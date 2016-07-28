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

  './Add_NewPlan_GeographyDialog',

  'dijit/_WidgetBase',
  'dijit/Dialog',
  'dijit/ConfirmDialog',
  'dojo/dom-style'
],
function (declare, array, lang, html, on, domConstruct, mouse, query, dom, topic,
          Memory, ComboBox, Polygon, Extent, Button, FeatureLayer, RelationshipQuery, QueryTask, Query, AttributeInspector, Add_NewPlan_GeographyDialog,
          _WidgetBase,Dialog, ConfirmDialog, domStyle) {
  
          return declare("", null, {



    /*************************************************



    **************************************************/
    constructor: function(options){



    },

    startup: function(){
      this.inherited(arguments);



    },


//  ********************************************
//  Create Edit panel depending on type of edit
//  ********************************************
    _insertEditPanel: function(formType,config){


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

        if(results.adds!=undefined && results.updates==undefined && results.deletes==undefined){

              if(confirm("Add a new capability to this plan?")){ 

                  /** treatement for attributes **/  

                  } else{  
                            ok=false;  
                        }  
        }  

        if(!ok){  
            throw new Error();  
        }  
      

    }, 

    // Do not bother the user with telling them they are deleting a capability they did not actually populate.

    checkForCancel: function(results){

        var ok = true;  

        // if(results.adds==undefined && results.updates==undefined && results.deletes!=undefined){

        //       if(confirm("Delete this capability and all of its resources?")){ 

        //           /** treatement for attributes **/  

        //           } else{  
        //                     ok=false;  
        //                }  
        // }  

        if(results.adds!=undefined && results.updates==undefined && results.deletes==undefined){

              if(confirm("Add a new capability to this plan?")){ 

                  /** treatement for attributes **/  

                  } else{  
                            ok=false;  
                        }  
        }  

        if(!ok){  
            throw new Error();  
        }  
      

    }, 


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


    },


    refreshCapInfoId: function(){
      var capInfo = dom.byId("capInfoId")
          if(capInfo){
             capInfo.remove();
          }
    },

    removeEditPanel: function(){
      var inspectorDiv = dom.byId("capEditId")
          if(inspectorDiv){
             inspectorDiv.remove();
          }
    },

    // *********************************************************************
    // Send Message to widget to call function that performs total refresh
    // Remove edit panel
    // *********************************************************************


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

    afterNewCapabilityAdded: function(){
      var thisDialog = dijit.byId("newDialogId");

            if(thisDialog){
                //thisDialog.hide();
                thisDialog.destroyRecursive();
            }
      topic.publish('ADDED_CAPABILITY');

    },

    afterExistingCapabilityIsEdited: function(){
      this.removeDijitBtns();
      this.refreshCapInfoId();
      topic.publish('REFRESH_CAPINFO');
    },


    afterCapabilityIsDeleted: function(){
      this.removeDijitBtns();
      this.refreshCapInfoId();
      topic.publish('DELETED_CAPABILITY');

    },

    removeAddResPanel:function(){
      this.removeDijitBtns();
      this.refreshCapInfoId();
      topic.publish('REFRESH_CAPINFO');

    },


//  ************************************************
//  pass what you need to create a fLayer Object  
//
//  ************************************************
    createCapFormComponents: function(formType,config){

      this.inherited(arguments);

      // *******************************************************************
      // Create INSPECTOR_PARENT Anchor for placing each attribute inspector

      var updateFeature;

      console.log("ADD_EDIT_DELETE_CAPABILITY_DIALOG" + " " + formType)

     if(formType=="editCap"||"addCap")

      {


        // **********************************************************************************************************************
        // CREATE FLAYER FOR Capabilities
        //
        // Errors can be introduced here when layers are re-published from downloaded layer packages.  This happens
        // when moving plans from one orgnanization account to another organization account via layer packages or geoDatabase. 
        // This behavior may be an unreported Esri Bug.
        //
        // Relationships will appear not to have names when compared to layers that function proplerly.
        // The error has to be fixed by editing the REST endpoint Feature Schema using rest/admin/services
        // https://blogs.esri.com/esri/arcgis/files/2014/10/How-to-Update-Hosted-Feature-Service-Schemas1.pdf
        // ***********************************************************************************************************************
        
        var capArr = config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capabilities'});

        if(capArr.length>0){

                var capURL = capArr[0].originURL;

                var edit_flayer = new FeatureLayer(capURL, {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        id: 'edit_flayer',
                        outFields: ["*"]
                    });  


                  // ******************************************************
                  // create listener to intercept deletes to allow a cancel
                  // *****************************************************
                  edit_flayer.on('before-apply-edits', this.checkForCancel); 


                  // ***********************************************************************************************
                  // This is VERY important.  Without the .on "load" it will function properly only 50% of the time!
                  // ***********************************************************************************************                                                             
                  edit_flayer.on("load", lang.hitch(this, function () {

                      // ****************************************************************
                      // TODO - Insert a check to make sure you want to add a Capability
                      // ****************************************************************
                      //
                      // Check for "addRes" and insert new record before creating Dialog
                      // ****************************************************************
                      if(formType=="addCap"){

                        //var geomURL = capUrl;
                        var getGeometryTask = new QueryTask(capURL);
                        var query = new Query();
                            query.where = '1=1';
                            query.returnGeometry = true;
                            query.returnCount = '1';
                            //getGeometryTask.execute(query).then(lang.hitch(this,this._addCapability));
                            getGeometryTask.execute(query).then(lang.hitch(this,function(response) {


                            if(response.features.length>0){


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

                                  edit_flayer.applyEdits([graphic], null, null, 
                                    lang.hitch(this, function(addResults) {
                                      console.log('inserted record: '); 
                                      console.log(addResults[0].objectId);
                                      this._newCapabilityForm(addResults[0].objectId, capURL);

                                    }), function(err){
                                            console.log(err);
                                        }
                                    );
                            }
                            else{

                                  // ****************************************************************************************************
                                  // This is where the new geography code detects an empty plan!
                                  //
                                  // Calls Add_New_Plan_GeographyDialog.js - only happens if the last cap has been deleted from the plan
                                  // ****************************************************************************************************
                                  var newPlan = new Add_NewPlan_GeographyDialog();

                                      newPlan.initializeNewPlan("newPlan", config, capURL);

                            }


                            }))

                      }

                      // **************************************************************
                      // 
                      // Do not create new record.  Simply pass values to create Dialog
                      // 
                      // **************************************************************
                      if(formType=="editCap"){
                          
                          this.configureEditCapDialog(config, edit_flayer);

                      }

              }))//END on Load

        } // end check on relationship classes


        else{

          alert("There is an error with the REST service.  The name for a related table is likely missing.  This can happen when re-publishing a layer package.  Please repair the service schema.")

        }

      }




    },



    _newCapabilityForm: function (oid, capURL) {


      var new_flayer = new FeatureLayer(capURL, {
          mode: FeatureLayer.MODE_ONDEMAND,
          id: 'new_flayer',
          outFields: ["*"]
        });  


      // ***********************************************************************************************
      // This is VERY important.  Without the .on "load" it will function properly only 50% of the time!
      // ***********************************************************************************************                                                             
      new_flayer.on("load", lang.hitch(this, function () {

          console.log("_capabilityUpdateForm has been reached!")

          var dialogTitle="Create a new capability target"

          var updateFeature;

          var objectID = oid;
          var query = new Query();
          query.where = "ObjectID = '" + objectID + "'"; 

          new_flayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features){
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
            //edit_flayer.on('before-apply-edits', this.checkDeletes); 


          var layerInfos = [
            {
              'featureLayer': new_flayer,
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

          //add a save and cancel button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelButton = new Button({ label: "Cancel", "class": "cancelButton"},domConstruct.create("div"));


          var myDialog = new Dialog({
            id:    "newDialogId",
            title: dialogTitle,
            style: "width: 500px;  background-color:#FFF;",
            onHide: function() {
                    myDialog.destroyRecursive();}
          });

          domStyle.set(myDialog.domNode, 'visibility', 'hidden');// this is necessary to keep the dialog from jumping when repositioning near the top with domStyle.set at Dialog.show


          var edContent = '';
              edContent += '<div class="dialog-content" id="edContent">';
              edContent += '</div>';

          
          var editDialogNode = domConstruct.create('div', {innerHTML: edContent});

            domConstruct.place(editDialogNode, dom.byId("newDialogId"), 'last');
            domConstruct.place(attInspector.domNode, dom.byId("edContent"), 'first');

            domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");
            domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
            domConstruct.place(cancelButton.domNode, attInspector.domNode, "after"); 


          // ***********************************************************
          // Store the updates to apply when the save button is clicked
          //  Detect when user has not entered a name for the capability
          // *********************************************************** 
          attInspector.on("attribute-change", function(evt) {
            //store the updates to apply when the save button is clicked 
            updateFeature.attributes[evt.fieldName] = evt.fieldValue;

            if(updateFeature.attributes.Capability==null){
                  updateFeature.attributes.Capability="Undefined Capability";
            }

          });

 
          // *************************************************************
          // Save Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          saveButton.on("click", lang.hitch(this, function() {

            // check for null value in the Capability Field.  No change to any value will not trigger attribute-change event
            if(updateFeature.attributes.Capability==null){
                  updateFeature.attributes.Capability="Undefined Capability";
            }

            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);

                   this.afterNewCapabilityAdded();

                   //myDialog.hide;
                   //myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err);
                      }
                  );
            }));



          
          cancelButton.on("click", lang.hitch(this, function() {

            // no need to delete record if cancel is clicked when editing an existing record 

              updateFeature=[];
              myDialog.hide
              myDialog.destroyRecursive();

            // delete the record just added, if cancel is clicked after "Add Resource"
            // else{
            //   updateFeature.getLayer().applyEdits(null, null, [updateFeature],
            //   lang.hitch(this, function(adds,updates,deletes) {
            //       this.removeAddResPanel();
            //       updateFeature = [];

            //       myDialog.hide
            //       myDialog.destroyRecursive();

            //       }), function(err){
            //               console.log(err.message);
            //           }
            //       );
            //   }


            }));


          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {

                   this.afterCapabilityIsDeleted();

                   myDialog.hide;
                   myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
            }));


        myDialog.show().then(function () {
          domStyle.set(myDialog.domNode, "top", "100px");
          domStyle.set(myDialog.domNode, 'visibility', 'visible');
        });

     }))// only after new_flayer has loaded   

},



