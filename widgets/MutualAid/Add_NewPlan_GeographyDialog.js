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

  'dojo/data/ItemFileReadStore',
  'dojo/promise/all',
  'dijit/form/FilteringSelect',
  'dijit/registry',

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

function (declare, array, lang, html, on, domConstruct, mouse, query, dom, topic, Memory, ComboBox, 
        ItemFileReadStore, all, FilteringSelect,registry,
        Polygon, Extent, Button, FeatureLayer, RelationshipQuery, QueryTask, Query, AttributeInspector,
        _WidgetBase,Dialog,domStyle) {
  
          return declare("", null, {



    /*************************************************



    **************************************************/
    constructor: function(options){

        this.stateData = [];
        this.countyData = [];
        this.stateURL = "http://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0";
        this.countyURL = "http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/0";
        this.stateName = ""; 
        this.countyName = "";

    },

    startup: function(){
      this.inherited(arguments);





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
      
      //this.removeEditPanel();
      topic.publish('DELETED_CAPABILITY');

    },

    afterCapabilityIsAdded: function(){

      //this.removeEditPanel();
      topic.publish('ADDED_CAPABILITY');

    },

     afterCapabilityIsSaved: function(){
    //   this.removeDijitBtns();
    //   this.removeEditPanel();
    //   this.refreshCapInfoId();
    //   topic.publish('REFRESH_CAPINFO');
     },

//DO NOT REMOVE CAP INFO panel when adding capabilities
    afterAddEditDeletedCapability: function(){
      //this.removeDijitBtns();
        var thisDialog = dijit.byId("newDialogId");
            if(thisDialog){
                //thisDialog.hide();
                thisDialog.destroyRecursive();
            }

      topic.publish('ADDED_CAPABILITY');
    },

    // afterCapDelete: function(){
    //   this.removeDijitBtns();
    //   this.refreshCapInfoId();
    //   topic.publish('CAP_DELETED');
    // },

    // removeAddResPanel:function(){
    //   this.removeDijitBtns();
    //   this.refreshCapInfoId();
    //   topic.publish('REFRESH_CAPINFO');

    // },


//  ************************************************
//  pass what you need to create a fLayer Object  
//
//  ************************************************
    initializeNewPlan: function(formType,config, capURL){

      this.inherited(arguments);

      this.config =  config


      var updateFeature;

        this.stateStore = new ItemFileReadStore({
          url: require.toUrl("widgets/MutualAid/mutualAid_configs/stateList.json")
        });

        this.countyStore = new ItemFileReadStore({
          url: require.toUrl("widgets/MutualAid/mutualAid_configs/countyList.json") 
          // typeMap: { "Name": esri.geometry.Extent}
         });
        
        this.stateFS = new FilteringSelect({
          id: "stateCmbBox",
          name:  "stateCmbBox",
          store: this.stateStore,
          searchAttr: "name",
          onChange: lang.hitch(this, function(value){
            this.stateChange(value);
          })
        }, "stateCmbBox");

        this.countyFS = new FilteringSelect({
          id: "countyCmbBox",
          name:  "countyCmbBox",
          displayedValue: "Please select a state first.",
          label: "name",
          store: this.countyStore,
          searchAttr: "name",
          onChange: lang.hitch(this, function(value){
            this.countyChange(value);
          })
        }, "countyCmbBox");




        //add a save button next to the delete button
        var saveButton = new Button({ label: "Save", "class": "saveButton", "id": "saveButton"},domConstruct.create("div"));
        var cancelEditButton = new Button({ label: "Cancel", "class": "cancelEditButton"},domConstruct.create("div"));

        var edContent = '';
        edContent += '<div id="initCapDialog">';
        edContent += '<div>This application has detected that you have created a new plan. <BR>' +
                      'Please identify the jurisdiction that your plan corresponds to below.<BR></div>';
        edContent += '<div id="stateLabel">Select a state</div>';
        edContent += '<div id="countyLabel">Select a county</div>';
        edContent += '<div id="inspector_parent"> </div>';
        edContent += '<div id="stateCmbBox"> </div>';
        edContent += '</div>';
        
        var addDialogNode = domConstruct.create('div', {
          innerHTML: edContent
        });

        domConstruct.place(addDialogNode, document.body, 'last');
        domConstruct.place(this.stateFS.domNode, "stateLabel", "after");
        domConstruct.place(this.countyFS.domNode, "countyLabel", "after");
        domConstruct.place(saveButton.domNode, "inspector_parent", "after");
        domConstruct.place(cancelEditButton.domNode, "inspector_parent", "after");

        this._addDialog = new Dialog({
          title: "Intitiate New Capability Layer",
          draggable: true,
          id: 'ciDialog'
        }, addDialogNode);

        
        this._addDialog.connect(this._addDialog, "hide", lang.hitch(this, function() {
          this.hideInitCapDialog();
        }));

        saveButton.on("click", lang.hitch(this, function() {
          console.log('save!!!!!');
          if (this.countyName === ""){
            console.log(this.stateName);
            this._getPlaceGeom(this.stateName);
          }
          if (this.countyName !== ""){
            console.log(this.countyName);
            this._getPlaceGeom(this.stateName, this.countyName);
          }
          this.hideInitCapDialog();
        }));
        
        cancelEditButton.on("click", lang.hitch(this, function() {
          console.log('cancel!!!!!');
          this.hideInitCapDialog();
        }));

        this._addDialog.show();
    },

      _getPlaceGeom: function(stateName, countyName){
        
        var q = new Query();
        var geomURL, promises;

        if (typeof countyName == 'undefined') {
          geomURL = this.stateURL;
          q.where = "STATE_NAME = '" + stateName + "'";
        }
        else{
          geomURL = this.countyURL;
          q.where = "STATE_NAME = '" + stateName + "' AND NAME = '" + countyName + "'";
        }
        var getGeometryTask = new QueryTask(geomURL);
        q.returnGeometry = true;
        q.returnCount = '1';

        var getPlaceGeom = getGeometryTask.execute(q);
        promises = getPlaceGeom;

        //open initAddRecord on Cap_AddRecordDialog.js
        promises.then(lang.hitch(this, this.createNewPlanGeography));
      },

      stateChange: function(val){  
          this.stateName = this.stateFS.get("value");
          // var placeName = this.stateFS.get("value");
          if (this.stateName !== "") {
            //dijit.byId(this.id + '.ddDialog').onCancel(); //this will close the drop down button
            //query the data store to get the extent set the map extent equal to the extent from the store
            this.countyFS.attr({ disabled: false, displayedValue: "" });
            this.countyFS.query = { state_name: this.stateName };
            this.countyFS.set("store", this.countyStore);
              
            //give focus to the county filtering select
            this.countyFS.focus();
            this.stateStore.fetchItemByIdentity({
              identity: this.stateName, 
              // onItem: this.handleExtent, 
              onError: this.errorHandler
            });
          }
      },

      countyChange: function(){
          this.countyName = this.countyFS.get("displayedValue");
      },

      
          


      // // Function to hide attribute inspector Dialog windows
      hideInitCapDialog: function(){
        var thisDialog = dijit.byId("initCapDialog");
            if(thisDialog){
                thisDialog.hide();
                thisDialog.destroyRecursive();
            }
        var ccb = dijit.byId("countyCmbBox");
        if(ccb){
          ccb.destroyRecursive();
        }        
        var scb = dijit.byId("stateCmbBox");
        if(scb){
          scb.destroyRecursive();
        }

        var aiD = dijit.byId("ciDialog");
        if(aiD){
          aiD.destroyRecursive();
        }


      },


// ******************************************************
// insert record using reference geography for a new Plan
// ******************************************************

 createNewPlanGeography: function (geography) {

    var capArr = this.config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capabilities'});

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


                    var polygon = new Polygon(geography.features[0].geometry);

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
                        this._newCapabilityUpdateForm(addResults[0].objectId, capURL);

                      }), function(err){
                              console.log(err);
                          }
                      );


                  }))//END on Load

        } // end check on relationship classes

        else{

          alert("There is an error with the REST service.  The name for a related table is likely missing.  This can happen when re-publishing a layer package.  Please repair the service schema.")

        }
        

},


    _newCapabilityUpdateForm: function (oid, capURL) {

      var new_flayer = new FeatureLayer(capURL, {
          mode: FeatureLayer.MODE_ONDEMAND,
          id: 'new_flayer',
          outFields: ["*"]
        });  


      // ***********************************************************************************************
      // This is VERY important.  Without the .on "load" it will function properly only 50% of the time!
      // ***********************************************************************************************                                                             
      new_flayer.on("load", lang.hitch(this, function () {

          console.log("_capabilityUpdateForm with new geography has been reached!")
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

         domStyle.set(myDialog.domNode, 'visibility', 'hidden');// this is necessary to keep the dialog from jumping when repositioning near the top with dialog.show().then



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

                   this.afterAddEditDeletedCapability();
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
            }));


          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {

                   this.afterCapDelete();

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

    }




  });
});