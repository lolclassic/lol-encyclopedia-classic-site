# 26.20.1 PC 베타 공개 계약

사용자의 현재 지시 “일단 배포진행해”를 근거로 Android 소스 커밋 `2f5ac8a0`과 사이트 커밋 `c034f63`을 반영했습니다. 이 PC 베타는 사이트에서 공개되며, 기존 26.19.5 exporter·음성 고정 해시·승인 기록·촬영물은 해당 버전의 기록으로 보존합니다. 사이트 게시 지시와 Riot 자산 권리 허가는 구분합니다.

## Google Play 제공 상태

Google Play Console에서 26.20.1(code 26) 릴리스가 `활성`이고 100% 출시 상태로 8개 대상 국가/지역에 제공 중임을 확인했습니다. 대상은 대한민국·일본·미국·영국·캐나다·오스트레일리아·뉴질랜드·아일랜드입니다. 스토어 전파에는 시간이 더 걸릴 수 있습니다. 이 상태는 Riot 자산 권리 허가, Riot Production API 승인, 모든 기기·국가에서의 실제 다운로드 또는 더 높은 버전 자동 설치 검증을 뜻하지 않습니다.

## 새 도구

- `prepare_pc_beta_contract_2620.py`: 최종 Android 자료를 읽고 정확한 원본 파일 해시·이미지·음성 목록을 고정합니다. 자료가 바뀌면 새 검토 계약을 준비해야 합니다. 승인 기록을 만들지 않습니다.
- `export_pc_beta_2620.py`: 이 계약과 현재 원본이 완전히 일치할 때만 PC 사본을 내보냅니다. 백과사전용 JS/CSS/JSON, manifest의 이미지, 검토한 기존·신규 음성만 포함합니다. 운영자/CMS·커뮤니티·원격 업데이트·외부 동영상 모듈은 제외합니다.
- `verify_pc_beta_2620.py --candidate`: 원본·PC 사본·카탈로그·CSP를 확인한 로컬 검토 결과를 출력합니다. 공개 승인으로 간주하지 않습니다.
- `verify_pc_beta_2620.py`: 새 export manifest 해시와 명시적인 26.20 사용자 승인 기록이 일치해야 통과합니다.

26.19 스크립트·completion·영어 자료·frozen roster는 변경하지 않고 새 26.20 스크립트를 뒤에 추가합니다. 이전 단계에서 승계한 변경 없는 스킬 자료의 근거를 보존합니다. 신규 챔피언은 `Jade_Aatrox/Caitlyn/Irelia/Karma/Quinn`이며 일반 본섭 챔피언과 ID를 구분합니다.

기존 여덟 음성 카탈로그는 원래 exporter의 고정 분류·분포·SHA 검사로 확인합니다. `classic-voice-2620.json`은 별도 schema/분류/해시와 KO233·JA224·EN233의 690개 참조, 689개 고유 음성 파일을 확인합니다. SHA·언어·원본 연결 검증은 전체 대사의 사람 청취나 녹음 시기 확인을 뜻하지 않습니다.

## 실행 명령

실행 위치: 이 사이트 publish worktree. 먼저 Android의 최종 `meta.json`, 26.20 데이터와 HTML 연결을 완성하고 offline manifest를 다시 생성합니다. 도구 실행 전 새 파일과 데이터·언어 UI를 검토합니다.

```powershell
python -B prepare_pc_beta_contract_2620.py --android-www '<Android repository>/app/src/main/assets/www'
python -B export_pc_beta_2620.py --android-www '<Android repository>/app/src/main/assets/www'
python -B verify_pc_beta_2620.py --candidate --android-www '<Android repository>/app/src/main/assets/www'
```

다른 출력 경로를 검토하려면 exporter에 `--target <empty-or-exporter-owned-dir>`, verifier에 `--root <same-dir>`를 사용합니다. 비어 있지 않은 폴더는 기존 exporter manifest와 모든 파일 해시가 맞아야 합니다. 기존 파일 변경이나 목록 외 파일이 있으면 내보내기를 중단해 보존합니다.

로컬 브라우저에서 한국어·일본어·영어의 배치, 추천 세 트리, 용어 팝업, 음성 목록·재생, 직전 화면 복귀, 아이템 분류 스크롤을 확인합니다. 이전 browser 검사 파일의 72명·26.19 가드는 바꾸어 통과시키지 말고 별도 26.20 검증을 사용합니다.

## 공개 승인

현재 사용자 배포 지시를 근거로 `pc-beta-publication.json`에 `appVersion: "26.20.1"`, `userPublicationApproved: true`, 실제 `pc-beta/export-manifest.json`의 SHA-256을 기록했습니다. 승인 근거는 r11 공개 미디어 provenance에 남깁니다. 기본 verifier를 통과한 동일 파일만 Git에 포함합니다. 이 승인은 PC 미리보기 게시 승인이고 Play 출시나 Riot 자산 권리 승인이 아닙니다.

PC 베타에는 APK 자동 업데이트·CMS·커뮤니티·운영자·원격 동영상 모듈을 포함하지 않습니다. Android 업데이트 피드의 실제 게시·설치 상태는 별도 네이티브 배포 기록을 기준으로 하며 이 PC 게시 승인이 이를 대신하지 않습니다.

## 현재 자료와 미완료 항목

클래식 챔피언 77명과 한국어·일본어·영어를 지원합니다. 신규 5명의 과거 픽 음성은 한국어 5개·일본어 4개·영어 5개이며 카르마 일본어 원본은 미확보입니다. 신규 배경은 과거 설정의 편집 요약·번역입니다. 현재 Classic 클라이언트 선택 이벤트 검증이나 사람의 전 음성 청취를 주장하지 않습니다.

현재 PC export manifest: `78a71109c8436417843c9f25c9112443a44b253cdc1f735515dd7cf88302a1e2`. 11,957개 파일·406,415,391바이트와 source contract를 변경하지 않았습니다. 새 사진 18장과 영상은 26.20.1 r11 실제 휴대폰 촬영이며 이전 미디어를 재표기하지 않았습니다.
