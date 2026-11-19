---
slug: opendots-windows-gemini-telegram-bot
title: "[AI/Agent] 오픈소스 OpenDots 완벽 커스텀: Windows 환경 구축부터 Google Gemini 무료 연동 및 텔레그램 봇 개발기"
authors: [JunHoKim21]
tags: ["ai", "agent", "opendots", "gemini", "telegram-bot", "windows"]
date: 2026-10-02
---

# [AI/Agent] 오픈소스 OpenDots 완벽 커스텀: Windows 환경 구축, Gemini 무료 연동 및 텔레그램 봇 개발기

> 본 포스팅은 오픈소스 멀티 에이전트 워크스페이스인 OpenDots를 로컬 Windows 환경에 설치하고, 유료 클라우드 종속성을 제거한 뒤 Google Gemini 무료 API 및 Telegram Bot을 직접 연동하면서 겪은 수많은 트러블슈팅과 해결 과정을 정리한 개발기입니다.

## 1. 개요 (Overview)

OpenDots는 유명 AI 에이전트 프레임워크인 [CopilotKit](https://github.com/CopilotKit/CopilotKit) 팀에서 공개한 오픈소스 에이전트 작업 공간 템플릿입니다.
단순히 브라우저 대화창에 갇힌 챗봇이 아니라, '항상 켜져 있는 나만의 AI 동료(AI Co-worker)'를 지향하며, 노션(Notion)처럼 자체 문서함(`Spaces`)에 문서를 직접 생성·편집하고, 슬랙/음성통화/컴퓨터 제어까지 아우르는 강력한 구조를 가지고 있습니다.
하지만 이 오픈소스를 개인 로컬 PC에서 "완전 무료"로 실무에 도입하기에는 몇 가지 거대한 장벽이 있었습니다.

## 2. 직면했던 문제들과 해결 과제 (Why)

깃허브에서 코드를 클론받아 바로 실행했을 때 마주친 주요 난관은 다음과 같았습니다:

1. Windows 환경 미지원: 리눅스/Mac 전용 쉘 문법(`NODE_ENV=...`)과 파일 잠금 문제로 인한 Vite 504 캐시 에러.
2. 유료 클라우드(CopilotKit Intelligence Cloud) 종속성: 가입 및 결제 키(`INTELLIGENCE_API_KEY`)를 강제하여 완전 로컬 단독 구동 불가.
3. 텔레그램 미지원: 메신저 채널로 Slack만 샘플 제공, 일상적으로 쓰기 편한 텔레그램 봇 부재.
4. Google Gemini와의 호환성 버그 (400 Bad Request): Gemini 3.x Thinking 모델의 `thought_signature` 누락 오류.
5. 무료 API 할당량(Quota) 초과 (429/503 오류): 최신 플래그십 모델의 극단적 하루 20회 제한.

## 3. 주요 개발 및 커스텀 내역 (How)

### ① Windows 구동 환경 및 CORS 패치

* 인라인 환경 변수 오류 해결: `package.json` 스크립트에 `cross-env`를 도입하여 윈도우 파워셸/CMD에서도 환경 변수가 정상 주입되도록 수정했습니다.
* Vite 번들링 충돌(504) 방지: 윈도우 파일 시스템 락으로 인한 종속성 캐시 불일치 문제를 해결하기 위해 `vite --force` 옵션을 기본 적용했습니다.
* CORS 포트 허용: 백엔드(`4310`)와 프론트엔드(`5173`) 포트 간 통신뿐 아니라, 사용자가 `4310`으로 직접 접속해도 문제가 없도록 Origin 허용 검증을 보강했습니다.

### ② CopilotKit Cloud 우회 & Google Gemini 로컬 직결

* `INTELLIGENCE_API_KEY=local` 모드를 구축하여 원격 인증을 우회하고 로컬 SQLite(`opendots.sqlite`) 기반의 스레드 바인딩 파이프라인으로 전환했습니다.
* Google Gemini API의 OpenAI 호환 엔드포인트(`https://generativelanguage.googleapis.com/v1beta/openai/`)를 연결하여 완전 무료 운영 환경을 구현했습니다.

### ③ 텔레그램 봇(Telegram Bot) 신규 개발 (`src/server/telegram-bot.ts`)

* 경량 봇 프레임워크인 `grammy`를 기반으로 Long Polling 방식의 텔레그램 봇 서비스를 개발했습니다.
* 주요 기능:
* 포트포워딩이나 고정 IP, ngrok 없이 로컬 PC에서 즉시 실행
* 허용 사용자 ID(`TELEGRAM_ALLOWED_USERS`) 인증으로 타인 무단 사용 방지
* AI 추론 중 '입력 중...(typing)' 상태 표시
* 대화 히스토리 메모리 캐싱 및 대화 초기화(`/reset`, `/clear`) 명령어 지원
* 텔레그램 메시지 4,000자 초과 시 자동 분할 전송

### ④ Gemini Thought Signature 누락 버그 해결 (`src/server/gemini-interceptor.ts`)

에이전트가 "문서 요약"이나 "페이지 생성" 등의 도구(Function Calling)를 실행할 때, Gemini 3.x 모델에서 지속적으로 `HTTP 400 Bad Request` 에러가 발생했습니다.

* Root Cause: Gemini 3.x Thinking 모델은 도구 호출 시 고유 암호화 토큰인 `thought_signature`를 생성합니다. 하지만 `@tanstack/ai-openai` 라이브러리가 OpenAI 표준 규격만 따르다 보니 다음 도구 결과 요청 시 이 필드를 누락시켜 구글 서버가 요청을 거부(`Function call is missing a thought_signature in functionCall parts`)한 것이었습니다.
* 해결책: 글로벌 `fetch`를 가로채는 미들웨어(Interceptor)를 구현했습니다. SSE 스트리밍 청크에서 `thought_signature`를 캐싱해 두었다가, 다음 도구 호출 요청의 `assistant` 메시지에 자동으로 복원·주입하도록 설계했습니다.

### ⑤ 무료 할당량(Quota) 최적화: `gemini-flash-lite-latest` 전환

초기에 설정했던 `gemini-3.8-flash`는 구글 무료 티어 정책상 하루에 단 20회만 허용되는 극단적인 일일 쿼터 제한이 있었습니다.
이를 하루 1,500회(15 RPM) 호출이 가능한 `gemini-flash-lite-latest` 모델로 전환하여 429(Resource Exhausted) 에러를 근본적으로 해결했습니다.

## 4. 핵심 구현 코드

### 1) Gemini Thought Signature Interceptor

```typescript
// src/server/gemini-interceptor.ts
const thoughtSignatures = new Map<string, unknown>();

export function setupGeminiInterceptor() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = String(input);

    // 1. 요청 전송 시: assistant 메시지에 누락된 thought_signature 주입
    if (url.includes('generativelanguage.googleapis.com') && init?.body && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (Array.isArray(body.messages)) {
          let modified = false;
          for (const msg of body.messages) {
            if (msg.role === 'assistant' && Array.isArray(msg.tool_calls)) {
              for (const call of msg.tool_calls) {
                if (call.id && !call.extra_content && thoughtSignatures.has(call.id)) {
                  call.extra_content = thoughtSignatures.get(call.id);
                  modified = true;
                }
              }
            }
          }
          if (modified) init.body = JSON.stringify(body);
        }
      } catch {}
    }

    const res = await originalFetch(input, init);

    // 2. 응답 수신 시: 스트리밍 청크(SSE)에서 thought_signature 추출 및 캐싱
    if (url.includes('generativelanguage.googleapis.com') && res.ok && res.body) {
      const [stream1, stream2] = res.body.tee();
      (async () => {
        try {
          const reader = stream2.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const chunk = JSON.parse(line.slice(6));
                  const calls = chunk.choices?.[0]?.delta?.tool_calls;
                  if (Array.isArray(calls)) {
                    for (const call of calls) {
                      if (call.id && call.extra_content) {
                        thoughtSignatures.set(call.id, call.extra_content);
                      }
                    }
                  }
                } catch {}
              }
            }
          }
        } catch {}
      })();

      return new Response(stream1, { status: res.status, statusText: res.statusText, headers: res.headers });
    }
    return res;
  };
}
```

## 5. 최종 결과 및 시연

모든 커스텀 및 트러블슈팅을 완료한 후, 텔레그램 및 웹에서 다음과 같은 결과를 얻을 수 있었습니다:

1. 텔레그램 업무 지시:
   * 모바일 텔레그램으로 "테스트 폴더에 있는 문서 요약해줘"라고 전송.
2. 에이전트 자율 작업:
   * 에이전트가 로컬 SQLite 데이터베이스를 검색(`list_authorized_spaces`).
   * 해당 스페이스의 문서를 읽음(`read_space_page`).
3. 실시간 보고서 회신:
   * 1초 만에 깔끔한 마크다운 형태의 프로젝트 요약 보고서가 텔레그램 답장으로 즉시 도착!

## 6. 요약 (Summary)

1. 오픈소스 AI 프로젝트를 로컬에 도입할 때는 벤더 종속성(유료 클라우드)과 OS 호환성(Windows vs Linux)을 반드시 점검해야 합니다.
2. Google Gemini의 OpenAI 호환 API를 사용할 때는 Thinking 모델의 `thought_signature` 보존 여부와 모델별 무료 쿼터(20회 vs 1,500회)를 주의 깊게 확인해야 합니다.
3. 텔레그램 연동과 프록시 인터셉터를 통해, 완전 무료이면서도 상시 대기하는 나만의 AI 디지털 비서를 성공적으로 구축할 수 있었습니다.
