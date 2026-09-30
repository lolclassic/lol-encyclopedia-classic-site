"""Check the reviewed PC Beta export and, when provided, its Android source."""
from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from export_pc_beta import (
    DATA, EXCLUDED_SCRIPTS, IMAGE_DIRS, SCRIPTS, SECRET_PATTERNS,
    STYLES, TARGET, file_digest, html_for_pc, voice_files,
)


class ResourceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.scripts: set[str] = set()
        self.styles: set[str] = set()
        self.resources: set[str] = set()
        self.policies: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == 'meta' and values.get('http-equiv') == 'Content-Security-Policy':
            self.policies.append(values.get('content') or '')
        raw = values.get('src') if tag in {'script', 'img', 'audio', 'video', 'source'} else None
        if tag == 'link' and values.get('rel') in {'stylesheet', 'manifest', 'icon', 'apple-touch-icon'}:
            raw = values.get('href')
        if raw:
            parsed = urlsplit(raw)
            if parsed.scheme or parsed.netloc or raw.startswith('//') or parsed.path.startswith('/'):
                raise ValueError(f'External or absolute embedded resource: {raw}')
            if parsed.path:
                self.resources.add(parsed.path)
                if tag == 'script':
                    self.scripts.add(parsed.path)
                elif tag == 'link' and values.get('rel') == 'stylesheet':
                    self.styles.add(parsed.path)


