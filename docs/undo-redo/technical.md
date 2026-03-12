# Undo/Redo

## Overview
The Undo/Redo feature maintains reversible editing history for variable operations in the PDF editor by tracking state transitions over the variable collection.

## Implementation
1. Variable state is managed through a history object instead of a single flat list.
2. Every committed change updates the current state and pushes a snapshot into history.
3. Undo pops the most recent snapshot from `past` and prepends the current state into `future`.
4. Redo restores the next `future` snapshot and records current state back into `past`.

## Components
- `PDFContainer`: central owner of history state, undo/redo handlers, and keyboard listeners.
- Toolbar actions: undo and redo buttons trigger history transitions.
- Keyboard integration: global keydown handler maps shortcuts to history operations.

## History State Structure
History uses three tracks:
1. **past**: ordered snapshots before current state.
2. **present**: current variable state used for rendering.
3. **future**: snapshots available after an undo, for redo operations.

## State Snapshots (how state is stored after every change)
Snapshots are deep-cloned copies of variable arrays. Cloning avoids mutation side effects and preserves correctness across steps. New snapshots are only recorded when state actually changes, preventing redundant history entries.

## Supported Actions (add, delete, etc)
Undo/redo covers user actions that modify variable state, including add, update, delete, drag/move, and resize flows. Non-mutating operations are excluded from history updates.

## Keyboard Shortcuts and History Limit
1. **Ctrl+Z** triggers undo.
2. **Ctrl+Y** triggers redo.
3. Shortcuts are ignored while typing in editable inputs/areas.
4. History is capped at **50 events**, trimming oldest snapshots to control memory use.

## AI Prompt Reference
- Workflow prompt source: `workflow/step4_Add_variables_Two.md`

