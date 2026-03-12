# Variable Placement

## Overview
The Variable Placement feature provides an interactive layer over rendered PDF pages where users can create, position, resize, edit, and delete form-like variables.

## Implementation
1. Field definitions are initiated from the left panel and instantiated through drag-and-drop into the active PDF page context.
2. On drop, a modal captures core metadata (key, label, type) before committing the variable to state.
3. Variable state updates are tracked through history snapshots to support undo/redo and keyboard shortcuts.
4. Editing reuses the same modal path, allowing in-place updates for existing variables.

## Components
- `PDFContainer`: owns render, overlay interactions, modal lifecycle, and history management.
- Variable modal/popup: handles add/edit forms, validation feedback, and constraints.
- Overlay field box: supports drag movement, resize handles, coordinate display, and delete action.

## Overlay Architecture
The feature uses a layered structure:
1. **PDF Canvas**: rendered page surface from the PDF viewer.
2. **Variable Overlay Layer**: absolute-position container aligned to the current page.
3. **Variable Boxes**: interactive field nodes with labels, resize controls, and delete affordance.

## Variable Data Model
Variables are state objects containing placement and behavior metadata: `id`, `key`, `label`, `type`, `page`, `x`, `y`, `width`, `height`, plus optional constraints/config fields depending on type.

## Drag and Drop (Source and target)
The drag source is the field button in the left pane. The target is the PDF page drop region in the center pane. Drop events capture page context and client position, then open metadata input before persistence.

## Positional Calculation (Coordinate system, Pixel Position, Page Reference)
Positioning uses a top-left origin in pixel space. `x` and `y` are calculated relative to the active page viewport, while `page` stores a 1-based reference. Width/height values are adjusted during resize interactions.

## Field Editing and Deleting
Clicking a variable opens edit mode in the popup with existing values prefilled. Deleting is performed via the field-level close icon, removing the variable from state and overlay.

## AI Prompt reference
- Workflow prompt source: `workflow/step3_Add_variables_One.md`
- Workflow prompt source: `workflow/step4_Add_variables_Two.md`

