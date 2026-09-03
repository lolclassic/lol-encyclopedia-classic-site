from __future__ import annotations

from pathlib import Path
import unittest

import capture_public_marketing as capture
import finalize_media_provenance as finalize
import generate_asset_provenance as asset_provenance


class ApkIdentityTests(unittest.TestCase):
    def test_expected_qa_identity_is_parsed(self) -> None:
        identity = capture.parse_apk_identity(
            "package: name='com.lolclassic.encyclopedia.qa' versionCode='1'\n"
            "launchable-activity: name='com.lolclassic.encyclopedia.MainActivity'\n"
        )
        self.assertEqual(identity["package"], capture.EXPECTED_PACKAGE)
        self.assertEqual(identity["activity"], capture.EXPECTED_ACTIVITY_CLASS)

    def test_missing_launchable_activity_fails_closed(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "launchable activity"):
            capture.parse_apk_identity(
                "package: name='com.lolclassic.encyclopedia.qa' versionCode='1'\n"
            )


class SafetyConstantTests(unittest.TestCase):
    def test_production_package_is_never_the_capture_target(self) -> None:
        self.assertNotEqual(capture.EXPECTED_PACKAGE, capture.REJECTED_PRODUCTION_PACKAGE)
        self.assertEqual(
            capture.ACTIVITY,
            "com.lolclassic.encyclopedia.qa/com.lolclassic.encyclopedia.MainActivity",
        )

    def test_runtime_fingerprint_is_exact_and_excludes_post_capture_evidence(self) -> None:
        expected = (
            "app/src/main/assets/www/data/offline-assets.json",
            "app/src/main/assets/www/index.html",
            "app/src/main/assets/www/nostalgia-218-fidelity.js",
            "app/src/main/assets/www/portrait-fix.js",
            "app/src/main/assets/www/sw.js",
        )
        self.assertEqual(capture.CAPTURE_RUNTIME_SOURCE_PATHS, expected)
        self.assertEqual(finalize.CAPTURE_RUNTIME_SOURCE_PATHS, expected)
        self.assertEqual(capture.EXPECTED_ANDROID_TRACKED_DIFF_PATHS, frozenset())
        self.assertFalse(any(path.startswith("play-store/") for path in expected))
        self.assertNotIn(
            "app/src/main/assets/www/nostalgia-218-fidelity.js",
            capture.EXPECTED_ANDROID_UNTRACKED_PATHS,
        )
        self.assertEqual(len(capture.EXPECTED_ANDROID_UNTRACKED_PATHS), 88)
        self.assertEqual(len(capture.EXPECTED_ANDROID_PROTECTED_UNTRACKED_SHA256), 4)

    def test_android_evidence_merge_preserves_same_apk_runtime_and_safety(self) -> None:
        existing = {
            "schemaVersion": 2,
            "source": {
                "repository": "LolClassicBeta_codex_recovered",
                "evidencePath": "play-store/screenshot-evidence.json",
                "capturedAt": "old-time",
                "androidCommit": "1" * 40,
                "androidTrackedState": "authorized-home-interface-wip",
                "package": capture.EXPECTED_PACKAGE,
                "apkSha256": "a" * 64,
            },
            "deviceSafety": {
                "productionHashesBefore": {"base.apk": "safe"},
                "productionHashesAfter": {"base.apk": "safe"},
            },
            "videoAudit": {"runtime": {"contained": True}, "physicalProof": {}},
            "screenshots": [
                {"file": name, "runtime": {"route": f"old-{index}"}}
                for index, name in enumerate(finalize.EXPECTED_SCREENSHOTS)
            ],
            "summary": {},
        }
        evidence = {
            "capturedAt": "new-time",
            "source": {
                "android": {
                    "commit": "2" * 40,
                    "trackedState": "authorized-version-218-fidelity-final-commit",
                },
                "applicationId": capture.EXPECTED_PACKAGE,
                "apkSha256": "a" * 64,
            },
            "deviceGate": {
                "physicalDevice": True,
                "kernelQemu": "0",
                "exactlyOneAuthorizedTarget": True,
                "productionPackageRejected": True,
            },
            "settingsRestoration": {"verified": True},
        }
        captures = [
            {
                "file": name,
                "purpose": f"PURPOSE-{index}",
                "route": f"route-{index}",
                "png": {
                    "width": 1080,
                    "height": 2340,
                    "mode": "RGB",
                    "bytes": index + 1,
                    "sha256": f"{index:064x}",
                },
            }
            for index, name in enumerate(finalize.EXPECTED_SCREENSHOTS)
        ]

        merged = finalize.merge_android_play_evidence(existing, evidence, captures)

        self.assertEqual(merged["source"]["repository"], "LolClassicBeta_codex_recovered")
        self.assertEqual(
            merged["source"]["evidencePath"], "play-store/screenshot-evidence.json"
        )
        self.assertEqual(merged["source"]["androidCommit"], "2" * 40)
        self.assertEqual(
            merged["source"]["androidTrackedState"],
            "authorized-version-218-fidelity-final-commit",
        )
        self.assertEqual(
            merged["deviceSafety"]["productionHashesBefore"], {"base.apk": "safe"}
        )
        self.assertEqual(
            merged["deviceSafety"]["productionHashesAfter"], {"base.apk": "safe"}
        )
        self.assertEqual(merged["videoAudit"], existing["videoAudit"])
        self.assertEqual(merged["screenshots"][0]["runtime"], {"route": "old-0"})
        self.assertEqual(merged["screenshots"][0]["route"], "route-0")
        self.assertEqual(merged["screenshots"][0]["bytes"], 1)

    def test_tour_concat_resets_every_segment_timestamp(self) -> None:
        command = capture.build_tour_concat_command(
            [Path("one.mp4"), Path("two.mp4")], Path("tour.mp4")
        )
        filter_complex = command[command.index("-filter_complex") + 1]
        self.assertEqual(command.count("-i"), 2)
        self.assertIn("[0:v:0]settb=AVTB,setpts=PTS-STARTPTS", filter_complex)
        self.assertIn("[1:v:0]settb=AVTB,setpts=PTS-STARTPTS", filter_complex)
        self.assertIn("[v0][v1]concat=n=2:v=1:a=0[outv]", filter_complex)

    def test_tour_segment_holds_each_device_screenshot_for_three_seconds(self) -> None:
        command = capture.build_tour_segment_command(
            Path("phone.png"), Path("segment.mp4")
        )
        self.assertEqual(command[command.index("-loop") + 1], "1")
        self.assertEqual(command[command.index("-framerate") + 1], "30")
        self.assertEqual(command[command.index("-frames:v") + 1], "90")
        self.assertEqual(len(capture.TOUR), 10)


class AssetProvenanceTests(unittest.TestCase):
    def test_historical_launcher_derivative_remains_an_explicit_exception(self) -> None:
        release_record = asset_provenance.to_release_record(
            {
                "localPath": "assets/app-icon.png",
                "mediaType": "image/png",
                "sourceType": "USER_SUPPLIED_HISTORICAL_LAUNCHER_DERIVATIVE",
                "outputSha256": "0" * 64,
                "captureMethod": "mechanical derivative",
                "containsRiotOfficialAssetInsideAppUI": False,
            }
        )
        self.assertEqual(release_record["category"], "historical_launcher_exception")
        self.assertTrue(release_record["thirdParty"])
        self.assertTrue(release_record["embeddedRiotOrThirdPartyContent"])


if __name__ == "__main__":
    unittest.main()
