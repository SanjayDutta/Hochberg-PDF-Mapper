# Project Directory Hierarchy

```
pdf-mapper/
├── Dockerfile                          # Docker image definition for the app
├── docker-compose.yml                  # Docker Compose service configuration
├── eslint.config.mjs                   # ESLint configuration
├── next.config.ts                      # Next.js configuration
├── next-env.d.ts                       # Next.js TypeScript environment declarations
├── package.json                        # Project dependencies and scripts
├── postcss.config.mjs                  # PostCSS / Tailwind CSS configuration
├── tsconfig.json                       # TypeScript compiler configuration
├── README.md                           # Project readme
│
├── public/                             # Static assets served directly
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/                                # Application source code
│   ├── app/                            # Next.js App Router pages and routes
│   │   ├── favicon.ico
│   │   ├── globals.css                 # Global styles and dark mode overrides
│   │   ├── layout.tsx                  # Root layout (ThemeProvider, font setup)
│   │   ├── page.tsx                    # Root page (upload + recent templates + feature cards)
│   │   └── [uuid]/                     # Dynamic template route
│   │       ├── page.tsx                # Template editor page (loads template from store)
│   │       └── getJson/
│   │           └── route.ts            # GET API endpoint — returns template variables as JSON
│   │
│   ├── components/                     # Reusable React components
│   │   ├── FeatureCardsCarousel.tsx    # Arrow-driven feature highlights carousel (root page)
│   │   ├── PDFContainer.tsx            # Main PDF editor (rendering, fields, toolbar, undo/redo)
│   │   ├── PDFContainerWrapper.tsx     # Client wrapper to lazy-load PDFContainer
│   │   ├── RootNavBar.tsx              # Navigation bar for the root/home page
│   │   ├── TemplateCards.tsx           # Recent work cards displayed on the root page
│   │   ├── TemplateNavBar.tsx          # Navigation bar for the template editor page
│   │   ├── ThemeProvider.tsx           # Global dark/light theme context provider
│   │   └── UploadPdf.tsx               # PDF file upload input and handler
│   │
│   └── lib/                            # Shared utilities and server-side modules
│       ├── fieldSchema.ts              # Zod schema for import/export JSON validation
│       ├── templateActions.ts          # Server actions for template CRUD operations
│       └── templateStore.ts            # Global in-memory template store (UUID → template map)
│
├── docs/                               # Feature documentation
│   ├── in-memory-storage/
│   │   ├── technical.md
│   │   └── non-technical.md
│   ├── json-export/
│   │   ├── technical.md
│   │   └── non-technical.md
│   ├── json-import-validation/
│   │   ├── technical.md
│   │   └── non-technical.md
│   ├── pdf-rendering/
│   │   ├── technical.md
│   │   └── non-technical.md
│   ├── template-routing-uuid/
│   │   ├── technical.md
│   │   └── non-technical.md
│   ├── undo-redo/
│   │   ├── technical.md
│   │   └── non-technical.md
│   ├── upload-pdf/
│   │   ├── technical.md
│   │   └── non-technical.md
│   └── variable-placement/
│       ├── technical.md
│       └── non-technical.md
│
└── workflow/                           # Step-by-step development prompts and objectives
    ├── hierarchy.md                    # This file — project directory overview
    ├── step0.md                        # Project setup
    ├── step1.md                        # PDF upload feature
    ├── step2.md                        # PDF rendering
    ├── step3.md                        # Variable placement
    ├── step4.md                        # Undo/redo and field editing
    ├── step5_Access_Variables.md       # JSON export and API access
    ├── step6_In-memory_Storage.md      # In-memory store and template routing
    ├── step7.md                        # UI/UX refinements
    ├── step8_JSON_Import_Validation.md # JSON import and validation flow
    ├── step9.md                        # Root page feature cards and carousel
    └── step10.md                       # Documentation objectives
```
