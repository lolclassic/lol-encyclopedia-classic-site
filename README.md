# 롤 백과사전 클래식

클래식 챔피언, 아이템, 특성, 소환사 주문과 룬을 Android에서 살펴보는 LOLFLIX의 비공식 참고 앱입니다.

현재 Android 앱은 Google Play를 통해 공개 배포되고 있습니다.

현재 공개 Play 버전은 2.0.3이며, 사이트의 사진과 영상은 2026-09-05에 실제 휴대폰으로 촬영한 2.0.4 미리보기입니다.

## 미리보기 기능
- 클래식 챔피언 63명
- 아이템 149개, 특성 57개, 소환사 주문 16개
- 클래식 룬 53개, 정수 17종과 30칸 룬 페이지
- 만 16세 이상 이용자를 위한 익명 온라인 자유게시판·댓글·추천
- 게시글 신고, 사용자 차단·차단 해제와 차단 사용자 관리
- 버그 신고와 운영자 신고 처리·콘텐츠 관리

환경설정, 특성, 빌드와 룬 편성은 기기 내부에 저장됩니다. 커뮤니티 프로필·게시글·댓글·추천·신고·차단·버그 신고 데이터는 HTTPS로 LOLFLIX 서비스에 전송됩니다. 기존 사용자는 2026-08-02 약관에 다시 동의하기 전에도 게시판 읽기, 커뮤니티 프로필 삭제와 버그 신고를 이용할 수 있습니다. 게시글·댓글 작성과 개별 삭제, 추천, 게시글 신고, 사용자 차단·해제와 닉네임 변경에는 만 16세 이상 확인과 최신 약관 동의가 필요합니다.

일반 로컬 데이터 초기화, 이 기기의 커뮤니티 세션 제거, 커뮤니티 프로필 및 서버 데이터 삭제는 서로 다른 작업입니다. 커뮤니티 프로필은 최신 약관 재동의 없이 앱 내부에서 삭제하거나 공개 삭제 안내를 거쳐 삭제 코드를 외부 삭제 페이지에 직접 제출하여 삭제할 수 있습니다. 삭제 코드는 익명 프로필 생성 직후 한 번 표시·발급되며 현재 Android 설정 화면에서는 다시 표시되지 않습니다.

## 공개 정책
- [개인정보처리방침](https://lolclassic.github.io/lol-encyclopedia-classic-site/privacy.html)
- [이용약관](https://lolclassic.github.io/lol-encyclopedia-classic-site/terms.html)
- [커뮤니티 프로필 및 데이터 삭제](https://lolclassic.github.io/lol-encyclopedia-classic-site/delete-account.html)
- [문의](https://lolclassic.github.io/lol-encyclopedia-classic-site/contact.html)

지원 이메일: gktmtmxhs7313@gmail.com

롤 백과사전 클래식은 Riot Games의 보증·승인을 받은 공식 제품이 아닙니다.

## 현재 화면 검증

`capture-evidence.json`에는 현재 QA APK와 웹 자산의 일치 결과, 사진 10장과 실제 화면 녹화의 해시, 화면에 보인 이미지의 경로·해시를 기록합니다. 개인 기기 식별자, 로컬 경로, 사용자 저장 데이터는 공개하지 않습니다. 문의 화면은 빈 양식이며 전송하지 않았습니다.

사진은 원본의 모든 RGB 픽셀을 보존한 1080×1920 크기의 24-bit RGB PNG이며 영상은 Android 화면 녹화의 영상 스트림을 보존해 MP4 컨테이너를 정리했습니다. 촬영 중 다른 앱의 알림 아이콘을 숨기고 촬영 후 시스템 설정을 복원했습니다. 일반 시계·배터리·연결 표시는 그대로입니다. `app-main-screen.png`는 첫 룬 페이지 사진과 동일한 포스터입니다. 기존 앱 아이콘의 출처 기록은 유지합니다. 공개 사진 검증은 APK 전체의 배포 권한이나 Play 출시 심사를 대신하지 않습니다.

현재 공개 미디어 검증 명령:

```text
python verify_current_capture.py
python verify_public_phase2b3.py --report public-qa-phase2b3.json
python verify_riot_notices.py
python -m unittest -v test_capture_public_marketing.py test_current_capture.py
```

`capture_public_marketing.py`와 `finalize_media_provenance.py`는 이전 촬영 계획을 보존한 도구입니다. 현재 미디어는 새 물리 기기 촬영 결과를 검토한 뒤 별도로 반영했으며, 이전 도구의 APK 배포 검사는 완화하지 않았습니다.
