"""Export a reviewed, static PC archive preview from the Android WebView assets.

The exporter copies only named runtime files, manifest-listed images (excluding
the historical user reference), and audio named by eight reviewed voice catalogs.
No generated Android config, operator/CMS modules, or bulk audio tree is copied.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import re
import shutil
from pathlib import Path


SITE = Path(__file__).resolve().parent
TARGET = SITE / "pc-beta"

STYLES = frozenset({
    "style.css", "classic-rune-ui.css", "classic-detail-extras.css",
    "classic-reference-ui.css", "classic-preferences.css", "classic-news-ui.css",
    "classic-surface-theme.css", "community-translation.css",
    "classic-skill-effects-26195.css", "classic-recommendations-ui.css",
})
SCRIPTS = frozenset({
    "classic-preference-store.js", "classic-champion-media.js",
    "mode-classic-champions.js", "classic-skin-viewer.js", "classic-documents.js",
    "classic-spell-details.js", "classic-damage-view.js", "classic-voice-library.js",
    "classic-pick-voice.js", "classic-champion-backgrounds.js",
    "classic-detail-extras.js", "classic-reference-ui.js", "classic-news-ui.js",
    "classic-skill-effects-26195.js", "classic-recommendations-ui.js",
    "classic-corrections.js", "classic-patch-updates.js", "classic-patch-2619.js",
    "classic-skill-completion-26192.js", "classic-locale-26195.js",
    "classic-skill-locale-26195.js", "classic-skill-display-locale-26195.js",
    "app.js", "champion-routing-fix.js", "portrait-fix.js",
    "classic-ui-overrides.js", "release-readability-controls.js",
    "final-ui-hotfix.js", "nostalgia-218-fidelity.js", "classic-rune-ui.js",
})
EXCLUDED_SCRIPTS = frozenset({
    "operator-champion-overlay.js", "operator-context.js",
    "operator-test-drafts.js", "cms-content-merge.js", "cms-preview.js",
    "community-online.js", "release-update-26195.js",
    "video-page-runtime-fix.js", "classic-video-playback.js",
})
EXCLUDED_STYLES = frozenset({"operator-context.css"})
DATA = frozenset({
    "meta.json", "mode-classic-champions.json", "mode-classic-runtime.json",
    "mode-classic-champions-16.17.1.json", "mode-classic-runtime-16.17.1.json",
    "mode-classic-champions-16.18.1.json", "mode-classic-runtime-16.18.1.json",
    "classic-items-26.19.json", "runes-classic.json", "classic-masteries-26.19.json",
    "spells.json", "classic.json", "classic-champion-media.json",
    "app-documents.json", "app-documents-localized-26195.json",
    "classic-damage-calculations.json", "classic-damage-manifest.json",
    "classic-detail-metadata.json", "classic-glossary.json",
    "classic-glossary-localized-26195.json", "classic-item-aliases.json",
    "classic-champion-release-dates.json", "classic-news.json",
    "classic-news-2619.json", "classic-news-localized-26195.json",
    "classic-patch-updates.json", "classic-english-26.19.json",
    "classic-localized-26.19.json", "classic-backgrounds-26.19.json",
    "classic-backgrounds-localized-26195.json", "classic-skill-completion-26.19.json",
    "classic-skill-localized-26195.json", "classic-skill-localized-extra-26195.json",
    "classic-pick-voice.json", "classic-pick-language-assessment-26195.json",
    "classic-voice-library.json",
    "classic-voice-locale-26195.json", "classic-voice-locale-cdn-26195.json",
    "classic-garen-base-26195.json", "classic-voice-locale-base-26195.json",
    "classic-voice-locale-skin301-estimate-26195.json",
    "classic-voice-locale-ko-estimate-26195.json",
    "classic-skill-effects-26195.json", "classic-recommendations-26195.json",
})
VOICE_CATALOGS = (
    "classic-pick-voice.json", "classic-voice-library.json",
    "classic-voice-locale-26195.json", "classic-voice-locale-cdn-26195.json",
    "classic-garen-base-26195.json", "classic-voice-locale-base-26195.json",
    "classic-voice-locale-skin301-estimate-26195.json",
    "classic-voice-locale-ko-estimate-26195.json",
)
GAREN_CATALOG_SHA256 = '51496da530bc64cf4553efdeda64d4ca7615a13019e54f7d3b277d66b3112681'
ESTIMATED_CATALOG_SHA256 = {
    'classic-voice-locale-base-26195.json': 'ed7b44967d9212893951ab18cbf8c2dc554b3125f41d19c49a2c4ffab404e224',
    'classic-voice-locale-skin301-estimate-26195.json': '65f1b5508e661f5350b255a3e32d3584a35c555246208c98d1b1a6a3e836c528',
    'classic-voice-locale-ko-estimate-26195.json': 'c1f738094d7e15128031028d3e942a01289effe33955a725c0e526f940ec4676',
}
VOICE_RULES = {
    'classic-pick-voice.json': (3, 'CHAMPION_SELECTION_VOICE', re.compile(
        r'audio/champion-pick/(?:(?:ko_KR|ja_JP|en_US)/[0-9]+_[A-Za-z0-9]+\.ogg|verified-26\.19/[a-z0-9]+\.mp3)'
    )),
    'classic-voice-library.json': (3, 'VERIFIED_CLASSIC_RESTORED_VOICE', re.compile(
        r'audio/classic-voices/shared/[a-f0-9]{64}\.ogg'
    )),
    'classic-voice-locale-26195.json': (1, 'VERIFIED_CLASSIC_NAMED_SKIN_LOCALIZED_VO', re.compile(
        r'audio/classic-voices/localized-26195/(?:ja_JP|en_US)/[a-f0-9]{64}\.ogg'
    )),
    'classic-voice-locale-cdn-26195.json': (1, 'VERIFIED_CLASSIC_NAMED_SKIN_LOCALIZED_VO', re.compile(
        r'audio/classic-voices/localized-26195-cdn-1619/(?:ja_JP|en_US)/[a-f0-9]{64}\.ogg'
    )),
    'classic-garen-base-26195.json': (1, 'GAREN_CLASSIC_MODE_BASE_AND_OLD_EN_ARCHIVE_ESTIMATES', re.compile(
        r'audio/classic-voices/(?:(?:classic-mode-base-26195/(?:ja_JP|en_US))|garen-old-en-26195)/[a-f0-9]{64}\.ogg'
    )),
    'classic-voice-locale-base-26195.json': (1, 'CLASSIC_MODE_BASE_VO_LOCALIZED_ESTIMATES', re.compile(
        r'audio/classic-voices/classic-mode-base-26195/(?:ja_JP|en_US)/[a-f0-9]{64}\.ogg'
    )),
    'classic-voice-locale-skin301-estimate-26195.json': (1, 'CLASSIC_MODE_SKIN301_LOCALIZED_VO_26_19_ESTIMATES', re.compile(
        r'audio/classic-voices/localized-26195-cdn-1619-estimate/(?:ja_JP|en_US)/[a-f0-9]{64}\.ogg'
    )),
    'classic-voice-locale-ko-estimate-26195.json': (1, 'CLASSIC_MODE_KOREAN_VO_ESTIMATES', re.compile(
        r'audio/classic-voices/(?:classic-mode-base-26195|classic-mode-skin301-ko-26195)/ko_KR/[a-f0-9]{64}\.ogg'
    )),
}
IMAGE_DIRS = frozenset({
    'branding', 'champ_img', 'classic_champ_img', 'classic_rune',
    'classic_summoner', 'mode_classic', 'official_champion',
    'official_classic_skin', 'official_classic_spell', 'official_item',
    'official_mastery', 'official_rune', 'skill_img', 'summoner_spell',
})
SECRET_PATTERNS = (
    re.compile(rb"AIza[0-9A-Za-z_-]{30,}"),
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"(?:ghp_|ghs_|sk-)[0-9A-Za-z_-]{20,}"),
)

PC_CONFIG = """'use strict';
window.__LOLCLASSIC_CONFIG__ = Object.freeze({
  appVersion: '26.19.5', webBeta: true,
  communityApiBaseUrl: '', communityTranslationApiBaseUrl: '',
  operatorTestDrafts: false, durableVoicePreferences: false
});
"""

PC_RUNTIME = """/* Browser-only archive preview: no community or external video requests. */
(() => {
  'use strict';
  const copy = {
    ko_KR: { label:'PC 베타 · 백과사전 전용 미리보기', backSite:'사이트로 돌아가기', backArchive:'백과사전 홈으로',
      title:'온라인 기능은 이 PC 베타에 연결되지 않았습니다.',
      body:'챔피언, 아이템, 특성, 주문, 룬, 새소식과 로컬 설정을 둘러볼 수 있습니다. 자유게시판은 Android 앱에서 이용해 주세요.',
      settingsNote:'룬·특성·빌드 선택은 이 브라우저에 저장됩니다. PC 베타에서는 온라인 커뮤니티를 이용할 수 없습니다.',
      aboutNote:'PC 베타에서는 챔피언·스킬·아이템·특성·소환사 주문·룬 정보를 살펴보고 룬과 특성 편성을 브라우저에 저장할 수 있습니다. 온라인 커뮤니티는 Android 앱에서 이용할 수 있습니다.' },
    ja_JP: { label:'PC ベータ · 百科事典プレビュー', backSite:'サイトに戻る', backArchive:'百科事典のホームへ',
      title:'この PC ベータではオンライン機能を利用できません。',
      body:'チャンピオン、アイテム、マスタリー、サモナースペル、ルーン、ニュース、ローカル設定を閲覧できます。掲示板は Android アプリでご利用ください。',
      settingsNote:'ルーン、マスタリー、ビルドの選択はこのブラウザに保存されます。PC ベータではオンラインコミュニティを利用できません。',
      aboutNote:'PC ベータではチャンピオン、スキル、アイテム、マスタリー、サモナースペル、ルーンを閲覧し、ルーンとマスタリーの編成をブラウザに保存できます。オンラインコミュニティは Android アプリで利用できます。' },
    en_US: { label:'PC Beta · Archive-only preview', backSite:'Back to site', backArchive:'Back to archive',
      title:'Online features are not connected in this PC Beta.',
      body:'Explore champions, items, masteries, spells, runes, news, and local settings. Use the Android app for the community.',
      settingsNote:'Rune, mastery, and build choices are stored in this browser. The online community is unavailable in the PC Beta.',
      aboutNote:'The PC Beta lets you browse champions, abilities, items, masteries, spells, and runes, and save rune and mastery choices in this browser. The online community is available in the Android app.' }
  };
  const ui = () => copy[window.ClassicLocale?.getLocale?.()] || copy.en_US;
  const unavailable = () => {
    const t = ui();
    return `<section class="pcBetaUnavailable"><h2>${t.title}</h2><p>${t.body}</p><button type="button" data-go="home">${t.backArchive}</button></section>`;
  };
  board = unavailable;
  post = unavailable;
  const androidSettings = settings;
  settings = function () {
    const old = localized('룬·특성·빌드 및 오프라인 게시판 데이터는 기기에 저장됩니다. 온라인 닉네임·글·댓글·추천·신고·차단·버그 신고는 커뮤니티 서버에서 처리됩니다.');
    return androidSettings().replace(`<p class="hint">${old}</p>`, `<p class="hint">${ui().settingsNote}</p>`);
  };
  const androidAbout = about;
  about = function () {
    const old = localized('챔피언·스킬·아이템·특성·소환사 주문·룬 정보를 살펴보고, 룬과 특성 편성을 기기에 저장할 수 있습니다. 익명 온라인 커뮤니티에서는 게시글·댓글·추천·신고·차단과 프로필 삭제 기능을 제공합니다.');
    return androidAbout().replace(old, ui().aboutNote);
  };
  const originalHomeFeed = homeFeed;
  homeFeed = function (tab) {
    if (tab === '커뮤니티' || tab === '영상')
      return `<li class="hmFeedEmpty"><span class="hmFeedStatus">${ui().title}</span></li>`;
    return originalHomeFeed(tab);
  };
  loadLolVideos = async () => {};
  const publicDocuments = Object.freeze({
    'document/contact':'../contact.html',
    'document/terms':'../terms.html',
    'document/privacy':'../privacy.html',
    'document/deletion':'../delete-account.html',
    'online-delete':'../delete-account.html'
  });
  const archiveGo = go;
  go = function (route) {
    if (publicDocuments[route]) {
      location.assign(publicDocuments[route]);
      return;
    }
    return archiveGo(route);
  };
  if (publicDocuments[location.hash.slice(1)]) {
    location.replace(publicDocuments[location.hash.slice(1)]);
    return;
  }
  document.body.classList.add('pcBetaWeb');
  const banner = document.createElement('aside');
  banner.className = 'pcBetaBanner';
  banner.innerHTML = '<strong></strong><a href="../index.html"></a>';
  document.querySelector('.app').before(banner);
  const syncBannerHeight = () => {
    const height = `${banner.getBoundingClientRect().height}px`;
    if (document.documentElement.style.getPropertyValue('--pc-beta-banner-height') !== height)
      document.documentElement.style.setProperty('--pc-beta-banner-height', height);
  };
  const update = () => {
    banner.querySelector('strong').textContent = ui().label;
    banner.querySelector('a').textContent = ui().backSite;
    syncBannerHeight();
  };
  update();
  window.addEventListener('classic-locale-change', update);
  window.addEventListener('resize', syncBannerHeight);
  new ResizeObserver(syncBannerHeight).observe(banner);
})();
"""

PC_CSS = """.pcBetaBanner{position:relative;z-index:30;display:flex;align-items:center;
  justify-content:space-between;gap:1rem;padding:.55rem clamp(1rem,3vw,2rem);
  color:#f3e6c5;background:#17242a;border-bottom:2px solid #b5914f;
  font:600 13px/1.45 system-ui,sans-serif}
