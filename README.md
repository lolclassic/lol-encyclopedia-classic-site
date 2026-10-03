# 롤 백과사전 클래식

클래식 챔피언, 아이템, 특성, 소환사 주문과 룬을 Android에서 살펴보는 LOLFLIX의 비공식 참고 앱입니다.

현재 Android 앱은 Google Play를 통해 공개 배포되고 있습니다.

사이트 본문의 수치는 26.19.5 개발버전 기준입니다. 대표 영문 화면 4장과 무음 영상은 2026-09-30 당시의 개발 APK를 설치한 실제 Android 휴대폰에서 촬영했습니다. 이후 추천 조합 화면의 변경은 현재 PC 베타에 반영되어 있으며, 갤러리는 촬영 당시의 화면을 보존합니다. Codex가 r33 원본 화면 4장과 영상의 디코딩된 302프레임을 시각적으로 검토해 개인정보 노출을 발견하지 않았습니다. 영상은 원본 1080×2340을 프레임별 360×780으로 축소한 18개 번호 순서 컨택트 시트에서 검토했습니다. 축소 검토는 아주 작은 글자의 식별에 제한이 있습니다. Android 상태바·탐색 막대와 기기 상태 아이콘은 남아 있습니다. 사용자의 2026-09-30 사이트·PC 베타·미디어 공개와 GitHub 반영 승인을 바탕으로 r33 촬영물을 갤러리에 게시했습니다. 전체 프레임을 사람이 개별 검토했다고 기록하지 않습니다. 앞서 게시한 r32 촬영물은 바이트와 검토 기록을 보존하며 최신 APK 촬영물로 표시하지 않습니다. 앞선 26.19.5 개발 APK 촬영물과 2.0.4 휴대폰 촬영물도 기록용으로 보존합니다. 과거 영문 브라우저 화면은 이전 자산 스냅샷의 로컬 기록으로 보존하며 현재 공개 갤러리에서는 참조하지 않습니다. 어느 자료도 Google Play 출시 화면으로 표기하지 않습니다.

## PC 베타

`pc-beta/index.html`은 현재 Android WebView 백과사전의 정적 브라우저용 사본입니다. 챔피언, 아이템, 특성, 주문, 룬, 새소식과 로컬 설정을 사용할 수 있습니다. PC 베타는 자유게시판·온라인 영상·운영자 기능을 연결하지 않습니다. 문의·약관·개인정보·계정 삭제 안내는 사이트의 공개 페이지로 이동합니다. Android 운영 설정이나 비밀값은 복사하지 않고, `runtime-config.js`에 공개 가능한 `webBeta: true` 설정만 생성합니다. 서비스 워커의 대량 사전 캐시는 등록하지 않습니다.

72명 각각의 편집형 추천 조합에는 포지션을 기준으로 추천한 소환사 주문 2개가 포함됩니다. 추천 특성은 공격·방어·보조 세 트리를 가로로 함께 표시하며, 각 트리의 6행·4열 위치와 빈칸을 유지합니다. 아이콘을 누르면 아래에 해당 특성 이름과 추천 포인트가 표시되고, 실제 특성 편성값은 변경하지 않습니다. 이 조합은 참고용으로 편집한 예시이며 실제 선택률·승률 통계가 아닙니다.

음성은 검토한 여덟 카탈로그에 명시된 파일만 복사합니다. 일본어·영어 기본 음성 42명과 클래식 Skin301 전용 음성 5명, 한국어 음성 48명의 일부는 72명 현지 음성 목록을 채우기 위한 추정 자료입니다. 가렌 기본 음성과 별도 영어 옛 음성도 추정 자료입니다. 26.19 클래식 모드의 Skin301 메타데이터는 기본 음성 뱅크를 참조하지만, 양쪽 음원의 바이트 단위 동일성과 녹음 시기는 확인되지 않았습니다. 사용자가 이 PC 사본의 사이트 공개를 승인했습니다. `pc-beta-publication.json`은 승인된 내보내기 manifest의 SHA-256을 고정합니다. 공개 PC 베타 링크 검사는 이 승인 기록과 현재 내보내기가 일치할 때만 통과합니다. 공개된 브라우저 베타는 개발 미리보기이며, 이 승인은 Riot의 자산 권리 승인이나 Play 출시 승인을 증명하지 않습니다.

