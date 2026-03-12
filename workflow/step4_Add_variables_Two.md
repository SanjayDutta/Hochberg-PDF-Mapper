## Step 4 :  Add variables in PDF- 2nd Part

**1.Aim:** This project is a PDF Varaible Mapper. So we shall be placing variables on top of the document, in a step by step manner, and export a JOSN schema desceriving the variable and its placements

**2. Objectives**

- [x] When the key value is added in the pop up, and when user clicks add/update, we should do a check if the key value is unique across all the fields. if the key name is not unique, show an error below the key field in pop up.
- [x] Right now we have the ability to add text field only. Lets also add fields like Number
- [x] Lets also add another Field Dropdown
- [x] In the pop up box, i also want to display the information regarding the field. Currently, we display the key and label. However, in the field we have more information, like x and y. I want to display all of the remaining in a collapsible menu format
- [x] Now i want to add a state mechanism over all the fields. So lets say current state [{id:123,key:k1,label:l1},{id:456,key:k2,label:l1}] and i make changes to the 2nd field's label, so my new state is [{id:123,key:k1,label:l1},{id:456,key:k2,label:l2}]. I should be able to undo this and go back to the previos state. Similary i should also be to do a redo and go the later states. We should be able be able to achive this using undo and redo buttons on the top
- [x] In the Undo history, I want to have a maximum history of 50 events
- [x] Also ctrl+z should done an Undo and ctrl+y should a Redo

- [x] Now lets add some constraint on the fields that we have. Lets start with the text field. In the pop up user should be able to speicify the maxlength, minlength and required check. All of these information should also be available when we down the json file.

- [x] Lets add constraint on numbers field, like minimum value, maximum value and allow decimal check and also requirement check. 

- [x] Lets also add constraints on dropdown field. In dropdown popup, user should be able to add the values , like add value 1 and below it should be an add ti have more dropdown options.

- [x] lets add constraints on checkbox. In checkbox, one option must be provided in order to add it. 