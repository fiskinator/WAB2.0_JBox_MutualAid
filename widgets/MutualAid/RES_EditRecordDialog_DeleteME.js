define([
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/store/Memory", 
    "dijit/form/ComboBox",
    // "application/ThiraLayer",
    "dojo/on",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/dijit/AttributeInspector",
    "esri/request",
    "dijit/Dialog",
    "dijit/form/Button",

    "dijit/_WidgetBase",
    "dojo/topic",

],
  function (
    arrayUtils,
    declare,
    lang,
    event,
    dom,
    domConstruct,
    domStyle,
    domAttr,
    Memory,
    ComboBox,
    // ThiraLayer,
    on,
    QueryTask,
    Query,
    FeatureLayer,
    AttributeInspector,
    esriRequest,
    Dialog,
    Button,
    _WidgetBase,
    topic
  ) {
    return declare("", null, {
      initResEditForm: function (resGID,resName, whichPage) {
        // css classes for social layers

        this.socialCSS = {
          iconAttention: "icon-attention-1",
          dialogContent: "dialog-content",
          layerSettingsHeader: "layer-settings-header",
          layerSettingsMoreInfo: "layer-settings-more-info",
          layerSettingsInput: "layer-settings-input",
          layerSettingsDescription: "layer-settings-description",
          layerSettingsSubmit: "layer-settings-submit",
          layerSettingsSelect: "layer-settings-select",
          authStatus: "twitter-auth-status",
          clear: "clear"
        };

        // css classes for social layers
        this.set("fromPage", whichPage);

        //Get RTLT data from JSON
        var rtltData = [];
        dojo.xhrGet({
            url: "config/rtlt.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                // console.log(obj[0].attributes.Category);
                rtltData = obj;
            },
            error: function(err) {
              /* this will execute if the response couldn't be converted to a JS object,
                   or if the request was unsuccessful altogether. */
               console.log(err);
            }
        });

        var resArr = this.this_config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
        var resURL = resArr[0].originURL;

        var capResources_flayer = new FeatureLayer(resURL, {
              mode: FeatureLayer.MODE_ONDEMAND,
              id: 'capResources_flayer',
              outFields: ["ResourceName","ResourceType","NbrRequired","Category","Type"]
            });  

        capResources_flayer.on("load", lang.hitch(this, function () {

        var updateFeature;
        var query = new Query();
        query.where = "GlobalID = '" + resGID + "'"; 
        query.outFields = "*";

        capResources_flayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features){
            if (features.length > 0) {
              //store the current feature
              updateFeature = features[0];
            }
            else {
              console.log('no features to update');
            }
        });

        this.rtltResources = [];

        for (var i=0; i<rtltData.length; i++){
          // this.rtltCategories.push({
          //   "name": rtltData[i].attributes.Category,
          //   "id": i
          //   });

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
              {'fieldName': 'Category', 'isEditable': true, 'label': 'Resource Category', 'customField': rtltCmbBox },
              {'fieldName': 'ResourceName', 'isEditable': true, 'customField': rtltCmbBox2 },
              {'fieldName': 'ResourceType', 'isEditable': true},
              {'fieldName': 'NbrRequired','isEditable': true}];    

          var layerInfos = [{
              'featureLayer': capResources_flayer,
                  'showAttachments': false,
                  'isEditable': true,
                  'fieldInfos' : fieldInfos
          }];

          var attInspector = new AttributeInspector({
            layerInfos: layerInfos
          }, domConstruct.create("div"));

          //add a save button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelEditButton = new Button({ label: "Cancel", "class": "cancelEditButton"},domConstruct.create("div"));
          
          var edContent = '';
          edContent += '<div class="' + this.socialCSS.dialogContent +' id="edContent">';
          edContent += '<div id="inspector_parent"> </div>';
          edContent += '</div>';
          edContent += '</div>';
          
          var editDialogNode = domConstruct.create('div', {
            innerHTML: edContent
          });

          domConstruct.place(editDialogNode, document.body, 'last');
          domConstruct.place(attInspector.domNode, "inspector_parent", 'last');
          domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
          domConstruct.place(cancelEditButton.domNode, attInspector.domNode, "after");
          domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");

          this._editDialog = new Dialog({
            title: "Edit " + resName,
            draggable: true,
            id: "aiDialog"
          }, editDialogNode);

          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);
                // this.removeDOMElements_IfTheyExist('aiDialog');
                this.hideREDialog();
                  }), function(err){
                          console.log(err);
                      }
                  );
            }));

          cancelEditButton.on("click", lang.hitch(this, function() {
            this.hideREDialog();
            updateFeature = [];
          }));

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
            // console.log(rtltResourcesFilter);
            // console.log(rtltResourcesFilter);E

          }));

          attInspector.on("next", function(evt) {
            updateFeature = evt.feature;
            console.log("Next " + updateFeature.attributes.objectid);
          });

          attInspector.on("delete", lang.hitch(this, function() {
            alert('do you really want to delete this?!?!');
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('removed record: ' + deletes[0].objectId);
                // this.removeDOMElements_IfTheyExist('aiDialog');
                this.hideREDialog();
                  }), function(err){
                          console.log(err.message);
                      }
                  );
          }));   

          this._editDialog.connect(this._editDialog, "hide", lang.hitch(this, function() {
            this.hideREDialog();
            updateFeature = [];
          }));
          /**/
          
          this._editDialog.show();
        }));
      },

      // Function to hide attribute inspector Dialog windows
      hideREDialog: function(){
          var d = dijit.byId("aiDialog");
          if(d){ d.destroyRecursive(false);} 

          var d1 = dijit.byId("rtltCmbBox");
          if(d1){ d1.destroyRecursive(false);}     
          
          var d2 = dijit.byId("rtltCmbBox2");
          if(d2){ d2.destroyRecursive(false);}   

          this.createCapResourceArray(this.fromPage);  // this can be clicked from report or from the page
      }

    });
  });