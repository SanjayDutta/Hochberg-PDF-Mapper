## Step 6 :  In Memory Storage

**1.Aim:** We are going to have a global in memoery store. The aim is to allow user to continue their work, even after closing the browser.

**2. Objectives**

- [x] lets setup a global map or a memory template store.
- [x] to test if this is working or not, when the server starts, load the store with some dummy data and when the root path is accessed via the web browser, read this dummy data from the store and display it.
- [x] We are trying to acheive a feature, where user should be able to resume their work even after closing their browser. For this we shall be using the help of the global in-memory template. Now once the user uploads a pdf, make an entry to the global in-memoery template store, storing the important information like path of pdf, fields which are added to page and associated important information. 
When user uploads a template, then generate a uuid and associate this uuid with this pdf. so for example, user is in localhost:3000 (root) and he uploads a pdf, then generate a uuid and redirect the user to localhost:3000/{uuid}. So when the user returns to localhost:3000/{uid} he can resume the work again. When the user uploads a PDF, store the PDF content together with the template. So the PDF itself is stored in memory. 
If user uploads the same file name again, create new entry with new uuid. If someone opens a non-existing /{uuid}? show a “Template not found”

- [x] in the root page, on the top, make a horizontol component, which in a cards manner shows the available templates, read from the global in-memory template. Basically if there are any entries made in the in-memory template, it means that the user was doing some work. This work should be visible as a card in the top horizontal component of the root path. Below it we will have out sual pdf uploader component.

- [x] Now, add a cross button on the top-left corner of the cards. Upon clicking a pop up open asking the user if they want to delete this ? with the options Yes and NO. If user clicks yes, remove the the entry of this object from in-memory template as well as everywhere else. If they click no, just close the pop up

- [x] Now that we have a delete feature, in the PDFContainer, on the top we have a section for zooming and pagination, in the right side, extreme, add a red trash bin icon and upon clicking, the same pop up about are you sure you want to delete should come up. If user clicks yes, then do the as usual delete and redirect the user to root page. Upon cliking no just close pop up


**NOTE** This is to be an in-memory storage mechanism, no persistent storage