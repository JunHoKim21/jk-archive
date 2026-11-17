---
slug: /ai/blog-automation
title: "[AI 자동화] 뉴스레터 수집부터 Blogger 비공개 초안 발행까지, Human-in-the-Loop 블로그 자동화 시스템 구축기"
authors: [JunHoKim21]
tags: [ai-agent, automation, python, blogger-api, seo, aeo, cloudinary, devlog]
sidebar_position: 2
date: 2026-11-17
---

> **"매주 쏟아지는 뉴스레터 키워드를 수집하고, SEO/AEO에 최적화된 HTML 원고와 썸네일까지 자동 생성하되—최종 사실 검수와 발행 버튼만큼은 사람이 직접 책임질 수 없을까?"**

정보성 블로그를 꾸준히 운영하면서 가장 많은 에너지를 소모하는 부분은 키워드 리서치, HTML/JSON-LD 구조화, 썸네일 제작, 그리고 업로드 반복 작업입니다. 하지만 AI가 쓴 글을 사람 검수 없이 무인으로 자동 발행하면 품질 저하와 정책 위반 위험이 커집니다.

이를 해결하기 위해 Python CLI 자동화 파이프라인(`naver-blog-auto`)과 AI 에이전트 전용 스킬(`adsense-blog-writer`)을 결합하여, **수집·작성·이미지 생성·초안 저장은 100% 자동화하고 최종 검수 및 공개는 사람이 결정하는 Human-in-the-Loop 블로그 운영 시스템**을 구축한 과정을 정리합니다.

---

## 1. 프로젝트 개요

