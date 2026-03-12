# In-Memory Storage

## Overview
The in-memory storage feature keeps template work available on the server so users can return to an existing template URL and continue editing without starting over.

## Purpose
This feature exists to make the editing workflow continuous and practical during active usage. It stores uploaded PDF content and related field data together with a generated template ID so work can be resumed while the server is running.

## How it works
1. When a user uploads a PDF, the app creates a new template entry in a global server memory store.
2. A unique ID is generated and the user is redirected to a template-specific route.
3. The root page reads all current entries and shows them as Recent Work cards for quick reopening.
4. If a user revisits a valid template route, the stored PDF and mapped fields are loaded back into the editor.
5. Users can delete templates from cards or from the editor page, and the entry is removed from memory.
6. If an invalid template ID is opened, the app shows a Template not found response.

## User Benefits
Users can pause and resume document mapping without re-uploading files during the server session. The feature also gives a clear workspace history through visible cards and safe deletion actions when old templates are no longer needed.
