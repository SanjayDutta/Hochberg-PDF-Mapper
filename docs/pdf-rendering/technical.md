# PDF Rendering

## Overview
The PDF Rendering feature is responsible for loading a validated PDF into the editor view and presenting page-level navigation with responsive layout behavior.

## Implementation
1. After upload validation, the app enters a loading phase and prepares PDF bytes for rendering.
2. `PDFContainer` becomes the active view and replaces the upload interface.
3. Rendering uses a paginated model: one active page in the center with navigation state (`pageNumber`, `numPages`).
4. UI controls synchronize with state updates for previous/next movement, direct page jumps, and thumbnail clicks.
5. The container is scroll-focused so users scroll inside the component rather than scrolling the full browser page.

## Components
- `UploadPdf`: triggers loading state and transitions into the rendering experience.
- `PDFContainer`: renders the document, page controls, zoom controls, and side panels.
- Right thumbnail pane: clickable mini-previews for fast page selection and visual context.

## Rendering Architecture
The layout is split into three regions: left utility pane, center render pane, and right thumbnail pane. The center pane hosts the main PDF page and internal scrolling viewport. The right pane keeps a vertical list of thumbnails and tracks active page highlight. On small screens, left and right panes are hidden, leaving only the center pane for simplified mobile usability.

## Page Navigation
Page navigation is state-driven with bounds checks.
1. Previous/Next controls update the active page only within valid limits.
2. Direct numeric input supports jump-to-page behavior with clamp logic to valid page range.
3. Clicking a right-pane thumbnail sets the active page immediately.
4. Thumbnail scrolling follows the selected page for visual continuity.

## Zoom Handling
Zoom is handled through incremental scaling with minimum and maximum limits.
1. Zoom out decreases scale in small steps until the lower bound.
2. Zoom in increases scale in small steps until the upper bound.
3. The displayed zoom percentage reflects current scale and updates as state changes.

