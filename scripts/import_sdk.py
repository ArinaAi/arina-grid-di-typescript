#!/usr/bin/env python3
"""Import a generated SDK zip into this repo.

    python scripts/import_sdk.py path/to/<sdk>.zip

Generated paths are replaced; ours are untouched; preserved files (package.json, README.md,
LICENSE, SECURITY.md) are created once, then only diffed. The version in package.json is
written back into the generated src/version.ts; environment variable names are rewritten to the
ARINA_GRID_* family (the generator derives them from the API title and the security scheme and
offers no setting for them); and the empty default base URL the generator emits when no
environment is configured is replaced by an error (a client must never fall back to a host we do
not own). See CONTRIBUTING.md.
"""

from __future__ import annotations

import difflib
import json
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "src"

# Zip-owned paths, replaced wholesale (minus OURS_INSIDE_GENERATED).
GENERATED = [
    "src",
    "api.md",
    "SKILL.md",
    ".claude",
    "scalar-sdk.manifest.json",
    "tests/smoke-test.ts",
    "biome.json",
    "tsconfig.json",
    "tsconfig.cjs.json",
    "scripts/finalize-build.mjs",
    "scripts/publish-npm.mjs",
    ".gitignore",
]

# Hand-written code living under a generated directory.
OURS_INSIDE_GENERATED = [
    "src/lib",
]

# Created on first import, then owned here; diffed on later imports.
PRESERVED = [
    "package.json",
    "README.md",
    "LICENSE",
    "SECURITY.md",
]

# Keeps the trailing `// x-release-please-version` marker: release-please bumps the line by it.
VERSION_TS_RE = re.compile(r"^(export const VERSION = ')([^']+)(')", re.MULTILINE)
# Generated env var name -> ours. Keys are what the generator emits today; a key that is absent
# is treated as already renamed, so this step retires itself if the generator adopts the names.
ENV_RENAMES = {
    "API_KEY": "ARINA_GRID_API_KEY",
    "ARINA_BASE_URL": "ARINA_GRID_BASE_URL",
    "ARINA_LOG": "ARINA_GRID_LOG",
    "ARINA_CUSTOM_HEADERS": "ARINA_GRID_CUSTOM_HEADERS",
}
ENV_RENAME_FILES = ["src/**/*.ts", "api.md", "SKILL.md", ".claude/**/*.md", "tests/smoke-test.ts"]

PLACEHOLDER_BASE_URL = re.compile(
    r"(?P<indent>[ \t]+)const defaultBaseURL = '';\n"
)


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def extract(zip_path: Path, into: Path) -> Path:
    """Unzip and return the directory that holds package.json."""
    with zipfile.ZipFile(zip_path) as archive:
        archive.extractall(into)
    candidates = [p.parent for p in into.rglob("package.json") if "node_modules" not in p.parts]
    if len(candidates) != 1:
        fail(f"expected exactly one package.json in the zip, found {len(candidates)}")
    root = candidates[0]
    if not (root / "src" / "client.ts").exists():
        fail("zip does not contain src/client.ts")
    return root


def replace_generated(source: Path) -> list[str]:
    """Copy generated paths from ``source`` into the repo. Returns what was replaced."""
    replaced: list[str] = []
    keep = [REPO / p for p in OURS_INSIDE_GENERATED]

    for rel in GENERATED:
        src, dst = source / rel, REPO / rel
        if not src.exists():
            print(f"note: zip has no {rel}; leaving ours in place")
            continue
        if src.is_dir():
            if dst.exists():
                for child in dst.iterdir():
                    if any(child == k or k.is_relative_to(child) for k in keep):
                        _remove_generated_within(child, keep)
                    else:
                        shutil.rmtree(child) if child.is_dir() else child.unlink()
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        replaced.append(rel)
    return replaced


def _remove_generated_within(directory: Path, keep: list[Path]) -> None:
    """Delete everything under ``directory`` except the ``keep`` paths."""
    if directory in keep:
        return
    if directory.is_file():
        directory.unlink()
        return
    for child in directory.iterdir():
        if any(child == k or k.is_relative_to(child) for k in keep):
            _remove_generated_within(child, keep)
        else:
            shutil.rmtree(child) if child.is_dir() else child.unlink()


def handle_preserved(source: Path) -> tuple[list[str], list[str]]:
    """Bootstrap missing preserved files; diff the rest. Returns (created, differing)."""
    created: list[str] = []
    differing: list[str] = []
    for rel in PRESERVED:
        src, dst = source / rel, REPO / rel
        if not src.exists():
            continue
        if not dst.exists():
            shutil.copy2(src, dst)
            created.append(rel)
            continue
        theirs = src.read_text(encoding="utf-8").splitlines(keepends=True)
        ours = dst.read_text(encoding="utf-8").splitlines(keepends=True)
        if theirs != ours:
            differing.append(rel)
            print(f"\n--- {rel}: generated version differs from ours (ours is kept) ---")
            sys.stdout.writelines(difflib.unified_diff(ours, theirs, fromfile=f"ours/{rel}", tofile=f"zip/{rel}", n=1))
    return created, differing


