# Template Routing UUID

## Overview
The template routing UUID feature ties PDF upload events to dynamically generated identifiers, enabling route-based session persistence within the in-memory store.

## Implementation
1. On PDF upload, a UUID is generated server-side and a new template entry is written to the global in-memory map.
2. The server responds with the UUID and the client performs a redirect to `/{uuid}`.
3. The dynamic route reads the UUID from the URL path and queries the store for the matching template.
4. If found, editor state (PDF content, variable fields, metadata) is hydrated from the stored object.
5. If not found, a template-not-found response is returned to the client.

## Components
- UUID generation utility: produces unique identifiers per upload event.
- Upload API route: creates the store entry and returns the UUID to the client.
- Dynamic route handler (`/[uuid]`): resolves the template and drives editor hydration.
- In-memory store module: the shared map that bridges upload and resume flows.

## UUID Generation
A UUID is produced at upload time using a standard random generation approach. Each upload — even for a file with an identical name — triggers a new UUID, ensuring store entries never collide.

## Routing and Route Pattern
The app uses a dynamic segment pattern (`/[uuid]`) to capture the template identifier from the URL. This maps directly to a Next.js dynamic route that delegates store lookup and page rendering.

## Template Lookup
On route load, the UUID is extracted from route params and used as the key for a direct map lookup in the global store. A successful hit returns the full template object; a miss triggers the not-found path.

## Error Handling
If the store returns no result for a given UUID, the route renders a "Template not found" state rather than throwing an unhandled error, keeping the user experience predictable.

## Resume Workflow
Because the full template payload — PDF binary data, field definitions, and metadata — is stored on upload, the resume path requires only a single store read to fully reconstruct editor state with no additional fetches.

## AI Prompt Reference
- Workflow prompt source: `workflow/step6_In-memory_Storage.md`
