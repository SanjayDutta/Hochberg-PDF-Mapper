## Step 3 :  Add variables in PDF- 1st Part

**1.Aim:** This project is a PDF Varaible Mapper. So we shall be placing variables on top of the document, in a step by step manner, and export a JOSN schema desceriving the variable and its placements

**2. Objectives**

- [x]  For the first step, we shall add Fields to the left-vertical component. Lets start with the basic, just a text based field option.
- [x] Upon clicking the field option, we create the variable and place it at the center of the selected page. Basically we are overlaying a text field on top on the selected page in the PDFContainer.
- [x] Each of the fields, are variable model (id, key, label, type, page, x, y, optional width/height). Right now we shall set default values to height, width, x,y coordinate, id. We shall only fill the key,label and type. We already have a field text. Now when user clicks the text Field, it should open a pop up box, asking the user to fill the key and value. After that user will click Add button in popup and it should add it in the center of the selected pdf page.
- [x] Now instead of placing the text field in the center, lets make it drag and drop. Clicking on the text field in the left-component doesnt do anything. Instead user will have to drag and drop the field in the selected pdf field. Once its dropped, a pop up will open asking for the key value and Label value.
- [x] Upon clicking the inserted variable on the pdf page, the pop should open again, allowing user to change the values.
- [x] the attributes of the variable should be {  id,  key
  label,  type,  page,  x,  y,  width,  height,} So when user drags a text field, automatically fill the type as text, page value should be where the user dropped the field, x and y are pixel coordinates on the pdf page.
- [x] After insertion of the field and adding the information in popup, the field should sizeable. That is user can move this component left/right/up/down to set the size of this field in the pdf page. The fields highet and width value goes into the fields {height,width } value

- [x] We shall also given an option to delete the field. Add a small cross icon in the field, which are inserted in the page canvas. On clicking this, the field gets removed.

- [x] add some more fields, like checkbox and dropdown