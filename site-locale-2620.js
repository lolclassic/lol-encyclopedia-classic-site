/* Local, deterministic homepage translations. Does not modify app data or policy pages. */
(() => {
  'use strict';
  const TEXT = {
  "LoL Encyclopedia Classic — Unofficial Archive": {
    "ko": "LoL 백과사전 클래식 — 비공식 아카이브",
    "ja": "LoL クラシック百科事典 — 非公式アーカイブ"
  },
  "Skip to content": {
    "ko": "본문으로 이동",
    "ja": "本文へ移動"
  },
  "LoL Encyclopedia Classic": {
    "ko": "LoL 백과사전 클래식",
    "ja": "LoL クラシック百科事典"
  },
  "PC Beta": {
    "ko": "PC 베타",
    "ja": "PC ベータ"
  },
  "Features": {
    "ko": "기능",
    "ja": "機能"
  },
  "Video": {
    "ko": "영상",
    "ja": "動画"
  },
  "Screens": {
    "ko": "화면",
    "ja": "画面"
  },
  "Release": {
    "ko": "출시 현황",
    "ja": "公開状況"
  },
  "Privacy": {
    "ko": "개인정보",
    "ja": "プライバシー"
  },
  "Contact": {
    "ko": "문의",
    "ja": "お問い合わせ"
  },
  "THE CLASSIC ARCHIVE": {
    "ko": "클래식 아카이브",
    "ja": "クラシックアーカイブ"
  },
  "Android app · PC browser beta": {
    "ko": "Android 앱 · PC 브라우저 베타",
    "ja": "Android アプリ · PC ブラウザベータ"
  },
  "Riot Games official reference link · League of Legends": {
    "ko": "Riot Games 공식 참고 링크 · 리그 오브 레전드",
    "ja": "Riot Games 公式参考リンク · リーグ・オブ・レジェンド"
  },
  "Android beta · PC browser beta · 26.20": {
    "ko": "Android 베타 · PC 브라우저 베타 · 26.20",
    "ja": "Android ベータ · PC ブラウザベータ · 26.20"
  },
  "The League you remember.": {
    "ko": "기억 속 리그를 다시.",
    "ja": "懐かしいリーグを、\nもう一度。"
  },
  "Return to Classic.": {
    "ko": "클래식으로 돌아오세요.",
    "ja": "クラシックへ戻ろう。"
  },
  "is an independently developed historical reference for Classic champions, items, masteries, summoner spells, and runes. Explore the Android development build and its PC browser beta preview.": {
    "ko": "은 클래식 챔피언, 아이템, 특성, 소환사 주문과 룬을 정리한 독립 개발 자료 앱입니다. Android 개발 버전과 PC 브라우저 베타 미리보기를 살펴보세요.",
    "ja": "は、クラシックのチャンピオン、アイテム、マスタリー、サモナースペル、ルーンをまとめた独立開発の資料アプリです。Android 開発版と PC ブラウザベータのプレビューをご覧ください。"
  },
  "Open PC Beta": {
    "ko": "PC 베타 열기",
    "ja": "PC ベータを開く"
  },
  "View app screens": {
    "ko": "앱 화면 보기",
    "ja": "アプリ画面を見る"
  },
  "Free": {
    "ko": "무료",
    "ja": "無料"
  },
  "No ads": {
    "ko": "광고 없음",
    "ja": "広告なし"
  },
  "No email login": {
    "ko": "이메일 로그인 없음",
    "ja": "メールログイン不要"
  },
  "Android HTTPS community": {
    "ko": "Android HTTPS 커뮤니티",
    "ja": "Android HTTPS コミュニティ"
  },
  "26.20 · Candidate under review": {
    "ko": "26.20 · 후보 버전 검토 중",
    "ja": "26.20 · 候補版を確認中"
  },
  "Explore Classic 26.20.": {
    "ko": "클래식 26.20을 살펴보세요.",
    "ja": "クラシック 26.20 を見てみよう。"
  },
  "Riot's 26.20 patch notes ↗": {
    "ko": "Riot 26.20 패치 노트 ↗",
    "ja": "Riot 26.20 パッチノート ↗"
  },
  "26.20 beta · Reference data": {
    "ko": "26.20 베타 · 참고 데이터",
    "ja": "26.20 ベータ · 参考データ"
  },
  "Classic champions": {
    "ko": "클래식 챔피언",
    "ja": "クラシックチャンピオン"
  },
  "Shop-listed items": {
    "ko": "상점 표시 아이템",
    "ja": "ショップ掲載アイテム"
  },
  "Masteries": {
    "ko": "특성",
    "ja": "マスタリー"
  },
  "Summoner spells": {
    "ko": "소환사 주문",
    "ja": "サモナースペル"
  },
  "Classic runes": {
    "ko": "클래식 룬",
    "ja": "クラシックルーン"
  },
  "Champion skill references": {
    "ko": "챔피언 스킬 자료",
    "ja": "チャンピオンのスキル資料"
  },
  "26.20 · Browser beta preview": {
    "ko": "26.20 · 브라우저 베타 미리보기",
    "ja": "26.20 · ブラウザベータプレビュー"
  },
  "Explore the PC Beta.": {
    "ko": "PC 베타를 살펴보세요.",
    "ja": "PC ベータを見てみよう。"
  },
  "The PC Beta uses the app's current encyclopedia interface to browse 77 champions, shop-listed items, masteries, spells, runes, and 26.20 news. Champion details include editorial suggested builds and explanations of linked skill effects. Suggested builds include two role-based summoner spells and a compact Offense, Defense, and Utility overview. The three trees retain their original six-row, four-column positions; tap an icon to read its name and points. Cataloged voice lines play locally where available, with their language labels. Settings and saved reference choices stay in the browser.": {
    "ko": "PC 베타는 앱의 현재 백과사전 화면을 사용해 챔피언 77명, 상점 표시 아이템, 특성, 주문, 룬과 26.20 소식을 보여 줍니다. 챔피언 상세 화면에는 편집된 추천 조합과 연결된 스킬 효과 설명이 있습니다. 추천 조합에는 역할에 맞춘 소환사 주문 2개와 공격·방어·보조 특성을 함께 보여 주는 작은 요약이 포함됩니다. 세 특성 트리는 원래의 6행·4열 위치를 유지합니다. 아이콘을 누르면 이름과 투자 포인트를 볼 수 있습니다. 목록에 있는 음성대사는 제공되는 범위에서 로컬 재생되며 언어를 표시합니다. 설정과 저장한 자료 선택은 브라우저에 남습니다.",
    "ja": "PC ベータでは、アプリの現在の百科事典画面を使って、77体のチャンピオン、ショップ掲載アイテム、マスタリー、スペル、ルーン、26.20 のニュースを閲覧できます。チャンピオン詳細には編集者によるおすすめビルドと、リンク付きスキル効果の説明があります。おすすめビルドには役割に合わせた2つのサモナースペルと、オフェンス・ディフェンス・ユーティリティをまとめた小さな一覧が含まれます。3つのツリーは元の6行・4列の位置を保ちます。アイコンをタップすると名前とポイントを確認できます。収録済みボイスは、提供されている範囲でローカル再生でき、言語ラベルも表示します。設定と保存した資料の選択はブラウザ内に残ります。"
  },
  "Community and online video are not connected in this browser preview; the Android app handles the online community.": {
    "ko": "이 브라우저 미리보기에는 커뮤니티와 온라인 영상이 연결되어 있지 않습니다. 온라인 커뮤니티는 Android 앱에서 이용합니다.",
    "ja": "このブラウザプレビューでは、コミュニティとオンライン動画は接続されていません。オンラインコミュニティは Android アプリで利用します。"
  },
  "26.20 beta": {
    "ko": "26.20 베타",
    "ja": "26.20 ベータ"
  },
  "A historical archive and community in one app.": {
    "ko": "한 앱에서 만나는 기록과 커뮤니티.",
    "ja": "1つのアプリで、資料とコミュニティを。"
  },
  "The app includes searchable champion, item, rune, and terminology references. Posts, comments, recommendations, reporting, blocking, and bug reports are handled by an HTTPS online service.": {
    "ko": "앱에는 검색 가능한 챔피언·아이템·룬·용어 자료가 있습니다. 게시글, 댓글, 추천, 신고, 차단과 버그 제보는 HTTPS 온라인 서비스에서 처리합니다.",
    "ja": "アプリには検索できるチャンピオン、アイテム、ルーン、用語の資料があります。投稿、コメント、投稿への推薦、通報、ブロック、不具合報告は HTTPS のオンラインサービスで処理します。"
  },
  "77 Classic champions": {
    "ko": "클래식 챔피언 77명",
    "ja": "77体のクラシックチャンピオン"
  },
  "Browse Classic champion portraits, localized names, attributes, and P/Q/W/E/R skills.": {
    "ko": "클래식 챔피언의 초상화, 언어별 이름, 능력치와 P/Q/W/E/R 스킬을 살펴보세요.",
    "ja": "クラシックチャンピオンのポートレート、各言語の名前、ステータス、P/Q/W/E/R スキルを確認できます。"
  },
  "147 shop-listed items": {
    "ko": "상점 표시 아이템 147개",
    "ja": "ショップ掲載アイテム147個"
  },
  "Explore prices, component items, connected build paths, and familiar Korean item nicknames.": {
    "ko": "가격, 하위 아이템, 연결된 조합 경로와 익숙한 한국어 아이템 별명을 확인하세요.",
    "ja": "価格、素材アイテム、つながるビルド経路、韓国語のアイテム通称を確認できます。"
  },
  "Masteries and spells": {
    "ko": "특성과 주문",
    "ja": "マスタリーとスペル"
  },
  "Review 56 masteries and 16 classic summoner spells. Suggested builds show Offense, Defense, and Utility together in a compact overview, preserving each tree's original grid positions.": {
    "ko": "특성 56개와 클래식 소환사 주문 16개를 살펴보세요. 추천 조합은 공격·방어·보조 특성을 작은 요약으로 함께 보여 주며, 각 트리의 원래 격자 위치를 유지합니다.",
    "ja": "56個のマスタリーと16個のクラシックサモナースペルを確認できます。おすすめビルドではオフェンス・ディフェンス・ユーティリティを小さな一覧にまとめ、各ツリーの元の配置を保ちます。"
  },
  "Classic rune pages": {
    "ko": "클래식 룬 페이지",
    "ja": "クラシックルーンページ"
  },
  "Choose from 53 Classic runes, including 17 quintessences, and arrange a complete 30-slot rune page.": {
    "ko": "정수 17개를 포함한 클래식 룬 53개에서 선택해 30칸 룬 페이지를 구성하세요.",
    "ja": "17個のクイントエッセンスを含む53個のクラシックルーンから選び、30スロットのルーンページを作れます。"
  },
  "Pseudonymous community": {
    "ko": "닉네임 기반 커뮤니티",
    "ja": "ニックネームで使うコミュニティ"
  },
  "The online community requires age 18+ confirmation and acceptance of its terms before use. It supports posts, comments, recommendations, reports, and blocks.": {
    "ko": "온라인 커뮤니티는 이용 전 만 18세 이상 확인과 약관 동의가 필요합니다. 게시글, 댓글, 추천, 신고와 차단을 지원합니다.",
    "ja": "オンラインコミュニティの利用には、18歳以上の確認と利用規約への同意が必要です。投稿、コメント、投稿への推薦、通報、ブロックに対応しています。"
  },
  "Three app languages": {
    "ko": "앱 언어 3개",
    "ja": "アプリは3言語に対応"
  },
  "Choose Korean, Japanese, or English for the interface and reference descriptions. The voice language has a separate setting and source labels.": {
    "ko": "화면과 자료 설명의 언어를 한국어·일본어·영어 중에서 선택하세요. 음성 언어는 별도 설정과 출처 라벨이 있습니다.",
    "ja": "画面と資料の説明は、韓国語・日本語・英語から選べます。ボイスの言語には個別の設定と出典ラベルがあります。"
  },
  "Suggested Classic builds": {
    "ko": "클래식 추천 조합",
    "ja": "クラシックのおすすめビルド"
  },
  "Each of the 77 champions has an editorial example of items, runes, masteries, two summoner spells, and skill order. These are reference suggestions, not measured pick rates or win rates.": {
    "ko": "챔피언 77명 각각에 아이템, 룬, 특성, 소환사 주문 2개와 스킬 순서의 편집된 예시가 있습니다. 참고용 추천이며, 측정된 선택률이나 승률이 아닙니다.",
    "ja": "77体それぞれに、アイテム、ルーン、マスタリー、2つのサモナースペル、スキル取得順の編集例があります。参考用のおすすめであり、実測のピック率や勝率ではありません。"
  },
  "Skill effect explanations": {
    "ko": "스킬 효과 설명",
    "ja": "スキル効果の説明"
  },
  "Tap linked ability terms to read brief explanations in the selected app language.": {
    "ko": "스킬 설명에서 연결된 용어를 누르면 선택한 앱 언어로 짧은 설명을 볼 수 있습니다.",
    "ja": "スキル説明内のリンク付き用語をタップすると、選択したアプリ言語で短い説明を読めます。"
  },
  "In the 26.20 beta": {
    "ko": "26.20 베타에서",
    "ja": "26.20 ベータで"
  },
  "League Classic 26.20 news": {
    "ko": "리그 클래식 26.20 소식",
    "ja": "リーグ クラシック 26.20 のニュース"
  },
  "The app includes the Classic portion of patch 26.20 in Korean, Japanese, and English. New Classic champions and balance changes have separate archive entries. Open the original Riot patch notes for the complete update.": {
    "ko": "앱에는 26.20 패치의 클래식 부분이 한국어·일본어·영어로 포함되어 있습니다. 새 클래식 챔피언과 밸런스 변경은 별도 아카이브 항목으로 확인할 수 있습니다. 전체 업데이트는 Riot 패치 노트 원문을 확인하세요.",
    "ja": "アプリには26.20パッチのクラシック部分が韓国語・日本語・英語で収録されています。新しいクラシックチャンピオンとバランス変更には、専用のアーカイブ項目があります。更新全体は Riot のパッチノート原文をご確認ください。"
  },
  "Riot's full patch notes (Korean) ↗": {
    "ko": "Riot 패치 노트 전체 보기 (한국어) ↗",
    "ja": "Riot パッチノート全文（韓国語）↗"
  },
  "Data boundary": {
    "ko": "데이터 처리 범위",
    "ja": "データの処理範囲"
  },
  "Local reference data stays separate from the online community.": {
    "ko": "로컬 참고 자료와 온라인 커뮤니티는 별도로 처리합니다.",
    "ja": "ローカル資料とオンラインコミュニティは別々に処理します。"
  },
  "App settings, masteries, builds, and rune pages remain on the device. Community requests use LOLFLIX over HTTPS. Optional post translation has been tested in the 26.20 development app's Canary environment. It is not yet available in the production app. When enabled and requested, LOLFLIX's Cloudflare Worker sends stored post titles, bodies, and target language to Google Gemini API using a billing-linked project. Canary has request-count limits, but these do not guarantee zero cost.": {
    "ko": "앱 설정, 특성, 조합과 룬 페이지는 기기에 남습니다. 커뮤니티 요청은 HTTPS로 LOLFLIX에 전달합니다. 선택형 게시글 번역은 26.20 개발 앱의 Canary 환경에서 시험했습니다. 운영 앱에서는 아직 이용할 수 없습니다. 기능을 활성화하고 번역을 요청하면 LOLFLIX의 Cloudflare Worker가 저장된 게시글 제목·본문·목표 언어를 결제 연결 프로젝트의 Google Gemini API에 보냅니다. Canary에는 요청 횟수 제한이 있지만, 비용이 발생하지 않는다고 보장하지는 않습니다.",
    "ja": "アプリの設定、マスタリー、ビルド、ルーンページは端末内に残ります。コミュニティのリクエストは HTTPS で LOLFLIX に送信します。任意の投稿翻訳は26.20開発アプリの Canary 環境でテストしました。本番アプリではまだ利用できません。有効化された状態で翻訳を依頼すると、LOLFLIX の Cloudflare Worker が保存済みの投稿タイトル、本文、対象言語を、課金に連携したプロジェクトの Google Gemini API に送信します。Canary にはリクエスト数の制限がありますが、費用が発生しないことを保証するものではありません。"
  },
  "Privacy details": {
    "ko": "개인정보 처리 자세히 보기",
    "ja": "プライバシーの詳細"
  },
  "On device": {
    "ko": "기기 내부",
    "ja": "端末内"
  },
  "Local archive": {
    "ko": "로컬 아카이브",
    "ja": "ローカルアーカイブ"
  },
  "Historical references and preferences": {
    "ko": "과거 자료와 환경 설정",
    "ja": "過去の資料と環境設定"
  },
  "Mastery choices, builds, and rune-page state": {
    "ko": "특성 선택, 조합과 룬 페이지 상태",
    "ja": "マスタリーの選択、ビルド、ルーンページの状態"
  },
  "Removable through app data deletion": {
    "ko": "앱 데이터 삭제로 제거 가능",
    "ja": "アプリデータの削除で消去可能"
  },
  "No ads, analytics SDK, purchases, or subscriptions": {
    "ko": "광고·분석 SDK·구매·구독 없음",
    "ja": "広告・分析 SDK・購入・サブスクリプションなし"
  },
  "HTTPS online processing": {
    "ko": "HTTPS 온라인 처리",
    "ja": "HTTPS オンライン処理"
  },
  "Community and moderation": {
    "ko": "커뮤니티와 운영 관리",
    "ja": "コミュニティと管理"
  },
  "Pseudonymous profiles and nicknames": {
    "ko": "닉네임 기반 프로필",
    "ja": "ニックネームを使うプロフィール"
  },
  "Posts, comments, recommendations, reports, blocks, and bug reports": {
    "ko": "게시글·댓글·추천·신고·차단·버그 제보",
    "ja": "投稿・コメント・投稿への推薦・通報・ブロック・不具合報告"
  },
  "Age 18+ confirmation and acceptance of the 2026-09-27 terms": {
    "ko": "만 18세 이상 확인과 2026-09-27 약관 동의",
    "ja": "18歳以上の確認と2026-09-27の利用規約への同意"
  },
  "Moderator review and content management": {
    "ko": "운영자의 검토와 콘텐츠 관리",
    "ja": "管理者による確認とコンテンツ管理"
  },
  "26.20 beta · English phone capture · October 7, 2026": {
    "ko": "26.20 베타 · 영어 휴대폰 촬영 · 2026년 10월 7일",
    "ja": "26.20 ベータ · 英語の実機撮影 · 2026年10月7日"
  },
  "See Classic 26.20 on a phone.": {
    "ko": "휴대폰에서 클래식 26.20을 만나보세요.",
    "ja": "スマートフォンでクラシック26.20を。"
  },
  "These screens and the silent feature tour were captured from the 26.20 beta on a physical Android phone. They show the home screen, Classic Aatrox, Garen's suggested mastery trees, and a linked skill-effect explanation. The complete app area is retained; the phone's system bars are outside this WebView view.": {
    "ko": "이 화면과 무음 기능 소개 영상은 실제 Android 휴대폰의 26.20 베타에서 촬영했습니다. 메인 화면, 클래식 아트록스, 가렌 추천 특성 트리와 연결된 스킬 효과 설명을 보여 줍니다. 앱 영역 전체를 유지했으며, 휴대폰 시스템 표시줄은 이 WebView 영역 밖에 있습니다.",
    "ja": "これらの画面と無音の機能紹介動画は、実機の Android スマートフォンで26.20ベータを撮影したものです。ホーム画面、クラシックのエイトロックス、ガレンのおすすめマスタリー、リンク付きスキル効果の説明を紹介します。アプリ領域全体を保持しており、端末のシステムバーはこの WebView 領域の外にあります。"
  },
  "Classic home · English": {
    "ko": "클래식 메인 · 영어",
    "ja": "クラシックのホーム · 英語"
  },
  "26.20 beta · October 7, 2026.": {
    "ko": "26.20 베타 · 2026년 10월 7일.",
    "ja": "26.20 ベータ · 2026年10月7日。"
  },
  "Your browser does not support HTML5 video.": {
    "ko": "이 브라우저는 HTML5 영상을 지원하지 않습니다.",
    "ja": "このブラウザは HTML5 動画に対応していません。"
  },
  "English feature tour · phone": {
    "ko": "영어 기능 소개 · 휴대폰",
    "ja": "英語の機能紹介 · スマートフォン"
  },
  "Silent 23.37-second recording of the beta app · October 7, 2026.": {
    "ko": "베타 앱 무음 영상 23.37초 · 2026년 10월 7일.",
    "ja": "ベータアプリの無音動画23.37秒 · 2026年10月7日。"
  },
  "26.20 beta · English · Physical Android phone": {
    "ko": "26.20 베타 · 영어 · 실제 Android 휴대폰",
    "ja": "26.20 ベータ · 英語 · 実機の Android スマートフォン"
  },
  "Four views of the latest beta.": {
    "ko": "최신 베타의 네 가지 화면.",
    "ja": "最新ベータの4つの画面。"
  },
  "Open a screenshot to see the full app view. Choose Korean, Japanese, or English in the app's language settings. Suggested builds are editorial reference examples rather than measured win-rate statistics.": {
    "ko": "이미지를 열면 앱 화면 전체를 볼 수 있습니다. 앱 언어 설정에서 한국어·일본어·영어를 선택하세요. 추천 조합은 편집된 참고 예시이며, 측정된 승률 통계가 아닙니다.",
    "ja": "画像を開くとアプリ画面全体を確認できます。アプリの言語設定では韓国語・日本語・英語を選べます。おすすめビルドは編集された参考例であり、実測の勝率統計ではありません。"
  },
  "Classic home · phone": {
    "ko": "클래식 메인 · 휴대폰",
    "ja": "クラシックのホーム · スマートフォン"
  },
  "26.20 beta · English": {
    "ko": "26.20 베타 · 영어",
    "ja": "26.20 ベータ · 英語"
  },
  "Aatrox · Classic entry": {
    "ko": "아트록스 · 클래식 항목",
    "ja": "エイトロックス · クラシック項目"
  },
  "Garen · suggested masteries": {
    "ko": "가렌 · 추천 특성",
    "ja": "ガレン · おすすめマスタリー"
  },
  "Offense, Defense and Utility together": {
    "ko": "공격·방어·보조를 한눈에",
    "ja": "オフェンス・ディフェンス・ユーティリティを一覧に"
  },
  "Linked skill effect · taunt": {
    "ko": "스킬 효과 연결 · 도발",
    "ja": "スキル効果リンク · タウント"
  },
  "Brief explanation with a close button": {
    "ko": "닫기 버튼이 있는 짧은 설명",
    "ja": "閉じるボタン付きの短い説明"
  },
  "Previous capture record · 26.19.5 · September 30, 2026": {
    "ko": "이전 촬영 기록 · 26.19.5 · 2026년 9월 30일",
    "ja": "以前の撮影記録 · 26.19.5 · 2026年9月30日"
  },
  "These earlier images and their recording retain the version and date of the original development snapshot.": {
    "ko": "이전 이미지와 영상은 원래 개발 버전의 번호와 촬영일을 유지합니다.",
    "ja": "以前の画像と動画は、元の開発版のバージョンと撮影日を保持しています。"
  },
  "26.19.5 English phone capture · September 30, 2026": {
    "ko": "26.19.5 영어 휴대폰 촬영 · 2026년 9월 30일",
    "ja": "26.19.5 英語の実機撮影 · 2026年9月30日"
  },
  "See the development app on a phone.": {
    "ko": "휴대폰의 개발 앱 화면을 확인하세요.",
    "ja": "スマートフォンの開発アプリ画面を見る。"
  },
  "The four screenshots and silent champion-list recording were captured directly from the 26.19.5 development app on a physical Android phone on September 30, 2026. They show that development snapshot's archive pages; later interface changes can be explored in the PC Beta.": {
    "ko": "화면 4장과 무음 챔피언 목록 영상은 2026년 9월 30일 실제 Android 휴대폰의 26.19.5 개발 앱에서 직접 촬영했습니다. 당시 개발 버전의 자료 화면을 보여 줍니다. 이후 화면 변경은 PC 베타에서 살펴볼 수 있습니다.",
    "ja": "4枚の画面と無音のチャンピオン一覧動画は、2026年9月30日に実機の Android スマートフォンで26.19.5開発アプリを直接撮影しました。当時の開発版の資料画面を示しています。その後の画面変更は PC ベータで確認できます。"
  },
  "English champion archive on a phone": {
    "ko": "휴대폰의 영어 챔피언 자료",
    "ja": "スマートフォンの英語チャンピオン資料"
  },
  "26.19.5 Android development snapshot · September 30, 2026.": {
    "ko": "26.19.5 Android 개발 버전 기록 · 2026년 9월 30일.",
    "ja": "26.19.5 Android 開発版の記録 · 2026年9月30日。"
  },
  "Physical-phone champion archive": {
    "ko": "실제 휴대폰 챔피언 자료",
    "ja": "実機のチャンピオン資料"
  },
  "Silent Android recording of the English champion list · September 30, 2026.": {
    "ko": "영어 챔피언 목록 Android 무음 영상 · 2026년 9월 30일.",
    "ja": "英語チャンピオン一覧の Android 無音動画 · 2026年9月30日。"
  },
  "26.19.5 development snapshot · English · September 30, 2026": {
    "ko": "26.19.5 개발 버전 기록 · 영어 · 2026년 9월 30일",
    "ja": "26.19.5 開発版の記録 · 英語 · 2026年9月30日"
  },
  "English screens from a phone": {
    "ko": "휴대폰에서 촬영한 영어 화면",
    "ja": "スマートフォンで撮影した英語画面"
  },
  "These four screenshots were captured from the 26.19.5 Android development app on a physical phone on September 30, 2026. They preserve that development snapshot; the current PC Beta includes later interface updates.": {
    "ko": "이 화면 4장은 2026년 9월 30일 실제 휴대폰의 26.19.5 Android 개발 앱에서 촬영했습니다. 당시 개발 버전의 기록이며, 현재 PC 베타에는 이후 화면 변경이 포함되어 있습니다.",
    "ja": "これら4枚の画面は、2026年9月30日に実機のスマートフォンで26.19.5 Android 開発アプリを撮影しました。当時の開発版を記録したもので、現在の PC ベータにはその後の画面更新が含まれています。"
  },
  "Champion archive · phone": {
    "ko": "챔피언 자료 · 휴대폰",
    "ja": "チャンピオン資料 · スマートフォン"
  },
  "26.19.5 development app": {
    "ko": "26.19.5 개발 앱",
    "ja": "26.19.5 開発アプリ"
  },
  "Garen details · phone": {
    "ko": "가렌 상세 · 휴대폰",
    "ja": "ガレンの詳細 · スマートフォン"
  },
  "Item archive · phone": {
    "ko": "아이템 자료 · 휴대폰",
    "ja": "アイテム資料 · スマートフォン"
  },
  "Summoner spells · phone": {
    "ko": "소환사 주문 · 휴대폰",
    "ja": "サモナースペル · スマートフォン"
  },
  "Google Play release": {
    "ko": "Google Play 출시",
    "ja": "Google Play 公開"
  },
  "Available on Google Play.": {
    "ko": "Google Play에서 제공됩니다.",
    "ja": "Google Play で公開中。"
  },
  "Visit the": {
    "ko": "출시된 앱은",
    "ja": "公開済みのアプリは"
  },
  "Google Play listing": {
    "ko": "Google Play 스토어 페이지",
    "ja": "Google Play ストアページ"
  },
  "for the published app. The 26.20.1 release changes have been submitted to Google Play and are under review. Approval for public release is not yet confirmed. Store availability does not establish Riot Games approval or distribution authorization.": {
    "ko": "에서 확인할 수 있습니다. 26.20.1 출시 변경사항을 Google Play 심사에 제출했으며 현재 검토 중입니다. 공개 승인은 아직 확인되지 않았습니다. 스토어 제공 여부가 Riot Games의 승인이나 배포 허가를 의미하지는 않습니다.",
    "ja": "で確認できます。26.20.1のリリース変更をGoogle Playの審査に提出し、現在審査中です。公開の承認はまだ確認されていません。ストアでの提供は Riot Games の承認や配布許可を意味しません。"
  },
  "On Google Play": {
    "ko": "Google Play 공개",
    "ja": "Google Play 公開中"
  },
  "Current public listing": {
    "ko": "현재 공개 스토어 페이지",
    "ja": "現在公開中のストアページ"
  },
  "Google Play package:": {
    "ko": "Google Play 패키지:",
    "ja": "Google Play パッケージ:"
  },
  "The published store version is separate from the beta preview shown here": {
    "ko": "공개 스토어 버전은 여기의 베타 미리보기와 별개입니다",
    "ja": "公開済みストア版と、ここで紹介するベータプレビューは別のものです"
  },
  "Historical archive and HTTPS community remain separate from Riot API access": {
    "ko": "과거 자료와 HTTPS 커뮤니티는 Riot API 접근과 별도로 운영합니다",
    "ja": "過去の資料と HTTPS コミュニティは Riot API へのアクセスとは別に運用します"
  },
  "Under development": {
    "ko": "개발 중",
    "ja": "開発中"
  },
  "26.20 candidate": {
    "ko": "26.20 후보 버전",
    "ja": "26.20 候補版"
  },
  "77 champions, 147 shop-listed items, 56 masteries, 16 spells, and 53 runes in the current beta data": {
    "ko": "현재 베타 자료: 챔피언 77명, 상점 표시 아이템 147개, 특성 56개, 주문 16개, 룬 53개",
    "ja": "現在のベータ資料: チャンピオン77体、ショップ掲載アイテム147個、マスタリー56個、スペル16個、ルーン53個"
  },
  "Korean, Japanese, and English language choices are included in the candidate": {
    "ko": "후보 버전에 한국어·일본어·영어 선택을 포함했습니다",
    "ja": "候補版には韓国語・日本語・英語の選択が含まれています"
  },
  "Google Play review is in progress; production post translation remains pending": {
    "ko": "Google Play 검토가 진행 중이며 운영 게시글 번역은 아직 준비 중입니다",
    "ja": "Google Playの審査が進行中で、本番環境の投稿翻訳は引き続き準備中です"
  },
  "Availability on Google Play does not imply endorsement by Riot Games or approval of a Riot Production API application.": {
    "ko": "Google Play 제공 여부는 Riot Games의 지지나 Riot Production API 신청 승인을 의미하지 않습니다.",
    "ja": "Google Play での提供は、Riot Games の支持や Riot Production API 申請の承認を意味しません。"
  },
  "Riot API status": {
    "ko": "Riot API 상태",
    "ja": "Riot API の状況"
  },
  "Production Riot API features are not live yet.": {
    "ko": "운영 Riot API 기능은 아직 제공하지 않습니다.",
    "ja": "本番 Riot API の機能はまだ提供していません。"
  },
  "Limited in-app current-player lookup remains disabled until LoL Encyclopedia Classic (Application 861480) receives the applicable Riot Production approval. For expanded current-player statistics and match history, the Android app may open Rift Archive (Application 868824), a separately registered product. Each product will use only its own Production API key and server-side backend if approved.": {
    "ko": "LoL Encyclopedia Classic(신청 861480)이 해당 Riot Production 승인을 받기 전까지, 앱 내부의 제한된 현재 플레이어 조회는 비활성화 상태입니다. 현재 플레이어의 확장 통계와 경기 기록은 Android 앱에서 별도 등록 제품인 Rift Archive(신청 868824)를 열 수 있습니다. 승인된 경우 각 제품은 자기 제품의 Production API 키와 서버 백엔드만 사용합니다.",
    "ja": "LoL Encyclopedia Classic（申請861480）が該当する Riot Production の承認を受けるまで、アプリ内の限定的な現在のプレイヤー検索は無効のままです。現在のプレイヤーの詳しい統計や試合履歴については、Android アプリから別途登録された製品 Rift Archive（申請868824）を開く場合があります。承認された場合、各製品はそれぞれ専用の Production API キーとサーバーバックエンドだけを使用します。"
  },
  "Pending Riot approval": {
    "ko": "Riot 승인 대기",
    "ja": "Riot の承認待ち"
  },
  "Separate products · Separate API keys": {
    "ko": "별도 제품 · 별도 API 키",
    "ja": "別の製品 · 別の API キー"
  },
  "Project identity": {
    "ko": "프로젝트 소개",
    "ja": "プロジェクトについて"
  },
  "Independent, unofficial historical reference app.": {
    "ko": "독립 개발한 비공식 과거 자료 앱.",
    "ja": "独立開発の非公式資料アプリ。"
  },
  "LoL Encyclopedia Classic — Unofficial Archive is free, independently developed, and not affiliated with or endorsed by Riot Games. “Classic” describes the historical archive theme; it does not claim to be an official League of Legends Classic product.": {
    "ko": "LoL 백과사전 클래식 — 비공식 아카이브는 무료 독립 개발 앱으로, Riot Games와 제휴하거나 Riot Games의 지지를 받지 않습니다. '클래식'은 과거 자료를 정리하는 아카이브 주제를 뜻하며, 공식 리그 오브 레전드 클래식 제품임을 주장하지 않습니다.",
    "ja": "LoL クラシック百科事典 — 非公式アーカイブは、無料で独立開発されており、Riot Games との提携や Riot Games による支持を受けていません。「クラシック」は過去の資料をまとめるアーカイブのテーマを示すもので、公式のリーグ・オブ・レジェンド クラシック製品であると主張するものではありません。"
  },
  "Privacy summary": {
    "ko": "개인정보 요약",
    "ja": "プライバシーの概要"
  },
  "Terms summary": {
    "ko": "약관 요약",
    "ja": "利用規約の概要"
  },
  "Product, privacy, and rights support": {
    "ko": "제품·개인정보·권리 관련 지원",
    "ja": "製品・プライバシー・権利に関するサポート"
  },
  "Need help or data deletion?": {
    "ko": "도움이나 데이터 삭제가 필요하신가요?",
    "ja": "サポートやデータ削除が必要ですか？"
  },
  "Delete data": {
    "ko": "데이터 삭제",
    "ja": "データを削除"
  },
  "An independent Android historical reference project by LOLFLIX.": {
    "ko": "LOLFLIX의 독립 Android 과거 자료 프로젝트입니다.",
    "ja": "LOLFLIX による独立した Android 資料プロジェクトです。"
  },
  "Privacy policy": {
    "ko": "개인정보 처리방침",
    "ja": "プライバシーポリシー"
  },
  "Terms of use": {
    "ko": "이용약관",
    "ja": "利用規約"
  },
  "Data deletion": {
    "ko": "데이터 삭제",
    "ja": "データ削除"
  },
  "LoL Encyclopedia Classic — Unofficial Archive isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.": {
    "ko": "LoL 백과사전 클래식 — 비공식 아카이브는 Riot Games의 지지를 받지 않으며, Riot Games 또는 Riot Games 소유 자산의 제작·관리에 공식적으로 관여하는 사람들의 견해나 의견을 대변하지 않습니다. Riot Games 및 관련 모든 자산은 Riot Games, Inc.의 상표 또는 등록상표입니다.",
    "ja": "LoL クラシック百科事典 — 非公式アーカイブは Riot Games の支持を受けておらず、Riot Games またはその資産の制作・管理に公式に関わる人々の見解や意見を反映するものではありません。Riot Games および関連するすべての資産は Riot Games, Inc. の商標または登録商標です。"
  },
  "LoL Encyclopedia Classic — Unofficial Archive was created under Riot Games' \"Legal Jibber Jabber\" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.": {
    "ko": "LoL 백과사전 클래식 — 비공식 아카이브는 Riot Games의 'Legal Jibber Jabber' 정책에 따라 Riot Games 소유 자산을 사용해 제작했습니다. Riot Games는 이 프로젝트를 지지하거나 후원하지 않습니다.",
    "ja": "LoL クラシック百科事典 — 非公式アーカイブは、Riot Games の「Legal Jibber Jabber」ポリシーに基づき、Riot Games が所有する資産を使用して制作しました。Riot Games はこのプロジェクトを支持または後援していません。"
  }
};
  const ATTRIBUTES = {
  "Primary navigation": {
    "ko": "주요 메뉴",
    "ja": "メインナビゲーション"
  },
  "English 26.20 beta home screen captured from the WebView of a physical Android phone": {
    "ko": "실제 Android 휴대폰의 WebView에서 촬영한 26.20 베타 영어 메인 화면",
    "ja": "実機の Android スマートフォンの WebView で撮影した26.20ベータの英語ホーム画面"
  },
  "English 26.20 beta showing Garen's suggested Offense, Defense and Utility mastery trees together": {
    "ko": "가렌 추천 공격·방어·보조 특성을 함께 보여 주는 26.20 베타 영어 화면",
    "ja": "ガレンのおすすめオフェンス・ディフェンス・ユーティリティを一覧表示する26.20ベータの英語画面"
  },
  "26.20 beta reference data": {
    "ko": "26.20 베타 참고 데이터",
    "ja": "26.20ベータの参考データ"
  },
  "Open the full English 26.20 home screen": {
    "ko": "26.20 영어 메인 화면 전체 열기",
    "ja": "26.20英語ホーム画面全体を開く"
  },
  "English 26.20 beta home screen from a physical Android phone": {
    "ko": "실제 Android 휴대폰의 26.20 베타 영어 메인 화면",
    "ja": "実機の Android スマートフォンの26.20ベータ英語ホーム画面"
  },
  "Open the full English home screenshot": {
    "ko": "영어 메인 화면 이미지 전체 열기",
    "ja": "英語ホーム画面の画像全体を開く"
  },
  "English 26.20 beta home screen with the Classic champion strip and news": {
    "ko": "클래식 챔피언 목록과 소식이 있는 26.20 베타 영어 메인 화면",
    "ja": "クラシックチャンピオン一覧とニュースがある26.20ベータ英語ホーム画面"
  },
  "Open the full Classic Aatrox screenshot": {
    "ko": "클래식 아트록스 이미지 전체 열기",
    "ja": "クラシックのエイトロックス画像全体を開く"
  },
  "English 26.20 Classic Aatrox entry with its own portrait, attributes and skills": {
    "ko": "별도 초상화·능력치·스킬이 있는 26.20 클래식 아트록스 영어 화면",
    "ja": "専用のポートレート・ステータス・スキルがある26.20クラシックのエイトロックス英語画面"
  },
  "Open the full suggested mastery screenshot": {
    "ko": "추천 특성 이미지 전체 열기",
    "ja": "おすすめマスタリー画像全体を開く"
  },
  "English Garen recommendation showing all three mastery trees in their original grid positions": {
    "ko": "세 특성 트리를 원래 격자 위치로 보여 주는 영어 가렌 추천 화면",
    "ja": "3つのマスタリーツリーを元の配置で示す英語のガレンおすすめ画面"
  },
  "Open the full skill-effect explanation screenshot": {
    "ko": "스킬 효과 설명 이미지 전체 열기",
    "ja": "スキル効果の説明画像全体を開く"
  },
  "English taunt explanation opened from Rammus's linked ability description": {
    "ko": "람머스 스킬의 연결된 용어에서 연 영어 도발 설명",
    "ja": "ラムスのスキル説明リンクから開いた英語のタウント説明"
  },
  "Physical Android phone showing the English Classic champion archive in the 26.19.5 development app": {
    "ko": "실제 Android 휴대폰에 표시된 26.19.5 개발 앱의 영어 클래식 챔피언 자료",
    "ja": "実機の Android スマートフォンに表示された26.19.5開発アプリの英語クラシックチャンピオン資料"
  },
  "Physical Android phone showing the English Classic champion archive": {
    "ko": "실제 Android 휴대폰의 영어 클래식 챔피언 자료",
    "ja": "実機の Android スマートフォンの英語クラシックチャンピオン資料"
  },
  "Physical Android phone showing English Garen details and base stats": {
    "ko": "실제 Android 휴대폰의 영어 가렌 상세와 기본 능력치",
    "ja": "実機の Android スマートフォンの英語ガレン詳細と基本ステータス"
  },
  "Physical Android phone showing the English Classic item archive": {
    "ko": "실제 Android 휴대폰의 영어 클래식 아이템 자료",
    "ja": "実機の Android スマートフォンの英語クラシックアイテム資料"
  },
  "Physical Android phone showing English Classic summoner spells": {
    "ko": "실제 Android 휴대폰의 영어 클래식 소환사 주문",
    "ja": "実機の Android スマートフォンの英語クラシックサモナースペル"
  }
};
  const STORAGE_KEY = 'lolclassic-public-site-language';
  const normalize = value => value.replace(/\s+/gu, ' ').trim();
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement || node.parentElement.closest('script, style, [data-site-language-selector], #release-2620 p[lang]')) continue;
    const source = normalize(node.nodeValue);
    if (source && TEXT[source]) textNodes.push({node, original:node.nodeValue, source});
  }
  const attributes = [];
  document.querySelectorAll('[alt], [aria-label]').forEach(element => {
    for (const attribute of ['alt', 'aria-label']) {
      const source = element.getAttribute(attribute);
      if (source && ATTRIBUTES[source]) attributes.push({element, attribute, source});
    }
  });
  const titles = {
    en:'LoL Encyclopedia Classic — Unofficial Archive',
    ko:'LoL 백과사전 클래식 — 비공식 아카이브',
    ja:'LoL クラシック百科事典 — 非公式アーカイブ'
  };
  const descriptions = {
    en:'LoL Encyclopedia Classic — Unofficial Archive is an independently developed Android reference app for historical League of Legends data and an online community.',
    ko:'LoL 백과사전 클래식 — 비공식 아카이브는 리그 오브 레전드 과거 자료와 온라인 커뮤니티를 제공하는 독립 개발 Android 참고 앱입니다.',
    ja:'LoL クラシック百科事典 — 非公式アーカイブは、リーグ・オブ・レジェンドの過去の資料とオンラインコミュニティを提供する独立開発の Android 資料アプリです。'
  };
  function chooseLanguage(value) {
    return ['ko','ja','en'].includes(value) ? value : null;
  }
  function setLanguage(value, persist = true) {
    const language = chooseLanguage(value) || 'en';
    textNodes.forEach(({node, original, source}) => {
      const translated = language === 'en' ? null : TEXT[source][language];
      node.nodeValue = translated === null ? original : original.replace(/\S(?:[\s\S]*\S)?/u, translated);
    });
    attributes.forEach(({element, attribute, source}) => {
      element.setAttribute(attribute, language === 'en' ? source : ATTRIBUTES[source][language]);
    });
    document.documentElement.lang = language;
    document.body.dataset.siteLanguage = language;
    document.title = titles[language];
    document.querySelector('meta[name="description"]').content = descriptions[language];
    document.querySelector('.english-summary').lang = language;
    document.querySelectorAll('#release-2620 p[lang]').forEach(element => { element.hidden = element.lang !== language; });
    document.querySelector('[data-site-language-selector]').setAttribute('aria-label', {ko:'사이트 언어',ja:'サイトの言語',en:'Site language'}[language]);
    document.querySelectorAll('button[data-site-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.siteLanguage === language));
    });
    // Policy pages retain their original content and provide language summary anchors.
    document.querySelectorAll('a[href^="privacy.html"], a[href^="terms.html"], a[href^="delete-account.html"]').forEach(link => {
      const base = link.getAttribute('href').split('#')[0];
      link.setAttribute('href', language === 'ko' ? base : base + (language === 'ja' ? '#japanese' : '#english'));
    });
    document.querySelectorAll('a[href^="contact.html"]').forEach(link => { link.setAttribute('href', 'contact.html#' + {ko:'korean',ja:'japanese',en:'english'}[language]); });
    if (persist) { try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Read-only/private browsing still works. */ } }
  }
  document.querySelectorAll('button[data-site-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.siteLanguage));
  });
  let saved;
  try { saved = chooseLanguage(localStorage.getItem(STORAGE_KEY)); } catch { saved = null; }
  const query = chooseLanguage(new URL(location.href).searchParams.get('lang'));
  const preferred = chooseLanguage((navigator.language || 'en').split('-')[0]);
  setLanguage(query || saved || preferred || 'en', false);
  window.LOLCLASSIC_SITE_LOCALE = Object.freeze({
    supported:['ko','ja','en'],
    setLanguage,
    translatedTextNodes:textNodes.length,
    translatedAttributes:attributes.length
  });
})();
