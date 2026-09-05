from __future__ import annotations

from pathlib import Path
import json
import subprocess
import tempfile
import unittest
import zipfile
from unittest.mock import MagicMock, patch

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
    def test_capture_commit_may_be_an_ancestor_of_current_android_head(self) -> None:
        android_repo = Path("android")
        with patch.object(finalize.subprocess, "run") as run:
            run.return_value.returncode = 0
            self.assertTrue(
                finalize.capture_commit_reaches_head(
                    android_repo, "1" * 40, "2" * 40
                )
            )
            run.assert_called_once_with(
                ["git", "merge-base", "--is-ancestor", "1" * 40, "2" * 40],
                cwd=android_repo,
                check=False,
                capture_output=True,
                text=True,
                encoding="utf-8",
            )

    def test_unrelated_capture_commit_is_rejected(self) -> None:
        with patch.object(finalize.subprocess, "run") as run:
            run.return_value.returncode = 1
            self.assertFalse(
                finalize.capture_commit_reaches_head(
                    Path("android"), "1" * 40, "2" * 40
                )
            )

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
        evidence["source"]["apkSha256"] = "b" * 64
        with self.assertRaisesRegex(RuntimeError, "different APK"):
            finalize.merge_android_play_evidence(existing, evidence, captures)

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
    def test_local_and_unresolved_candidates_cannot_be_published_or_synced(self) -> None:
        for evidence in (
            {"classification": "LOCAL_CANDIDATE_NOT_PUBLISHED"},
            {"releaseStatus": "BLOCKED_FOR_PUBLIC_RELEASE"},
            {"unresolvedAssetCount": 1},
            {"releaseReadiness": {"unresolvedAssetCount": 1}},
        ):
            with self.subTest(evidence=evidence), self.assertRaisesRegex(RuntimeError, "cannot become public"):
                finalize.sync_android_play_screenshots(evidence, Path("missing-android"))

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


