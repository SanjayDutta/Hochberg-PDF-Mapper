# Template Routing UUID

## Overview
The template routing feature gives every uploaded PDF its own unique web address so users can return to their work at any time during the server session.

## Purpose
Without a persistent identifier, closing the browser tab would mean losing all mapping progress. This feature solves that by generating a unique ID for each upload and embedding it in the page URL, making the session fully resumable.

## How it works
1. When a user uploads a PDF, the app generates a unique ID for that template.
2. The user is automatically redirected to a new page at that unique address.
3. The template data, including the PDF and any mapped fields, is stored under that ID.
4. If the user revisits the same URL later, all previous work is loaded back into the editor.
5. If a URL with an unknown ID is opened, the app shows a clear "Template not found" message.
6. Each new upload always gets a fresh ID, even if the file name is the same.

## User Benefits
Users can bookmark or share their editor URL and confidently return to continue mapping without losing any progress made during the current server session.
