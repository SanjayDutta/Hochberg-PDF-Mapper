## Step 2 : Bare-bones Project Setup - 2nd Part

**1.Aim:** We have a web browser accessible project. Now we will work on rendering the pdf pages.

**2. Objectives**

- [x] Once the upload is succesfull, do a loading spinner (use bootstrap) where the PDFContainer component gets displayed.
- [x] The PDFContainer will diplay the pdf pages. This should follow a pagination structure. Where page 1 of the pdf is diplayed, and then we will left/right arrow button below, which on clicking will take to the next page or previous page.
- [x] When the user uploads a pdf, we hsall have a loading screen, where we are reading the transcript. Once the loading has taken place, we no longer need the UploadPDF container, so we can hide it. And replace it with the PDFContainer. So in short, in should be seamless transition from Upload to Viewing the pdf pages.
- [x] In the PDFContainer, make it scrollable. So i scroll the coomponent and not the page itself.
- [x] Add a vertical component on the right side, which shows smaller view of the pdf pages. On clicking these smaller view, user can directyly go to that page. Same as the earlier, I should scroll the component to see the views, one after the other, rather than scroll the page.
- [x] Add a vertical component on the left, it's width should be a bit more than the right side (maybe 30% for left component, 55% for middle and 20% for the right component). THis vertical component for the time being is empty. We shall develop this component in later steps.
- [x] We are also looking into mobile view. In smaller width screen hide the left and right vertical components.
- [x] For the PDFContainer, add a simple zoom tool (+/-) so that we can zoom into the pdf pages and zoom out.
- [ ] Add a scroll bar in the right vertical component