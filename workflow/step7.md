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
