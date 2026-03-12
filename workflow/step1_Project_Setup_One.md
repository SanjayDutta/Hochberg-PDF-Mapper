## Step 1 : Bare-bones Project Setup - 1st part

**1.Aim:** We are going to setup a very simple, bare bone structure of the project. This will start with the project setup and checking if the project can be accessed via the web browser.

**2. Objectives**

- [x] Setup a Next.js application 
- [x] The root route should just display a "Hello World"
- [x] Setup a dockerfile - Create docker-compose.yml - add .dockerignore
- [x] Add necessary inputs in dockerignore (node_modules, .next, .git, Dockerfile, docker-compose.yml, README.md)
- [x] In the root route, create a component (UploadPdf) which will ask the user to drag and drop a PDF file or select a pdf file. Upon succesfull uploading, a message should display below, that pdf has been succesfully uploaded. 
**NOTE:** We are not storing the pdf file in the web server, we shall be doing all the processing in the frontend. So our application shal store it in a File state. We shall also do a validation check (file type- pdf and file size - 5MB). After validation check passes we shall display below (file upload success OR file upload fail)