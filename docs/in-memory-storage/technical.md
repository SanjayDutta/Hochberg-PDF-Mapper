# In-Memory Storage

## Overview
The in-memory storage feature maintains template state in a process-level store so PDF mapping sessions can be resumed through route-based template identifiers.

## Implementation
1. The server initializes a global map-like store keyed by template UUID.
2. Upload flow creates a template object containing PDF data, metadata, and mapped variable fields.
3. The client is redirected to `/{uuid}` after creation, and this route loads data from the store.
4. Root-page cards are rendered from current store entries to expose resumable work items.
5. Delete actions remove the same template key from memory and update visible UI state.

## Components
- Global template store module: holds template objects keyed by UUID.
- Upload/root flow components: create entries and list available templates.
- Template route/page loader: resolves UUID and hydrates editor state.
- Delete handlers: remove entries from both root cards and editor context.

## Storage Architecture
Storage uses a single in-process global map. This keeps read/write operations simple and fast for a single running server instance. Each key is a generated UUID and each value is a complete template payload required to reopen editing state.

## Template Object Structure
Each template object includes: identifier, file-related metadata, PDF content reference/data, and variable mapping state (field names, positions, page references, and configuration attributes). The structure is designed so one lookup can rebuild editor context without additional joins.

## Lifecycle
A template is created on upload, updated as field state changes, read when the template route is opened, listed on root as recent work, and removed on explicit delete confirmation. If a UUID cannot be resolved, the route returns a template-not-found response.

## Limitations
Because storage is memory-only, data is not durable across server restarts, deployments, or crashes. Horizontal scaling also requires shared persistence because process-local memory is isolated per instance.

## AI Prompt Reference
- Workflow prompt source: `workflow/step6_In-memory_Storage.md`