승인된 `pc-beta/`와 현재 `assets/physical-26195-en-r33-raw/`는 명시적인 파일 목록으로 커밋합니다. 앞서 게시한 `assets/physical-26195-en-r32-raw/`는 기존 Git 바이트와 검토 기록을 그대로 보존합니다. 나머지 과거 `assets/physical-26195-en-*`, `assets/preview-26195-en-*` 후보는 로컬에서 보존하고 Git에서 제외합니다. r31 등 역사적 검증 선택지는 해당 로컬 기록이 있을 때 사용합니다.

공개용 파일을 명시적으로 Git에 포함한 뒤 `python -B verify_public_phase2b3.py --git-release`를 실행해 HTML이 참조하는 로컬 파일이 모두 Git 인덱스에 있는지 확인합니다. 현재 공개 본문이 참조하는 PC 베타 및 r33 화면·영상이 인덱스에 모두 포함돼 있어야 이 검사가 통과합니다. 일반 `verify_public_phase2b3.py`의 통과는 로컬 파일 존재만 확인합니다. 네이티브 코드만 변경되고 `verify_pc_beta.py --android-www <Android repository>/app/src/main/assets/www`가 현재 원본과의 일치를 확인하면 PC 베타를 다시 내보내지 않습니다.

소스에서 엄격한 목록으로 다시 내보내는 명령:

```text
python export_pc_beta.py --android-www <Android repository>/app/src/main/assets/www
python verify_pc_beta.py --android-www <Android repository>/app/src/main/assets/www
python -m http.server 8777
```

별도 터미널에서 브라우저 기능 검증:

```text
node verify_pc_beta_browser.js <local PC Beta index URL>
```

브라우저 검증에는 Playwright와 Chromium 계열 브라우저가 필요합니다. 설치 위치가 기본값과 다르면 `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE` 환경 변수를 설정합니다. `verify_pc_beta.py`는 manifest 해시, 허용된 파일 종류, 음성 목록, HTML/CSS 자산 경로, CSP와 비밀값 패턴을 검사하고, `--android-www`가 있으면 현재 Android 원본과도 대조합니다. 브라우저 검증은 주요 화면, 패치노트, 공개 정책·삭제 안내, 현지 음성 재생을 확인하며 외부 HTTP(S) 요청, JS 오류, 404 응답, 서비스 워커 등록이 없는지 검사합니다. 내보내기 manifest는 `pc-beta/export-manifest.json`입니다.

## Android 개발앱 기능
- 클래식 챔피언 72명
- 72명 각각의 편집형 추천 조합, 포지션별 소환사 주문 2개와 스킬 효과 용어 설명
- 추천 특성의 공격·방어·보조 세 트리 동시 표시, 원래 위치 유지와 아이콘별 이름·포인트 확인
- 구매 가능 아이템 147개, 특성 56개, 소환사 주문 16개
- 클래식 룬 53개, 정수 17종과 30칸 룬 페이지
- 만 18세 이상 이용자를 위한 익명 온라인 자유게시판·댓글·추천
- 게시글 신고, 사용자 차단·차단 해제와 차단 사용자 관리
- 버그 신고와 운영자 신고 처리·콘텐츠 관리

환경설정, 특성, 빌드와 룬 편성은 기기 내부에 저장됩니다. 커뮤니티 프로필·게시글·댓글·추천·신고·차단·버그 신고 데이터는 HTTPS로 LOLFLIX 서비스에 전송됩니다. 26.19.5 개발 빌드의 선택형 게시글 번역은 Canary QA에서 시험 중입니다. 26.19.5 release 빌드에는 별도의 운영용 번역 URL이 설정되어 있지만, 운영용 Worker의 서버 측 `TRANSLATION_ENABLED` 설정은 `false`이고 Canary 설정은 `true`입니다. 번역 기능이 활성화된 환경에서 이용자가 번역을 요청하면 저장된 게시글 제목·본문과 선택 언어가 LOLFLIX의 Cloudflare Worker를 거쳐 결제 계정이 연결된 Google Gemini API 프로젝트로 전달됩니다. 게시판 읽기·작성, 댓글, 추천, 신고, 차단, 버그 신고 등 온라인 커뮤니티 이용에는 만 18세 이상 확인과 2026-09-27 약관 동의가 필요합니다. 기존 사용자도 계속 이용하려면 재동의해야 합니다. 커뮤니티 프로필 및 데이터 삭제와 개인정보 관련 문의는 재동의 없이 가능합니다.

