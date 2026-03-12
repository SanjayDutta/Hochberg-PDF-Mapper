## Step 9 : Documentation 

**1.Aim:** Prompts for Documentation

**2. Pre-requisite Knowledge**

In the root working directory, there is a folder called docs. Inside it we will have folders for various features. In each of them we will have 2 markdown files, technical and non-technical. In each of these we will document the specific feature, one with a technical focus and other with non-technical focus. For the format of the markdown refer to the notes at the bottom.



**3. Objective**

- [x] Write the technical/non-technical documentation for the feature upload-pdf. For technical documentation add additional Subheadings - File Handling, File Validation parameters, Libraries Used. Also short write paragraph/numbered points for each.

- [x] Write the technical/non-technical documentation for the feature pdf-rendering. For technical documentation add additional Subheadings - Rendering Architecture, Page Navigation, Zoom Handling (refer to /workflow/step2.md for details). Also short write paragraph/numbered points for each.

- [x] Write the technical/non-technical documentation for the feature variable-placement. For technical documentation add additional Subheadings - Overlay Architecture (focus on PDF Canvas, Variable Overlay layer and Variable Boxes), Variable Data Model, Drag and Drop (Source and target), Positional Calculation (Coordinate system, Pixel Position, Page Reference), Field Editing and Deleting (refer to /workflow/step3.md and step4.md for details). Also short write paragraph/numbered points for each. Add AI Prompt reference subheading which should point to step3.md and step4.md markdown files in workflow

- [x] Write the technical/non-technical documentation for the feature undo-redo. For technical documentation add additional Subheadings - History State Structure, State Snashops (how state is stored after every change), Supported Actions (add, delete, etc), Keyboard shortcuts and Hisotry Limit (refer to /workflow/step4.md for details). Also short write paragraph/numbered points for each. Add AI Prompt reference subheading which should point to step4.md markdown files in workflow

- [x] Write the technical/non-technical documentation for the feature json-export. For technical documentation add additional Subheadings - EXport Data Structure Model, Metadata Structure, Download Mechanism, API Endpoint(refer to /workflow/step4.md for details). Also short write paragraph/numbered points for each. Add AI Prompt reference subheading which should point to step5_Access_Variables.md markdown files in workflow

- [x] Write the technical/non-technical documentation for the feature json-import-validation. For technical documentation add additional Subheadings - JSON Schema, Validation Engine, Import Workflow, Error Handling (refer to /workflow/step8_JSON_Import_validation.md for details). Also short write paragraph/numbered points for each. Add AI Prompt reference subheading which should point to step8_JSON_Import_validation.md markdown files in workflow

- [x] Write the technical/non-technical documentation for the feature template-routing-uuid. For technical documentation add additional Subheadings - UUID generation, Routing and Route Pattern, Template Lookup (Explain how store retrives the template), Error Handling, Resume Workflow (refer to /workflow/step6_In-memory_Storage.md for details). Also short write paragraph/numbered points for each. Add AI Prompt reference subheading which should point to step6_In-memory_Storage.md markdown files in workflow


**Note:** 
1.For non-technical, should explain in simple language (word limit 150-200 words) what the feature does and why it exists, without code. (E.g. Headers: Upload Pdf, Subheading1: Overview,paragraph:1 sentence introduction fo the feature , Subheading1: Purpose,paragraph: Explain in 1 or 2 sentences about the purpose of this feature,Subheading1: How it works,paragraph: Explain in few numbered points about how this feature works, Subheading1: User Benifits,paragraph: Explain in 1 or 2 sentences about the feature benifits the user)
2.For technical documentation format, should explain (word limit 200-300 words) what the feature does from technical perspective. (E.g. 

Headers: Upload Pdf, 
Subheading1: Overview,
paragraph:1 sentence introduction fo the feature (The Upload PDF feature handles file selection, validation, and loading of the PDF document into the editor.) 

Subheading1: Implementation,
paragraph: Explain the workflow of the feature implementation in few numbered points,

Subheading2: Components,
paragraph: Mention the components used to implement this feature 

*More subheading and related paragraph will be given in prompts*

)