def restore_version() -> str:
    """Write the version from package.json into the generated src/version.ts."""
    version = json.loads((REPO / "package.json").read_text(encoding="utf-8")).get("version")
    if not version:
        fail("package.json: no version")
    version_ts = SRC / "version.ts"
    text = version_ts.read_text(encoding="utf-8")
    new_text, count = VERSION_TS_RE.subn(rf"\g<1>{version}\g<3>", text)
    if count != 1:
        fail("could not find VERSION in the generated src/version.ts")
    version_ts.write_text(new_text, encoding="utf-8")
    return version


def rename_package(source: Path) -> str:
    """Make generated docs name our package, whatever name the generator was configured with."""
    theirs = json.loads((source / "package.json").read_text(encoding="utf-8")).get("name")
    ours = json.loads((REPO / "package.json").read_text(encoding="utf-8")).get("name")
    if not theirs or theirs == ours:
        return f"generated docs already name {ours}"
    count = 0
    for pattern in ENV_RENAME_FILES:
        for path in REPO.glob(pattern):
            if not path.is_file() or "lib" in path.relative_to(REPO).parts:
                continue
            text = path.read_text(encoding="utf-8")
            if theirs in text:
                count += text.count(theirs)
                path.write_text(text.replace(theirs, ours), encoding="utf-8")
    return f"generated docs renamed {theirs} -> {ours} ({count} mentions)"


def rename_env_vars() -> str:
    """Rewrite generated environment variable names to the ARINA_GRID_* family."""
    counts = dict.fromkeys(ENV_RENAMES, 0)
    for pattern in ENV_RENAME_FILES:
        for path in REPO.glob(pattern):
            if not path.is_file() or "lib" in path.relative_to(REPO).parts:
                continue
            text = original = path.read_text(encoding="utf-8")
            for old, new in ENV_RENAMES.items():
                text, n = re.subn(rf"(?<![A-Za-z0-9_]){old}(?![A-Za-z0-9_])", new, text)
                counts[old] += n
            if text != original:
                path.write_text(text, encoding="utf-8")
    if not counts["API_KEY"] and not counts["ARINA_BASE_URL"]:
        return "generated code already uses ARINA_GRID_* names; nothing renamed"
    return "env vars renamed: " + ", ".join(f"{k}->{v} ({counts[k]})" for k, v in ENV_RENAMES.items())


def patch_placeholder_base_url() -> str:
    """Make baseURL required when the generator emitted its empty default.

    With no environment configured, generated clients fall back to '' and requests go to a
    relative URL: an unhelpful TypeError in Node, the page's own origin in a browser. Replace
    the fallback with the SDK's own error. Once a production environment is configured the
    default is a real URL and this is a no-op.
    """
    client_ts = SRC / "client.ts"
    text = client_ts.read_text(encoding="utf-8")
    env = re.search(r"baseURL = readEnv\('([A-Z0-9_]+)'\)", text)
    error = re.search(r"throw new Errors\.(\w+Error)\(", text)
    if not env or not error:
        fail("client.ts: could not find the baseURL env var or the SDK error class")

    def replacement(match: re.Match) -> str:
        indent = match["indent"]
        return (
            f"{indent}if (!options.baseURL) {{\n"
            f"{indent}  throw new Errors.{error.group(1)}(\n"
            f"{indent}    'The baseURL client option must be set either by passing baseURL to the client "
            f"or by setting the {env.group(1)} environment variable.',\n"
            f"{indent}  );\n"
            f"{indent}}}\n"
            f"{indent}const defaultBaseURL = '';\n"
        )

    text, count = PLACEHOLDER_BASE_URL.subn(replacement, text)
    if count == 0:
        return "generated client has a real default base URL; no patch needed"
    if count != 1:
        fail(f"client.ts: expected one empty default base URL, found {count}")
    client_ts.write_text(text, encoding="utf-8")
    return "empty default base URL replaced with a required-option error"


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    zip_path = Path(argv[1]).expanduser().resolve()
    if not zip_path.is_file():
        fail(f"no such file: {zip_path}")

    with tempfile.TemporaryDirectory() as tmp:
        source = extract(zip_path, Path(tmp))
        replaced = replace_generated(source)
        created, differing = handle_preserved(source)
        package = rename_package(source)

    version = restore_version()
    renamed = rename_env_vars()
    patched = patch_placeholder_base_url()

    print("\nimport complete")
    print(f"  replaced (generated): {', '.join(replaced)}")
    if created:
        print(f"  created (preserved, first import): {', '.join(created)}")
    if differing:
        print(f"  review (preserved, zip differs): {', '.join(differing)}")
    print(f"  version restored to {version} in src/version.ts")
    print(f"  package:  {package}")
    print(f"  env vars: {renamed}")
    print(f"  base url: {patched}")
    print("\nnext: npm test, then commit as feat:/fix: describing the API change.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
