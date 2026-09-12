#!/usr/bin/env python3
"""One-off: strip local absolute machine-path prefixes from citation text in content/.

Two exact-string prefixes are removed. Nothing else is touched:

  /Users/romitsoley/Downloads/                        -> ""   (leaves the vault-relative
      path, e.g. "PRISM-Expansion-Vault/99-Assets/documents/Playbooks/Nursing Playbook.md",
      which is the spelling content/sources/playbooks.yaml already commits as canonical,
      or the bare transcript filename, e.g. "exxat_transcripts.md line 9: ...")

  /Users/romitsoley/Documents/GitHub/rr-emerging-domains/  -> ""   (leaves the repo-relative
      path, e.g. "content/prism/capability-map.yaml", which is the form
      apps/ecosystem/lib/strip-file-citations.ts already sanitizes at render time)

content/sources/registry.yaml is excluded: its two occurrences are its own deliberate
`path:` metadata field recording where the original artifact lives on the transcriber's
machine. That is designed behaviour, not the defect.

Safety property enforced below: re-inserting each removed prefix at the exact offsets it
was removed from reproduces the original file byte-for-byte. Nothing but those prefixes
can have changed.
"""

import pathlib
import sys

PREFIXES = [
    "/Users/romitsoley/Downloads/",
    "/Users/romitsoley/Documents/GitHub/rr-emerging-domains/",
]

EXCLUDE = {"content/sources/registry.yaml"}

ROOT = pathlib.Path(__file__).resolve().parent.parent


def transform(text: str) -> tuple[str, int]:
    """Remove every occurrence of each prefix. Returns (new_text, n_removed)."""
    out = text
    n = 0
    # Longest first so the two never race (they don't overlap, but be explicit).
    for prefix in sorted(PREFIXES, key=len, reverse=True):
        n += out.count(prefix)
        out = out.replace(prefix, "")
    return out, n


def verify(original: str, new: str) -> None:
    """Prove new == original with only whole PREFIXES deleted, nothing else.

    Walk both strings in lockstep. Where they agree, advance together. Where they
    diverge, the original MUST have a full prefix at that offset; skip exactly that
    many chars in the original and continue. Any other divergence is a bug.
    """
    i = j = 0
    while i < len(original) and j < len(new):
        if original[i] == new[j]:
            i += 1
            j += 1
            continue
        for prefix in sorted(PREFIXES, key=len, reverse=True):
            if original.startswith(prefix, i):
                i += len(prefix)
                break
        else:
            raise AssertionError(
                f"divergence at original[{i}]/new[{j}] not explained by a prefix: "
                f"{original[i - 40:i + 60]!r}"
            )
    # Trailing remainder in the original must be prefixes only (in practice: empty).
    rest = original[i:]
    for prefix in sorted(PREFIXES, key=len, reverse=True):
        rest = rest.replace(prefix, "")
    if rest or new[j:]:
        raise AssertionError(f"unconsumed tail: original={rest!r} new={new[j:]!r}")


def main() -> int:
    apply = "--apply" in sys.argv
    files, total = 0, 0
    for path in sorted((ROOT / "content").rglob("*.yaml")):
        rel = path.relative_to(ROOT).as_posix()
        if rel in EXCLUDE:
            continue
        original = path.read_text(encoding="utf-8")
        if not any(p in original for p in PREFIXES):
            continue
        new, n = transform(original)
        verify(original, new)
        files += 1
        total += n
        print(f"{n:5d}  {rel}")
        if apply:
            path.write_text(new, encoding="utf-8")
    verb = "rewrote" if apply else "would rewrite"
    print(f"\n{verb} {files} file(s), {total} prefix occurrence(s) removed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
