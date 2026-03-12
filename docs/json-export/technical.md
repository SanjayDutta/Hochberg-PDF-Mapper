# JSON Export

## Overview
The JSON Export feature serializes mapped PDF variable definitions into a normalized object payload for file download and API retrieval.

## Implementation
1. Export logic collects current variable state from the editor at download time.
2. The payload includes document metadata and a `variables` array with field-level attributes.
3. The object is validated before download to prevent malformed output.
4. A Blob is generated and downloaded as a `.json` file, named from the document title.

## Components
- `PDFContainer`: builds export payload, validates it, and triggers browser download.
- Export schema (`fieldSchema`): enforces payload shape for consistency.
- API route `/{uuid}/getJson`: returns equivalent JSON export payload over HTTP.

## Export Data Structure Model
The export root is a single JSON object (not an array):
1. `documentName`: source filename/title.
2. `metadata`: coordinate-system details.
3. `variables`: field objects containing `key`, `type`, `label`, `page`, `x`, `y`, `width`, `height`.
4. Optional nested groups: `config` (e.g., options) and `constraints` (e.g., min/max rules).

## Metadata Structure
Metadata currently includes coordinate reference details under `coordinateSystem`:
- `origin`: `top-left`
- `units`: `pixels`
- `pageIndex`: `1-based`

This keeps positional interpretation explicit for downstream systems.

## Download Mechanism
On download action, the app stringifies payload JSON, creates a Blob (`application/json`), generates an object URL, and programmatically clicks a temporary anchor element. The URL is revoked immediately after completion.

## API Endpoint
`GET /{uuid}/getJson` returns the export payload for a stored template. The endpoint resolves the template by UUID, transforms stored variable records into export format, and responds with JSON.

## AI Prompt Reference
- Workflow prompt source: `workflow/step5_Access_Variables.md`

