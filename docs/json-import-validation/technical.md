# JSON Import Validation

## Overview
The JSON Import Validation feature parses user-provided field-configuration JSON, validates structure and constraints, and maps valid records into editor state.

## Implementation
1. A file picker captures a JSON file from the upload section in the editor panel.
2. Pre-validation checks reject unsupported extension and oversized payloads.
3. The parsed JSON is validated through a schema layer before transformation.
4. Valid entries are converted into editor variable models and replace or update current state.
5. Failed validation surfaces explicit feedback through modal-based error handling.

## Components
- `PDFContainer`: controls file selection, confirmation flow, validation trigger, and state replacement.
- Validation schema module (`fieldSchema`): centralizes JSON shape rules.
- Modal UI states: confirmation modal and validation-error modal for safer import UX.

## JSON Schema
Import uses schema-driven validation to enforce payload shape:
1. Root document metadata and variables list must be present.
2. Variable objects must include required identifiers and positional fields.
3. Optional sections (constraints/config) are validated per supported field type.

## Validation Engine
The engine validates both structure and business-level constraints. It checks schema conformance, field coherence, and page-reference validity before allowing import into runtime state.

## Import Workflow
1. Select JSON file.
2. Run extension/size checks.
3. Show confirmation.
4. Parse + schema validate.
5. Transform to internal variable model.
6. Commit to editor state and sync where required.

## Error Handling
Validation failures are captured and shown in a dedicated modal. Errors include invalid schema, missing fields, and out-of-range page references. On failure, existing editor state is preserved to prevent accidental data loss.

## AI Prompt Reference
- Workflow prompt source: `workflow/step8_JSON_Import_Validation.md`

