## Step 8 : JSON Field Attribue Upoad, Validation and Load

**1.Aim:** User can also upload a JSON file, which has the attributes of the various fields and load it into the document

**2. Objectives**

- [x] Add a section , before View options, called Upload JSON Field Attributes, with an upload button. Upon clicking this button, user should be able to select a json file. After choosing the json file to be uploaded, we check and make sure its not more than 5MB and its extension is json.

- [x] Now lets have a JSON schema, which we would use to validate the user uploaded JSON document. So make the JSON schema in out repository and use npm packages like Zod for validaton

- [x] After succesfull validation, read the properties of the various fields in the user provided JSON and add the necessary fields in the pdf component

- [x] When user clicks Download, the JSON which is to be downloaded, first goes through validation, based on the earlier logic. So When user clicks download, open a pop which shows JSON evaluation is progress. Behind the scenes we validate the json with our json schema. Upon succesfull validation, the pop up should should JSON Validation sucessfull, download should being shortly and download of the json file should begin.