def verify(root: Path = TARGET, android_www: Path | None = None) -> dict[str, int | bool]:
    root = root.resolve(strict=True)
    manifest_path = root / 'export-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    records = manifest['files']
    if (manifest.get('schemaVersion'), manifest.get('classification'),
        manifest.get('communityConnected'), manifest.get('operatorModulesIncluded')) != (
            1, 'BROWSER_PREVIEW_NOT_ANDROID_APK', False, False):
        raise ValueError('Unexpected PC Beta export classification')
    actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    expected = set(records) | {'export-manifest.json'}
    if actual != expected or manifest.get('fileCount') != len(records):
        raise ValueError(f'Unexpected or missing export files: {sorted(actual ^ expected)[:12]}')
    if any(p.is_symlink() for p in root.rglob('*')):
        raise ValueError('Export contains a symlink')
    if manifest.get('totalBytes') != sum(row['bytes'] for row in records.values()):
        raise ValueError('Export size manifest mismatch')
    image_names: set[str] = set()
    audio_names: set[str] = set()
    root_names: set[str] = set()
    data_names: set[str] = set()
    for name, row in records.items():
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts or '\\' in name:
            raise ValueError(f'Unsafe export path: {name}')
        path = root / relative
        if path.stat().st_size != row['bytes'] or file_digest(path) != row['sha256']:
            raise ValueError(f'Export digest mismatch: {name}')
        if len(relative.parts) == 1:
            root_names.add(name)
        elif relative.parts[0] == 'data' and len(relative.parts) == 2:
            data_names.add(relative.parts[1])
        elif relative.parts[0] == 'images' and len(relative.parts) >= 3 and relative.parts[1] in IMAGE_DIRS:
            image_names.add(name)
        elif relative.parts[0] == 'audio' and len(relative.parts) >= 3 and relative.parts[1] in {'champion-pick', 'classic-voices'}:
            audio_names.add(name)
        else:
            raise ValueError(f'Unreviewed export path: {name}')
        if relative.suffix in {'.js', '.css', '.json', '.html'}:
            content = path.read_bytes()
            if any(pattern.search(content) for pattern in SECRET_PATTERNS):
                raise ValueError(f'Credential-like bytes in export: {name}')
    expected_root = (SCRIPTS | STYLES | {
        'index.html', 'manifest.webmanifest', 'runtime-config.js',
        'pc-beta-runtime.js', 'pc-beta.css',
    })
    if root_names != expected_root or data_names != DATA:
        raise ValueError(f'Unreviewed script, style, or data: root={sorted(root_names ^ expected_root)}, data={sorted(data_names ^ DATA)}')
    if len(image_names) != manifest.get('imageCount') or len(audio_names) != manifest.get('voiceFileCount'):
        raise ValueError('Image or voice file count mismatch')
    if audio_names != {p.as_posix() for p in voice_files(root)}:
        raise ValueError('Audio export differs from verified voice catalogs')
    html = (root / 'index.html').read_text(encoding='utf-8')
    parser = ResourceParser()
    parser.feed(html)
    if parser.scripts != SCRIPTS | {'runtime-config.js', 'pc-beta-runtime.js'} or parser.styles != STYLES | {'pc-beta.css'}:
        raise ValueError('HTML script/style list differs from reviewed export')
    if parser.resources - set(records):
        raise ValueError(f'Missing HTML resource: {sorted(parser.resources - set(records))}')
    if any(name in html for name in EXCLUDED_SCRIPTS):
        raise ValueError('Excluded online/operator script referenced in HTML')
    if len(parser.policies) != 1 or not all(rule in parser.policies[0] for rule in (
        "default-src 'self'", "script-src 'self'", "connect-src 'self'", "frame-src 'none'", "object-src 'none'"
    )):
        raise ValueError('PC Beta content security policy permits an unexpected request')
    config = (root / 'runtime-config.js').read_text(encoding='utf-8')
    if not all(value in config for value in ('webBeta: true', "communityApiBaseUrl: ''", "communityTranslationApiBaseUrl: ''")):
        raise ValueError('PC Beta configuration may connect online services')
    if 'navigator.serviceWorker.register' not in (root / 'app.js').read_text(encoding='utf-8') or 'webBeta !== true' not in (root / 'app.js').read_text(encoding='utf-8'):
        raise ValueError('PC Beta service worker guard is missing')
    for name in STYLES | {'pc-beta.css'}:
        content = (root / name).read_text(encoding='utf-8')
        for raw in re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)', content):
            value = raw.strip()
            if value.startswith('data:'):
                continue
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or value.startswith('/') or not (root / parsed.path).is_file():
                raise ValueError(f'Unsafe or missing CSS resource in {name}: {value}')
    icons = json.loads((root / 'manifest.webmanifest').read_text(encoding='utf-8')).get('icons', [])
    if not all((root / icon['src']).is_file() for icon in icons):
        raise ValueError('Missing web manifest icon')
    landing = (root.parent / 'index.html').read_text(encoding='utf-8')
    if re.search(r'href\s*=\s*["\'][^"\']*pc-beta/', landing, re.I):
        approval_path = root.parent / 'pc-beta-publication.json'
        if not approval_path.is_file() or json.loads(approval_path.read_text(encoding='utf-8')) != {
            'schemaVersion': 1,
            'classification': 'USER_APPROVED_BROWSER_PREVIEW_NOT_PLAY_RELEASE_OR_RIGHTS_CLEARANCE',
            'appVersion': '26.19.5', 'userPublicationApproved': True,
            'exportManifestSha256': file_digest(manifest_path),
            'rightsClearanceClaim': False, 'playReleaseClaim': False,
        }:
            raise ValueError('Public PC Beta link lacks user approval for this exact export manifest')
    if android_www is not None:
        source = android_www.resolve(strict=True)
        if source.name != 'www' or not (source / 'index.html').is_file():
            raise ValueError('Expected an Android www source directory')
        source_html = (source / 'index.html').read_text(encoding='utf-8')
        if file_digest(source / 'index.html') != manifest.get('sourceIndexSha256') or html_for_pc(source_html) != html:
            raise ValueError('PC Beta HTML differs from current Android source')
        if file_digest(source / 'app.js') != manifest.get('sourceAppJsSha256'):
            raise ValueError('PC Beta app.js differs from current Android source')
        for name in ('nostalgia-218-fidelity.js', 'classic-voice-library.js',
                     'classic-pick-voice.js', 'data/classic-pick-language-assessment-26195.json',
                     'data/classic-garen-base-26195.json',
                     'data/classic-voice-locale-base-26195.json',
                     'data/classic-voice-locale-skin301-estimate-26195.json',
                     'data/classic-voice-locale-ko-estimate-26195.json',
                     'data/classic-skill-effects-26195.json',
                     'data/classic-recommendations-26195.json'):
            if file_digest(source / name) != records[name]['sha256']:
                raise ValueError(f'PC Beta voice source differs from current Android source: {name}')
    return {'files': len(records), 'images': len(image_names), 'voiceFiles': len(audio_names),
            'bytes': manifest['totalBytes'], 'sourceVerified': android_www is not None}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=TARGET)
    parser.add_argument('--android-www', type=Path, help='Current private Android app/src/main/assets/www')
    args = parser.parse_args()
    print(json.dumps(verify(args.root, args.android_www), sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
