# Upload PDF

## Overview
The Upload PDF feature handles client-side file intake, validation, preprocessing, and transition into the PDF editor flow.

## Implementation
1. The upload UI accepts file input through both drag-and-drop and click-to-select interactions.
2. On selection, the feature runs validation checks before any processing begins.
3. A `FileReader` converts the PDF into an ArrayBuffer, then to base64 for persistence.
4. A unique template ID is generated and stored via server action, along with document metadata.
5. The user is redirected to a template route where editing continues in the PDF container.

## Components
- `UploadPdf` manages file selection state, validation, loading transitions, and routing.
- `PDFContainer` is mounted after successful preparation for field mapping operations.
- Server action `createTemplateAction` persists template payloads used by subsequent pages.

## File Handling
The feature reads user-selected files in the browser using `FileReader.readAsArrayBuffer`. Binary content is transformed into a base64 string, enabling storage in the in-memory template store and later reconstruction into a renderable PDF file.

## File Validation Parameters
1. **Type check:** Accepts only files with MIME `application/pdf` or `.pdf` extension.
2. **Size check:** Enforces a maximum size of 5 MB.
3. **Presence check:** Handles empty file selection with explicit user feedback.

## Libraries Used
- **React**: state and lifecycle control for upload interactions.
- **Next.js App Router**: route navigation and server action integration.
- **Browser File APIs** (`FileReader`, `Uint8Array`, `btoa`): PDF byte processing and encoding.

