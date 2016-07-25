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

  'esri/graphic',
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
          Memory, ComboBox, Graphic, Polygon, Extent, Button, FeatureLayer, RelationshipQuery, QueryTask, Query, AttributeInspector,
          _WidgetBase,Dialog,domStyle) {
  
          return declare("Add_Edit_Delete_PartnerDialog", null, {



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



    },

    startup: function(){
      this.inherited(arguments);



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

      // Check for previous comboBox dijits placed in popups
 //     var cbox = dijit.byId("rtltCmbBox");
 //           if(cbox){ cbox.destroyRecursive();}// remove dijit if it already exists
 //     var cbox2 = dijit.byId("rtltCmbBox2");
 //           if(cbox2){cbox2.destroyRecursive();}// remove dijit if it already exists

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




    _createParCustomDomains:function(formType, config){

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



    _createPartnerDomainFromPlan:function(formType, config, resGID, capID, parGID, clickedFrom){



                 var entirePartnerArr=[];

                    var qTable = config.relates.filter(function(item) { return item.origin === 'Mission_AssistingOrgs'; });
                      if (qTable.length){
                          var qTableUrl = qTable[0].originURL;

                          console.log('getUniquePartnerListFOR_ENTIRE_PLAN - task defined');

                          var whereQuery = "1=1";
                          var query = new esri.tasks.Query();

                              // Set statistic to create unique list of Partners for a capability
                              var statDef = new esri.tasks.StatisticDefinition();
                                  statDef.statisticType = "count";
                                  statDef.onStatisticField = "Organization";
                                  statDef.outStatisticFieldName = "SummaryCount";

                              // Define query to group by Organization and sort in decending order 
                              var queryTask = new QueryTask(qTableUrl);
                                  //query.outFields = ['SummaryCount','Organization'];
                                  query.where = whereQuery;
                                  query.groupByFieldsForStatistics = ["Organization"];
                                  query.outStatistics = [ statDef ];
                                  query.returnGeometry = false;
                                  query.orderBy = "SummaryCount";
                                  queryTask.execute(query).then(lang.hitch(this, function(response, i) {

                                      //this.config.partnersAddedToEntirePlan=response.features;
                                      array.forEach(response.features, lang.hitch(this, function(item,i) {
                                        if ((item.attributes.Organization!=null) && (item.attributes.Organization!="")){
                                          entirePartnerArr.push({
                                              name: item.attributes.Organization,
                                              Organization:item.attributes.Organization,
                                              SummaryCount: item.attributes.SummaryCount,
                                              id: item.attributes.Organization
                                          });
                                        }// End if to remove blanks
                                      }));// end loop

                                      //console.log(entirePartnerArr)

                                      this._createParFormComponents(formType, config, resGID, capID, parGID, clickedFrom, entirePartnerArr)

                                      }), function(err){
                                          console.log("Error Creating Partner Array " + err);
                                          //alert("Error Creating Partner Domain")
                                        }   
                                  );
                      }
                      else{
                        console.log("Error determining URL to Partner committments Table")
                        alert("Error determining URL to Partner Committments Table")
                      }


    },
  

//  ************************************************
//  pass what you need to create a fLayer Object  
//   resGID,capID,rName
//  ************************************************
    _createParFormComponents: function(formType, config, resGID, capID, parGID, clickedFrom, entirePartnerArr){

      this.inherited(arguments);

      // *******************************************************************
      // Create INSPECTOR_PARENT Anchor for placing each attribute inspector

      var updateFeature;
          this.partnerStoreArr=[];
          this.partnerStoreArr=entirePartnerArr;


      //for (var i=0; i < entirePartnerArr.length; i++){
      //    this.partnerStoreArr.push({
      //      "name": entirePartnerArr[i].Organization,
      //      "id": entirePartnerArr[i].id
      //      });
      //}    


    // ******************************
    // ADD NEW RESOURCE ENTRY FORM
    // 
    // *******************************      
     if(formType=="editPar"||"addPar"){

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

        //var resArr = config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
        var resArr = config.relates.filter(function(item) { return item.queryTableName === 'Capabilities' && item.origin === 'Mission_AssistingOrgs'; });
 

        if(resArr.length>0){

                var parURL = resArr[0].originURL;

                var edit_flayer = new FeatureLayer(parURL, {
                      mode: FeatureLayer.MODE_ONDEMAND,
                      id: 'edit_flayer',
                      outFields: ["Organization","JurisdictionType","Agreement","Comments","NmbCommited","ResourceKey", "AgreementDetails", "CapabilityFK", "ResourceFK"]
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
                      if(formType=="addPar"){

                            var newAttributes = {
                               "attributes":{
                                'Organization' : '',
                                'JurisdictionType' : '',
                                'Agreement' : '',
                                'Comments' : '',
                                'NmbCommited' : 0,
                                'ResourceKey' : '',
                                'AgreementDetails' :'',
                                'CapabilityFK': capID,
                                'ResourceFK': resGID
                             }};

                            // can set the location of the resource here, currently configured to pass no geometry
                            //var point = new Point( {"x": 0, "y": 0, "spatialReference": {"wkid": 4326 }});
                          var graphic = new Graphic(null, null, [newAttributes]);


                            edit_flayer.applyEdits([graphic], null, null,lang.hitch(this, function(addResults) {
                                var oid = addResults[0].objectId;
                                console.log('inserted record: ' + oid); 
                                this.configureParDialog(oid, config, edit_flayer, resGID, capID, parGID, clickedFrom);
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
                      if(formType=="editPar"){
                          
                          this.configureParDialog(null, config, edit_flayer, resGID, capID, parGID, clickedFrom);

                      }

              }))//END on Load

        } 




        else{

          alert("There is an error with the REST service.  The name for a related table is likely missing.  This can happen when re-publishing a layer package.  Please repair the service schema.")

        }
      }// END RESOURCE SECTION

  },



    // ***************************************************
    // Create Attribute Inspector for adding NEW RESOURCE
    // ***************************************************
    configureParDialog: function (oid, config, edit_flayer, resGID, capID, parGID, clickedFrom) {

      var updateFeature;   

    // Check for previous comboBox dijits
      var pPick = dijit.byId("partnerPickList");


      //var cbox2 = dijit.byId("rtltCmbBox2");

      if(pPick){// Must catch this in more than one place
        pPick.destroyRecursive();}// remove dijit if it already exists
      //if(cbox2){cbox2.destroyRecursive();}// remove dijit if it already exists


      // Create Query for editing selected partner Resource using GlobalID
      if(oid==null){

          var query = new Query();
          query.where = "GlobalID = '" + parGID + "'"; 
          query.outFields = ["Organization","JurisdictionType","Agreement","Comments","NmbCommited","AgreementDetails"];

          var dialogTitle="Edit this Partner Committment"

      }

      // Create query for added resource partner using OID that was just created
      else{

          var query = new Query();
          query.where = "ObjectID = '" + oid + "'"; 
          query.outFields = ["Organization","JurisdictionType","Agreement","Comments","NmbCommited","AgreementDetails","CapabilityFK", "ResourceKey", "ResourceFK"];

          var dialogTitle="Add a new partner for this resource"

      }


        edit_flayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features){
            if (features.length > 0) {

              //store the current feature
              // Assign Capability and Resource Relationship values to the Partner Record!
              updateFeature = features[0];
              updateFeature.attributes.CapabilityFK = capID;
              updateFeature.attributes.ResourceFK = resGID;
            }
            else {
              console.log('no features to update');
            }
        });

          this.parStoreMem = new Memory({
              idProperty: "id",
              data: this.partnerStoreArr
          }); 

          var partnerPickList = new ComboBox({
            id: "partnerPickList",
            name:  "partnerPickList",
            store: this.parStoreMem,
            placeHolder: "Select a resource partner"
          }, "partnerPickList");


          partnerPickList.startup();

                var layerInfos = [
                  {
                    'featureLayer': edit_flayer,
                    'showAttachments': false,
                    'isEditable': true,
                    'fieldInfos': [
                        {'fieldName': 'Organization', 'isEditable': true, 'customField': partnerPickList, 'label': 'Resource Partner'},
                        {'fieldName': 'JurisdictionType', 'isEditable': true, 'tooltip': 'Jurisdiction Type', 'label': 'Jurisdiction Type'},
                        {'fieldName': 'NmbCommited', 'isEditable': true, 'tooltip': 'Total # of Resources Commited', 'label': '# Commited'},
                        {'fieldName': 'Agreement', 'isEditable': true, 'tooltip': 'Agreement', 'label': 'Agreement'},
                        {'fieldName': 'AgreementDetails', 'isEditable': true, 'tooltip': 'Agreement Details', 'label': 'Agreement Details'},
                        {'fieldName': 'Comments', 'isEditable': true, 'tooltip': 'Comments', 'label': 'Comments'}
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
            style: "background-color:#FFF;",
            onHide: function() {
                    myDialog.destroyRecursive();}
          });

         domStyle.set(myDialog.domNode, 'visibility', 'hidden');// this is necessary to keep the dialog from jumping when repositioning near the top with dialog.show().then


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

                  if(clickedFrom=="NO REFRESH"){

                  }
                  else{
                    this.afterAddEditDelete();
                  }

                   

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
                  this.removeAddResPanel();
                  updateFeature = [];

                  myDialog.hide
                  myDialog.destroyRecursive();

                  }), function(err){
                          console.log(err.message);
                      }
                  );
              }


            }));


          attInspector.on("delete", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {

                  if(clickedFrom=="NO REFRESH"){

                  }
                  else{
                    this.afterAddEditDelete();
                  }

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

      },

    // ***********************************************************************
    // Check to make sure the person wants to 
    // This will interupt the applyEdits process so that a delete is not made
    // ***********************************************************************

    checkDeletes: function(results){

        var ok = true;  

        if(results.adds==undefined && results.updates==undefined && results.deletes!=undefined){

              if(confirm("Remove this resource committment?")){ 

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