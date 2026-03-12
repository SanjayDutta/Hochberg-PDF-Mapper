# JSON Import Validation

## Overview
JSON Import Validation lets users upload a JSON file and load field settings directly into the PDF editor.

## Purpose
This feature exists to save time and avoid repetitive manual setup. Instead of recreating each field one by one, users can bring in a prepared configuration and continue editing immediately.

## How it works
1. Users choose a JSON file from the upload section in the left panel.
2. The app checks basic file rules first, such as file type and size limits.
3. A confirmation step warns that current field settings may be replaced.
4. The file content is validated against the expected JSON structure.
5. If validation succeeds, field data is loaded into the editor and shown on the correct PDF pages.
6. If validation fails, the app shows a clear error message so users can fix the file.
7. Existing mappings remain protected when import validation fails.

## User Benefits
Users get faster onboarding for repeated templates, fewer manual mistakes, and safer updates through validation checks. The feature improves consistency across documents and makes collaboration easier when teams share mapping JSON files.

