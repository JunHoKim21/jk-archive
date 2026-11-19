---
slug: spring-boot-ffmpeg-thumbnail-render
title: "[Spring Boot & AI] 대용량 영상 썸네일 자동화: FFmpeg 오디오 추출부터 Render 배포까지"
authors: [JunHoKim21]
tags: ["spring-boot", "ffmpeg", "gemini", "render", "docker"]
date: 2026-10-07
---

# 개요 (Overview)

AI 기반의 동영상 썸네일 및 하이라이트 쇼츠(15~30초) 자동 생성 스튜디오를 구축하면서 직면했던 대용량 미디어 처리 문제와, 이를 FFmpeg 오디오 추출 파이프라인 및 Gemini 멀티모달 오디오 분석으로 해결한 과정을 공유합니다. 더불어 이렇게 만든 어플리케이션을 FFmpeg 환경과 함께 Render(무료 클라우드)에 Docker로 무중단 배포하는 팁을 다룹니다.

# 등장 배경 및 필요성 (Why)

사용자가 올리는 실전 영상은 최소 100MB에서 2GB가 넘어갑니다. 처음에는 이 통 영상을 그대로 AI 모델에 던져서 분석을 요청했습니다. 
하지만 이 방식은 큰 한계가 있었습니다.
1. 요금 폭탄 및 할당량 부족: API 무료 티어(예: 하루 20회)를 금방 소진하며 토큰 사용량이 극심함.
2. 네트워크 타임아웃: Spring Boot의 기본 업로드 용량 초과(`Failed to fetch`) 및 AI 서버 503 과부하 발생.
3. 처리 시간 지연: 1GB 영상을 통째로 분석하는 데 엄청난 시간이 소요됨.
이 문제를 해결하기 위해, 시각적 정보보다 핵심 대화(오디오) 내용이 썸네일과 쇼츠의 하이라이트를 결정한다는 점에 착안하여 아키텍처를 전면 개편했습니다.

# 동작 원리 및 내부 구조 (How it works)

새로운 파이프라인의 핵심은 백엔드 전처리와 AI의 텍스트 동적 배치(Dynamic Positioning)입니다.

1. 오디오 경량화: 사용자가 1GB 영상을 올리면, Spring Boot 백엔드에서 `FFmpeg`를 구동해 영상 속 오디오만 mp3 파일(수십 MB 수준)로 빠르게 추출합니다.
2. Gemini 멀티모달 분석: 텍스트 대본(STT) 변환을 거치지 않고, Gemini 1.5 Flash에 mp3 파일 자체를 던집니다. AI가 목소리의 억양과 내용을 듣고 핵심 썸네일 구간(Timestamp)과 15~30초짜리 쇼츠 구간(Start/End)을 뽑아냅니다.
3. AI 기반 동적 렌더링 구도 파악: 자막을 무조건 가운데나 아래에 박으면 사람 얼굴을 가리게 됩니다. AI 프롬프트에 영상 구도를 파악하여 텍스트가 피사체를 가리지 않는 최적의 위치(`position: top-right, bottom-left 등`)를 응답하게 합니다.
4. FFmpeg 합성: AI가 리턴한 `position` 값에 맞춰 FFmpeg 좌표(`x, y`)를 동적으로 계산하여 자막과 브랜드 태그를 입힌 썸네일과 쇼츠를 최종 반환합니다.

# 실무 코드 예제 (Code Example)

1. 동적 자막 렌더링 (FFmpegService.java)
AI가 내려준 `position` 값에 따라 자막 좌표를 동적으로 할당합니다.

```java
String mainX = "w*0.08"; String mainY = "h*0.65";
String brandX = "w*0.08"; String brandY = "h*0.12";

if (position != null) {
    switch (position) {
        case "top-left": mainX = "w*0.08"; mainY = "h*0.25"; break;
        case "top-right": mainX = "w*0.92-text_w"; mainY = "h*0.25"; brandX = "w*0.92-tw"; break;
        case "bottom-left": mainX = "w*0.08"; mainY = "h*0.75"; break;
        case "center": mainX = "(w-text_w)/2"; mainY = "(h-text_h)/2"; brandX = "w*0.08"; break;
    }
}
String drawFilter = String.format(
        "drawtext=fontfile='%s':textfile='%s':fontsize=%d:x=%s:y=%s",
        fontPath, textPath, mainFontSize, mainX, mainY
);
```

2. Dockerfile 배포 세팅
일반적인 무료 웹 호스팅(Vercel 등)에서는 FFmpeg 실행이 불가능합니다. 따라서 `Render`와 같이 Docker 배포를 지원하는 환경에 올려야 합니다.

```dockerfile
# 1단계: 빌드 환경 (Java 17)
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app
COPY . .
RUN chmod +x gradlew
RUN ./gradlew bootJar --no-daemon

# 2단계: 실행 환경 (Java 17 JRE + FFmpeg)
FROM eclipse-temurin:17-jre
WORKDIR /app
# FFmpeg 패키지 필수 설치
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-Dserver.port=${PORT:8081}", "-jar", "app.jar"]
```

# 실무 주의점 및 트러블슈팅 (Best Practices & Pitfalls)

* Spring Boot 멀티파트 용량 해제: 고용량 영상 처리를 위해 `application.yml`에서 `spring.servlet.multipart.max-file-size`와 `max-request-size`를 500MB 이상으로 넉넉히 설정해야 클라이언트에서 `Failed to fetch` 에러가 발생하지 않습니다.
* API Rate Limit 방어: 무료 AI API는 `429 Too Many Requests` 에러가 잦습니다. RestTemplate 호출 시 `try-catch` 루프와 `Thread.sleep`을 조합해 3~5초 후 재시도하는 롤백 로직을 반드시 넣어야 합니다.
* API 키 보안: `application.yml`에 API 키를 하드코딩해서 Github에 올리면 바로 털립니다. `${GEMINI_API_KEY:default}` 처럼 환경변수로 빼고, Render 웹 대시보드 환경변수 세팅에 키를 넣어주세요.

# 한 줄 요약 (Summary)

대용량 미디어 프로젝트에서는 영상을 통째로 다루지 말고 오디오 등 필요한 정보만 잘게 썰어서(FFmpeg) AI에게 넘겨야 하며, 배포 시에는 FFmpeg 의존성이 완벽히 해결되는 Docker 환경을 활용해야 합니다.
