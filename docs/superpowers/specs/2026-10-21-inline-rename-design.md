# Inline card title renaming — issue #3

Approved in chat: single-click title editing and context-menu Rename for Activity, Task and Story. Activity/Task details use a separate document button; Story details open from the card outside the title. No pencil. Begin/cancel do not rebuild the canvas; pointer clicks place the caret at the text position when supported. Enter saves, Escape cancels, blur saves, whitespace-only and unchanged values do not commit. IME confirmation must not submit.

Keep a view-local draft across redraws, resolve the entity by ID against current data, and track activeEditors. Disable only the edited item's drag source. Persist via commitModal so a failed write restores model/history while retaining the input for retry. Clear editor lifecycle on map switch/close. Do not rename linked notes or change the map schema. Existing undo/redo and drag/drop remain supported.

Validation: DOM integration tests on the real compiled plugin view for all entity types, save/cancel/blur/IME, failed-write retry, refresh and lifecycle, and drag/event isolation; full npm test. Native UI validation is reported separately from DOM simulation.
