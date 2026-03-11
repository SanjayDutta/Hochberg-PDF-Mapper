## Step 1 : Bare-bones Project Setup - 2nd Part

**1.Aim:** We have a web browser accessible project. Now we will work on rendering the pdf pages.

**2. Objectives**

- [x] Once the upload is succesfull, do a loading spinner (use bootstrap) where the PDFContainer component gets displayed.
- [x] The PDFContainer will diplay the pdf pages. This should follow a pagination structure. Where page 1 of the pdf is diplayed, and then we will left/right arrow button below, which on clicking will take to the next page or previous page.
- [ ] When the user uploads a pdf, we hsall have a loading screen, where we are reading the transcript. Once the loading has taken place, we no longer need the UploadPDF container, so we can hide it. And replace it with the PDFContainer. So in short, in should be seamless transition from Upload to Viewing the pdf pages