class LocalStagingTests(unittest.TestCase):
    def test_preflight_only_cannot_contact_device_or_create_staging(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            stage = Path(temporary) / "new-stage"
            argv = [
                "capture_public_marketing.py", "--expected-serial", "test-serial",
                "--android-repo", str(capture.CANONICAL_ANDROID_ROOT),
                "--expected-head", "a" * 40, "--apk", str(Path(temporary) / "test.apk"),
                "--expected-apk-sha256", "b" * 64, "--staging-dir", str(stage), "--preflight-only",
            ]
            with patch.object(capture.sys, "argv", argv), patch.object(capture, "verify_android_repo", return_value={}), patch.object(capture, "verify_apk_www", return_value={}), patch.object(capture, "locate_adb") as locate, patch("builtins.print"):
                self.assertEqual(capture.main(), 0)
            locate.assert_not_called()
            self.assertFalse(stage.exists())

    def test_staging_rejects_both_repositories_and_existing_paths(self) -> None:
        for destination in (
            capture.PUBLIC_ROOT / "assets/new",
            capture.CANONICAL_ANDROID_ROOT / "play-store/new",
            capture.PUBLIC_ROOT.parent,
        ):
            with self.subTest(destination=destination), self.assertRaisesRegex(RuntimeError, "outside"):
                capture.verify_staging_directory(destination, capture.CANONICAL_ANDROID_ROOT)
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaisesRegex(RuntimeError, "non-existing"):
                capture.verify_staging_directory(root, capture.CANONICAL_ANDROID_ROOT)
            self.assertEqual(
                capture.verify_staging_directory(root / "fresh", capture.CANONICAL_ANDROID_ROOT),
                (root / "fresh").resolve(),
            )

    def test_staging_rejects_another_git_checkout(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / ".git").mkdir()
            with self.assertRaisesRegex(RuntimeError, "inside a Git"):
                capture.verify_staging_directory(root / "fresh", capture.CANONICAL_ANDROID_ROOT)


class CurrentSourceTests(unittest.TestCase):
    def test_wrong_checkout_and_short_commit_fail_before_git_or_device(self) -> None:
        with patch.object(capture, "run") as command:
            with self.assertRaisesRegex(RuntimeError, "canonical recovered"):
                capture.verify_android_repo(Path("wrong-checkout"), "a" * 40)
            with self.assertRaisesRegex(RuntimeError, "full expected"):
                capture.verify_android_repo(capture.CANONICAL_ANDROID_ROOT, "abc123")
            command.assert_not_called()

    def test_staged_android_changes_are_included_in_clean_gate(self) -> None:
        def result(command, **kwargs):
            if command == ["git", "branch", "--show-current"]:
                output = "codex\n"
            elif command == ["git", "rev-parse", "HEAD"]:
                output = "a" * 40 + "\n"
            elif command == ["git", "diff", "HEAD", "--name-only"]:
                output = "app/src/main/assets/www/app.js\n"
            else:
                output = ""
            return subprocess.CompletedProcess(command, 0, output, "")
        with patch.object(capture, "run", side_effect=result):
            with self.assertRaisesRegex(RuntimeError, "tracked-state"):
                capture.verify_android_repo(capture.CANONICAL_ANDROID_ROOT, "a" * 40)

    def make_apk_fixture(self, root: Path) -> Path:
        www = root / "app/src/main/assets/www"
        (www / "images").mkdir(parents=True)
        (www / "data").mkdir()
        (www / "app.js").write_bytes(b"current runtime")
        (www / "images/test.png").write_bytes(b"fixture image bytes")
        (www / "data/offline-assets.json").write_text(json.dumps({
            "count": 1, "totalBytes": len(b"fixture image bytes"), "assets": ["images/test.png"],
        }), encoding="utf-8")
        apk = root / "fixture.apk"
        with zipfile.ZipFile(apk, "w") as archive:
            for path in www.rglob("*"):
                if path.is_file():
                    archive.write(path, "assets/www/" + path.relative_to(www).as_posix())
        return apk

    def test_every_www_file_is_checked_and_stale_non_legacy_runtime_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            apk = self.make_apk_fixture(root)
            expected = capture.sha256_file(apk)
            verified = capture.verify_apk_www(root, apk, expected)
            self.assertEqual(verified["wwwFileCount"], 3)
            self.assertTrue(verified["offlineManifestVerified"])
            (root / "app/src/main/assets/www/app.js").write_bytes(b"new runtime")
            with self.assertRaisesRegex(RuntimeError, "bytes differ"):
                capture.verify_apk_www(root, apk, expected)

    def test_apk_hash_and_extra_bundle_entries_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            apk = self.make_apk_fixture(root)
            with self.assertRaisesRegex(RuntimeError, "expected SHA-256"):
                capture.verify_apk_www(root, apk, "0" * 64)
            with zipfile.ZipFile(apk, "a") as archive:
                archive.writestr("assets/www/unexpected.js", b"not source")
            with self.assertRaisesRegex(RuntimeError, "path set"):
                capture.verify_apk_www(root, apk, capture.sha256_file(apk))

    def test_manifest_path_cannot_escape_android_tree(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "escapes"):
            capture.contained_path(Path("android"), "../private/key")


class CaptureRestorationTests(unittest.TestCase):
    SETTINGS = {"accelerometerRotation": "1", "userRotation": "0", "headsUpNotifications": "null"}

    def device(self):
        device = MagicMock()
        device.forward_created = True
        device.adb.return_value = subprocess.CompletedProcess([], 0, "", "")
        device.installed_package_hashes.return_value = {"base.apk": "a" * 64}
        device.restore_setting.side_effect = lambda namespace, key, original: original
        return device

    def test_storage_failure_cannot_skip_any_settings_hash_or_forward_cleanup(self) -> None:
        device = self.device()
        private_snapshot = {"session": "must-never-be-persisted"}
        with patch.object(capture, "restore_local_storage", side_effect=RuntimeError("private error")):
            result = capture.restore_capture_state(
                device, Path("tools"), "ws://old", private_snapshot, self.SETTINGS, {"base.apk": "a" * 64},
            )
        self.assertFalse(result["verified"])
        self.assertEqual(device.restore_setting.call_count, 3)
        device.installed_package_hashes.assert_called_once_with(capture.REJECTED_PRODUCTION_PACKAGE)
        device.adb.assert_any_call("forward", "--remove", f"tcp:{capture.DEVTOOLS_PORT}")
        self.assertNotIn("must-never-be-persisted", json.dumps(result))
        self.assertNotIn("private error", json.dumps(result))

    def test_first_setting_failure_does_not_skip_remaining_restoration(self) -> None:
        device = self.device()
        device.restore_setting.side_effect = [RuntimeError("denied"), "0", "null"]
        result = capture.restore_capture_state(
            device, Path("tools"), None, None, self.SETTINGS, {"base.apk": "a" * 64},
        )
        self.assertFalse(result["verified"])
        self.assertEqual(device.restore_setting.call_count, 3)
        self.assertTrue(result["productionPackage"]["verified"])
        self.assertTrue(result["devtoolsForwardRemoved"])

    def test_changed_production_apk_fails_even_when_other_restoration_succeeds(self) -> None:
        device = self.device()
        device.installed_package_hashes.return_value = {"base.apk": "b" * 64}
        result = capture.restore_capture_state(
            device, Path("tools"), None, None, self.SETTINGS, {"base.apk": "a" * 64},
        )
        self.assertFalse(result["verified"])
        self.assertFalse(result["productionPackage"]["verified"])
        self.assertTrue(result["devtoolsForwardRemoved"])

    def test_stale_webview_reconnects_before_restoring_original_storage(self) -> None:
        device = self.device()
        device.wait_for_webview.return_value = "ws://new"
        with patch.object(capture, "restore_local_storage", side_effect=[RuntimeError(), {"verified": True}]) as restore:
            result = capture.restore_capture_state(
                device, Path("tools"), "ws://old", {"saved": "original"}, self.SETTINGS, {"base.apk": "a" * 64},
            )
        self.assertTrue(result["verified"])
        self.assertTrue(result["storage"]["reconnectedForRestoration"])
        self.assertEqual(restore.call_args.args[1], "ws://new")

    def test_restore_handles_proto_key_and_removes_only_capture_added_keys(self) -> None:
        original = {"saved": "original", "__proto__": "also-original", "quoted": "line\nquote\""}
        expressions = []
        with patch.object(capture, "evaluate_private", side_effect=lambda *args: expressions.append(args[2]) or True), patch.object(capture, "local_storage_snapshot", return_value=original):
            result = capture.restore_local_storage(Path("tools"), "ws://fixture", original)
        script = """
        const booted = true;
        const localStorage = Object.assign(Object.create(null), { saved: 'changed', extra: 'capture' });
        Object.defineProperties(localStorage, {
          removeItem: {value(key) {delete this[key]}},
          setItem: {value(key, value) {this[key] = value}},
        });
        """ + "Promise.resolve(" + expressions[0] + ").then(() => process.stdout.write(JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage[k]])))));"
        completed = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(json.loads(completed.stdout), original)
        self.assertTrue(result["verified"])
        self.assertNotIn("localStorage.clear", expressions[0])

    def test_package_hash_reader_is_qa_or_production_read_only_and_validates_paths(self) -> None:
        device = capture.SafeDevice(Path("adb"), "expected-serial")
        with patch.object(device, "adb") as adb:
            with self.assertRaisesRegex(RuntimeError, "two-package"):
                device.installed_package_hashes("another.package")
            adb.assert_not_called()
            adb.return_value = subprocess.CompletedProcess([], 0, "package:/sdcard/unsafe.apk\n", "")
            with self.assertRaisesRegex(RuntimeError, "allowlist"):
                device.installed_package_hashes(capture.EXPECTED_PACKAGE)

    def test_restore_over_one_megabyte_uses_real_stdin_and_no_private_argv(self) -> None:
        original = {"session": "PRIVATE_SESSION_TEST_" + "x" * (1024 * 1024 + 123)}
        with tempfile.TemporaryDirectory() as temporary:
            tools = Path(temporary)
            (tools / "webview_eval.mjs").write_text("""
            import { readFileSync } from 'node:fs';
            const booted = true;
            if (process.argv[3] !== '-') throw new Error('stdin transport required');
            const localStorage = Object.assign(Object.create(null), {session: 'changed', extra: 'fixture'});
            Object.defineProperties(localStorage, {
              removeItem: {value(key) {delete this[key]}},
              setItem: {value(key, value) {this[key] = value}},
            });
            const result = await eval(readFileSync(0, 'utf8'));
            if (!localStorage.session.startsWith('PRIVATE_SESSION_TEST_') ||
                localStorage.session.length !== 1024 * 1024 + 123 + 'PRIVATE_SESSION_TEST_'.length ||
                Object.hasOwn(localStorage, 'extra'))
              throw new Error('restoration contents differ');
            process.stdout.write(JSON.stringify(result));
            """, encoding="utf-8")
            with patch.object(capture.subprocess, "run", wraps=subprocess.run) as run, patch.object(capture, "local_storage_snapshot", return_value=original):
                result = capture.restore_local_storage(tools, "ws://unit-test", original)
            self.assertTrue(result["verified"])
            self.assertEqual(run.call_args.args[0], ["node", str(tools / "webview_eval.mjs"), "ws://unit-test", "-"])
            self.assertGreater(len(run.call_args.kwargs["input"]), 1024 * 1024)
            self.assertNotIn("PRIVATE_SESSION_TEST_", " ".join(run.call_args.args[0]))

    def test_private_transport_suppresses_command_output_and_timeout_values(self) -> None:
        private = "PRIVATE_FAKE_STORAGE_VALUE"
        for result in (
            subprocess.CompletedProcess([], 1, private, private),
            subprocess.TimeoutExpired(["node", private], 70, output=private, stderr=private),
            subprocess.CompletedProcess([], 0, private, ""),
        ):
            with self.subTest(result=type(result).__name__):
                replacement = {"side_effect": result} if isinstance(result, Exception) else {"return_value": result}
                with patch.object(capture.subprocess, "run", **replacement) as run:
                    with self.assertRaisesRegex(RuntimeError, "values withheld") as caught:
                        capture.evaluate_private(Path("tools"), "ws://unit-test", private)
                self.assertNotIn(private, str(caught.exception))
                self.assertTrue(caught.exception.__suppress_context__)
                self.assertEqual(run.call_args.kwargs["input"], private)
                self.assertNotIn(private, run.call_args.args[0])

    def test_missing_existing_qa_target_never_launches_or_installs(self) -> None:
        device = self.device()
        device.adb.return_value = subprocess.CompletedProcess([], 1, "", "")
        with self.assertRaisesRegex(RuntimeError, "already-running"):
            capture.snapshot_existing_qa_storage(device, Path("tools"))
        device.adb.assert_called_once_with("shell", "pidof", capture.EXPECTED_PACKAGE, check=False)
        device.wait_for_webview.assert_not_called()

    def test_existing_target_snapshot_is_taken_once_without_lifecycle_commands(self) -> None:
        device = self.device()
        device.adb.return_value = subprocess.CompletedProcess([], 0, "1234\n", "")
        device.wait_for_webview.return_value = "ws://existing"
        values = {"saved": "before-launch"}
        with patch.object(capture, "local_storage_snapshot", return_value=values) as snapshot:
            websocket, original = capture.snapshot_existing_qa_storage(device, Path("tools"))
            fingerprint = capture.storage_fingerprint(original)
        self.assertEqual(websocket, "ws://existing")
        self.assertEqual(original, values)
        self.assertEqual(fingerprint["entries"], 1)
        snapshot.assert_called_once_with(Path("tools"), "ws://existing")
        device.adb.assert_called_once_with("shell", "pidof", capture.EXPECTED_PACKAGE, check=False)

    def test_snapshot_rejects_unbooted_app_or_active_fullqa_overlay(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            tools = Path(temporary)
            helper = tools / "webview_eval.mjs"
            for booted, overlay in ((False, False), (True, True)):
                helper.write_text(
                    "import {readFileSync} from 'node:fs';"
                    + f"const booted = {str(booted).lower()}; const window = {{__qaMemoryStorageActive: {str(overlay).lower()}}};"
                    + "const localStorage = {}; process.stdout.write(JSON.stringify(eval(readFileSync(0, 'utf8'))));",
                    encoding="utf-8",
                )
                with self.subTest(booted=booted, overlay=overlay), self.assertRaisesRegex(RuntimeError, "values withheld"):
                    capture.local_storage_snapshot(tools, "ws://unit-test")


class ExactSonaRuntimeTests(unittest.TestCase):
    def state(self):
        return {
            "view": "home", "hash": "#home", "href": capture.APP_URL_PREFIX + "#home",
            "serviceWorkerControlled": False, "broken": [], "placeholders": [],
            "memoryFixtureActive": True, "marketingFixturePrepared": True,
            "authenticatedSessionPresent": False, "communityOnline": False, "communityRows": [],
            "modalOpen": False, "scrollX": 0, "scrollY": 0,
            "homeFeature": {
                "url": "https://appassets.androidplatform.net/assets/www/images/historical_gallery/sona-user-reference.png",
                "sha256": capture.SONA_SHA256, "width": 307, "height": 557,
            },
        }

    def test_home_background_checks_exact_bytes_and_js_expression_compiles(self) -> None:
        state = self.state()
        with patch.object(capture, "evaluate", return_value=state) as evaluate:
            self.assertEqual(capture.route_and_audit(Path("tools"), "ws://test", "HOME", "home", "go('home');"), state)
        subprocess.run(
            ["node", "--check", "-"], input=evaluate.call_args.args[2],
            text=True, encoding="utf-8", capture_output=True, check=True,
        )
        state["homeFeature"]["sha256"] = "0" * 64
        with patch.object(capture, "evaluate", return_value=state), self.assertRaisesRegex(RuntimeError, "exact user-selected"):
            capture.route_and_audit(Path("tools"), "ws://test", "HOME", "home", "go('home');")

    def test_service_worker_controlled_capture_is_rejected(self) -> None:
        state = self.state()
        state["serviceWorkerControlled"] = True
        with patch.object(capture, "evaluate", return_value=state), self.assertRaisesRegex(RuntimeError, "un-cached"):
            capture.route_and_audit(Path("tools"), "ws://test", "HOME", "home", "go('home');")


class MarketingIsolationTests(unittest.TestCase):
    def test_missing_memory_marker_cannot_capture_any_pixels(self) -> None:
        device = MagicMock()
        with patch.object(capture, "evaluate", return_value=False):
            with self.assertRaisesRegex(RuntimeError, "fixture is missing"):
                capture.capture_isolated_png(device, Path("tools"), "ws://test", Path("forbidden.png"), 1)
        device.capture_png.assert_not_called()
        device.wait_for_exact_foreground.assert_not_called()

    def test_missing_route_marker_is_rejected_before_capture(self) -> None:
        state = ExactSonaRuntimeTests().state()
        state["memoryFixtureActive"] = False
        with patch.object(capture, "evaluate", return_value=state), self.assertRaisesRegex(RuntimeError, "lost the isolated"):
            capture.route_and_audit(Path("tools"), "ws://test", "HOME", "home", "go('home');")

    def test_default_seed_and_official_notice_are_the_only_community_rows(self) -> None:
        for online, rows in ((False, capture.DEFAULT_COMMUNITY_ROWS), (True, capture.OFFICIAL_ONLINE_COMMUNITY_ROWS)):
            state = {"communityOnline": online, "communityRows": rows, "authenticatedSessionPresent": False}
            capture.validate_community_rows(state)
            state["communityRows"] = (*rows, ("private-local-id", "ordinary personal story", "plain nickname"))
            with self.assertRaisesRegex(RuntimeError, "unexpected rows"):
                capture.validate_community_rows(state)
            state["communityRows"] = rows
            state["authenticatedSessionPresent"] = True
            with self.assertRaisesRegex(RuntimeError, "authenticated session"):
                capture.validate_community_rows(state)

    def test_prepare_uses_default_seed_and_guard_precedes_any_mutation(self) -> None:
        expected = {
            "memoryFixtureActive": True, "fixturePrepared": True, "nicknameIsDefault": True,
            "seededPostIds": ["1", "2", "3", "4", "5"], "localOwnerCount": 0,
            "commentCount": 0, "authenticatedSessionPresent": False,
        }
        with patch.object(capture, "evaluate", return_value=expected) as evaluate:
            capture.prepare_memory_capture_state(Path("tools"), "ws://test")
        expression = evaluate.call_args.args[2]
        script = (
            "const window = {__qaMemoryStorageActive:false}; let mutations = 0;"
            "const store = {set() {mutations++}, get() {return null}};"
            + "Promise.resolve(" + expression + ").then(() => {process.exitCode=1}, error => {"
            "if (mutations || error.message !== 'fresh memory fixture required') process.exitCode=1;"
            "});"
        )
        subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True)
        self.assertIn("JSON.parse(JSON.stringify(SEED_POSTS))", expression)
        self.assertIn("store.set('res3nick', '소환사')", expression)
        expected["commentCount"] = 1
        with patch.object(capture, "evaluate", return_value=expected), self.assertRaisesRegex(RuntimeError, "deterministic"):
            capture.prepare_memory_capture_state(Path("tools"), "ws://test")

    def test_session_release_failure_still_restarts_native_and_restores_values(self) -> None:
        device = CaptureRestorationTests().device()
        device.wait_for_webview.return_value = "ws://native"
        events = []
        def command(*args, **kwargs):
            events.append(args)
            return subprocess.CompletedProcess([], 0, "", "")
        device.adb.side_effect = command
        def release(process):
            events.append(("release",))
            raise RuntimeError("lost helper")
        def restore(*args):
            events.append(("restore", args[1]))
            return {"verified": True}
        with patch.object(capture, "finish_memory_storage_session", side_effect=release) as finish, patch.object(capture, "restore_local_storage", side_effect=restore):
            result = capture.restore_capture_state(
                device, Path("tools"), "ws://fixture", {"saved": "original"},
                CaptureRestorationTests.SETTINGS, {"base.apk": "a" * 64},
                memory_session=MagicMock(), memory_session_attempted=True,
            )
        finish.assert_called_once()
        self.assertFalse(result["verified"])
        self.assertTrue(result["storage"]["verified"])
        self.assertEqual(events[:4], [
            ("release",), ("shell", "am", "force-stop", capture.EXPECTED_PACKAGE),
            ("shell", "am", "start", "-W", "-n", capture.ACTIVITY), ("restore", "ws://native"),
        ])
        self.assertEqual(device.restore_setting.call_count, 3)
        self.assertTrue(result["devtoolsForwardRemoved"])

    def test_pre_ready_session_failure_also_requires_native_restart(self) -> None:
        device = CaptureRestorationTests().device()
        with patch.object(capture, "restore_local_storage", return_value={"verified": True}):
            result = capture.restore_capture_state(
                device, Path("tools"), "ws://old", {"saved": "original"},
                CaptureRestorationTests.SETTINGS, {"base.apk": "a" * 64}, memory_session_attempted=True,
            )
        self.assertTrue(result["nativeQaRestartedAfterFixture"])
        self.assertEqual(device.adb.call_args_list[0].args, ("shell", "am", "force-stop", capture.EXPECTED_PACKAGE))

    def test_shared_native_digest_matches_unicode_javascript_ordering(self) -> None:
        values = {"saved": "unchanged", "\ue000": "bmp", "\U00010000": "astral", "lone": "\ud800"}
        script = (
            "const values=JSON.parse(" + json.dumps(json.dumps(values)) + ");"
            "const keys=Object.keys(values).sort(); const data=JSON.stringify(keys.map(k=>[k,values[k]]));"
            "crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)).then(hash=>"
            "process.stdout.write(JSON.stringify({keyCount:keys.length,sha256:Buffer.from(hash).toString('hex')})));"
        )
        output = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True).stdout
        self.assertEqual(capture.native_storage_fingerprint(values), json.loads(output))


if __name__ == "__main__":
    unittest.main()
