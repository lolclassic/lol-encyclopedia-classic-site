from __future__ import annotations

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
        modified_runtime_sources = set(expected) - {
            "app/src/main/assets/www/nostalgia-218-fidelity.js"
        }
        self.assertTrue(
            modified_runtime_sources.issubset(capture.EXPECTED_ANDROID_WIP_PATHS)
        )
        self.assertFalse(any(path.startswith("play-store/") for path in expected))
        self.assertIn(
            "app/src/main/assets/www/nostalgia-218-fidelity.js",
            capture.EXPECTED_ANDROID_VERSION218_UNTRACKED_PATHS,
        )


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
