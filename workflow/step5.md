## Step 3 :  Access Variables

**1.Aim:** Once all the variables have been placed, we shall now mechanism to download/access all these templates 

**2. Objectives**

- [x] Add a Download button on the top-right.
- [x] When this download button is clicked, initiate a file down. This file is a json file
- [x] Currently our fields have a structure like following - 
{  key,  page,  x,  y,  width,  height,  label} so our downloadable json should look like - 
{
  "documentName": "contract.pdf",
  "variables": [
    {
      "key": field.key,
      "page": field.page,
      "x": field.x,
      "y": field.y,
      "width": field.width,
      "height": field.height,
      "label": field.label
    }
  ]
}
- [x] Add a horizontal bar at the top. It should have have an editable text field, which is file name. users can edit this field to change the name of the document.
- [x] In the same bar, move the Download, Undo and Redo button towards the right side of the bar
- [x] The text color is very light, use darker color, like black
- [x] we are missing type in dropdown and checkbox, add type as dropdown and checkbox respectively
- [x] in both dropdown and checkbox, we have dropdownOptions and chekcbox options, instead put them under config:{options:...} This makes it cleaner
- [x] in case of text fields, add the constarints under a key value like constraints:{"minLength":...} THis is makes it cleaner
- [x] Similarly for number,dropdown,checkbox, put the constraints under the constraints attribute

- [x] Add a metadata tag in the json file which is being generated, under this it should have  "coordinateSystem": {
    "origin": "top-left",
    "units": "pixels",
    "pageIndex": "1-based"}
    Later we can add more metadata if required
