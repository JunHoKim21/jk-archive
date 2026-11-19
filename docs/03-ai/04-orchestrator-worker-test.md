---
slug: orchestrator-worker-multi-agent-coding
title: "AI 한 명이 다 짜지 않고 팀장(오케스트레이터)과 팀원(워커)으로 나눠 코딩 테스트해 본 후기"
authors: [JunHoKim21]
tags: ["ai", "multi-agent", "orchestrator", "worker", "automation"]
date: 2026-11-13
---

![팀장 AI와 작업자 AI 역할 분담 썸네일](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhGwVXaQWtiBVZMnpeTsLliELVkr-kgzZf5TlEFxl4DhqGk7s6WUq3qHGJT7vosoZe_cq2te7INXv4iDMYfLDy2guGEXZ8nsIOXednE2WAZ3h0EGOPsksOegy2xGgQgcT8CI6sbj99-nu3ZmekcICGSMMJC9Z8vMov3zkv0aikW5XpTFz6Om4RfYGKOVysq/s800/AI%20%ED%95%9C%20%EB%AA%85%EC%9D%B4%20%EB%8B%A4%20%EC%A7%9C%EC%A7%80%20%EC%95%8A%EA%B3%A0%20%ED%8C%80%EC%9E%A5%28%EC%98%A4%EC%BC%80%EC%8A%A4%ED%8A%B8%EB%A0%88%EC%9D%B4%ED%84%B0%29%EA%B3%BC%20%ED%8C%80%EC%9B%90%28%EC%9B%8C%EC%BB%A4%29%EC%9C%BC%EB%A1%9C%20%EB%82%98%EB%88%A0%20%EC%BD%94%EB%94%A9%20%ED%85%8C%EC%8A%A4%ED%8A%B8%ED%95%B4%20%EB%B3%B8%20%ED%9B%84%EA%B8%B0.png)

## 1. AI도 혼자 다 하기보다 팀으로 일하면 어떨까?

보통 AI에게 코딩이나 작업을 맡길 때는 AI 한 명에게 모든 일을 한꺼번에 요청하곤 합니다. 하지만 만들어야 할 파일이 늘어나고 기능이 복잡해지면, AI 혼자 여러 파일을 오가다가 앞의 내용을 잊어버리거나 방금 고친 코드를 실수로 덮어쓰는 일이 생길 수 있습니다.
그래서 이번에는 AI 한 명에게 모든 코드를 맡기지 않고, 실제 회사에서 팀이 협업하는 것처럼 역할을 둘로 나누어 테스트해 보았습니다.

* 팀장 AI (오케스트레이터): 전체 흐름을 설계하고 작업을 나눈 뒤, 마지막에 결과물을 직접 검수하는 역할입니다. (직접 코드를 작성하거나 수정하지 않습니다.)
* 작업자 AI (워커): 팀장 AI가 지정해 준 파일만 맡아서 실제 코드를 작성하고 수정하는 실무 담당입니다.

## 2. 왜 굳이 역할을 나눠서 시킬까?

작업을 쪼개서 위임하는 방식에는 크게 두 가지 장점이 있습니다.

* 병렬 처리(속도 향상): 서로 관련이 없는 작업은 한 작업이 끝날 때까지 기다릴 필요 없이, 여러 작업자 AI에게 동시에 맡겨 빠르게 처리할 수 있습니다.
* 소유권 분리(안전성 확보): 각 작업자 AI마다 수정할 수 있는 파일 범위를 엄격히 제한해 둡니다. 내가 맡은 파일 밖은 건드리지 못하게 선을 그어 두기 때문에, 다른 작업자가 작성한 코드를 실수로 덮어쓰는 사고를 원천적으로 막을 수 있습니다.

![팀장 AI와 작업자 AI 역할 분담 구조](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiDZEJciy-gRdkKYTAZW1V2GbObFMfP87aSnkRTVpY6ok9DKMo8MViebeYWbSXTmzRt_o4eQUudl9ZOzme877x8lbbY8KG8RwndAgd4DSABxUIkXcfcsVa_WGA3uNHfVBHjL0B2A4RSrQuqC0W06RehSz8xGDmB2AFP_IPNKo-39210XKmP2J3Y9A9UkwF0/s1600/image.png)

그림 1. 팀장 AI(오케스트레이터)가 작업을 병렬·순차 그룹으로 나누어 위임하고 최종 검수하는 전체 구조

## 3. 테스트 ①: 병렬 작업 + 순차 작업 + 자동 통합 테스트

기존 프로젝트 코드에 전혀 영향을 주지 않기 위해, 독립된 실험 폴더(`orchestrator-test`)를 만들고 Node.js에 기본으로 내장된 자동 테스트 도구(`node --test`)를 사용해 첫 번째 테스트를 진행했습니다.
이번 미션에서 만들어야 할 대상 파일은 총 4개였습니다.

파일 경로
역할
주요 기능

`orchestrator-test/mathUtils.mjs`
숫자 계산 도구
합계(`sum`), 평균(`average`) 계산

`orchestrator-test/textUtils.mjs`
문장 다듬기 도구
URL 슬러그 변환(`slugify`), 글자 자르기(`truncate`)

`orchestrator-test/summary.mjs`
최종 요약 생성
위 두 파일을 불러와 요약 객체 생성

`orchestrator-test/summary.test.mjs`
자동 품질 검사
전체 동작이 올바른지 자동으로 검증

