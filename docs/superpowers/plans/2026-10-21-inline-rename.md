# Inline Rename Implementation Plan

**Goal:** Implement approved issue #3 behavior for Activity, Task and Story titles.

1. Add a reusable compiled-plugin DOM test fixture in tests/helpers/map-view.cjs and failing tests in tests/inline-rename.test.cjs. Cover real view bindings and persistence, not only pure helpers.
2. Update src/main.ts with clickable titles and separate detail controls, Story context-menu action, view-local draft lifecycle, IME-safe input handling, drag isolation and rollback/retry using commitModal. Preserve existing click-to-details behavior.
3. Add compact title layout and hover/focus/touch styling in styles.css. Reuse existing translated Rename and keyboard-help strings.
4. Document the interaction in all README languages. Run npm test and targeted DOM tests. Inspect diff and avoid unrelated changes or publishing until requested.
