# 롤 백과사전 클래식 공개 제품 사이트

이 저장소는 LOLFLIX가 독립 개발 중인 비공식 Android 참고 앱
**롤 백과사전 클래식**의 공개 제품·정책 사이트를 호스팅합니다.

라이브 사이트:
[lolclassic.github.io/lol-encyclopedia-classic-site](https://lolclassic.github.io/lol-encyclopedia-classic-site/)

## 공개 범위

- `index.html` — 제품 기능, 내부 QA 요약, 최종 앱 화면, 출시 준비 현황
- `privacy.html` — 현재 오프라인 Android 앱과 정적 사이트의 개인정보처리방침
- `terms.html` — 공개 사이트와 Android 릴리스 후보의 이용약관
- `contact.html` — 제품·정책·권리·보안 문의 경로
- `styles.css` — 공통 반응형 스타일
- `assets/phone-*.png` — 동일 릴리스 후보 빌드에서 캡처한 최종 Google Play 화면 8장
- `assets/app-icon.png` — 공개 앱 아이콘
- `assets/feature-graphic.png` — 공개 Google Play 피처 그래픽 및 소셜 미리보기
- `riot.txt` — Riot Developer Portal 사이트 확인 파일

## 현재 제품 경계

현재 앱은 계정, 광고, 분석, 결제, 공유 커뮤니티 또는 Riot API 조회를
제공하지 않는 오프라인 참고 앱입니다. Android 인터넷 권한을 요청하지 않으며,
사용자가 만든 테스트 데이터와 설정은 기기의 앱 전용 저장소에만 남습니다.

## 현재 구현

- 컴팩트 홈에서 챔피언·아이템·룬·용어를 기기 안에서 통합 검색하고 보존 새소식·경기정보·기기 내 커뮤니티를 탐색
- 클래식 클라이언트 참조 화면과 정확히 대조한 60명의 표시 순서·초상과 115명 역사 아카이브
- 190개 아이템, 56개 특성, 16개 소환사 주문
- 룬 보관함·30개 소켓·통계의 3열 옛 룬 클라이언트와 기기 내부에 저장되는 5개 룬 페이지

2026년 7월 29일 기준 내부 Android 런타임 점검은 39/39, 화면 경로 점검은
18/18을 통과했습니다. 컴팩트 홈·기기 내 검색, 정확한 60명 초상,
30소켓·5페이지 룬 편성 검증을 포함합니다. 이 수치는 LOLFLIX의 내부 검증 결과이며
Riot Games 또는 Google의 인증을 의미하지 않습니다.

Google Play 조직 확인, 공개 지원 연락처, Play App Signing, 콘솔 선언,
배포 권리 확인 및 심사 제출은 계정 소유자 또는 외부 권리자의 작업으로 남아 있습니다.

## 보안 경계

Android 비공개 소스, 백엔드 코드, 서명 자료, API 키, 기업 식별값과 기타
비밀은 이 공개 저장소에 포함하지 않습니다. 비밀값을 이 저장소, 공개 이슈,
클라이언트 앱 또는 브라우저 JavaScript에 추가하지 마세요.

## 비공식 프로젝트 고지

롤 백과사전 클래식은 Riot Games의 보증·승인을 받은 공식 제품이 아니며,
Riot Games 또는 Riot Games 자산의 제작·관리에 공식적으로 관여한 사람들의
견해나 의견을 반영하지 않습니다. Riot Games 및 관련 자산은
Riot Games, Inc.의 상표 또는 등록상표입니다.
