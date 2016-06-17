///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/array',  
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/dom-construct',
  'dojo/mouse',

  'dojo/query',
  'dojo/dom',
  'dojo/topic',

  'dojo/store/Memory', 
  'dijit/form/ComboBox',

  'esri/geometry/Polygon',
  'esri/geometry/Extent',
  'dijit/form/Button',
  'esri/layers/FeatureLayer',
  'esri/tasks/RelationshipQuery',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/dijit/AttributeInspector',

  'dijit/_WidgetBase',
  'dijit/Dialog',
  'dojo/dom-style'
],
function (declare, array, lang, html, on, domConstruct, mouse, query, dom, topic,
          Memory, ComboBox, Polygon, Extent, Button, FeatureLayer, RelationshipQuery, QueryTask, Query, AttributeInspector,
          _WidgetBase,Dialog,domStyle) {
  
          return declare("", null, {



    /*************************************************

    This file Code:
      1) creates 6 different Attribute Inspector Objects based on user input click:
      

      Create Edit panel depending on type of edit
          editCap - Edit Capabity Form
          addCap -  Add Capability Form
          editRes - Edit Resource
          addRes -  Add Resource
          editPar - Edit Partner Committment
          addPar -  Add Partner Committment


      2) Creates the DOM nodes necessary for each form

      3) Passes refresh instructions to the main app

    **************************************************/
    constructor: function(options){




 //     var defaults = lang.mixin({}, this.options, options);
          // properties are contained in the config settings
          // that are created and updated in the app
  //        this.set("current_config", defaults.this_config);

    },

    startup: function(){
      this.inherited(arguments);



    },


/*

//  ********************************************
//  Create Edit panel depending on type of edit
//      editCap - Edit Capabity Form
//      addCap -  Add Capability Form
//      editRes - Edit Resource
//      addRes -  Add Resource
//      editPar - Edit Partner Committment
//      addPar -  Add Partner Committment
//  ********************************************
    _insertEditPanel: function(formType,config){
      // capInfoId is removed on edit button click
      this.inherited(arguments);

      var inspectorDiv = dom.byId("capEditId")
          if(inspectorDiv){
             inspectorDiv.remove();
          }

      // *************************************************
      // Place anchor DOM elements for various edit forms
      // *************************************************


      // Place edit Capability Inspector 
      if(formType=="editCap"){

          var  content="";
               content+='<div class="inspectorPanelTextContainer" id="capEditId">';
               content+=    '<div id="formPanelId"></div>';
               content+='</div>';

          var newDIV = domConstruct.toDom(content);
          //domConstruct.place(newDIV, dom.byId('capInfoEditPanel'), 'after');// could be "after" or "last"
          domConstruct.place(newDIV, dom.byId('selectedCoreCap'), 'after');// could be "after" or "last"

      }

      // Place ADD CAPABILITY Inspector at the top of the panel
      if(formType=="addCap"){

          var  content="";
               content+='<div class="inspectorPanelTextContainer" id="capEditId">';
               content+=    '<div id="formPanelId"></div>';
               content+='</div>';

          var newDIV = domConstruct.toDom(content);
          domConstruct.place(newDIV, dom.byId('selectedCoreCap'), 'after');// could be "after" or "last"
      }


      // Place ADD RESOURCE Inspector
      if(formType=="addRes"){

          var  content="";
               content+='<div class="inspectorPanelTextContainer" id="capEditId">';
               content+=    '<div id="formPanelId" class="inspectorPanelTextContainer" ></div>';
               content+='</div>';

          var newDIV = domConstruct.toDom(content);
          domConstruct.place(newDIV, dom.byId('placeAttrInsp_addRes'), 'after');// could be "after" or "last"
      }



              this.createFormComponents(formType, config);



    },

    removeEditPanel: function(){

      var inspectorDiv = dom.byId("capEditId")
          if(inspectorDiv){
             inspectorDiv.remove();
          }

    },

    removeInspectorParent: function(){

      var inspectorDiv = dom.byId("inspector_parent")
          if(inspectorDiv){
             inspectorDiv.remove();
          }

    },

 */ 
    removeDijitBtns: function(){

      var removeCapBtn = dijit.byId("maEditCAP");
          if(removeCapBtn){
             removeCapBtn.destroyRecursive();
          } 
      var removeTableBtn = dijit.byId("maReqResTable");
          if(removeTableBtn){
             removeTableBtn.destroyRecursive();
          } 

      var removeAddResourceBtn = dijit.byId("maAddResource");
          if(removeAddResourceBtn){
             removeAddResourceBtn.destroyRecursive();
          } 

      var removePartnerBtn = dijit.byId("maPartnerTable");
          if(removePartnerBtn){
             removePartnerBtn.destroyRecursive();
          } 

      var removeGapBtn = dijit.byId("maGapTable");
          if(removeGapBtn){
             removeGapBtn.destroyRecursive();
          } 

      // Check for previous comboBox dijits placed in popups
      var cbox = dijit.byId("rtltCmbBox");
            if(cbox){ cbox.destroyRecursive();}// remove dijit if it already exists
      var cbox2 = dijit.byId("rtltCmbBox2");
            if(cbox2){cbox2.destroyRecursive();}// remove dijit if it already exists

    },



    // ***************************************************
    // Send Message to widget 
    // Refresh the CapInfo panel using newly entered data
    // ***************************************************
    refreshCapInfoId: function(){

      var capInfo = dom.byId("capInfoId")
          if(capInfo){
             capInfo.remove();
          }


    },

    // *********************************************************************
    // Send Message to widget to call function that performs total refresh
    // Remove edit panel
    // *********************************************************************
    afterCapabilityIsDeleted: function(){
      
      this.removeEditPanel();
      topic.publish('DELETED_CAPABILITY');

    },

    afterCapabilityIsAdded: function(){

      this.removeEditPanel();
      topic.publish('ADDED_CAPABILITY');

    },

    afterCapabilityIsSaved: function(){
      this.removeDijitBtns();
      this.removeEditPanel();
      this.refreshCapInfoId();
      topic.publish('REFRESH_CAPINFO');
    },

    afterAddEditDelete: function(){
      this.removeDijitBtns();
  //    this.removeInspectorParent();
      this.refreshCapInfoId();
      topic.publish('REFRESH_CAPINFO');
    },


    removeAddResPanel:function(){
      this.removeDijitBtns();
      //this.removeInspectorParent();
      this.refreshCapInfoId();
      topic.publish('REFRESH_CAPINFO');

    },


    // *********************************************************************
    // Check to make sure the person wants to 
    // Remove edit panel
    // *********************************************************************
    checkDeletes: function(results){

        var ok = true;  

        if(results.adds==undefined && results.updates==undefined && results.deletes!=undefined){

              if(confirm("Delete this capability and all of its resources?")){ 

                  } else{  
                            ok=false;  
                        }  
        }  

        if(!ok){  
            throw new Error();  
        }  
      

    },

    _createCustomDomains:function(formType, config){

        // GET RTLT DATA FROM JSON

        var rtltData = [];
          dojo.xhrGet({
            url: "widgets/MutualAid/mutualAid_configs/rtlt.json",
            handleAs: "json",
            load: lang.hitch(this, function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                rtltData = obj;
                this._createFormComponents(formType, config, rtltData)
            }),
            error: function(err) {
              /* this will execute if the response couldn't be converted to a JS object,
                   or if the request was unsuccessful altogether. */
               alert("ERROR Reading RTLT JSON");
               console.log(err);
            }
        });

    },
  

//  ************************************************
//  pass what you need to create a fLayer Object  
//
//  ************************************************
    _createFormComponents: function(formType,config,rtltData){

      this.inherited(arguments);

      // *******************************************************************
      // Create INSPECTOR_PARENT Anchor for placing each attribute inspector

      var updateFeature;


     // var formDiv= dom.byId("formPanelId");

     // if(formDiv){

     //   var edContent = '';
     //p       edContent += '<div id="inspector_parent"> </div>';
          
     //   var editDialogNode = domConstruct.create('div', {innerHTML: edContent});
     //       domConstruct.place(editDialogNode, dom.byId("formPanelId"), 'last');

     // }

//    ******************************
/*      if(formType== "editCap"){

        //add a save button next to the delete button
        var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
        var cancelEditButton = new Button({ label: "Cancel", "class": "cancelEditButton"},domConstruct.create("div"));


        var resArr = config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capabilities'});
        var resURL = resArr[0].originURL;

        var cap_flayer = new FeatureLayer(resURL, {
              mode: FeatureLayer.MODE_ONDEMAND,
              id: 'capResources_flayer',
              outFields: ["*"]
            }); 



        var q = new Query();
            q.where = "GlobalId = '" + current_config.selectedCap.GlobalID + "'"; 


            cap_flayer.selectFeatures(q, FeatureLayer.SELECTION_NEW, lang.hitch(this, function(features){
                if (features.length > 0) {
                  //store the current feature
                  updateFeature = features[0];
                  console.log("Features have been found");
                }
                else {
                  console.log('no features to update');
                }
            }));

            // ******************************************************
            // create listener to intercept deletes to allow a cancel
            //  *****************************************************
            cap_flayer.on('before-apply-edits', this.checkDeletes); 




          var layerInfos = [
            {
              'featureLayer': cap_flayer,
              'showAttachments': false,
              'isEditable': true,
              'fieldInfos': [
                {'fieldName': 'Threat_Hazard', 'isEditable': true, 'label': 'Threat/Hazard:'},
                {'fieldName': 'Capability', 'isEditable': true, 'tooltip': 'Capability name', 'label': 'Core Capability:'},
                {'fieldName': 'Targets', 'isEditable': true, 'label': 'Targets:', "stringFieldOption": "textarea"},
                {'fieldName': 'Outcomes', 'isEditable': true, 'tooltip': 'List of desired outcomes', 'label': 'Outcomes','width': '100%', "stringFieldOption": "textarea"},
                {'fieldName': 'Impacts', 'isEditable': true, 'label': 'Impacts'},
                {'fieldName': 'Jurisdiction', 'isEditable': true, 'label': 'Jurisdiction:'},
                {'fieldName': 'ESF', 'isEditable': true, 'label': 'ESF:'}
              ]
            }
          ];

          var attInspector = new AttributeInspector({
            layerInfos: layerInfos
          }, domConstruct.create("div"));

          domConstruct.place(attInspector.domNode, dom.byId("inspector_parent"), 'last');
          domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");

          domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
          domConstruct.place(cancelEditButton.domNode, attInspector.domNode, "after");


          // ***********************************************************
          // Store the updates to apply when the save button is clicked
          // *********************************************************** 
          attInspector.on("attribute-change", function(evt) {
            updateFeature.attributes[evt.fieldName] = evt.fieldValue;
          });

          // *************************************************************
          // Save Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);

                    this.afterCapabilityIsSaved();

                  }), function(err){
                          console.log(err);
                      }
                  );
            }));

          // *************************************************************
          // Cancel Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          cancelEditButton.on("click", lang.hitch(this, function() {
            this.removeEditPanel();
            updateFeature = [];
          }));


          // ****************************************************************
          // Delete Button is clicked.  Intercept delete to verify with user
          // **************************************************************** 
          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('removed record: ' + deletes[0].objectId);
                  
                  this.afterCapabilityIsDeleted();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
          }));

            //setTimeout(lang.hitch(this, function() {

            //}), 500);

      }

    // *************************************************************
    // Add Capability Target
    //
    //
    // ************************************************************* 


      else if(formType== "addCap"){

          this._getGeometry(config.capabilitiesUrl, current_config);


      }
   */   
    // ******************************
    // ADD NEW RESOURCE ENTRY FORM
    // 
    // *******************************      
     if(formType=="editRes"||"addRes"){

        // **********************************************************************************************************************
        // CREATE FLAYER FOR RESOURCES
        //
        // Errors can be introduced here when layers are re-published from downloaded layer packages, Which happens
        // When moving plans from one orgnanization Account to another organization account This may be an unreported Esri Bug.
        //
        // Relationships will appear not to have names as they do with layers that function proplerly.
        // The error has to be fixed by editing the REST endpoint Feature Schema using rest/admin/services
        // https://blogs.esri.com/esri/arcgis/files/2014/10/How-to-Update-Hosted-Feature-Service-Schemas1.pdf
        // ***********************************************************************************************************************

        var resArr = config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
        

        if(resArr.length>0){

                var resURL = resArr[0].originURL;

                var edit_flayer = new FeatureLayer(resURL, {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        id: 'edit_flayer',
                        outFields: ["ResourceName","ResourceType","NbrRequired","Category","RTLT_Type"]
                    });  


                  // ******************************************************
                  // create listener to intercept deletes to allow a cancel
                  // *****************************************************
                  edit_flayer.on('before-apply-edits', this.checkDeletes); 


                  // ***********************************************************************************************
                  // This is VERY important.  Without the .on "load" it will function properly only 50% of the time!
                  // ***********************************************************************************************                                                             
                  edit_flayer.on("load", lang.hitch(this, function () {

                      // ****************************************************************
                      // TODO - Insert a check to make sure you want to add a resource
                      // ****************************************************************
                      //
                      // Check for "addRes" and insert new record before creating Dialog
                      // ****************************************************************
                      if(formType=="addRes"){

                            var resAttributes = {
                               "attributes":{
                                'ResourceID': '',
                                'ResourceName': '',
                                'ResourceType': '',
                                'NbrRequired': '',
                                'Category': '',
                                'CapabilityFK': config.selectedCap.GlobalID,
                                'RTLT_Type': '',
                             }};

                            // TODO - Add check to see if flayer exists

                            edit_flayer.applyEdits([resAttributes], null, null, 
                              lang.hitch(this, function(addResults) {
                                var oid = addResults[0].objectId;
                                console.log('inserted record: ' + oid); 
                                this.configureResDialog(oid, config, edit_flayer, rtltData);
                              }), function(err){
                                      alert("ERROR UPDATING");
                                      console.log(err);
                                  }
                              );
                      }

                      // **************************************************************
                      // 
                      // Do not create new record.  Simply pass values to create Dialog
                      // 
                      // **************************************************************
                      if(formType=="editRes"){
                          
                          this.configureResDialog(null, config, edit_flayer, rtltData);

                      }

              }))//END on Load

        } 




        else{

          alert("There is an error with the REST service.  The name for a related table is likely missing.  This can happen when re-publishing a layer package.  Please repair the service schema.")

        }
      }// END RESOURCE SECTION

  },

//    *******************************      
//      else if(formType=="editRes"){

         // msgHeader.innerHTML="Edit Resource & Partner Updates";

//          alert("Yay - AttrFormsManager - create the edit resource Form")





/*

   var myDialog = new Dialog({
            id:    "newDialogId",
            title: "Programmatic Dialog Creation",
            style: "width: 300px"
        });

            domStyle.set(myDialog.containerNode, {
              position: 'relative'
            })

        var edContent = '';
            edContent += '<div id="inspector_parent">Testing</div>';
          
        var editDialogNode = domConstruct.create('div', {innerHTML: edContent});
            domConstruct.place(editDialogNode, dom.byId("newDialogId"), 'last');



               // myDialog.set("content", "Hey, I wasn't there before, I was added at " + new Date() + "!");
                myDialog.show();


*/











 //     }


 //   },


/*
    qSelectionComplete: function(event){

      console.log("THIS DOES NOT GET CALLED");

      alert("qSelectionComplete")


        if (event.features.length > 0) {
            //store the current feature
            this.updateFeature = event.features[0];
            console.log("Features have been found");
        }

        else {
            console.log('no features to update');
        }


    },

    // *************************************************************
    // *************************************************************

    // Functions for Add Capability Target

    // Create this.featLayer
    // *************************************************************
    // ************************************************************* 
     _getGeometry: function(capUrl, config){
          var geomURL = capUrl;
          var getGeometryTask = new QueryTask(geomURL);
          var query = new Query();
            query.where = '1=1';
            query.returnGeometry = true;
            query.returnCount = '1';
          getGeometryTask.execute(query).then(lang.hitch(this,this._addCapability));

          this.featLayer = new FeatureLayer(capUrl, {
              mode: FeatureLayer.MODE_ONDEMAND,
              id: 'featLayer',
              outFields: ["*"]
            }); 
       
    },

    _addCapability: function(response){

          var polygon = new Polygon(response.features[0].geometry);

          var capAttributes = {
             "attributes":{
             'Capability': 'Cs',
             'Outcomes': 'Os',
             'Impacts': 'Is',
             'Targets': 'Ts',
             'Jurisdiction': 'Js',
             'ESF': 'Fs',
             'Threat_Hazard': 'Hs'
           }};

          var graphic = new esri.Graphic(polygon, null, capAttributes);

          this.featLayer.applyEdits([graphic], null, null, 
            lang.hitch(this, function(addResults) {

              console.log('inserted record: '); 
              console.log(addResults[0].objectId);
              this._capabilityUpdateForm(addResults[0].objectId);
            }), function(err){
                    console.log(err);
                }
            );

    },

    _capabilityUpdateForm: function (oid) {

          //add a save button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelEditButton = new Button({ label: "Cancel", "class": "cancelEditButton"},domConstruct.create("div"));

          var edContent = '';
              edContent += '<div id="inspector_parent"> </div>';
            
          var editDialogNode = domConstruct.create('div', {innerHTML: edContent});
              domConstruct.place(editDialogNode, dom.byId("formPanelId"), 'last');



          var updateFeature;

          var objectID = oid;
          var query = new Query();
          query.where = "ObjectID = '" + objectID + "'"; 

          this.featLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features){
              if (features.length > 0) {
                //store the current feature
                updateFeature = features[0];
              }
              else {
                console.log('no features to update');
              }
          });







            // ******************************************************
            // create listener to intercept deletes to allow a cancel
            //  *****************************************************
            this.featLayer.on('before-apply-edits', this.checkDeletes); 




          var layerInfos = [
            {
              'featureLayer': this.featLayer,
              'showAttachments': false,
              'isEditable': true,
              'fieldInfos': [
                {'fieldName': 'Threat_Hazard', 'isEditable': true, 'label': 'Threat/Hazard:'},
                {'fieldName': 'Capability', 'isEditable': true, 'tooltip': 'Capability name', 'label': 'Core Capability:'},
                {'fieldName': 'Targets', 'isEditable': true, 'label': 'Targets:', "stringFieldOption": "textarea"},
                {'fieldName': 'Outcomes', 'isEditable': true, 'tooltip': 'List of desired outcomes', 'label': 'Outcomes','width': '100%', "stringFieldOption": "textarea"},
                {'fieldName': 'Impacts', 'isEditable': true, 'label': 'Impacts'},
                {'fieldName': 'Jurisdiction', 'isEditable': true, 'label': 'Jurisdiction:'},
                {'fieldName': 'ESF', 'isEditable': true, 'label': 'ESF:'}
              ]
            }
          ];

          var attInspector = new AttributeInspector({
            layerInfos: layerInfos
          }, domConstruct.create("div"));



          domConstruct.place(attInspector.domNode, dom.byId("inspector_parent"), 'last');
          domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");

          domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
          domConstruct.place(cancelEditButton.domNode, attInspector.domNode, "after"); 


          // ***********************************************************
          // Store the updates to apply when the save button is clicked
          // *********************************************************** 
          attInspector.on("attribute-change", function(evt) {
            updateFeature.attributes[evt.fieldName] = evt.fieldValue;
          });

 
          // *************************************************************
          // Save Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);

                    this.afterCapabilityIsAdded();

                  }), function(err){
                          console.log(err);
                      }
                  );
            }));

          // *************************************************************
          // Cancel Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          cancelEditButton.on("click", lang.hitch(this, function() {
            this.removeEditPanel();
            updateFeature = [];
          }));


          // ****************************************************************
          // Delete Button is clicked.  Intercept delete to verify with user
          // **************************************************************** 
          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('removed record: ' + deletes[0].objectId);
                  
                  this.afterCapabilityIsDeleted();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
          }));

      },
*/

    //  ***************************************************
    //  Create Attribute Inspector for adding NEW RESOURCE

    configureResDialog: function (oid, config, edit_flayer, rtltData) {

      var updateFeature;   




      // Check for previous comboBox dijits
      var cbox = dijit.byId("rtltCmbBox");
      var cbox2 = dijit.byId("rtltCmbBox2");

      if(cbox){// Must catch this in more than one place
        cbox.destroyRecursive();}// remove dijit if it already exists
      if(cbox2){cbox2.destroyRecursive();}// remove dijit if it already exists




      // Create Query for edit using globalID
      if(oid==null){

        var query = new Query();
        query.where = "GlobalId = '" + config.selectedResGID + "'";  // set in _panelEditResClicked() of widget.js
        query.outFields = ["Category","ResourceName","ResourceType","NbrRequired","RTLT_Type"];

        var dialogTitle="Edit this Resource"

      }

      // Create query for 
      else{

        var query = new Query();
        query.where = "OBJECTID = '" + oid + "'";
        query.outFields = ["Category","ResourceName","ResourceType","NbrRequired","RTLT_Type"];

        var dialogTitle="Add a new Resource"

      }


        edit_flayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features){
            if (features.length > 0) {
              //store the current feature
              updateFeature = features[0];
            }
            else {
              console.log('no features to update');
            }
        });



        this.rtltResources = [];

        for (var i=0; i < rtltData.length; i++){

          this.rtltResources.push({
            "name": rtltData[i].attributes.Name,
            "id": rtltData[i].attributes.ID,
            "category": rtltData[i].attributes.Category,
            "type": rtltData[i].attributes.Type
            });
        }

        this.rtltStore = new Memory({
              idProperty: "ID",
              data: this.rtltResources
          }); 

        this.rtltCatStore = new Memory({
          idProperty: "id",
          data: [
            {name:"Animal Emergency Response", id:"Animal Emergency Response"},
            {name:"Medical and Public Health", id:"Medical and Public Health"},
            {name:"Incident Management", id:"Incident Management"},
            {name:"Emergency Medical Services", id:"Emergency Medical Services"},
            {name:"Fire/Hazardous Materials", id:"Fire/Hazardous Materials"},
            {name:"Law Enforcement Operations", id:"Law Enforcement Operations"},
            {name:"Public Works", id:"Public Works"},
            {name:"Search and Rescue", id:"Search and Rescue"},
            {name:"Mass Care Services", id:"Mass Care Services"}
          ]
        });

          var rtltCmbBox = new ComboBox({
            id: "rtltCmbBox",
            name:  "rtltCmbBox",
            store: this.rtltCatStore
          }, "rtltCmbBox");

          var rtltCmbBox2 = new ComboBox({
            id: "rtltCmbBox2",
            name:  "rtltCmbBox2",
            placeHolder: "Select a resource type..",
            store: this.rtltStore,
            onChange: function(value){
                    console.log(value);
              }
          }, "rtltCmbBox2");

          rtltCmbBox.startup();
          rtltCmbBox2.startup();

          //manually set fieldInfos array
          var fieldInfos =  [
              {'fieldName': 'Category',
                      'isEditable': true,
                      'label': 'Resource Category',                      
                      // 'customField': dijit.byId("rtltCmbBox")
                      'customField': rtltCmbBox
              },
              {'fieldName': 'ResourceName',
                      'isEditable': true,
                      'customField': rtltCmbBox2
              },
              {
                'fieldName': 'ResourceType',
                      'isEditable': true
              },
              {
                'fieldName': 'NbrRequired',
                      'isEditable': true
              }];     

          var layerInfos = [{
              'featureLayer': edit_flayer,
                  'showAttachments': false,
                  'isEditable': true,
                  'fieldInfos' : fieldInfos
          }];

          var attInspector = new AttributeInspector({
            layerInfos: layerInfos
          }, domConstruct.create("div"));

          //add a save and cancel button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelButton = new Button({ label: "Cancel", "class": "cancelButton"},domConstruct.create("div"));

 //         domConstruct.place(attInspector.domNode, dom.byId("inspector_parent"), 'last');

 //         domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");
 //         domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
 //         domConstruct.place(cancelAddResButton.domNode, attInspector.domNode, "after"); 

// --------------INSERT POPUP

          var myDialog = new Dialog({
            id:    "newDialogId",
            title: dialogTitle,
            style: "width: 500px; background-color:#FFF;",
            onHide: function() {
                    myDialog.destroyRecursive();}
          });


            //domStyle.set(myDialog.containerNode, {
            //  position: 'relative'
            //})

          var edContent = '';
              edContent += '<div class="dialog-content" id="edContent">';
              //edContent += '<div id="inspector_parent"> </div>';
              edContent += '</div>';
              //edContent += '</div>';
          
          var editDialogNode = domConstruct.create('div', {innerHTML: edContent});

            domConstruct.place(editDialogNode, dom.byId("newDialogId"), 'last');
            domConstruct.place(attInspector.domNode, dom.byId("edContent"), 'first');

            domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");
            domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
            domConstruct.place(cancelButton.domNode, attInspector.domNode, "after"); 






// --------------------END INSERT POPUP


          // ***********************************************************
          // Store the updates to apply when the save button is clicked
          // *********************************************************** 
          attInspector.on("attribute-change", lang.hitch(this, function(evt) {
            //store the updates to apply when the save button is clicked 
            console.log(evt.fieldName);
            updateFeature.attributes[evt.fieldName] = evt.fieldValue;

            //User changes category
            if (evt.fieldName === "Category"){
              this.rtltStore.data = this.rtltResources; //reset rtltDataStore
              var selectedCategory = evt.fieldValue;
              //filter resource array by selected category
              var rtltResourcesFilter = this.rtltResources.filter(function(el){
                return (el.category === selectedCategory);
              });

              if (rtltResourcesFilter.length > 0){
                this.rtltStore.data = rtltResourcesFilter;
              }
            }
            //User changes resource name
            if (evt.fieldName === "ResourceName"){
              var selectName = evt.fieldValue;
              var resourceId = this.rtltResources.filter(function(el){
                return (el.name === selectName);
              });

              if (resourceId.length > 0){
                updateFeature.attributes.ResourceID = resourceId[0].id;
                updateFeature.attributes.RTLT_Type = resourceId[0].type;
              }

            }            
          }));
 
          // *************************************************************
          // Save Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);

                   this.afterAddEditDelete();

                   myDialog.hide;
                   myDialog.destroyRecursive();


                  }), function(err){
                          console.log(err);
                      }
                  );
            }));



          
          cancelButton.on("click", lang.hitch(this, function() {

            // no need to delete record if cancel is clicked when editing an existing record 
            if(oid==null){
              updateFeature=[];
              myDialog.hide
              myDialog.destroyRecursive();
            }
            // delete the record just added, if cancel is clicked after "Add Resource"
            else{
              updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                //alert('need to remove a record: ' + deletes[0].objectId);
                  this.removeAddResPanel();
                  updateFeature = [];
                  //this.hideThisDialog();
                  myDialog.hide
                  myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err.message);
                      }
                  );

            }


            }));


          // saveButton.on("click", lang.hitch(this, function() {
          //   updateFeature.getLayer().applyEdits(null, [updateFeature], null,
          //     lang.hitch(this, function(adds,updates,deletes) {
          //       console.log('saved record: ' + updates[0].objectId);

          //      // this.hideRADialog();
          //         }), function(err){
          //                 console.log(err);
          //             }
          //         );
          //   }));



         // attInspector.on("next", function(evt) {
         //   updateFeature = evt.feature;
         //   console.log("Next " + updateFeature.attributes.OBJECTID);
         // });

          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {

                   this.afterAddEditDelete();

                   myDialog.hide;
                   myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
            }));


        myDialog.show();

      },

    // ***********************************************************************
    // Check to make sure the person wants to 
    // This will interupt the applyEdits process so that a delete is not made
    // ***********************************************************************

    checkDeletes: function(results){

        var ok = true;  

        if(results.adds==undefined && results.updates==undefined && results.deletes!=undefined){

              if(confirm("Delete this capability and all of its resources?")){ 

                  /** treatement for attributes **/  

                  } else{  
                            ok=false;  
                        }  
        }  

        if(!ok){  
            throw new Error();  
        }  
      

    }



  });
});