* **목적**: 주간 뉴스레터 수집부터 SEO/AEO 최적화 원고 작성, 썸네일 생성·호스팅, Blogger 비공개 초안 업로드까지 반복 공정을 자동화하고 최종 품질은 사람이 검수하는 안전 파이프라인 구축
* **대상 블로그**: Google Blogger **[정확한 정보전달](https://etc.jk-str.com/)**
* **핵심 기술 스택**:
  * **Backend / CLI**: Python (`cli.py`, `imaplib`, `Pillow`, `google-api-python-client`)
  * **Image Hosting**: Cloudinary (서명 기반 이미지 업로드)
  * **Publishing API**: Google Blogger v3 API
  * **AI Agent Skill**: `adsense-blog-writer` (AEO/GEO 및 애드센스 정책 최적화 프롬프트 스킬)
  * **Theme Engineering**: Blogger XML 테마 커스터마이징

---

## 2. 전체 파이프라인 흐름 (6단계)

```text
[1] 주간 키워드 뉴스레터 수신 (네이버 메일 / Stibee)
        ↓
[2] IMAP 수집 및 브리프 파싱 (mail_fetcher.py → JSON/MD 저장, 중복 방지)
        ↓
[3] AI 원고 작성 (adsense-blog-writer 스킬: SEO·AEO/GEO·애드센스 정책 HTML + JSON-LD)
        ↓
[4] 1200×1200 레트로 카드 썸네일 생성 & Cloudinary 업로드 (thumbnail_maker.py)
        ↓
[5] Blogger 비공개 초안 저장 (blogger_draft.py: isDraft=True 고정)
        ↓
[6] 사람 최종 검수(검색 설명·영문 퍼머링크·1차 경험담) → 수동/예약 게시 → Search Console 색인 요청
```

---

## 3. 핵심 모듈 및 스킬 구성

| 모듈 / 스킬 | 핵심 역할 |
| :--- | :--- |
| `config.py` | `.env` 환경변수 로드, 필수 API 키 검증, `output/`·`state/` 디렉터리 관리 |
| `mail_fetcher.py` | 네이버 IMAP 뉴스레터 수집, `state/history.json` 기반 중복 방지, 구조화 브리프(`.json`/`.md`) 추출 |
| `thumbnail_maker.py` | 카테고리 5종(`guide`, `compare`, `person`, `travel`, `default`)별 **1200×1200 2배 슈퍼샘플링 레트로 브라우저 창 + 도트 프레임 카드 PNG** 생성 및 Cloudinary 업로드 |
| `blogger_draft.py` | 최상단 `<figure><img>`(`max-width: 400px` 중앙 배치) + 모바일 인라인 HTML + JSON-LD(`BlogPosting.image`) 조립 및 Blogger 비공개 초안(`isDraft=True`) 업로드/수정 |
| `cli.py` | 4개 서브커맨드(`fetch`, `parse-sample`, `thumbnail`, `publish-draft`) 통합 CLI, UTF-8 JSON 응답 출력 |
| `adsense-blog-writer` 스킬 | AI 에이전트용 원고 작성·검수 규칙 (짧은 문단, 비교표, FAQ, 내부 링크, `[사람 검수 체크포인트]` 분리 보고) |

---

## 4. 핵심 설계 원칙 & 안전 가드

### ① 절대 무인 자동 발행 금지 (`isDraft=True` 고정)
* `create_draft_post` 함수는 API 호출 시 항상 **비공개 초안(`isDraft=True`)**으로만 저장하며, 즉시 공개 발행 옵션은 코드 레벨에서 원천 배제했습니다.
* 기존 글 수정(`--post-id`) 시에도 먼저 `view="ADMIN"`으로 게시글 상태를 조회해 **`status == "DRAFT"`인 경우에만 `patch`를 허용**하고, 이미 공개(`LIVE`)된 글은 API 덮어쓰기를 차단하는 안전 가드를 적용했습니다.

### ② 본문 원고와 광고 코드의 분리 (테마 일괄 제어)
* 개별 게시글 HTML 내부에는 `<ins class="adsbygoogle">` 코드를 일절 삽입하지 않고 순수 콘텐츠(`<img>`, `<h2>`, `<p>`, 표, JSON-LD)만 작성합니다.
* 광고 배치는 Blogger 테마 위젯(`HTML48`, `HTML49`, `HTML57`, `HTML80`, `HTML81`)이 본문 구조를 읽어 자동 배치하도록 위임하고, 애드센스 관리 화면에서는 자동 광고의 **`인페이지 형식`만 비활성화**하여 광고 중복 노출을 방지했습니다.

### ③ AEO / GEO 및 모바일 가독성 최적화
* AI 검색 엔진(ChatGPT, Perplexity, Gemini 등) 인용률을 높이기 위해 `BlogPosting` + `FAQPage` JSON-LD 구조화 데이터를 본문에 포함하고, 썸네일 URL을 스키마 `"image"` 필드에 자동 주입합니다.
* 스킨의 자동 목차(`#post-toc`)와 겹치지 않도록 원고 내 중복 `<nav>` 목차를 제거했으며, `<h2>` 소제목 2개 이상 + 1~2문장 짧은 단락 + `max-width: 400px` 대표 이미지 규칙을 적용해 모바일 가독성을 극대화했습니다.

---

## 5. 구축·운영 중 해결한 주요 트러블슈팅

### 1) 한글 썸네일 폰트 깨짐 및 해상도 저하 해결
* **원인**: Pillow 기본 폰트 사용 시 한글이 깨지거나 1200×1200 렌더링 시 텍스트 외곽선이 거칠어지는 현상 발생.
* **해결**: 번들 OFL 한글 폰트(`Jua-Regular.ttf` ➔ `DoHyeon-Regular.ttf`)를 우선 로드하고 글리프 누락 시 시스템 폰트로 폴백하도록 구성했으며, **2배 해상도(2400×2400)로 그린 뒤 LANCZOS 다운샘플링(슈퍼샘플링)**을 적용해 선명한 1200×1200 PNG 썸네일을 생성했습니다.

### 2) Blogger 테마 광고 미노출 및 사이드바 겹침 해결
* **원인**: 적용한 테마 XML에서 광고 위젯 6개가 `visible='false'`로 비활성화되어 있었고, `1560px` 미만 해상도에서 좌/우 사이드바 광고(`HTML55`, `HTML81`)가 본문 영역을 침범함.
* **해결**: 광고 위젯을 활성화한 뒤, 본문을 가리던 `HTML55`를 비활성화하고 CSS 미디어 쿼리를 보강해 화면 크기에 상관없이 깔끔하게 노출되도록 테마 XML을 개선했습니다.

### 3) Blogger v3 API 미지원 항목 분리 (`검색 설명`, `영문 퍼머링크`)
* **원인**: Google Blogger v3 API 스펙상 게시글 생성/수정 시 '검색 설명(Meta Description)'과 '사용자 지정 퍼머링크' 필드를 직접 세팅할 수 없음.
* **해결**: AI 에이전트가 원고 작성 완료 시 **최적화된 검색 설명(80~130자)과 추천 영문 퍼머링크를 `[사람 검수 체크포인트]`로 별도 출력**하도록 설계해, 사람이 Blogger 웹 편집기에서 1분 안에 복붙하고 최종 발행할 수 있는 효율적인 워크플로우를 구축했습니다.

### 4) 예약 발행(`SCHEDULED`) 상태 게시글의 본문·이미지 후속 보강
* **해결**: `DRAFT` 전용 안전 가드를 훼손하지 않으면서도, `build_post_html(...)`로 개선된 이미지와 본문을 재조립한 뒤 `posts().patch(..., body={'content': ...})`를 호출해 기존 예약 시각과 퍼머링크를 유지한 채 본문만 안전하게 업데이트하는 방식을 정립했습니다.

### 5) Google Search Console 등록 및 Blogger `?m=1` 리디렉션 이해
* `URL 접두어`(`https://etc.jk-str.com/`) + `sitemap.xml` 제출로 Search Console 등록을 완료했습니다.
* Blogger는 모바일 크롤러 요청 시 `302 -> ?m=1` 리디렉션을 반환하는 플랫폼 특성이 있어, 신규 발행 직후 첫 URL 검사에서는 일시적인 `리디렉션 오류`로 보일 수 있으나 데스크톱/표준 URL 기준으로 정상 색인됨을 실제 HTTP 응답 검증으로 확인했습니다.

---

## 6. 검증 및 운영 현황

* **단위 테스트**: `tests/` 4개 테스트 스위트(`test_mail_fetcher.py`, `test_thumbnail_maker.py`, `test_blogger_draft.py`, `test_cli.py`) **총 63건 전원 통과**
* **실제 운영 적용**: 기존 공개 글 5건의 레이아웃 및 썸네일 일괄 개선 완료, 신규 정보형 아티클 및 기술 개발기 다수 발행 및 예약 운영 중
