# PDF Mapper

## Project Overview

PDF Mapper is a browser-based tool that lets users upload a PDF document and visually place named variable fields on top of it. Each field marks a position on a specific page and stores metadata such as field name, type, and constraints. The completed mapping can be exported as a structured JSON file or retrieved via a REST API endpoint, making it straightforward to integrate template-driven document generation into external workflows.

The application runs as a Next.js web app with an in-memory template store. When a PDF is uploaded, a unique UUID is generated, the template is stored in server memory, and the user is redirected to a persistent editor URL. Returning to that URL resumes the session with all previously placed fields intact.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · react-pdf · pdfjs-dist · Zod

---

## Demo

A demo online version is running at **[https://pdfmapper-hwb5bwbfb2bhbqbb.germanywestcentral-01.azurewebsites.net](https://pdfmapper-hwb5bwbfb2bhbqbb.germanywestcentral-01.azurewebsites.net)**

You can checkout the application here.

---

## Features

- **PDF Upload** — Accepts PDF files via drag-and-drop or file picker, validates type and size before loading.
- **PDF Rendering** — Renders individual pages with zoom controls and page navigation. Thumbnails panel on the right allows quick page jumping.
- **Variable Placement** — Drag named fields from a sidebar onto any page. Fields are positioned using a coordinate overlay that maps pixel positions back to PDF-relative percentages.
- **Metadata Model** — Exported templates include coordinate metadata (`origin: top-left`, `units: pixels`, `pageIndex: 1-based`) so field positions are interpreted consistently across API consumers.
- **Field Editing and Deleting** — Click any placed field to edit its name, type, and attributes inline. Delete individual fields or clear all fields on a page.
- **Undo / Redo** — Full history of placement and edit actions with a 50-event cap. Keyboard shortcuts `Ctrl+Z` / `Ctrl+Y` supported.
- **JSON Export** — Download the complete variable mapping as a structured JSON object. Pre-download validation ensures only well-formed data is exported.
- **JSON Import** — Re-import a previously exported JSON file. Zod schema validation enforces structure and backward compatibility with legacy array payloads.
- **In-Memory Template Store** — Templates persist in server memory per UUID. Recent work is shown as cards on the home page for quick resumption.
- **Template Routing** — Each template has a dedicated route (`/{uuid}`). Opening a valid URL restores full editor state. Invalid UUIDs show a "Template not found" page.
- **Dark Mode** — Full light/dark theme toggle persisted via a global ThemeProvider.
- **Delete Template** — Remove a template from the editor toolbar or root page cards, with a confirmation dialog before deletion.

---

## Installation

**Prerequisites:** Node.js 18 or later, npm.

```bash
# 1. Clone the repository
git clone <repository-url>
cd pdf-mapper

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Other available scripts:

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimised production bundle |
| `npm run start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint across the project |

---

## Docker Instructions

A `Dockerfile` and `docker-compose.yml` are included for containerised deployment.

**Using Docker Compose (recommended):**

```bash
# Build and start the container
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# Stop the container
docker-compose down
```

**Using Docker directly:**

```bash
# Build the image
docker build -t pdf-mapper .

# Run the container
docker run -p 3000:3000 pdf-mapper
```

The app will be available at [http://localhost:3000](http://localhost:3000) in both cases.

---

## Documentation

Feature documentation is stored in the `docs/` directory. Each feature has two files — a plain-language explanation and a technical deep-dive.

| Feature | Non-Technical | Technical |
|---|---|---|
| Upload PDF | [docs/upload-pdf/non-technical.md](docs/upload-pdf/non-technical.md) | [docs/upload-pdf/technical.md](docs/upload-pdf/technical.md) |
| PDF Rendering | [docs/pdf-rendering/non-technical.md](docs/pdf-rendering/non-technical.md) | [docs/pdf-rendering/technical.md](docs/pdf-rendering/technical.md) |
| Variable Placement | [docs/variable-placement/non-technical.md](docs/variable-placement/non-technical.md) | [docs/variable-placement/technical.md](docs/variable-placement/technical.md) |
| Undo / Redo | [docs/undo-redo/non-technical.md](docs/undo-redo/non-technical.md) | [docs/undo-redo/technical.md](docs/undo-redo/technical.md) |
| JSON Export | [docs/json-export/non-technical.md](docs/json-export/non-technical.md) | [docs/json-export/technical.md](docs/json-export/technical.md) |
| JSON Import Validation | [docs/json-import-validation/non-technical.md](docs/json-import-validation/non-technical.md) | [docs/json-import-validation/technical.md](docs/json-import-validation/technical.md) |
| In-Memory Storage | [docs/in-memory-storage/non-technical.md](docs/in-memory-storage/non-technical.md) | [docs/in-memory-storage/technical.md](docs/in-memory-storage/technical.md) |
| Template Routing UUID | [docs/template-routing-uuid/non-technical.md](docs/template-routing-uuid/non-technical.md) | [docs/template-routing-uuid/technical.md](docs/template-routing-uuid/technical.md) |

For the full directory layout, see [workflow/hierarchy.md](workflow/hierarchy.md).

---

## AI Workflow Explanation

This project was developed using an AI-assisted workflow within an IDE that provides multiple coding agents through an automatic model selection mode. Instead of relying on a single model, the IDE automatically selected the most appropriate coding agent for each task.

Development was organized into incremental steps documented in the workflow/ directory. Each step contains:

- the goal of the phase
- contextual information for the task
- structured prompts guiding the AI agent
- a checklist of objectives to implement

The AI agents used these prompts to generate code suggestions, which were then reviewed, adjusted, and integrated into the project. This structured workflow allowed the project to be developed progressively, with each phase building on the previous one.

The workflow files also serve as a reproducible record of how the application evolved from initial setup through feature implementation and documentation.

**Workflow steps:**

| File | Phase |
|---|---|
| `workflow/step0_Intialization.md` | Project scaffolding and setup |
| `workflow/step1_Project_Setup_One.md` | PDF upload feature |
| `workflow/step2_Project_Setup_Two.md` | PDF rendering, zoom, and page navigation |
| `workflow/step3_Add_variables_One.md` | Variable placement overlay and drag-and-drop |
| `workflow/step4_Add_variables_Two.md` | Field editing, deleting, and undo/redo history |
| `workflow/step5_Access_Variables.md` | JSON export and API endpoint |
| `workflow/step6_In-memory_Storage.md` | In-memory store, UUID routing, and recent templates |
| `workflow/step7_Variable_and_Changes.md` | UI/UX refinements (navbar, dark mode, layout polish) |
| `workflow/step8_JSON_Import_Validation.md` | JSON import with schema validation and download pre-validation |
| `workflow/step9_Root_Page.md` | Root page feature cards and arrow carousel |
| `workflow/step10_Documentation.md` | Feature documentation generation |

Each workflow file contains an aim, pre-requisite context, and a checklist of objectives. Completed objectives are marked `[x]`. This structure made it straightforward to pause, resume, and extend development at any step.
