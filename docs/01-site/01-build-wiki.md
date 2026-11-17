---
id: build-wiki
title: Docusaurus + GitHub Pages 지식창고 구축기
sidebar_position: 1
tags: [docusaurus, github-pages, 인프라세팅]
slug: /site/build-wiki
---

# 나만의 제2의 뇌, 지식창고 구축 기록

개인적으로 공부한 백엔드 기술, 심리학, 투자 지식 등을 아카이빙하기 위해 Docusaurus와 GitHub Pages를 활용하여 정적 웹사이트를 구축했다.

## 1. 인프라 및 도메인 환경
- **도메인**: 가비아(Gabia)에서 관리 중인 `jk-str.com`의 서브 도메인(`docs.jk-str.com`) 활용
- **호스팅**: GitHub Pages (무료, 무제한 트래픽)
- **프레임워크**: Docusaurus v3 (React 기반, 마크다운 지원)

## 2. 가비아 DNS 설정
기존 블로그스팟(`etc.jk-str.com`) 운영에 영향을 주지 않도록 서브 도메인만 분리했다.
- **타입**: CNAME
- **호스트**: `docs`
- **값/위치**: `junhokim21.github.io.` (끝에 마침표 필수)

## 3. 프로젝트 생성 및 설정
로컬 환경에서 아래 명령어로 프로젝트 뼈대를 생성했다. 15년 차 백엔드 개발자답게 추후 확장성을 고려해 TypeScript를 선택했다.

```bash
npx create-docusaurus@latest jk-archive classic
```