// ***************************************************
    // Create Attribute Inspector for editing a CAPABILITY
    // ***************************************************
    configureEditCapDialog: function (config, edit_flayer) {

      console.log("FUNCTION: configureEditCapDialog")

      var updateFeature;   

      var dialogTitle="Edit this Capability"


      var q = new Query();
            q.where = "GlobalId = '" + config.selectedCap.GlobalID + "'"; 

            edit_flayer.selectFeatures(q, FeatureLayer.SELECTION_NEW, lang.hitch(this, function(features){
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
            edit_flayer.on('before-apply-edits', this.checkDeletes); 



          var layerInfos = [
            {
              'featureLayer': edit_flayer,
              'showAttachments': false,
              'isEditable': true,
              'fieldInfos': [
                {'fieldName': 'Threat_Hazard', 'isEditable': true, 'label': 'Threat/Hazard:'},
                {'fieldName': 'Capability', 'isEditable': true, 'tooltip': 'Capability name', 'label': 'Core Capability:'},
                {'fieldName': 'Targets', 'isEditable': true, 'label': 'Target Capability:', "stringFieldOption": "textarea"},
                {'fieldName': 'Outcomes', 'isEditable': true, 'tooltip': 'List of desired outcomes', 'label': 'Outcomes', "stringFieldOption": "textarea"},
                {'fieldName': 'Impacts', 'isEditable': true, 'label': 'Impacts'},
                {'fieldName': 'Jurisdiction', 'isEditable': true, 'label': 'Jurisdiction:'},
                {'fieldName': 'ESF', 'isEditable': true, 'label': 'ESF:'}
              ]
            }
          ];

          var attInspector = new AttributeInspector({
            layerInfos: layerInfos
          }, domConstruct.create("div"));

          //add a save and cancel button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelButton = new Button({ label: "Cancel", "class": "cancelButton"},domConstruct.create("div"));


          var myDialog = new Dialog({
            id:    "newDialogId",
            title: dialogTitle,
            style: "position:relative; background-color:#FFF;",
            onHide: function() {
                    myDialog.destroyRecursive();}
          });

          domStyle.set(myDialog.domNode, 'visibility', 'hidden');// this is necessary to keep the dialog from jumping when repositioning near the top with domStyle.set at Dialog.show


          myDialog.startup();

          var edContent = '';
              edContent += '<div class="dialog-content" id="edContent">';
              edContent += '</div>';

          
          var editDialogNode = domConstruct.create('div', {innerHTML: edContent});

            domConstruct.place(editDialogNode, dom.byId("newDialogId"), 'last');
            domConstruct.place(attInspector.domNode, dom.byId("edContent"), 'first');

            domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");
            domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
            domConstruct.place(cancelButton.domNode, attInspector.domNode, "after"); 



          // ***********************************************************
          // Store the updates to apply when the save button is clicked
          // *********************************************************** 
          attInspector.on("attribute-change", function(evt) {
            //store the updates to apply when the save button is clicked 
            updateFeature.attributes[evt.fieldName] = evt.fieldValue;
            
            if(updateFeature.attributes.Capability==null){
                  updateFeature.attributes.Capability="Undefined Capability";
            }

          });


 
          // *************************************************************
          // Save Button has been clicked.  Clear edit panel and refresh
          // ************************************************************* 
          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);

                   this.afterExistingCapabilityIsEdited();

                   myDialog.hide;
                   myDialog.destroyRecursive();


                  }), function(err){
                          console.log(err);
                      }
                  );
            }));



          
          cancelButton.on("click", lang.hitch(this, function() {

            // no need to delete record if cancel is clicked when editing an existing record 

              updateFeature=[];
              myDialog.hide
              myDialog.destroyRecursive();


            }));


          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {

                  this.afterCapabilityIsDeleted();

                   myDialog.hide;
                   myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
            }));

        //myDialog.layout();
        //myDialog.show();

        myDialog.show().then(function () {
          domStyle.set(myDialog.domNode, "top", "100px");
          domStyle.set(myDialog.domNode, 'visibility', 'visible');
        });


      }





  });
});