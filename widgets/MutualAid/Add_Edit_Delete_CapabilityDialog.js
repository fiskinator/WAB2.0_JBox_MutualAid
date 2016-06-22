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
      this.refreshCapInfoId();
      topic.publish('REFRESH_CAPINFO');
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



      if(formType== "editCap")
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
                  edit_flayer.on('before-apply-edits', this.checkDeletes); 


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

/*
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
  */
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

        } 




        else{

          alert("There is an error with the REST service.  The name for a related table is likely missing.  This can happen when re-publishing a layer package.  Please repair the service schema.")

        }



      }


    // *************************************************************
    // Add Capability Target
    //
    //
    // ************************************************************* 


      if(formType== "addCap"){

          this._getGeometry(current_config.capabilitiesUrl, config);


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


     // ***************************************************
    // Create Attribute Inspector for adding NEW RESOURCE
    // ***************************************************
    configureEditCapDialog: function (config, edit_flayer) {

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
            style: "width: 500px; position:relative; top:250px; background-color:#FFF;",
            onHide: function() {
                    myDialog.destroyRecursive();}
          });



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
          });


 
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

                   this.afterAddEditDelete();

                   myDialog.hide;
                   myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
            }));


        myDialog.show();

      }





  });
});