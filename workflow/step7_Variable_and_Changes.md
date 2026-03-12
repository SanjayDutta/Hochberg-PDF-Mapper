## Step 7 : Detailing Field Variables and other minor changes

**1.Aim:** Additional Field Variables and detailing and other minor changes

**2. Objectives**

- [x] For the text field, replace the + Text field to a font awesome icon (<i class="fa-solid fa-language"></i>) and after the icon write "Text"

- [x] For the Number field, replace the + Number field to a font awesome icon (<i class="fa-solid fa-hashtag"></i>) and after the icon write "Number"

- [x] For the Dropdown field, replace the + Dropdown  field to a font awesome icon (<i class="fa-solid fa-angles-down"></i>)and after the icon write "Dropdown"

- [x] For the Checklist field, replace the + Dropdown  field to a font awesome icon(<i class="fa-solid fa-list-check"></i>)and after the icon write "Checklist"

- [x] Add a field called 'Date', of type date with constraints like minDAte and maxDate and required. Use the font awesome icon (<i class="fa-solid fa-calendar-days"></i>)

- [x] Add a field called 'Radio', of type radio. Use the font awesome icon (<i class="fa-solid fa-circle-dot"></i>)

- [x] Also make the objects in the field pane flexible, instead of 1 item per line, make their width smaller and have 2 objects per line

- [x] Shift the Download button in PageContainer to the extreme right, like right-side of redo

- [x] Add a nav-bar on top (except in root,i.e. localhost:3000). The nav bar should have a hamburger menu icon only, on the extreme left. Upon clicking it a dropdown will appear. in this dropdown we will have our Recent Work component, which will have the available cards

- [x] in the top-right corner of Recent Work, add a switching button (Light Mode/Dark Mode) We will define this implementation later, for the time being just a switching button

- [x] I want to add some viewing options in the left-pane. These should be checkboxes with options 1.Show Coordinates and 2. Show Lables. Upon checking one or both it should do the following - Checking Show Coordinates, a badge should appear on the inserted fields, with the text inside of the x and y coordinates AND when Checking Show Lables, it should show the label inside the field, which have already been inserted. Right now Labels are hown by default. By default keep the show labels checkbox ticked.

- [x] The Download button and Delete button (trash bin icon) needs to be moved in the left pane. Add a section called Actions with 4 buttons - Download, Get Api , Delete and Reset. We already have the functionalities of Download and Delete, so no change. For Reset, when user clicks reset then remove all the added fields in the pdf document.

- [x] For the Get Api button- So when we click Download, a json file download gets initiated. Now when user click Get Api button, a pop up opens - which show a url link which looks like {GET http://{url of application}/{uid}/getJson} and underneath it a information section which says - "1. Copy the above URL and paste it browser or use API clients to fetch the JSON payload" At the bottom of the pop up we have Okay button

- [x] Make a route GET http://{url of application}/{uid}/getJson which will return the json content, which we provide the json file when downloading. Here we are sending back the contents of the download file as a response

- [x] I want to add dark mode, already we have buttons in place to do the switching (in Recent Works tab). Upon clicking them, i want to have dark mode in the application. Colors for different background can be rgb(61,61,61), rgb(33,33,33) and rgb(24,24,24). Font color should be white

- [x] Beside the hamburger menu icon, add header - PDF Variable Mapper and on the extreme right , add a house icon, which upon clicking will take the user to the root page

- [x] in the root page, at the extreme top, add the header - PDF Variable Mapper and move the recent-work down, keeping some gap between header and recent-work

- [x] Increase the width of the UploadPDf Component

- [x] in the path url/{uuid}, we have the dark/light mode switcher in the recent works hamnurger menu. Instead move this to the top-left, just beside the home icon

- [x] in the right pane add borders around each page, the border color need not to be black but a darker shade from the background

- [x] In the PageContainer, I have pagination tool (Something like Page 1 of Total), I want to have a small numberical box, where users can directly insert the page number as text, the that page from of the pdf will be rendered below. minimum value can be 1 and mximum value can be the total pages. So if some enters values less than 1, it sshould default to 1 and any valu higher than maximum pages, should default back to the maximum page number

- [x] The selected page in the right pane, should also be highlighted as per the page that is being rendered. So if user goes from page 1 to page 8 (either via entering the page number or by clicking next), the right pane should also scroll to that page, instead of remaining static and unhighligted

- [x] The buttons on the left should have different colors - Download (Background-#3B82F6,Hover-#2563EB,Text-#FFFFFF), Get API (Background-#10B981,Hover-#059669,Text-#FFFFFF), Reset (Background-#F59E0B,Hover-#D97706,Text-#FFFFFF), Delete (Background-#EF4444,Hover-#DC2626,Text-#FFFFFF)

- [x] For the undo and redo, replace the the text with font awesome undo-<i class="fa-solid fa-rotate-left"></i> and redo- <i class="fa-solid fa-rotate-right"></i>

- [x] The JSON that is generated when downloading/using GET APIs, is currently enclosed in [...]. We do not need this to be in an array, since the JSON payload return is just one object, with all key-value pairs in it, no multiple objects
