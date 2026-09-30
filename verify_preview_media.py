"""Verify historical 26.19.5 English browser-preview provenance and media."""
from __future__ import annotations

import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MEDIA = ROOT / 'assets'
SCREEN_NAMES = frozenset({
    'home', 'champions', 'garen', 'items', 'masteries', 'spells',
    'runes', 'patch-news', 'settings', 'about',
})
EXPECTED = {f'preview-26195-en-{name}.png' for name in SCREEN_NAMES} | {'preview-26195-en-tour.mp4'}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description='Verify historical English browser preview media')
    parser.add_argument('--android-www', type=Path, help='Current private Android app/src/main/assets/www')
    args = parser.parse_args()
    record = json.loads((MEDIA / 'preview-26195-en-provenance.json').read_text(encoding='utf-8'))
    export = json.loads((ROOT / 'pc-beta/export-manifest.json').read_text(encoding='utf-8'))
    if (record.get('schemaVersion'), record.get('classification'), record.get('appVersion')) != (
        1, 'ENGLISH_BROWSER_RENDERING_NOT_PHYSICAL_DEVICE_OR_PLAY_SCREENSHOT', '26.19.5'
    ):
        raise ValueError('Preview classification or version mismatch')
    if record.get('sourceCurrency') != 'HISTORICAL_SNAPSHOT_BEFORE_LATEST_PC_BETA_EXPORT':
        raise ValueError('Browser preview must be identified as historical')
    source_files = (
        ('sourceIndexSha256', 'index.html'),
        ('sourceAppJsSha256', 'app.js'),
        ('sourceNostalgiaJsSha256', 'nostalgia-218-fidelity.js'),
        ('sourceVoiceLibraryJsSha256', 'classic-voice-library.js'),
        ('sourcePickVoiceJsSha256', 'classic-pick-voice.js'),
        ('sourceGarenCatalogSha256', 'data/classic-garen-base-26195.json'),
        ('sourceKoreanVoiceCatalogSha256', 'data/classic-voice-locale-ko-estimate-26195.json'),
        ('sourceSkillEffectsCatalogSha256', 'data/classic-skill-effects-26195.json'),
        ('sourceRecommendationsCatalogSha256', 'data/classic-recommendations-26195.json'),
        ('sourceSkillEffectsJsSha256', 'classic-skill-effects-26195.js'),
        ('sourceSkillEffectsCssSha256', 'classic-skill-effects-26195.css'),
        ('sourceRecommendationsJsSha256', 'classic-recommendations-ui.js'),
        ('sourceRecommendationsCssSha256', 'classic-recommendations-ui.css'),
        ('sourceLocaleJsSha256', 'classic-locale-26195.js'),
    )
    source_matches_export = all(record.get(field) == export['files'][name]['sha256']
                                for field, name in source_files)
    source_matches_android = None
    if args.android_www is not None:
        source = args.android_www.resolve(strict=True)
        if source.name != 'www' or not (source / 'index.html').is_file():
            raise ValueError('Expected an Android www source directory')
        source_matches_android = all(record.get(field) == sha256(source / name)
                                     for field, name in source_files)
    if set(record.get('files', {})) != EXPECTED:
        raise ValueError('Missing or unreviewed 26.19.5 media record')
    if any((MEDIA / name).is_file() for name in ('preview-26195-en-tour.webm',)):
        raise ValueError('Unlisted extra preview video')
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    for name, metadata in record['files'].items():
        path = MEDIA / name
        if not path.is_file() or sha256(path) != metadata.get('sha256') or path.stat().st_size != metadata.get('bytes'):
            raise ValueError(f'Preview file hash/size mismatch: {name}')
        if f'assets/{name}' not in html:
            raise ValueError(f'Preview media not featured on English site: {name}')
        if name.endswith('.png'):
            content = path.read_bytes()
            if content[:8] != b'\x89PNG\r\n\x1a\n' or list(struct.unpack('>II', content[16:24])) != metadata.get('pixels') or metadata['pixels'] != [780, 1688]:
                raise ValueError(f'Unexpected screenshot resolution: {name}')
        else:
            probe = json.loads(subprocess.check_output([
                'ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height',
                '-of', 'json', str(path),
            ], text=True))
            if not any(row.get('codec_type') == 'video' and row.get('width') == 390 and row.get('height') == 844 for row in probe['streams']):
                raise ValueError('Preview video dimensions mismatch')
            if any(row.get('codec_type') == 'audio' for row in probe['streams']) or metadata.get('audioTrack') is not False:
                raise ValueError('Preview video unexpectedly has audio')
            if round(float(probe['format']['duration']), 2) != metadata.get('durationSeconds'):
                raise ValueError('Preview video duration mismatch')
    if record['screenshotCapture'] != {
        'browser': 'Microsoft Edge via Playwright', 'locale': 'en-US',
        'viewportCssPixels': [390, 844], 'deviceScaleFactor': 2,
        'source': 'local Android development WebView assets served by HTTP',
    }:
        raise ValueError('Screenshot capture method changed')
    if record['videoCapture'].get('locale') != 'en-US' or record['videoCapture'].get('audio') is not False:
        raise ValueError('Video capture method changed')
    print(json.dumps({'result': 'PASS_HISTORICAL_MEDIA', 'screens': len(SCREEN_NAMES), 'videos': 1,
                      'sourceMatchesCurrentExport': source_matches_export,
                      'sourceMatchesCurrentAndroid': source_matches_android,
                      'sourceAppJsSha256': record['sourceAppJsSha256']}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