.pcBetaBanner a{color:#ffe29a;text-decoration:underline;white-space:nowrap}
.pcBetaUnavailable{margin:1rem;padding:clamp(1.25rem,3vw,2rem);
  color:#f3e6c5;background:#132027;border:1px solid #a98b50;line-height:1.6}
.pcBetaUnavailable h2{margin:0 0 .8rem;font-size:clamp(1.3rem,3vw,2rem)}
.pcBetaUnavailable p{margin:0 0 1.2rem}
.pcBetaUnavailable button{padding:.6rem 1rem;border:1px solid #d7b367;
  color:#162027;background:#f4d787;cursor:pointer}
body.pcBetaWeb.nostalgia218Fidelity.nostalgia218HasArchiveDock .itemPage{
  height:calc(100dvh - 109px - var(--nostalgia-archive-dock-height,48px) - var(--pc-beta-banner-height,0px))!important}
body.pcBetaWeb.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive{
  grid-template-rows:auto minmax(0,1fr) auto!important}
body.pcBetaWeb.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive>.pcBetaBanner{
  grid-row:1!important;align-self:start!important}
body.pcBetaWeb.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive>.app{
  grid-row:2!important}
body.pcBetaWeb.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive>#floatingLegalFooter{
  grid-row:3!important}
@media(max-width:420px){.pcBetaBanner{align-items:flex-start;flex-direction:column;gap:.25rem}}
"""

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def safe_relative(value: str, prefix: str) -> Path:
    if not isinstance(value, str) or not value.startswith(prefix) or not re.fullmatch(r"[A-Za-z0-9_./' -]+", value):
        raise ValueError(f"Unsafe exported path: {value!r}")
    path = Path(value)
    if '..' in path.parts or path.is_absolute():
        raise ValueError(f"Unsafe exported path: {value!r}")
    return path


def html_for_pc(source: str) -> str:
    scripts = set(re.findall(r'<script src="([^"?]+)(?:\?[^\"]*)?"></script>', source))
    styles = set(re.findall(r'<link rel="stylesheet" href="([^"?]+)(?:\?[^\"]*)?">', source))
    expected_scripts = SCRIPTS | EXCLUDED_SCRIPTS | {'runtime-config.js'}
    if scripts != expected_scripts or styles != STYLES | EXCLUDED_STYLES:
        raise ValueError(f"Unreviewed HTML assets: scripts={sorted(scripts ^ expected_scripts)}, styles={sorted(styles ^ (STYLES | EXCLUDED_STYLES))}")
    for name in EXCLUDED_SCRIPTS:
        pattern = rf'<script src="{re.escape(name)}(?:\?[^\"]*)?"></script>\s*'
        source, count = re.subn(pattern, '', source)
        if count != 1:
            raise ValueError(f"Missing excluded script: {name}")
    for name in EXCLUDED_STYLES:
        pattern = rf'<link rel="stylesheet" href="{re.escape(name)}(?:\?[^\"]*)?">\s*'
        source, count = re.subn(pattern, '', source)
        if count != 1:
            raise ValueError(f"Missing excluded stylesheet: {name}")
    if source.count('<script src="runtime-config.js') != 1:
        raise ValueError('Could not locate safe PC Beta configuration slot')
    source = source.replace('<html lang="ko">', '<html lang="en">', 1)
    source = source.replace('<title>롤 백과사전 클래식</title>', '<title>LoL Encyclopedia Classic (Beta)</title>', 1)
    source, description_count = re.subn(
        r'<meta name="description" content="[^"]*">',
        '<meta name="description" content="Unofficial LoL Encyclopedia Classic PC Beta: explore historical champions, items, masteries, spells, runes, and news in your browser.">',
        source, count=1,
    )
    if description_count != 1:
        raise ValueError('Missing PC Beta description')
    source = source.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob:; font-src \'self\' data:; connect-src \'self\'; frame-src \'none\'; object-src \'none\'; base-uri \'self\'">', 1)
    source = source.replace('</head>', '<link rel="stylesheet" href="pc-beta.css">\n</head>', 1)
    source = source.replace('</body>', '<script src="pc-beta-runtime.js"></script>\n</body>', 1)
    if any(f'src="{name}' in source for name in EXCLUDED_SCRIPTS):
        raise ValueError('Excluded script remains in PC HTML')
    return source


def voice_files(source: Path) -> set[Path]:
    files: dict[Path, tuple[int, str]] = {}
    for name in VOICE_CATALOGS:
        catalog_path = source / 'data' / name
        catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
        schema, classification, allowed_path = VOICE_RULES[name]
        if catalog.get('schemaVersion') != schema or catalog.get('classification') != classification:
            raise ValueError(f'Unexpected voice catalog classification: {name}')
        if name in ESTIMATED_CATALOG_SHA256:
            expected_champions, expected_clips = {
                'classic-voice-locale-base-26195.json': (42, {'ja_JP': 1833, 'en_US': 1818}),
                'classic-voice-locale-skin301-estimate-26195.json': (5, {'ja_JP': 233, 'en_US': 239}),
                'classic-voice-locale-ko-estimate-26195.json': (48, {'ko_KR': 2139}),
            }[name]
            champions = catalog.get('champions')
            if file_digest(catalog_path) != ESTIMATED_CATALOG_SHA256[name] or not isinstance(champions, dict) or len(champions) != expected_champions or Counter(
                clip.get('locale') for champion in champions.values() for clip in champion.get('clips', [])
            ) != Counter(expected_clips):
                raise ValueError(f'Unexpected estimated Classic voice catalog distribution: {name}')
        if name == 'classic-garen-base-26195.json':
            clips = catalog.get('clips')
            if file_digest(catalog_path) != GAREN_CATALOG_SHA256 or not isinstance(clips, list) or len(clips) != 186 or not all(
                isinstance(clip, dict) and isinstance(clip.get('file'), str) for clip in clips
            ) or Counter((clip['locale'], clip['file'].split('/')[2]) for clip in clips) != Counter({
                ('ja_JP', 'classic-mode-base-26195'): 71,
                ('en_US', 'classic-mode-base-26195'): 71,
                ('en_US', 'garen-old-en-26195'): 44,
            }):
                raise ValueError('Unexpected Garen audio catalog distribution')
        def walk(node: object) -> None:
            if isinstance(node, dict):
                if isinstance(node.get('file'), str) and node['file'].startswith('audio/'):
                    rel = safe_relative(node['file'], 'audio/')
                    if not allowed_path.fullmatch(rel.as_posix()):
                        raise ValueError(f'Unexpected audio path in {name}: {rel}')
                    size, sha = node.get('bytes'), node.get('sha256')
                    if not isinstance(size, int) or size < 5 or not isinstance(sha, str) or not re.fullmatch(r'[a-f0-9]{64}', sha):
                        raise ValueError(f'Unverified audio entry: {rel}')
                    if rel in files and files[rel] != (size, sha):
                        raise ValueError(f'Conflicting audio metadata: {rel}')
                    files[rel] = size, sha
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for value in node:
                    walk(value)
        walk(catalog)
    for rel, (size, sha) in files.items():
        path = source / rel
        if not path.is_file() or path.is_symlink() or path.stat().st_size != size or file_digest(path) != sha:
            raise ValueError(f'Audio catalog mismatch: {rel}')
    return set(files)


def image_files(source: Path) -> set[Path]:
    manifest = json.loads((source / 'data/offline-assets.json').read_text(encoding='utf-8'))
    assets = manifest.get('assets')
    if manifest.get('schemaVersion') != 1 or manifest.get('root') != 'images' or not isinstance(assets, list) or len(assets) != manifest.get('count') or len(assets) != 2233:
        raise ValueError('Unexpected image allowlist')
    files = set()
    for value in assets:
        rel = safe_relative(value, 'images/')
        if rel == Path('images/historical_gallery/sona-user-reference.png'):
            continue
        if 'historical_gallery' in rel.parts:
            raise ValueError(f'Unreviewed historical image: {rel}')
        if len(rel.parts) < 3 or rel.parts[1] not in IMAGE_DIRS:
            raise ValueError(f'Unreviewed image directory: {rel}')
        if rel in files or not (source / rel).is_file() or (source / rel).is_symlink():
            raise ValueError(f'Missing or duplicate image: {rel}')
        files.add(rel)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--android-www', required=True, type=Path, help='Android app/src/main/assets/www source directory')
    args = parser.parse_args()
    source = args.android_www.resolve(strict=True)
    if source.name != 'www' or not (source / 'index.html').is_file():
        raise ValueError('Expected an Android www source directory')
    if TARGET.is_symlink() or (TARGET.exists() and not TARGET.is_dir()):
        raise ValueError('PC Beta output target is unsafe')

    source_html = (source / 'index.html').read_text(encoding='utf-8')
    generated: dict[Path, bytes] = {
        Path('index.html'): html_for_pc(source_html).encode('utf-8'),
        Path('runtime-config.js'): PC_CONFIG.encode('utf-8'),
        Path('pc-beta-runtime.js'): PC_RUNTIME.encode('utf-8'),
        Path('pc-beta.css'): PC_CSS.encode('utf-8'),
    }
    manifest = json.loads((source / 'manifest.webmanifest').read_text(encoding='utf-8'))
    manifest.update(name='LoL Encyclopedia Classic (Beta)', short_name='LoL Classic Beta', lang='en')
    generated[Path('manifest.webmanifest')] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    images = image_files(source)
    voices = voice_files(source)
    copied = ({Path(name) for name in STYLES | SCRIPTS}
              | {Path('data') / name for name in DATA}
              | images | voices)
    for rel in copied:
        path = source / rel
        if not path.is_file() or path.is_symlink() or source not in path.resolve().parents:
            raise ValueError(f'Missing or unsafe source file: {rel}')
        if rel.suffix in {'.js', '.css', '.json', '.html'}:
            data = path.read_bytes()
            if any(pattern.search(data) for pattern in SECRET_PATTERNS):
                raise ValueError(f'Credential-like bytes in source file: {rel}')
    previous_path = TARGET / 'export-manifest.json'
    previous = json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.is_file() else None
    if TARGET.exists() and previous is None and any(TARGET.iterdir()):
        raise ValueError('Nonempty PC Beta directory lacks an exporter manifest')
    previous_files = previous.get('files', {}) if previous else {}
    desired = {rel.as_posix(): None for rel in generated.keys() | copied}
    for rel in set(desired) | set(previous_files):
        path = TARGET / rel
        if path.is_symlink():
            raise ValueError(f'PC Beta output symlink: {rel}')
        if path.exists():
            if rel not in previous_files or file_digest(path) != previous_files[rel]['sha256']:
                raise ValueError(f'PC Beta file changed outside exporter: {rel}')
    TARGET.mkdir(parents=True, exist_ok=True)
    records = {}
    for rel in sorted(generated.keys() | copied):
        dest = TARGET / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if rel in generated:
            data = generated[rel]
            if not dest.is_file() or digest(data) != file_digest(dest):
                dest.write_bytes(data)
        else:
            original = source / rel
            if not dest.is_file() or file_digest(original) != file_digest(dest):
                shutil.copyfile(original, dest)
        records[rel.as_posix()] = {'sha256': file_digest(dest), 'bytes': dest.stat().st_size}
    for stale in sorted(set(previous_files) - set(records)):
        (TARGET / stale).unlink()
    result = {
        'schemaVersion': 1, 'classification': 'BROWSER_PREVIEW_NOT_ANDROID_APK',
        'sourceIndexSha256': digest(source_html.encode('utf-8')),
        'sourceAppJsSha256': file_digest(source / 'app.js'),
        'communityConnected': False, 'operatorModulesIncluded': False,
        'imageCount': len(images), 'voiceFileCount': len(voices),
        'files': records, 'fileCount': len(records),
        'totalBytes': sum(row['bytes'] for row in records.values()),
    }
    previous_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('classification', 'fileCount', 'totalBytes')}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