(참고: `slugify`는 웹 주소(URL)에 쓰기 좋게 문장을 깔끔한 형태로 다듬는 기능이고, `truncate`는 긴 문장을 정해진 길이에 맞춰 잘라 주는 기능입니다.)
팀장 AI는 각 파일이 서로 연결되어 있는지를 살펴보고, 작업 순서를 3단계로 나누어 지시했습니다.

1. 1단계(병렬 작업): 서로 독립적인 `mathUtils.mjs`와 `textUtils.mjs`를 2명의 작업자 AI가 동시에 작성했습니다.
2. 2단계(순차 작업): 앞선 두 파일이 모두 완료된 것을 확인한 뒤, 두 도구를 불러와 합치는 `summary.mjs`를 작성했습니다.
3. 3단계(순차 작업 + 최종 검수): 구현이 끝난 뒤 `summary.test.mjs` 테스트 파일을 작성하고, 마지막으로 팀장 AI가 직접 `node --test`를 실행해 20개 테스트 전부 통과(실패 0건)를 확인했습니다.

![실제 오케스트레이터 작업 위임 실행 화면](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdlTk1Pp_TV74B0mdk1IRNJA4vVUVIRMmFTlrqARk_2tdElRL_Ys7Ey13-5sbW4Abs56p4p-3RswQgWk6Cge3OixW6jm-dzuBLrtzJYn7yAT0d45LetD5qgdBp7JCeNCSrmqBP-T-JdLYKys-3KlI5kCzImr3TaraPbg3-PiTYiUok9FkINHf9PA01uH99/s1600/image.png)

그림 2. 실제 실행 화면: Wave 1(mathUtils.mjs, textUtils.mjs) 완료 확인 후 Wave 2(summary.mjs)와 Wave 3(summary.test.mjs)를 순차 위임하는 모습

## 4. 테스트 ②: 같은 파일에 기능 2개를 추가할 때 충돌 막기

두 번째는 실무에서 자주 마주치는 까다로운 상황을 가정한 테스트였습니다. 이미 만들어 둔 `orchestrator-test/summary.mjs` 파일 하나에 아래 두 가지 기능을 모두 추가하는 미션이었습니다.

1. 최솟값(`min`)과 최댓값(`max`)을 함께 구해 주는 기능 추가
2. 평균 값을 기준으로 A, B, C 등급(`grade`)을 계산해 주는 기능 추가

만약 이때 작업자 2명에게 "둘 다 지금 바로 `summary.mjs`를 고쳐!"라고 동시에 지시하면 어떻게 될까요? 두 사람이 같은 문서 파일을 동시에 열어 각자 고치고 저장하는 것과 똑같이, 나중에 저장한 쪽이 앞사람의 수정 내용을 덮어써 버리는 충돌이 발생합니다.
그래서 팀장 AI는 이번 작업을 병렬이 아닌 순차 지시로 처리했습니다. 같은 파일의 담당 작업자 AI에게 1단계(`min`/`max` 추가 및 완료 확인) → 2단계(`grade` 계산 추가 및 완료 확인) → 3단계(`summary.test.mjs` 테스트 보강) 순서로 한 번에 한 가지 작업만 맡긴 것입니다.

![같은 파일 수정 시 동시 수정과 순차 처리 비교](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgtmWEr3FZOz9bFw7cbezBxp6HXmxRwuUakQFQ_6GEPl4jBIkql6-KEpo7mRRPDDNHfZJFfhDE53_ZKNT0eYEp2030aGwEUsDmWESr_WWdp6y6wuvODNPIMIhj7qIhahAcxbV_EKPjZ3LS7FXlV9B-06hRwx_e_T-3hFZ9_3IHzk7fl3fWIXIordjaqvCJ2/s1600/image.png)

그림 3. 같은 파일(summary.mjs) 수정 시 동시 수정 충돌을 피하기 위해 순차 지시로 안전하게 처리한 비교 흐름
앞선 수정이 완전히 끝난 것을 확인한 뒤에 다음 기능을 얹었기 때문에 코드가 꼬이거나 덮어써지는 문제가 전혀 발생하지 않았습니다. 테스트 보강 후 팀장 AI가 `node --test`를 다시 실행해 본 결과, 기존 20개에 새 기능 검증이 더해진 22개 테스트가 실패 없이 전부 통과(실패 0건)했습니다.

## 5. 이번 테스트로 확인한 핵심 정리 3가지

* 1. 팀장 AI는 직접 코드를 고치지 않고 작업자 AI에게 위임합니다. 계획을 세우고 파일을 나누며 최종 결과를 검증하는 데 집중하고, 실제 코드 수정은 파일 소유권이 명확히 나뉜 작업자에게 맡깁니다.
* 2. 안 겹치는 일은 병렬로 빠르게, 같은 파일이나 의존성 있는 일은 순차로 안전하게 처리합니다. 무조건 동시에 실행하는 것이 답은 아니며, 파일이 겹치거나 앞선 작업 결과가 필요한 경우에는 순서를 지켜 충돌을 예방합니다.
* 3. 마지막 문법 검사와 통합 테스트는 직접 실행해 결과를 확인합니다. 작업자의 완료 보고만 믿고 끝내지 않고, 팀장 AI가 직접 테스트 도구(`node --test`)를 실행해 실제 통과 여부를 확인합니다.

## 6. 한 줄 결론

AI와 협업할 때도 겹치지 않는 일은 동시에 맡겨 속도를 높이고, 같은 파일이나 연결된 일은 순서를 지켜 안전하게 합친 뒤, 마지막은 직접 실행한 테스트로 검증하는 팀 구조가 훨씬 안정적이고 믿을 수 있는 결과를 만들어 줍니다.
