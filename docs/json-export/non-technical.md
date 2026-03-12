# JSON Export

## Overview
JSON Export allows users to download all mapped PDF field details as a structured JSON file.

## Purpose
This feature exists so field mappings are not locked inside the editor. Teams can store, review, share, and reuse mapping data across workflows without re-entering everything manually.

## How it works
1. After fields are placed on the PDF, users click **EXPORT JSON**.
2. The app collects field details such as key, type, label, page, coordinates, and size.
3. It organizes values into a clean JSON object that also includes document metadata.
4. Constraints and options are grouped in dedicated sections to keep the format easy to read.
5. The file is downloaded locally using the current document name as the base filename.
6. The same data can also be accessed through the API endpoint, which returns equivalent export payload data.

## User Benefits
Users get a portable representation of their work that can be audited, integrated, or reused later. It reduces repeated setup, improves traceability, and supports smoother handoff between technical and non-technical teams.