일반 로컬 데이터 초기화, 이 기기의 커뮤니티 세션 제거, 커뮤니티 프로필 및 서버 데이터 삭제는 서로 다른 작업입니다. 커뮤니티 프로필은 최신 약관 재동의 없이 앱 내부에서 삭제하거나 공개 삭제 안내를 거쳐 삭제 코드를 외부 삭제 페이지에 직접 제출하여 삭제할 수 있습니다. 삭제 코드는 익명 프로필 생성 직후 한 번 표시·발급되며 현재 Android 설정 화면에서는 다시 표시되지 않습니다.

## 공개 정책
- [개인정보처리방침](https://lolclassic.github.io/lol-encyclopedia-classic-site/privacy.html)
- [이용약관](https://lolclassic.github.io/lol-encyclopedia-classic-site/terms.html)
- [커뮤니티 프로필 및 데이터 삭제](https://lolclassic.github.io/lol-encyclopedia-classic-site/delete-account.html)
- [문의](https://lolclassic.github.io/lol-encyclopedia-classic-site/contact.html)

지원 이메일: gktmtmxhs7313@gmail.com

롤 백과사전 클래식은 Riot Games의 보증·승인을 받은 공식 제품이 아닙니다.

## 게시된 영문 화면 검증 · 2026-09-30 촬영

`assets/physical-26195-en-r33-raw/physical-26195-en-provenance.json`에는 2026-09-30 당시 개발 APK를 설치한 실제 휴대폰에서 촬영한 영문 화면 4장과 무음 영상 1개의 SHA-256, 크기, APK 해시, 촬영·상태 복구 기록을 남깁니다. 사이트 갤러리는 이 r33 원본을 참조하며, 이후 새로 빌드된 APK의 촬영물로 표시하지 않습니다. 정지 화면은 WebView DevTools로 경로를 열고, 화면 녹화는 Android 기본 스와이프로 영문 챔피언 목록을 스크롤했습니다. `privacyReview`에는 Codex가 1080×2340 원본 화면 4장과 영상의 디코딩된 302프레임을 시각적으로 검토해 개인정보 노출을 발견하지 않았음을 기록했습니다. 영상 검토는 원본 1080×2340 프레임을 360×780으로 축소해 배치한 18개 번호 순서 컨택트 시트에서 진행했으므로 아주 작은 글자의 식별에는 제한이 있습니다. 2026-09-30 사용자의 사이트 미디어 게시 승인과 이어진 현재 버전 반영 요청을 근거로 `userPublicationApproved=true`, `publicationReady=true`이며, 이 근거를 `publicationApprovalBasis`에 기록합니다. `publicationReady`는 해당 촬영물의 기술 검증과 사용자 사이트 게시 승인을 뜻하며, Play 출시나 자산 권리 승인을 뜻하지 않습니다. 전체 프레임을 사람이 개별 검토한 사실은 없으므로 `humanReviewed=false`를 유지합니다. Android 상태바·탐색 막대와 기기 상태 아이콘은 남아 있습니다. r33 원본 경로는 승인된 게시 목록에 포함합니다. 앞서 게시한 r32 원본은 바이트·촬영 당시 APK 해시·화면 4장과 영상 309프레임의 검토 기록을 변경 없이 보존하고 `--historical-r32`로 검사합니다. `python verify_physical_media_26195.py`는 게시된 r33 촬영물의 바이트와 기록된 검토 상태를 확인합니다. `--android-repo <Android repository>` 옵션은 현재 개발 APK가 r33 촬영 당시 APK와 동일한지도 검사하므로 이후 APK가 바뀌면 불일치를 보고합니다. r31은 촬영 당시 APK와 화면 4장·영상 295프레임의 Codex 검토 기록을 그대로 보존한 역사적 자료이며 `--candidate-r31`로 검사합니다. 나머지 과거 후보 원본은 Git에서 제외하며, r30·r28·r27·r26·r25·r24·r23 후보와 r22·r21·r20 촬영물도 각각 당시 APK의 역사적 기록으로 보존합니다. r30은 `--candidate-r30`, r28은 `--candidate-r28`, r27은 `--candidate-r27`, r26은 `--candidate-r26`, r25는 `--candidate-r25`, r24는 `--candidate-r24`, r23은 `--candidate-r23`, r22는 `--previous-r22`, r21은 `--previous-r21`, r20은 `--previous-r20`, 더 이전 자료는 `--historical`로 검사합니다. 어느 촬영물도 Play 출시 스크린샷이 아닙니다.

`assets/preview-26195-en-provenance.json`의 브라우저 화면 10장과 무음 영상 1개는 이전 개발 자산 스냅샷의 역사적 미리보기입니다. 원본 파일 해시와 캡처 방법을 보존하며, 현재 Android 소스·PC 베타와 일치하는 촬영물로 주장하지 않습니다. `python verify_preview_media.py --android-www <Android repository>/app/src/main/assets/www`는 이를 `PASS_HISTORICAL_MEDIA`로 분류합니다.

브라우저 미리보기를 현재 소스에서 다시 촬영하려면 Android `www` 디렉터리를 `127.0.0.1:8765`에서 제공하고, 해당 Android 소스에서 PC 베타를 다시 내보낸 뒤 `node capture_preview_media_26195.js http://127.0.0.1:8765/index.html#home`을 실행합니다. 촬영 전에 파일만 임시 디렉터리에 만들어 확인하려면 끝에 `--stage-only`를 붙입니다. 스크립트는 Edge에서 `en-US` 화면을 열고 외부 요청을 차단하며, 10개 PNG와 무음 MP4의 해시·소스 지문을 기록합니다. 이후 `python verify_preview_media.py --android-www <Android repository>/app/src/main/assets/www`로 결과를 대조합니다.

촬영에는 Playwright, Microsoft Edge, `ffmpeg`, `ffprobe`가 필요합니다. `PLAYWRIGHT_MODULE`은 Playwright 모듈, `CHROMIUM_EXECUTABLE`은 Edge 실행 파일 경로로 지정합니다.

## 이전 휴대폰 촬영물 보존

`capture-evidence.json`에는 이전 QA APK와 웹 자산의 일치 결과, 2.0.4 사진 10장과 실제 화면 녹화의 해시, 화면에 보인 이미지의 경로·해시를 기록합니다. 개인 기기 식별자, 로컬 경로, 사용자 저장 데이터는 공개하지 않습니다. 문의 화면은 빈 양식이며 전송하지 않았습니다.

사진은 원본의 모든 RGB 픽셀을 보존한 1080×1920 크기의 24-bit RGB PNG이며 영상은 Android 화면 녹화의 영상 스트림을 보존해 MP4 컨테이너를 정리했습니다. 촬영 중 다른 앱의 알림 아이콘을 숨기고 촬영 후 시스템 설정을 복원했습니다. 일반 시계·배터리·연결 표시는 그대로입니다. `app-main-screen.png`는 첫 룬 페이지 사진과 동일한 포스터입니다. 기존 앱 아이콘의 출처 기록은 유지합니다. 공개 사진 검증은 APK 전체의 배포 권한이나 Play 출시 심사를 대신하지 않습니다.

현재 공개 미디어 검증 명령:

```text
python verify_current_capture.py
python verify_public_phase2b3.py --report public-qa-phase2b3.json
python verify_riot_notices.py
python -m unittest -v test_capture_public_marketing.py test_current_capture.py
```

`capture_public_marketing.py`와 `finalize_media_provenance.py`는 이전 촬영 계획을 보존한 도구입니다. 현재 미디어는 새 물리 기기 촬영 결과를 검토한 뒤 별도로 반영했으며, 이전 도구의 APK 배포 검사는 완화하지 않았습니다.
