/* Display-only language layer. Classic IDs, values and source evidence stay in the bundled data. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicLocale = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const STORAGE_KEY = 'classicAppLocaleV1';
  const locales = ['ko_KR', 'ja_JP', 'en_US'];
  const languageNames = {ko_KR:'한국어', ja_JP:'日本語', en_US:'English'};
  const languageTags = {ko_KR:'ko', ja_JP:'ja', en_US:'en'};
  const label = (ko, ja, en) => [ko, ja, en];
  const labels = [
    label('메뉴', 'メニュー', 'Menu'), label('☰ 메뉴', '☰ メニュー', '☰ Menu'), label('메뉴 열기', 'メニューを開く', 'Open menu'),
    label('메뉴 닫기', 'メニューを閉じる', 'Close menu'), label('주 메뉴', 'メインメニュー', 'Main menu'),
    label('롤 백과사전 클래식', 'LoL クラシック百科事典', 'LoL Classic Encyclopedia'),
    label('LoL백과사전(베타)', 'LoL百科事典（ベータ）', 'LoL Encyclopedia (Beta)'),
    label('설정', '設定', 'Settings'), label('닫기', '閉じる', 'Close'),
    label('상세 정보', '詳細情報', 'Details'), label('홈', 'ホーム', 'Home'),
    label('게임 정보', 'ゲーム情報', 'Game information'), label('부가 기능', '追加機能', 'More tools'),
    label('커뮤니티', 'コミュニティ', 'Community'),
    label('챔피언 정보', 'チャンピオン情報', 'Champion info'),
    label('아이템 정보', 'アイテム情報', 'Item information'),
    label('아이템', 'アイテム', 'Items'),
    label('특성 정보', 'マスタリー情報', 'Mastery information'),
    label('주문', 'サモナースペル', 'Summoner spells'),
    label('소환사 주문', 'サモナースペル', 'Summoner spells'),
    label('룬', 'ルーン', 'Runes'), label('빌더', 'ビルダー', 'Builder'),
    label('용어 사전', '用語集', 'Glossary'), label('자유게시판', '自由掲示板', 'Free board'),
    label('자유 게시판', '自由掲示板', 'Free board'), label('의회', '評議会', 'Council'),
    label('이 앱에 대하여', 'このアプリについて', 'About this app'),
    label('클래식 기록실', 'クラシック記録室', 'Classic archive'),
    label('클래식 백과', 'クラシック百科', 'Classic encyclopedia'),
    label('클래식 챔피언 기록실', 'クラシックチャンピオン記録室', 'Classic champion archive'),
    label('클래식 챔피언', 'クラシックチャンピオン', 'Classic champions'),
    label('좌우로 넘겨보세요 ›', '左右にスワイプして見る ›', 'Swipe to browse ›'),
    label('좌우로 넘겨 다른 챔피언을 볼 수 있습니다.', '左右にスワイプすると他のチャンピオンを見られます。', 'Swipe to see more champions.'),
    label('클래식 챔피언을 한눈에', 'クラシックチャンピオンを一覧で', 'Classic champions at a glance'),
    label('클래식의 챔피언과 아이템을 다시 만나보세요', 'クラシックのチャンピオンとアイテムを再発見', 'Rediscover Classic champions and items'),
    label('챔피언과 아이템 기록을 살펴보세요.', 'チャンピオンとアイテムの記録を見る。', 'Explore champion and item records.'),
    label('Classic Encyclopedia 챔피언 정보 열기', 'クラシック百科事典のチャンピオン情報を開く', 'Open Classic champion information'),
    label('소식 기록', 'ニュース記録', 'News archive'),
    label('새소식', 'ニュース', 'News'), label('영상', '動画', 'Videos'),
    label('검색', '検索', 'Search'), label('초성어로 검색하세요', 'チャンピオンを検索', 'Search champions'),
    label('오프라인 통합 검색', 'オフライン検索', 'Offline search'),
    label('챔피언 검색', 'チャンピオン検索', 'Search champions'),
    label('검색 결과가 없습니다.', '検索結果がありません。', 'No results found.'),
    label('일치하는 챔피언이 없습니다.', '一致するチャンピオンがいません。', 'No matching champions.'),
    label('클래식 챔피언 색인', 'クラシックチャンピオン索引', 'Classic champion index'),
    label('챔피언 정렬', 'チャンピオンの並べ替え', 'Sort champions'),
    label('가나다 순', '名前順', 'Name'), label('출시 순', 'リリース順', 'Release date'),
    label('클래식 자료의 출처는 아래 공식 데이터 링크에서 확인할 수 있습니다.',
      'クラシック資料の出典は以下の公式データリンクで確認できます。',
      'Official source links for the Classic data appear below.'),
    label('챔피언 목록', 'チャンピオン一覧', 'Champion list'),
    label('이전 화면', '前の画面', 'Previous screen'),
    label('역할 선택', 'ロールを選択', 'Select role'),
    label('모두', 'すべて', 'All'), label('탱커', 'タンク', 'Tank'),
    label('방어형', 'タンク', 'Tank'),
    label('근접 딜러', 'ファイター', 'Fighter'), label('전사', 'ファイター', 'Fighter'),
    label('암살자', 'アサシン', 'Assassin'), label('마법사', 'メイジ', 'Mage'),
    label('원거리 딜러', 'マークスマン', 'Marksman'), label('원거리 공격수', 'マークスマン', 'Marksman'),
    label('서포터', 'サポート', 'Support'), label('지원형', 'サポート', 'Support'),
    label('배경', '背景', 'Lore'), label('음성대사', 'ボイス', 'Voice lines'),
    label('기본 능력치', '基本ステータス', 'Base stats'),
    label('스킬 정보', 'スキル情報', 'Ability information'),
    label('클래식 스킨', 'クラシックスキン', 'Classic skins'),
    label('보유 스킨', 'スキン', 'Skins'), label('기본 스킨', 'デフォルトスキン', 'Base skin'),
    label('스킨', 'スキン', 'Skin'), label('크로마', 'クロマ', 'Chroma'),
    label('등록된 스킨 정보가 없습니다.', '登録されたスキン情報はありません。', 'No skin information is available.'),
    label('공격력', '攻撃力', 'Attack damage'), label('체력', '体力', 'Health'),
    label('마나/기력', 'マナ/気', 'Mana/Energy'), label('공격 속도', '攻撃速度', 'Attack speed'),
    label('이동 속도', '移動速度', 'Movement speed'), label('사정 거리', '射程', 'Attack range'),
    label('사거리', '射程', 'Range'), label('방어력', '物理防御', 'Armor'),
    label('효과 범위', '効果範囲', 'Effect radius'),
    label('표시 범위', '表示範囲', 'Display range'),
    label('조준 범위', '照準範囲', 'Targeting range'),
    label('조준선 범위', '照準線の射程', 'Targeting line range'),
    label('시전 거리', '発動射程', 'Cast range'),
    label('시전 거리(중심 기준)', '中心からの射程', 'Cast range (from center)'),
    label('인간 형태 · 사거리', 'ヒト形態 · 射程', 'Human form · Range'),
    label('쿠거 · 급습 사거리', 'クーガー形態 · ジャンプの射程', 'Cougar form · Pounce range'),
    label('쿠거 · 할퀴기 사거리', 'クーガー形態 · クロウの射程', 'Cougar form · Swipe range'),
    label('쿠거 · 숨통 끊기 사거리', 'クーガー形態 · テイクダウンの射程', 'Cougar form · Takedown range'),
    label('관문 재사용 사거리', 'ゲート再発動の射程', 'Gate recast range'),
    label('환각 · 분신 조종 사거리', '幻惑 · 分身の操作範囲', 'Hallucinate · Clone control range'),
    label('크게 보기', '拡大して見る', 'View larger'),
    label('마법 저항력', '魔法防御', 'Magic resist'), label('주문력', '魔力', 'Ability power'),
    label('난이도', '難易度', 'Difficulty'),
    label('5초당 체력 회복', '5秒ごとの体力自動回復', 'Health regen per 5 sec'),
    label('5초당 마나/기력 회복', '5秒ごとのマナ/気自動回復', 'Mana/Energy regen per 5 sec'),
    label('패시브', '固有スキル', 'Passive'),
    label('쿨타임', 'クールダウン', 'Cooldown'),
    label('소모량 없음', 'コストなし', 'No cost'),
    label('마나 소모량', 'マナ消費', 'Mana cost'),
    label('기력 소모량', '気消費', 'Energy cost'),
    label('분노 소모량', 'フューリー消費', 'Fury cost'),
    label('체력 소모량', '体力消費', 'Health cost'),
    label('소모량', 'コスト', 'Cost'),
    label('수치 미제공', '数値未提供', 'Value unavailable'),
    label('없음', 'なし', 'None'), label('초', '秒', 'sec'),
    label('운영자 정정', '運営者による訂正', 'Operator correction'),
    label('스킬 정보를 불러오지 못했습니다.', 'スキル情報を読み込めませんでした。', 'Unable to load ability information.'),
    label('상세 피해량·계수는 클래식 원본을 확인 중입니다. 표시하지 않은 수치는 미확인입니다.',
      '詳細なダメージ値と反映率はクラシックの原本を確認中です。表示されていない値は未確認です。',
      'Detailed damage and scaling are being checked against the original Classic client. Omitted values remain unverified.'),
    label('검증된 수치 · 한국어 원문', '検証済み数値・韓国語の原文', 'Verified values · Korean source'),
    label('아이템 기록', 'アイテム記録', 'Item archive'),
    label('클래식 아이템의 이름·가격·효과와 조합 관계를 한곳에서 확인할 수 있습니다.',
      'クラシックアイテムの名前、価格、効果、レシピを確認できます。',
      'Browse Classic item names, prices, effects and recipes.'),
    label('클래식 아이템의 이름·가격·효과·조합과 아이콘을 한곳에서 확인할 수 있습니다.',
      'クラシックアイテムの名前、価格、効果、レシピ、アイコンをまとめて確認できます。',
      'Browse Classic item names, prices, effects, recipes and icons.'),
    label('현재 조건에 맞는 아이템', '現在の条件に合うアイテム', 'Items matching the current filters'),
    label('개를 표시합니다.', '件を表示します。', 'shown.'),
    label('의회 · 제1회 투표 결과', '評議会・第1回投票結果', 'Council · First vote results'),
    label('아이템 검색', 'アイテムを検索', 'Search items'),
    label('이 분류에 아이템이 없습니다.', 'この分類にアイテムはありません。', 'No items in this category.'),
    label('모든 아이템', 'すべてのアイテム', 'All items'),
    label('시작', 'スタート', 'Starter'), label('도구', '道具', 'Tools'),
    label('방어', '防御', 'Defense'), label('공격', '攻撃', 'Attack'),
    label('마법', '魔法', 'Magic'), label('이동', '移動', 'Movement'), label('기타', 'その他', 'Other'),
    label('라인 시작', 'レーン開始', 'Laning'), label('정글 시작', 'ジャングル開始', 'Jungling'),
    label('추가 골드', '追加ゴールド', 'Bonus gold'), label('소모품', '消耗品', 'Consumables'),
    label('시야', '視界', 'Vision'), label('체력 재생', '体力自動回復', 'Health regen'),
    label('치명타', 'クリティカル', 'Critical strike'),
    label('생명력 흡수', 'ライフスティール', 'Life steal'),
    label('마나', 'マナ', 'Mana'),
    label('재사용 대기시간 감소', 'クールダウン短縮', 'Cooldown reduction'),
    label('마나 재생', 'マナ自動回復', 'Mana regen'),
    label('장화', 'ブーツ', 'Boots'), label('사용 효과', '発動効果', 'Active effect'),
    label('방어구 관통력', '物理防御貫通', 'Armor penetration'),
    label('은신', 'ステルス', 'Stealth'), label('둔화', 'スロウ', 'Slow'),
    label('적중 시 효과', '通常攻撃時効果', 'On-hit'), label('오오라', 'オーラ', 'Aura'),
    label('마법 관통력', '魔法防御貫通', 'Magic penetration'),
    label('장신구', 'トリンケット', 'Trinket'), label('주문 흡혈', 'スペルヴァンプ', 'Spell vamp'),
    label('강인함', '行動妨害耐性', 'Tenacity'), label('스킬 가속', 'スキルヘイスト', 'Ability haste'),
    label('빌지워터', 'ビルジウォーター', 'Bilgewater'),
    label('골드', 'ゴールド', 'gold'), label('조합비', '合成費用', 'Combine cost'),
    label('아이템 효과', 'アイテム効果', 'Item effects'),
    label('고유 효과', '固有効果', 'Unique effect'), label('약칭', '略称', 'Aliases'),
    label('하위 아이템 · 조합 재료', '下位アイテム・合成素材', 'Components'),
    label('이 아이템을 만들 때 필요한 재료입니다。', 'このアイテムの合成に必要な素材です。', 'Components required to build this item.'),
    label('이 아이템을 만들 때 필요한 재료입니다.', 'このアイテムの合成に必要な素材です。', 'Components required to build this item.'),
    label('상위 아이템 · 업그레이드', '上位アイテム・アップグレード', 'Upgrades'),
    label('이 아이템을 재료로 사용해 만들 수 있습니다.', 'このアイテムを素材として作れるアイテムです。', 'Items you can build from this component.'),
    label('이 아이템의 변형', 'このアイテムのバリエーション', 'Item variants'),
    label('원본 자료에 효과 설명이 없습니다.', '元データに効果の説明がありません。', 'The source has no effect description.'),
    label('상점 구매 불가', 'ショップで購入不可', 'Unavailable in shop'),
    label('원본 설명의 일부 수치가 0으로 미치환되어 실제 수치로 확정할 수 없습니다.',
      '元の説明に一部の数値が0のまま残っているため、実際の値と確定できません。',
      'Some values remain as zero placeholders in the source description, so their actual values cannot be confirmed.'),
    label('분류', 'カテゴリー', 'Category'),
    label('특성 기록', 'マスタリー記録', 'Mastery archive'),
    label('특성', 'マスタリー', 'Masteries'),
    label('보조', '補助', 'Utility'),
    label('이 분기에', 'この分岐で', 'Requires'),
    label('포인트 필요', 'ポイントが必要', 'points in this branch'),
    label('첫 번째 단계', '最初の段階', 'First tier'),
    label('클래식 특성 이름', 'クラシックマスタリー名', 'Classic mastery names'),
    label('특성 트리 선택', 'マスタリーツリーを選択', 'Select mastery tree'),
    label('종', '種', 'types'),
    label('클래식 특성', 'クラシックマスタリー', 'Classic masteries'),
    label('역사 특성 분류', 'クラシックマスタリー分類', 'Classic mastery branch'),
    label('남은 포인트', '残りポイント', 'Points remaining'),
    label('선행', '前提条件', 'Requires'),
    label('선택 초기화', '選択をリセット', 'Reset selection'),
    label('클래식 소환사 주문', 'クラシックサモナースペル', 'Classic summoner spells'),
    label('재사용 대기시간', 'クールダウン', 'Cooldown'),
    label('재사용 대기시간(초)', 'クールダウン(秒)', 'Cooldown (sec)'),
    label('아이콘 없음', 'アイコンなし', 'No icon'),
    label('룬 기록', 'ルーン記録', 'Rune archive'),
    label('클래식 룬', 'クラシックルーン', 'Classic runes'),
    label('룬 목록', 'ルーン一覧', 'Rune list'),
    label('페이지 편집', 'ページを編集', 'Edit page'),
    label('룬 화면 전환', 'ルーン表示を切り替え', 'Switch rune view'),
    label('룬 페이지 편집', 'ルーンページを編集', 'Edit rune page'),
    label('룬 페이지 선택', 'ルーンページを選択', 'Select rune page'),
    label('룬 검색', 'ルーンを検索', 'Search runes'),
    label('룬 자료 검색', 'ルーン資料を検索', 'Search rune archive'),
    label('룬 자료 목록', 'ルーン資料一覧', 'Rune archive'),
    label('모든 룬', 'すべてのルーン', 'All runes'),
    label('전체 자료 보기', 'すべての資料を見る', 'View all entries'),
    label('선택 기록', '選択したルーン', 'Selected runes'),
    label('룬 분류', 'ルーン分類', 'Rune category'),
    label('효과 합계', '効果の合計', 'Total effects'),
    label('저장', '保存', 'Save'), label('초기화', 'リセット', 'Reset'),
    label('현재 페이지 초기화', '現在のページをリセット', 'Reset current page'),
    label('표식', 'マーク', 'Mark'), label('인장', 'シール', 'Seal'),
    label('문양', 'グリフ', 'Glyph'), label('정수', 'エッセンス', 'Quintessence'),
    label('빨강 표식', '赤のマーク', 'Red marks'),
    label('노랑 인장', '黄のシール', 'Yellow seals'),
    label('파랑 문양', '青のグリフ', 'Blue glyphs'),
    label('룬 페이지', 'ルーンページ', 'Rune page'),
    label('룬 보관함', 'ルーン一覧', 'Rune inventory'),
    label('룬 보관함 검색', 'ルーン一覧を検索', 'Search rune inventory'),
    label('룬 선택기', 'ルーン選択', 'Rune selector'),
    label('룬 색상 선택', 'ルーンの色を選択', 'Select rune color'),
    label('완성 룬 페이지', '完成したルーンページ', 'Completed rune page'),
    label('장착한 룬 이름과 수량', '装着中のルーン名と個数', 'Equipped rune names and counts'),
    label('장착한 룬', '装着中のルーン', 'Equipped runes'),
    label('장착한 룬이 없습니다.', '装着中のルーンはありません。', 'No runes equipped.'),
    label('현재 적용된 룬 페이지 스탯', '現在のルーンページ効果', 'Current rune page stats'),
    label('룬을 선택하면 적용 스탯이 표시됩니다.', 'ルーンを選ぶと適用中のステータスが表示されます。', 'Select runes to see the applied stats.'),
    label('각 룬 효과 적용 중', '各ルーンの効果を適用中', 'Rune effects applied'),
    label('선택한 룬 없음', '選択したルーンなし', 'No runes selected'),
    label('1개 해제', '1個外す', 'Remove one'),
    label('장착됨. 눌러서 1개 해제', '装着中。押すと1個外します', 'Equipped. Tap to remove one'),
    label('빈 소켓. 눌러서 왼쪽 선택기 열기', '空のソケット。押すと左の選択画面を開きます', 'Empty socket. Tap to open the selector on the left'),
    label('룬 보관함에서 룬을 고르고 룬판에서 30개 편성을 확인합니다. 빈 소켓을 누르면 해당 색상으로 전환되고, 장착된 룬을 누르면 1개 해제됩니다.',
      '一覧からルーンを選び、ルーン盤で30個の構成を確認します。空のソケットを押すとその色に切り替わり、装着したルーンを押すと1個外せます。',
      'Choose runes from the inventory and review the 30-rune setup on the board. Tap an empty socket to switch colors, or an equipped rune to remove one.'),
    label('위 탭으로 공격 · 방어 · 보조 트리를 전환합니다. 포인트는 세 트리가 하나의 30포인트 상태를 공유하며, 탭하면 +1, 길게 누르기나 우클릭하면 −1입니다.',
      '上のタブで攻撃・防御・補助ツリーを切り替えます。3ツリーで30ポイントを共有し、タップで+1、長押しまたは右クリックで−1です。',
      'Use the tabs to switch between Offense, Defense and Utility. All three trees share 30 points. Tap to add one; long press or right-click to remove one.'),
    label('성장', 'レベルごと', 'Per level'), label('하급', '下級', 'Lesser'),
    label('선택한 룬이 없습니다.', '選択したルーンはありません。', 'No runes selected.'),
    label('룬을 선택하면 효과가 표시됩니다.', 'ルーンを選ぶと効果が表示されます。', 'Select runes to see their effects.'),
    label('룬 메모 저장', 'ルーンメモを保存', 'Save rune notes'),
    label('불러오기', '読み込む', 'Load'),
    label('실제 룬 목록 보기', 'ルーン一覧を見る', 'View rune list'),
    label('추천 소환사 주문', 'おすすめのサモナースペル', 'Suggested summoner spells'),
    label('추천 조합 정보가 없습니다.', 'おすすめの組み合わせ情報はありません。', 'No suggested combination is available.'),
    label('소환사의 주문 정보 열기', 'サモナースペル情報を開く', 'Open summoner spells'),
    label('추천 아이템 정보가 없습니다.', 'おすすめのアイテム情報はありません。', 'No suggested items are available.'),
    label('아이템 정보 열기', 'アイテム情報を開く', 'Open items'),
    label('스킬', 'スキル', 'Abilities'),
    label('공략 정보', '攻略情報', 'Guide'),
    label('등록된 플레이 팁이 없습니다.', '登録されたプレイのヒントはありません。', 'No play tips are available.'),
    label('등록된 상성 정보가 없습니다.', '登録された対策情報はありません。', 'No matchup information is available.'),
    label('특징', '特徴', 'Roles'),
    label('전체글', 'すべての投稿', 'All posts'),
    label('개념글', '人気の投稿', 'Popular posts'),
    label('내글', '自分の投稿', 'My posts'),
    label('글쓰기', '投稿する', 'Write post'),
    label('새로고침', '更新', 'Refresh'),
    label('닉변경', '名前を変更', 'Change nickname'),
    label('글이 존재하지 않습니다.', '投稿がありません。', 'No posts found.'),
    label('처음', '最初', 'First'), label('이전', '前へ', 'Previous'),
    label('다음', '次へ', 'Next'), label('끝', '最後', 'Last'),
    label('페이지 검색', 'ページ検索', 'Find page'),
    label('게시물', '投稿', 'Post'), label('목록', '一覧', 'List'),
    label('이전글', '前の投稿', 'Previous post'),
    label('다음글', '次の投稿', 'Next post'),
    label('아이디', '名前', 'Name'), label('제목', 'タイトル', 'Title'),
    label('내용', '内容', 'Content'), label('조회', '閲覧', 'Views'),
    label('추천', 'おすすめ', 'Likes'), label('댓글', 'コメント', 'Comments'),
    label('신고하기', '通報する', 'Report'),
    label('댓글등록', 'コメントを投稿', 'Post comment'),
    label('댓글 입력', 'コメントを入力', 'Enter comment'),
    label('본문 추가', '本文を追加', 'Add body'),
    label('취소', 'キャンセル', 'Cancel'), label('등록', '登録', 'Submit'),
    label('삭제', '削除', 'Delete'),
    label('닉네임', 'ニックネーム', 'Nickname'),
    label('닉네임을 설정하세요.', 'ニックネームを設定してください。', 'Choose a nickname.'),
    label('닉네임을 입력하세요.', 'ニックネームを入力', 'Enter a nickname'),
    label('온라인 게시물', 'オンラインの投稿', 'Online post'),
    label('온라인 게시판을 불러오는 중입니다.', 'オンライン掲示板を読み込み中です。', 'Loading the online board.'),
    label('게시물을 불러오는 중입니다.', '投稿を読み込み中です。', 'Loading post.'),
    label('온라인 글쓰기', 'オンライン投稿の作成', 'Write an online post'),
    label('이미지 선택', '画像を選択', 'Choose images'),
    label('게시글 첨부 이미지', '投稿の添付画像', 'Post attachment'),
    label('내 글 삭제', '自分の投稿を削除', 'Delete my post'),
    label('댓글삭제', 'コメントを削除', 'Delete comment'),
    label('작성자 차단', '投稿者をブロック', 'Block author'),
    label('개념글 추천', '人気投稿として推薦', 'Like this post'),
    label('온라인 닉네임을 설정하세요.', 'オンラインで使うニックネームを設定してください。', 'Choose your online nickname.'),
    label('등록한 글과 이미지는 서버에 저장되며 신고 및 운영자 관리 대상입니다.',
      '投稿した文章と画像はサーバーに保存され、通報や運営者による管理の対象となります。',
      'Posts and images are stored on the server and may be reported or moderated.'),
    label('타인의 권리를 침해하거나 명예를 훼손하는 댓글은 제재될 수 있습니다.',
      '他人の権利や名誉を侵害するコメントは制限の対象になる場合があります。',
      'Comments that violate others’ rights or damage their reputation may be restricted.'),
    label('온라인 커뮤니티 프로필 없음', 'オンラインコミュニティのプロフィールなし', 'No online community profile'),
    label('온라인 커뮤니티 프로필:', 'オンラインコミュニティのプロフィール:', 'Online community profile:'),
    label('확인 중', '確認中', 'Checking'),
    label('만 18세 이상 확인과 2026-09-27 약관 재동의 후 커뮤니티 이용 가능',
      '18歳以上の確認と2026-09-27版の規約への再同意後に掲示板を利用できます。',
      'Community access requires age 18+ confirmation and renewed acceptance of the 2026-09-27 terms.'),
    label('최신 약관 동의 완료 · 읽기와 쓰기 가능',
      '最新の規約に同意済み・閲覧と投稿が可能', 'Current terms accepted · reading and posting enabled'),
    label('게시판을 이용할 때 동의와 닉네임 설정을 시작합니다.',
      '掲示板を利用するときに同意とニックネームの設定を求めます。',
      'Consent and nickname setup start when you open the board.'),
    label('온라인 버그 신고', 'オンラインで不具合を報告', 'Report a bug online'),
    label('차단 사용자 관리', 'ブロックしたユーザーの管理', 'Manage blocked users'),
    label('커뮤니티 프로필 및 데이터 삭제', 'コミュニティのプロフィールとデータを削除', 'Delete community profile and data'),
    label('이 기기의 커뮤니티 연결 해제', 'この端末のコミュニティ接続を解除', 'Disconnect community on this device'),
    label('기기 저장 데이터 초기화, 커뮤니티 프로필 삭제, 이 기기의 커뮤니티 연결 해제는 서로 다른 작업입니다.',
      '端末データの初期化、コミュニティプロフィールの削除、この端末の接続解除はそれぞれ異なる操作です。',
      'Resetting device data, deleting your community profile and disconnecting this device are separate actions.'),
    label('차단 사용자 목록을 불러오는 중입니다.', 'ブロックしたユーザーを読み込み中です。', 'Loading blocked users.'),
    label('이 기기에 저장된 커뮤니티 세션이 없어 차단 목록이 없습니다.',
      'この端末にコミュニティセッションがないため、ブロック一覧はありません。',
      'No block list is available because this device has no community session.'),
    label('차단한 사용자가 없습니다.', 'ブロックしたユーザーはいません。', 'No blocked users.'),
    label('차단 시각', 'ブロック日時', 'Blocked at'),
    label('차단 해제', 'ブロックを解除', 'Unblock'),
    label('서버가 반환한 현재 닉네임과 차단 시각을 표시합니다. 사용자 ID는 화면에 표시하지 않습니다.',
      'サーバーから取得した現在のニックネームとブロック日時を表示します。ユーザーIDは表示しません。',
      'Shows current nicknames and block times returned by the server. User IDs are not displayed.'),
    label('계정·데이터 삭제 안내', 'アカウント・データ削除のご案内', 'Account and data deletion guide'),
    label('이 작업은 일반 로컬 데이터 초기화와 다르며, 현재 인증된 온라인 커뮤니티 프로필을 서버에서 삭제합니다.',
      'これは通常の端末データ初期化とは異なり、認証中のオンラインコミュニティプロフィールをサーバーから削除します。',
      'This deletes the authenticated online community profile from the server; it is separate from resetting local data.'),
    label('커뮤니티 프로필이 삭제됩니다.', 'コミュニティのプロフィールが削除されます。', 'Your community profile will be deleted.'),
    label('본인의 게시글과 댓글이 비공개·삭제 처리됩니다.', '自分の投稿とコメントは非公開・削除扱いになります。', 'Your posts and comments will be hidden and deleted.'),
    label('추천·차단 관계, 게시글 신고 연결정보, 버그 신고의 사용자 연결정보와 연락처가 제거됩니다.',
      'いいね・ブロック関係、投稿通報との関連情報、不具合報告のユーザー関連情報と連絡先が削除されます。',
      'Likes, block relationships, report links, bug report user links and contact information will be removed.'),
    label('운영상 필요한 범위에서 버그 신고의 자유입력 제목·본문·앱 버전·기기 정보 일부는 남을 수 있습니다.',
      '運営上必要な範囲で、不具合報告の入力した件名・本文、アプリのバージョン、端末情報の一部が残る場合があります。',
      'Some bug report titles, text, app versions and device details may remain where needed for operations.'),
    label('삭제 후 이전 프로필은 복구할 수 없습니다.', '削除後は以前のプロフィールを復元できません。', 'The old profile cannot be recovered after deletion.'),
    label('룬·특성·빌드 등 비커뮤니티 로컬 데이터는 삭제되지 않습니다.',
      'ルーン、マスタリー、ビルドなどコミュニティ以外の端末データは削除されません。',
      'Local non-community data such as runes, masteries and builds will remain.'),
    label('성공 후 새 프로필을 자동 생성하지 않습니다.', '削除後、新しいプロフィールは自動作成されません。',
      'A new profile will not be created automatically.'),
    label('삭제 코드는 프로필 생성 직후 한 번 표시되며 현재 Android 설정에서는 다시 표시되지 않습니다. 따로 보관한 삭제 코드는 아래 삭제 안내에서 제출할 수 있습니다.',
      '削除コードはプロフィール作成直後に一度だけ表示され、現在のAndroid設定では再表示されません。別に保管したコードは以下の削除案内から提出できます。',
      'The deletion code appears once after profile creation and cannot be viewed again in current Android settings. A separately saved code can be submitted through the deletion guide below.'),
    label('커뮤니티 프로필 영구 삭제', 'コミュニティプロフィールを完全に削除', 'Permanently delete community profile'),
    label('삭제할 커뮤니티 세션이 이 기기에 없습니다.', 'この端末には削除できるコミュニティセッションがありません。',
      'There is no community session to delete on this device.'),
    label('버그 신고', '不具合を報告', 'Bug report'),
    label('버그 제목', '不具合の件名', 'Bug report title'),
    label('재현 방법과 실제 현상', '再現手順と実際の結果', 'Steps to reproduce and actual behavior'),
    label('버그 내용', '不具合の詳細', 'Bug report details'),
    label('연락처(선택) :', '連絡先（任意）:', 'Contact (optional):'),
    label('선택 연락처', '任意の連絡先', 'Optional contact'),
    label('자유입력 제목·본문과 앱 버전·기기 정보는 운영상 필요한 범위에서 남을 수 있습니다. 프로필 삭제 시 사용자 연결정보와 연락처는 제거됩니다.',
      '入力した件名・本文、アプリのバージョン、端末情報は運営上必要な範囲で残る場合があります。プロフィール削除時にはユーザー関連情報と連絡先が削除されます。',
      'Entered titles and text, app version and device details may remain where needed for operations. Profile deletion removes user links and contact details.'),
    label('전송', '送信', 'Send'),
    label('사용 챔피언 제한:', '使用できるチャンピオン:', 'Required champion:'),
    label('최대 중첩', '最大スタック', 'Maximum stacks'),
    label('스킬 피해량', 'スキルダメージ', 'Ability damage'),
    label('상세 보기', '詳細を見る', 'View details'),
    label('온라인 커뮤니티 약관 재동의', 'オンラインコミュニティの規約に再同意', 'Renew online community consent'),
    label('온라인 커뮤니티 이용 동의', 'オンラインコミュニティの利用に同意', 'Online community consent'),
    label('온라인 커뮤니티는', 'オンラインコミュニティは', 'The online community is for'),
    label('만 18세 이상', '18歳以上', 'people aged 18 or older'),
    label('만 이용할 수 있습니다. 게시글·댓글·추천·신고·차단과 익명 세션 정보는 커뮤니티 서버에서 처리됩니다.',
      'のみ利用できます。投稿、コメント、いいね、通報、ブロック、匿名セッション情報はコミュニティサーバーで処理されます。',
      'only. Posts, comments, likes, reports, blocks and anonymous session details are handled by the community server.'),
    label('본인은 만 18세 이상이며, 2026-09-27 이용약관과 개인정보처리방침에 동의합니다.',
      '私は18歳以上であり、2026-09-27版の利用規約とプライバシーポリシーに同意します。',
      'I am at least 18 and agree to the 2026-09-27 Terms of Service and Privacy Policy.'),
    label('취소하면 프로필 삭제와 개인정보 문의는 계속 이용할 수 있지만, 게시판 등 커뮤니티 기능은 실행되지 않습니다.',
      'キャンセルしてもプロフィールの削除とプライバシーに関するお問い合わせは利用できますが、掲示板などのコミュニティ機能は使えません。',
      'If you cancel, you can still delete your profile or make a privacy inquiry. Board and other community features will be unavailable.'),
    label('동의', '同意する', 'Agree'),
    label('콘텐츠와 소리', 'コンテンツと音声', 'Content and sound'),
    label('음성, 콘텐츠와 커뮤니티 환경을 관리합니다.',
      '音声、コンテンツ、コミュニティの設定を管理します。',
      'Manage voice, content and community settings.'),
    label('백과사전 콘텐츠', '百科事典コンテンツ', 'Encyclopedia content'),
    label('최신 콘텐츠', '最新コンテンツ', 'Latest content'),
    label('앱 내장 콘텐츠', 'アプリ内コンテンツ', 'Bundled content'),
    label('정상', '正常', 'Ready'),
    label('업데이트 확인 중', '更新を確認中', 'Checking for updates'),
    label('기본 콘텐츠 사용 중', '基本コンテンツを使用中', 'Using bundled content'),
    label('데이터와 계정', 'データとアカウント', 'Data and account'),
    label('콘텐츠 새로 불러오기', 'コンテンツを再読み込み', 'Reload content'),
    label('기기 저장 데이터 초기화', '端末の保存データをリセット', 'Reset device data'),
    label('개인정보처리방침', 'プライバシーポリシー', 'Privacy policy'),
    label('앱 소개', 'アプリ紹介', 'About the app'),
    label('공개 개인정보처리방침', '公開プライバシーポリシー', 'Public privacy policy'),
    label('이용약관', '利用規約', 'Terms of service'),
    label('문의하기', 'お問い合わせ', 'Contact us'),
    label('앱 버전', 'アプリバージョン', 'App version'),
    label('앱 언어', 'アプリの言語', 'App language'),
    label('음성 언어', '音声の言語', 'Voice language'),
    label('기존 언어별 음성', '既存の言語別ボイス', 'Archived voice language'),
    label('음성 음량', '音量', 'Voice volume'),
    label('챔피언 음성', 'チャンピオンボイス', 'Champion voice'),
    label('일시 비활성화', '一時停止中', 'Temporarily disabled'),
    label('비공식 팬 프로젝트', '非公式ファンプロジェクト', 'Unofficial fan project'),
    label('제공 기능', '機能', 'Features'),
    label('자료 안내', '資料について', 'About the data'),
    label('Riot Games 관련 고지', 'Riot Games に関する告知', 'Riot Games notice'),
    label('원본 데이터를 불러오는 중…', '元データを読み込み中…', 'Loading source data…'),
    label('데이터 로딩 실패', 'データの読み込みに失敗', 'Data loading failed'),
    label('클래식', 'クラシック', 'Classic'), label('한국 서버 약칭', '韓国サーバーの略称', 'Korean server aliases'),
    label('한국어 원문', '韓国語の原文', 'Korean source text'),
    label('스킨 정보', 'スキン情報', 'Skin information'),
    label('기본', 'デフォルト', 'Default'), label('포인트', 'ポイント', 'points'),
    label('레벨당', 'レベルごと', 'per level'),
    label('18레벨', 'レベル18', 'level 18'),
    label('선택', '選択', 'Selected'), label('합계', '合計', 'Total'),
    label('수치', '数値', 'Value'), label('고정 피해', '確定ダメージ', 'true damage'),
    label('물리 피해', '物理ダメージ', 'physical damage'),
    label('마법 피해', '魔法ダメージ', 'magic damage'),
    label('치명타 확률', 'クリティカル率', 'Critical chance'),
    label('치명타 피해량', 'クリティカルダメージ', 'Critical damage'),
    label('물리 관통력', '物理防御貫通', 'Armor penetration'),
    label('기력', '気', 'Energy'), label('기력 재생', '気の回復', 'Energy regen'),
    label('경험치 획득', '経験値獲得', 'Experience gain'),
    label('백분율 체력', '割合体力', 'Percent health'),
    label('레벨당 마나', 'レベルごとのマナ', 'Mana per level'),
    label('레벨당 마나 재생', 'レベルごとのマナ回復', 'Mana regen per level'),
    label('레벨당 공격력', 'レベルごとの攻撃力', 'Attack damage per level'),
    label('레벨당 마법 저항력', 'レベルごとの魔法防御', 'Magic resist per level'),
    label('레벨당 재사용 대기시간', 'レベルごとのクールダウン短縮', 'Cooldown reduction per level'),
    label('클래식의 기억을 다시 만나는 백과사전',
      'クラシックの思い出をもう一度楽しむ百科事典', 'An encyclopedia of Classic memories'),
    label('2012~2013년 모바일 정보 앱의 화면 구조와 감성을 현대 Android 환경에 맞게 담은 비공식 팬 프로젝트입니다.',
      '2012～2013年のモバイル情報アプリの構成と雰囲気を現代の Android に再現した非公式ファンプロジェクトです。',
      'An unofficial fan project bringing the layout and feel of 2012–2013 mobile reference apps to modern Android.'),
    label('챔피언·스킬·아이템·특성·소환사 주문·룬 정보를 살펴보고, 룬과 특성 편성을 기기에 저장할 수 있습니다. 익명 온라인 커뮤니티에서는 게시글·댓글·추천·신고·차단과 프로필 삭제 기능을 제공합니다.',
      'チャンピオン、スキル、アイテム、マスタリー、サモナースペル、ルーンを閲覧し、ルーンとマスタリーの構成を端末に保存できます。匿名オンラインコミュニティでは投稿、コメント、いいね、通報、ブロック、プロフィール削除ができます。',
      'Browse champions, abilities, items, masteries, summoner spells and runes, and save rune and mastery setups on your device. The anonymous online community supports posts, comments, likes, reports, blocks and profile deletion.'),
    label('역사 자료는 참고와 보존 목적으로 제공되며 현재 게임의 수치·명칭과 다를 수 있습니다. 앱은 무료이며 광고와 인앱 결제, 이메일·비밀번호 회원가입이 없습니다.',
      '歴史資料は参考・保存を目的としており、現在のゲームの数値や名称とは異なる場合があります。アプリは無料で、広告、アプリ内購入、メール・パスワード登録はありません。',
      'Historical data is provided for reference and preservation and may differ from the current game. The app is free, with no ads, in-app purchases or email/password sign-up.'),
    label('롤 백과사전 클래식은 Riot Games의 보증·승인·후원을 받지 않습니다. Riot Games 및 관련 자산은 Riot Games, Inc.의 상표 또는 등록 상표입니다.',
      'LoL クラシック百科事典は Riot Games の保証、承認、支援を受けていません。Riot Games と関連資産は Riot Games, Inc. の商標または登録商標です。',
      'LoL Classic Encyclopedia is not endorsed, approved or sponsored by Riot Games. Riot Games and related properties are trademarks or registered trademarks of Riot Games, Inc.'),
    label('비공식 팬 프로젝트 · 공식 Riot 영문 고지는',
      '非公式ファンプロジェクト · Riot の英語による正式な告知は',
      'Unofficial fan project · See the official Riot notice in English in'),
    label('에서 확인할 수 있습니다.', 'をご覧ください。', '.'),
    label('룬·특성·빌드 및 오프라인 게시판 데이터는 기기에 저장됩니다. 온라인 닉네임·글·댓글·추천·신고·차단·버그 신고는 커뮤니티 서버에서 처리됩니다.',
      'ルーン、マスタリー、ビルド、オフライン掲示板のデータは端末に保存されます。オンラインのニックネーム、投稿、コメント、いいね、通報、ブロック、不具合報告はコミュニティサーバーで処理されます。',
      'Rune, mastery, build and offline board data is stored on your device. Online nicknames, posts, comments, likes, reports, blocks and bug reports are handled by the community server.'),
    label('기억나는 클래식 아이템', '思い出のクラシックアイテム', 'Classic items you remember'),
    label('가장 좋아했던 챔피언', 'お気に入りのチャンピオン', 'Your favorite champion'),
    label('룬 조합 공유', 'ルーン構成を共有', 'Share a rune setup'),
    label('자유게시판 이용 안내', '自由掲示板のご案内', 'Free board guidance'),
    label('온라인 자유게시판 이용 안내', 'オンライン自由掲示板のご案内', 'Online free board guidance'),
    label('롤 클래식 패치노트 · 26.18', 'リーグ クラシック パッチノート · 26.18', 'League Classic Patch Notes · 26.18'),
    label('운영자', '運営者', 'Operator'), label('소환사', 'サモナー', 'Summoner'),
    label('닉네임을 설정하세요.', 'ニックネームを設定してください。', 'Choose a nickname.'),
    label('글이 존재하지 않습니다.', '投稿がありません。', 'No posts found.'),
    label('저장소를 쓸 수 없어 이번 실행에서만 유지됩니다.',
      '保存領域を使用できないため、この起動中だけ保持されます。',
      'Storage is unavailable; changes will last only for this session.'),
    label('욕설이나 비방 댓글은 누군가에게 큰 상처로 남을 수 있습니다.',
      '暴言や中傷のコメントは人を深く傷つけることがあります。',
      'Abusive comments can cause real harm.'),
    label('개념글 추천', '人気投稿に推薦', 'Like this post'),
    label('내   용', '内   容', 'Content'),
    label('제   목', 'タイトル', 'Title'),
    label('아이디 :', '名前:', 'Name:'),
    label('등록된 플레이 팁이 없습니다.', '登録されたプレイのヒントはありません。', 'No play tips are available.'),
    label('클래식 플레이 팁입니다.', 'クラシックのプレイヒントです。', 'These are Classic play tips.'),
    label('공략 (플레이 팁)', '攻略（プレイヒント）', 'Guide (play tips)'),
    label('카운터픽 (상대할 때)', 'カウンターピック（対戦時）', 'Counterpick (facing this champion)'),
    label('소환사 주문 정보', 'サモナースペル情報', 'Summoner spell information'),
    label('정확한 클래식 수치', '正確なクラシックの数値', 'Exact Classic values'),
    label('페이지', 'ページ', 'page'),
    label('룬 편성', 'ルーン構成', 'Rune setup'),
    label('선택한 룬 없음', 'ルーンが選択されていません', 'No runes selected'),
    label('각 룬 효과 적용 중', '各ルーンの効果を適用中', 'Each rune effect is applied'),
    label('성장 룬은 레벨당 수치와 18레벨 합계를 함께 표시합니다.',
      'レベルごとに成長するルーンは、レベルごとの値とレベル18での合計を表示します。',
      'Scaling runes show per-level values and the total at level 18.'),
    label('클래식 룬의 이름·효과·분류와 현재 편성 합계를 확인할 수 있습니다.',
      'クラシックルーンの名前、効果、分類と現在の構成の合計を確認できます。',
      'Browse Classic rune names, effects, categories and your current setup totals.'),
    label('표식 9 · 인장 9 · 문양 9 · 정수 3의 클래식 편성 규칙과 효과 합계를 확인할 수 있습니다.',
      'マーク9、シール9、グリフ9、エッセンス3のクラシック構成ルールと効果合計を確認できます。',
      'The Classic setup allows 9 marks, 9 seals, 9 glyphs and 3 quintessences. Review their combined effects.'),
    label('자료 목록에서 항목을 누르면 추가되고, 선택 기록에서 항목을 누르면 1개 해제됩니다. 선택 결과는 효과 합계에 바로 반영됩니다.',
      '資料一覧の項目をタップすると追加され、選択記録の項目をタップすると1つ外せます。結果は効果合計にすぐ反映されます。',
      'Tap an entry in the archive to add it, or tap a selected entry to remove one. Totals update immediately.'),
    label('공격·방어·보조 특성의 요구 포인트와 선행 관계를 한눈에 확인할 수 있습니다.',
      '攻撃、防御、ユーティリティのマスタリーに必要なポイントと前提条件を一覧で確認できます。',
      'Review point requirements and prerequisites for offense, defense and utility masteries.'),
    label('항목을 누르면 1포인트 추가됩니다. 길게 누르기/우클릭은 1포인트를 뺍니다. 이름·효과·요구 조건은 클래식 자료를 기준으로 합니다.',
      '項目をタップすると1ポイント追加します。長押しまたは右クリックで1ポイント減らします。名前、効果、条件はクラシック資料に基づきます。',
      'Tap to add one point. Long press or right-click to remove one. Names, effects and requirements follow the Classic source.'),
  ];
  const translations = new Map(labels.map(row => [row[0], row]));
  const index = {ko_KR:0, ja_JP:1, en_US:2};
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  let data = null;
  let observer = null;
  let current = readStoredLocale();

  function deviceLocale() {
    const primary = String(root.navigator?.language || root.navigator?.languages?.[0] || '').replaceAll('_', '-');
    let calendar = '';
    try { calendar = String(root.Intl?.DateTimeFormat?.().resolvedOptions().locale || '').replaceAll('_', '-'); }
    catch (_) { /* The browser language is sufficient when Intl is unavailable. */ }
    const regionOf = tag => tag.split('-').slice(1).find(part => /^[A-Za-z]{2}$/.test(part) || /^\d{3}$/.test(part))?.toUpperCase();
    const region = regionOf(primary) || regionOf(calendar);
    if (region === 'KR') return 'ko_KR';
    if (region === 'JP') return 'ja_JP';
    if (region) return 'en_US';
    const language = primary.split('-')[0].toLowerCase();
    return language === 'ko' ? 'ko_KR' : language === 'ja' ? 'ja_JP' : 'en_US';
  }
  function readStoredLocale() {
    try {
      const stored = root.localStorage?.getItem(STORAGE_KEY);
      if (locales.includes(stored)) return stored;
    } catch (_) { /* WebView storage can be unavailable; retain an in-memory choice. */ }
    return deviceLocale();
  }
  function getLocale() { return current; }
  function setLocale(value) {
    if (!locales.includes(value)) return false;
    current = value;
    try { root.localStorage?.setItem(STORAGE_KEY, value); } catch (_) { /* Keep the current session usable. */ }
    if (root.document?.documentElement) root.document.documentElement.lang = languageTags[value];
    if (root.document?.title !== undefined) root.document.title = text('롤 백과사전 클래식');
    if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('classic-locale-change', {detail:{locale:value}}));
    return true;
  }
  function text(value) {
    const source = String(value == null ? '' : value);
    if (current === 'ko_KR') return source;
    const exact = translations.get(source);
    if (exact) return exact[index[current]];
    const trimmed = source.trim();
    if (trimmed !== source && translations.has(trimmed)) return source.replace(trimmed, translations.get(trimmed)[index[current]]);
    let match = source.match(/^최대 중첩\s+(\d+)개$/);
    if (match) return current === 'ja_JP' ? `最大スタック ${match[1]}` : `Maximum stacks: ${match[1]}`;
    match = source.match(/^(\d+)\/(\d+) 페이지 · (\d+)건$/);
    if (match) return current === 'ja_JP'
      ? `${match[1]}/${match[2]} ページ · 全${match[3]}件`
      : `Page ${match[1]}/${match[2]} · ${match[3]} posts`;
    match = source.match(/^(조회|추천|댓글)\s+(\d+)$/);
    if (match) return `${text(match[1])} ${match[2]}`;
    match = source.match(/^(.+?)\s+(\d+)\s*(명|개|종|건)$/);
    if (match && translations.has(match[1])) return current === 'ja_JP'
      ? `${text(match[1])} ${match[2]}${match[3] === '명' ? '人' : '件'}`
      : `${text(match[1])} · ${match[2]}`;
    match = source.match(/^(.+?)\s*[·:]\s*(\d+)\s*(명|개|종|건)$/);
    if (match && translations.has(match[1])) return current === 'ja_JP'
      ? `${text(match[1])} · ${match[2]}${match[3] === '명' ? '人' : '件'}`
      : `${text(match[1])} · ${match[2]}`;
    match = source.match(/^(앱 버전|조합비|조회|추천|댓글|남은 포인트|선행|합계)\s*[:：]?\s*(.+)$/);
    if (match) return `${text(match[1])}: ${match[2]}`;
    let prefix = null;
    for (const [key, value] of translations) {
      if (source.startsWith(key) && /^[\s:：+\-·(\d%]/.test(source.slice(key.length))
          && (!prefix || key.length > prefix[0].length)) prefix = [key, value];
    }
    if (prefix) return prefix[1][index[current]] + source.slice(prefix[0].length);
    return source;
  }
  function setData(value) {
    if (!value || value.schemaVersion !== 1 || value.version !== '16.19.1'
        || !value.locales?.ja_JP || !value.locales?.en_US) throw new Error('Invalid 26.19 locale data');
    data = value;
  }
  function rowForLocale(locale, kind, id) {
    return locales.includes(locale) ? data?.locales?.[locale]?.[kind]?.[String(id)] || null : null;
  }
  function row(kind, id) { return rowForLocale(current, kind, id); }
  function identity(kind, source) {
    if (typeof source !== 'object' || !source) return source;
    return kind === 'masteries' ? source.id : (source.riotId || source.id || source.i);
  }
  function name(kind, source) {
    const id = identity(kind, source);
    if (kind === 'champions' && id === 'Jade_Nunu')
      return {ko_KR:'누누', ja_JP:'ヌヌ', en_US:'Nunu'}[current];
    const localized = current === 'ko_KR' ? '' : row(kind, id)?.name;
    if (localized) return localized;
    if (kind === 'champions') return current === 'en_US' ? source?.nameEn || source?.en || source?.ko || '' : source?.ko || source?.name || '';
    if (kind === 'items') return current === 'en_US' ? source?.en || source?.ko || '' : source?.ko || '';
    if (kind === 'spells') return current === 'en_US' ? source?.nameEn || source?.name || '' : source?.name || '';
    if (kind === 'runes') return source?.title || source?.ko || '';
    if (kind === 'masteries') return source?.name || '';
    return source?.name || '';
  }
  function description(kind, source) {
    if (current === 'ko_KR') return '';
    const id = identity(kind, source);
    const record = row(kind, id);
    return record?.description || record?.tooltip || '';
  }
  function skill(championId, slot) {
    const entry = row('champions', championId);
    return slot === 'P' ? entry?.passive || null
      : entry?.spells?.[{Q:0,W:1,E:2,R:3}[slot]] || null;
  }
  function hasVerifiedName(kind, source) {
    if (current === 'ko_KR') return true;
    const id = identity(kind, source);
    return Boolean(row(kind, id)?.name);
  }
  function apply(container) {
    if (!root.document || !container) return;
    if (root.document.documentElement) root.document.documentElement.lang = languageTags[current];
    if (root.document.title !== undefined) root.document.title = text('롤 백과사전 클래식');
    const excluded = '.brow .bt, .brow .bn, .bdBody .fv, .ctext, .crow .ch, .crow .cb > span:first-child, '
      + '.newsArticle h2, .newsArticleMeta, .newsArticleBody, .hmCommunityRow b, .hmCommunityUser .hmFeedAuthor, '
      + '.onlineManageList b, .wrow b, '
      + '.classicGlossaryHeading, .classicGlossary p, .posts li > b, .onlineTranslation, '
      + '[data-user-content], .localeSourceDetails [lang=ko], [contenteditable], script, style';
    const nodes = [];
    if (container.nodeType === 3) nodes.push(container);
    else {
      const walker = root.document.createTreeWalker(container, root.NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest(excluded)) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      const result = text(source);
      if (node.nodeValue !== result) node.nodeValue = result;
    }
    const elements = container.nodeType === 1 ? [container, ...container.querySelectorAll('[aria-label],[placeholder],[title],[alt]')] : [];
    for (const element of elements) {
      if (element.closest(excluded)) continue;
      let originals = originalAttributes.get(element);
      if (!originals) { originals = {}; originalAttributes.set(element, originals); }
      for (const attribute of ['aria-label', 'placeholder', 'title', 'alt']) {
        if (!element.hasAttribute(attribute)) continue;
        if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
        const result = text(originals[attribute]);
        if (element.getAttribute(attribute) !== result) element.setAttribute(attribute, result);
      }
    }
  }
  function observe() {
    if (!root.document || observer || !root.MutationObserver) return;
    observer = new root.MutationObserver(records => {
      for (const record of records) for (const added of record.addedNodes) {
        if (added.nodeType === 1 || added.nodeType === 3) apply(added);
      }
    });
    observer.observe(root.document.body, {childList:true, subtree:true});
    apply(root.document.body);
  }
  if (root.document?.body) apply(root.document.body);
  return Object.freeze({locales, languageNames, getLocale, setLocale, setData, row, rowForLocale, name, description,
    skill, hasVerifiedName, text, apply, observe});
});
