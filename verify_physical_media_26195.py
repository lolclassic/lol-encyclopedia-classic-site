"""Verify current or historical English 26.19.5 physical-phone media."""
from __future__ import annotations

import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
MEDIA = ROOT / 'assets'
SCREENS = ('champions', 'garen', 'items', 'spells')
EXPECTED = {f'physical-26195-en-{name}.png' for name in SCREENS} | {'physical-26195-en-tour.mp4'}
PROVENANCE_NAME = 'physical-26195-en-provenance.json'
CURRENT_DIR = MEDIA / 'physical-26195-en-r32-raw'
CURRENT_APK_SHA256 = '6ba4fad5ece9104b7a70f31b8779b6bf1d797601a0df511ce681d4326cd9e560'
R31_RAW_DIR = MEDIA / 'physical-26195-en-r31-raw'
R31_APK_SHA256 = '23d67a7f50ba45dd7d10a4ea20b962aa60efeec5ca0ed3860ed42efbfb53afb9'
R30_RAW_DIR = MEDIA / 'physical-26195-en-r30-raw'
R30_APK_SHA256 = 'd4025e69abd0da1a7b99dc4b4d10f8e5cbf6aff0555101136369580d0b97ad4d'
R28_RAW_DIR = MEDIA / 'physical-26195-en-r28-raw'
R28_APK_SHA256 = '121db97fae2c004262d52c40d0051537813b07aad383bef279c46a5ea025b6a1'
R27_RAW_DIR = MEDIA / 'physical-26195-en-r27-raw'
R27_APK_SHA256 = '2133dc36973dc4193e180d8ebd17167b98ea5092b7416a79ca0583cb7c0eeb7f'
R26_RAW_DIR = MEDIA / 'physical-26195-en-r26-raw'
R26_APK_SHA256 = '44205930cb5dfc6d2415dd72573e1e37f57594e9d07ea007ad42c6398e31b5bc'
R25_RAW_DIR = MEDIA / 'physical-26195-en-r25-raw'
R25_APK_SHA256 = 'b75d8ba25726d960a727e56d98148d4b69672c0136ea9f6355c1081cf00c3245'
R24_RAW_DIR = MEDIA / 'physical-26195-en-r24-raw'
R24_APK_SHA256 = 'c4d63121a9166813200e415e7e316f6fb6837c1e899df60427bba30b85da964b'
R23_RAW_DIR = MEDIA / 'physical-26195-en-r23-raw'
R23_EDITED_DIR = MEDIA / 'physical-26195-en-r23-edited'
R23_EDITED_PROVENANCE_NAME = 'physical-26195-en-edited-provenance.json'
R23_APK_SHA256 = 'bfe44149d75025140abf520d78f2620832204b860ec0ce08ea5865009398b4b2'
PREVIOUS_R22_DIR = MEDIA / 'physical-26195-en-r22'
PREVIOUS_R22_APK_SHA256 = 'c8943444af961cb307513699d562475b591da4a41eb10bb6aca2ccdc4f45759d'
PREVIOUS_R21_DIR = MEDIA / 'physical-26195-en-r21'
PREVIOUS_R21_APK_SHA256 = 'ae88f4d91c9dcd94f03ee93a5410521306efd7e9a49a1d0f13ff986663201305'
PREVIOUS_DIR = MEDIA / 'physical-26195-en-r20'
PREVIOUS_APK_SHA256 = '0a7c82f8efebcb9b75179a2012b7b2c9868fd6fd6295028dbe8479169bc885f1'
HISTORICAL_APK_SHA256 = '7fa719c2296d9f95a098541a2467fcf522047fabecbf1f95e56e759bf89c18f9'


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_media(media_dir: Path, expected_apk_sha256: str, featured: bool,
                 android_repo: Path | None) -> dict:
    provenance = media_dir / PROVENANCE_NAME
    record = json.loads(provenance.read_text(encoding='utf-8'))
    if (record.get('schemaVersion'), record.get('classification'), record.get('appVersion')) != (
        1, 'ENGLISH_PHYSICAL_ANDROID_DEVELOPMENT_NOT_PLAY_RELEASE', '26.19.5'
    ):
        raise ValueError('Physical media classification or version mismatch')
    build = record['build']
    if (build['packageName'] != 'com.lolclassic.encyclopedia.overlaytest.dev'
        or build['versionCode'] != 24
        or build['localAndInstalledApkSha256'] != expected_apk_sha256):
        raise ValueError('Physical media development package mismatch')
    if record['device'] != {
        'model': 'SM-S911N', 'physical': True, 'androidUser': 0,
        'exactSerialVerifiedLocally': True,
    }:
        raise ValueError('Physical device provenance mismatch')
    if record['capture'] != {
        'locale': 'en_US',
        'offlineRoutes': ['champions', 'champion/garen/basic', 'items', 'spells'],
        'screenshotMethod': 'adb exec-out screencap -p',
        'videoMethod': 'adb shell screenrecord',
        'routeControl': ('WebView DevTools Runtime.evaluate for still routes; native Android input swipe for screenrecord'
                         if media_dir in (CURRENT_DIR, R31_RAW_DIR, R30_RAW_DIR) else
                         'WebView DevTools Runtime.evaluate; same locale application steps as app settings'),
        'audioTrack': False,
    }:
        raise ValueError('Physical capture method mismatch')
    restore = record['stateRestoration']
    if any(restore[key] is not True for key in (
        'originalLocaleAndRoute', 'originalForeground',
        'developmentAndProductionApkHashesUnchanged',
    )) or set(restore['productionApkSha256']) != {'base.apk', 'split_config.xxhdpi.apk'}:
        raise ValueError('Physical capture restoration was not verified')
    review = record['privacyReview']
    if media_dir == CURRENT_DIR and review.get('status') == 'PENDING_MANUAL_REVIEW':
        if review != {
            'status': 'PENDING_MANUAL_REVIEW', 'screensReviewed': 0,
            'videoFramesReviewed': 0, 'privateContentObserved': None,
            'humanReviewed': False, 'publicationReady': False,
        }:
            raise ValueError('Current raw media pending review record mismatch')
    elif media_dir in (CURRENT_DIR, R31_RAW_DIR):
        expected_frames = 309 if media_dir == CURRENT_DIR else 295
        if review != {
            'status': ('CODEX_VISUALLY_REVIEWED_USER_PUBLICATION_APPROVED'
                       if media_dir == CURRENT_DIR else
                       'CODEX_VISUALLY_REVIEWED_PUBLIC_APPROVAL_PENDING'),
            'screensReviewed': len(SCREENS), 'videoFramesReviewed': expected_frames,
            'privateContentObserved': False,
            'androidStatusAndNavigationBarsVisible': True,
            'deviceStatusIconsVisible': True,
            'humanReviewed': False, 'publicationReady': media_dir == CURRENT_DIR,
            **({'method': ('Full raw screenshots and all 309 decoded video frames inspected in 18 contact sheets; '
                           'video frames downsampled to 360x780 from 1080x2340'),
                'userPublicationApproved': True,
                'publicationScope': 'USER_APPROVED_SITE_MEDIA_PREVIEW_NOT_PLAY_RELEASE_OR_RIGHTS_CLEARANCE'}
               if media_dir == CURRENT_DIR else {}),
        }:
            raise ValueError('Current raw media visual review record mismatch')
    elif media_dir in (R30_RAW_DIR, R28_RAW_DIR, PREVIOUS_R22_DIR, R23_RAW_DIR, R24_RAW_DIR, R25_RAW_DIR, R26_RAW_DIR, R27_RAW_DIR):
        if review != {
            'status': 'PENDING_MANUAL_REVIEW', 'screensReviewed': 0,
            'videoFramesReviewed': 0, 'privateContentObserved': None,
        }:
            raise ValueError('Current raw media must remain pending manual review')
    else:
        expected_method = ('Full screenshots and every decoded video frame inspected in frame-order contact sheet'
                           if media_dir == PREVIOUS_R21_DIR else
                           'Full screenshots and every decoded video frame inspected in numbered contact sheets')
        if (review.get('humanReviewed') is not False or review['screensReviewed'] != len(SCREENS)
            or review.get('method') != expected_method):
            raise ValueError('Physical media visual review record mismatch')
    if media_dir not in (MEDIA, CURRENT_DIR, R31_RAW_DIR, R30_RAW_DIR, R28_RAW_DIR, PREVIOUS_R22_DIR, R23_RAW_DIR, R24_RAW_DIR, R25_RAW_DIR, R26_RAW_DIR, R27_RAW_DIR):
        if (review['status'] != 'PENDING_PUBLIC_PRIVACY_REVIEW'
            or review.get('statusBarNotificationIconsAndDeviceStateVisible') is not True
            or review.get('privateContentObserved', False) is not None
            or review.get('publicationReady') is not False):
            raise ValueError('Current raw media public privacy review must remain pending')
    elif media_dir == MEDIA and (review['status'] != 'VISUAL_REVIEWED_BY_CODEX' or review['privateContentObserved'] is not False):
        raise ValueError('Historical physical media visual review record mismatch')
    if set(record['files']) != EXPECTED:
        raise ValueError('Missing or unexpected physical media record')
    if featured and {p.name for p in media_dir.iterdir()} != EXPECTED | {PROVENANCE_NAME}:
        raise ValueError('Current physical media directory has missing or unexpected entries')
    extra = {p.name for p in media_dir.glob('physical-26195-en-*') if p.is_file()} - EXPECTED - {PROVENANCE_NAME}
    if extra:
        raise ValueError(f'Unreviewed physical media files: {sorted(extra)}')
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    for name in EXPECTED:
        path = media_dir / name
        metadata = record['files'][name]
        if not path.is_file() or metadata['sha256'] != sha256(path) or metadata['bytes'] != path.stat().st_size:
            raise ValueError(f'Physical media hash/size mismatch: {name}')
        if featured and f'assets/{media_dir.name}/{name}' not in html:
            raise ValueError(f'Physical media is not featured on the English site: {name}')
        if name.endswith('.png'):
            content = path.read_bytes()
            if content[:8] != b'\x89PNG\r\n\x1a\n' or list(struct.unpack('>II', content[16:24])) != [1080, 2340] or metadata['pixels'] != [1080, 2340]:
                raise ValueError(f'Physical screenshot dimensions mismatch: {name}')
        else:
            probe = json.loads(subprocess.check_output([
                'ffprobe', '-v', 'error', '-show_entries',
                'format=duration:stream=codec_type,codec_name,width,height,nb_frames',
                '-of', 'json', str(path),
            ], text=True))
            video = [row for row in probe['streams'] if row.get('codec_type') == 'video']
            if len(video) != 1 or video[0].get('codec_name') != 'h264' or [video[0].get('width'), video[0].get('height')] != [1080, 2340]:
                raise ValueError('Physical video codec or dimensions mismatch')
            if any(row.get('codec_type') == 'audio' for row in probe['streams']) or metadata['audioTrack'] is not False:
                raise ValueError('Physical video unexpectedly has audio')
            if round(float(probe['format']['duration']), 2) != metadata['durationSeconds'] or int(video[0]['nb_frames']) != metadata['frameCount']:
                raise ValueError('Physical video duration or frame count mismatch')
            if (media_dir not in (R30_RAW_DIR, R28_RAW_DIR, PREVIOUS_R22_DIR, R23_RAW_DIR, R24_RAW_DIR, R25_RAW_DIR, R26_RAW_DIR, R27_RAW_DIR)
                and review['status'] != 'PENDING_MANUAL_REVIEW'
                and review['videoFramesReviewed'] != metadata['frameCount']):
                raise ValueError('Not all recorded video frames were visually reviewed')
    if android_repo is not None:
        apk = android_repo.resolve(strict=True) / 'build/parallel-26195/android-app/outputs/apk/overlayTest/app-overlayTest.apk'
        if not apk.is_file() or sha256(apk) != build['localAndInstalledApkSha256']:
            raise ValueError('Android development APK differs from captured installation')
    return {'result': 'PASS_TECHNICAL_MEDIA_ONLY', 'physicalScreens': len(SCREENS), 'videos': 1,
            'androidApkVerified': android_repo is not None,
            'developmentApkSha256': build['localAndInstalledApkSha256'],
            'privacyReviewStatus': review['status'],
            'userPublicationApproved': review.get('userPublicationApproved', False),
            'publicationReady': review.get('publicationReady', False),
            'publicationScope': review.get('publicationScope')}


def verify_r23_candidate() -> dict:
    """Check the preserved r23 capture and its separately labeled crop."""
    raw_result = verify_media(R23_RAW_DIR, R23_APK_SHA256, False, None)
    raw_provenance = R23_RAW_DIR / PROVENANCE_NAME
    edited_provenance = R23_EDITED_DIR / R23_EDITED_PROVENANCE_NAME
    record = json.loads(edited_provenance.read_text(encoding='utf-8'))
    if (record.get('schemaVersion'), record.get('classification'), record.get('appVersion')) != (
        1, 'ENGLISH_PHYSICAL_ANDROID_DEVELOPMENT_EDITED_NOT_PLAY_RELEASE', '26.19.5'
    ):
        raise ValueError('r23 edited media classification mismatch')
    if record.get('source') != {
        'directory': R23_RAW_DIR.name,
        'captureProvenance': PROVENANCE_NAME,
        'captureProvenanceSha256': sha256(raw_provenance),
        'developmentApkSha256': R23_APK_SHA256,
    }:
        raise ValueError('r23 edited media source provenance mismatch')
    if record.get('transform') != {
        'cropPixels': {'x': 0, 'y': 98, 'width': 1080, 'height': 2116},
        'screenshots': 'Pixel-exact PNG crop of raw RGBA images; no other pixel edits',
        'video': 'ffmpeg -i <raw MP4> -vf crop=1080:2116:0:98 -c:v libx264 -bf 0 -crf 18 -preset medium -pix_fmt yuv420p -an -fps_mode passthrough -enc_time_base demux -video_track_timescale 1000000 -movflags +faststart <edited MP4>',
        'videoReencoded': True,
    }:
        raise ValueError('r23 edited media transform mismatch')
    review = record.get('privacyReview', {})
    if (review.get('status') != 'CODEX_VISUALLY_INSPECTED_DEVICE_UI_CROP'
        or review.get('screensReviewed') != len(SCREENS)
        or review.get('videoFramesReviewed') != 9
        or review.get('deviceStatusAndNavigationBarsRemoved') is not True
        or review.get('privateContentObservedInEditedMedia') is not False
        or review.get('humanReviewed') is not False
        or review.get('publicationReady') is not False):
        raise ValueError('r23 edited media review status mismatch')
    if set(record.get('files', {})) != EXPECTED:
        raise ValueError('r23 edited media file set mismatch')
    if {path.name for path in R23_EDITED_DIR.iterdir()} != EXPECTED | {R23_EDITED_PROVENANCE_NAME}:
        raise ValueError('r23 edited media directory has missing or unexpected entries')
    for name, metadata in record['files'].items():
        path = R23_EDITED_DIR / name
        if not path.is_file() or sha256(path) != metadata['sha256'] or path.stat().st_size != metadata['bytes']:
            raise ValueError(f'r23 edited media hash/size mismatch: {name}')
        if name.endswith('.png'):
            with Image.open(R23_RAW_DIR / name) as original, Image.open(path) as edited:
                if original.mode != 'RGBA' or edited.mode != 'RGBA' or edited.size != (1080, 2116):
                    raise ValueError(f'r23 edited screenshot mode/dimensions mismatch: {name}')
                if original.crop((0, 98, 1080, 2214)).tobytes() != edited.tobytes():
                    raise ValueError(f'r23 edited screenshot differs from the documented crop: {name}')
            if metadata['pixels'] != [1080, 2116] or metadata['mode'] != 'RGBA':
                raise ValueError(f'r23 edited screenshot provenance mismatch: {name}')
        else:
            probe = json.loads(subprocess.check_output([
                'ffprobe', '-v', 'error', '-show_entries',
                'format=duration:stream=codec_type,codec_name,width,height,nb_frames',
                '-of', 'json', str(path),
            ], text=True))
            video = [row for row in probe['streams'] if row.get('codec_type') == 'video']
            if (len(video) != 1 or video[0].get('codec_name') != 'h264'
                or [video[0].get('width'), video[0].get('height')] != [1080, 2116]
                or int(video[0]['nb_frames']) != 9 or round(float(probe['format']['duration']), 2) != 14.61
                or any(row.get('codec_type') == 'audio' for row in probe['streams'])):
                raise ValueError('r23 edited video codec, timing, dimensions or audio mismatch')
            if (metadata['pixels'] != [1080, 2116] or metadata['frameCount'] != 9
                or metadata['durationSeconds'] != 14.61 or metadata['audioTrack'] is not False):
                raise ValueError('r23 edited video provenance mismatch')
    return {**raw_result, 'capture': 'historical-candidate-r23',
            'editedScreens': len(SCREENS), 'editedVideos': 1,
            'editedPrivacyReviewStatus': review['status'], 'publicationReady': False}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--android-repo', type=Path,
                        help='Compare the current source APK with the captured, installed development APK')
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument('--historical', action='store_true',
                        help='Verify the preserved previous capture without comparing it with the current APK')
    selection.add_argument('--previous-r21', action='store_true',
                           help='Verify the preserved r21 capture without comparing it with the current APK')
    selection.add_argument('--previous-r22', action='store_true',
                           help='Verify the preserved r22 capture without comparing it with the current APK')
    selection.add_argument('--previous-r20', action='store_true',
                           help='Verify the preserved r20 capture without comparing it with the current APK')
    selection.add_argument('--candidate-r23', action='store_true',
                           help='Verify preserved r23 raw and edited media, not the current site or APK')
    selection.add_argument('--candidate-r24', action='store_true',
                           help='Verify preserved r24 raw capture without treating it as published site media')
    selection.add_argument('--candidate-r25', action='store_true',
                           help='Verify preserved r25 raw capture without treating it as published site media')
    selection.add_argument('--candidate-r26', action='store_true',
                           help='Verify preserved r26 raw capture without treating it as published site media')
    selection.add_argument('--candidate-r27', action='store_true',
                           help='Verify preserved r27 raw capture without treating it as published site media')
    selection.add_argument('--candidate-r28', action='store_true',
                           help='Verify preserved r28 raw capture without treating it as published site media')
    selection.add_argument('--candidate-r30', action='store_true',
                           help='Verify preserved r30 raw capture without treating it as published site media')
    selection.add_argument('--candidate-r31', action='store_true',
                           help='Verify preserved r31 raw capture without treating it as the current site or APK')
    args = parser.parse_args()
    if (args.historical or args.previous_r22 or args.previous_r21 or args.previous_r20
        or args.candidate_r23 or args.candidate_r24 or args.candidate_r25
        or args.candidate_r26 or args.candidate_r27 or args.candidate_r28 or args.candidate_r30
        or args.candidate_r31) and args.android_repo is not None:
        parser.error('--android-repo compares only the current capture')
    if args.candidate_r31:
        result = verify_media(R31_RAW_DIR, R31_APK_SHA256, False, None)
        result['capture'] = 'candidate-r31-raw'
    elif args.candidate_r30:
        result = verify_media(R30_RAW_DIR, R30_APK_SHA256, False, None)
        result['capture'] = 'candidate-r30-raw'
    elif args.candidate_r28:
        result = verify_media(R28_RAW_DIR, R28_APK_SHA256, False, None)
        result['capture'] = 'candidate-r28-raw'
    elif args.candidate_r27:
        result = verify_media(R27_RAW_DIR, R27_APK_SHA256, False, None)
        result['capture'] = 'candidate-r27-raw'
    elif args.candidate_r26:
        result = verify_media(R26_RAW_DIR, R26_APK_SHA256, False, None)
        result['capture'] = 'candidate-r26-raw'
    elif args.candidate_r25:
        result = verify_media(R25_RAW_DIR, R25_APK_SHA256, False, None)
        result['capture'] = 'candidate-r25-raw'
    elif args.candidate_r24:
        result = verify_media(R24_RAW_DIR, R24_APK_SHA256, False, None)
        result['capture'] = 'candidate-r24-raw'
    elif args.candidate_r23:
        result = verify_r23_candidate()
    elif args.historical:
        result = verify_media(MEDIA, HISTORICAL_APK_SHA256, False, None)
        result['capture'] = 'historical'
    elif args.previous_r22:
        result = verify_media(PREVIOUS_R22_DIR, PREVIOUS_R22_APK_SHA256, False, None)
        result['capture'] = 'previous-r22'
    elif args.previous_r21:
        result = verify_media(PREVIOUS_R21_DIR, PREVIOUS_R21_APK_SHA256, False, None)
        result['capture'] = 'previous-r21'
    elif args.previous_r20:
        result = verify_media(PREVIOUS_DIR, PREVIOUS_APK_SHA256, False, None)
        result['capture'] = 'previous-r20'
    else:
        result = verify_media(CURRENT_DIR, CURRENT_APK_SHA256, True, args.android_repo)
        result['capture'] = 'current-r32-raw'
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
