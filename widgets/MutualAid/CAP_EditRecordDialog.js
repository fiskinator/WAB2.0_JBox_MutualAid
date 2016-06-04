define([
    "dijit/registry",
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/window",
    "dojo/dom-class",
    "dojo/Stateful",
    "dojo/Evented",
    "dojo/dom-construct",
    "dojo/fx/easing",
    "dojo/number",
    "dojo/on",
    "dojo/request",
    "dijit/Dialog",

    "dojo/store/Memory",
    "dojox/charting/action2d/Highlight",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/Chart",
    "dojox/charting/Chart2D",
    "dojox/charting/plot2d/StackedColumns",
    "dojox/charting/themes/MiamiNice",
    
    "esri/geometry/Extent",
    "dijit/form/Button",
    "esri/layers/FeatureLayer",
    "esri/tasks/RelationshipQuery",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/dijit/AttributeInspector",


    //"application/CAP_InitiateDialog",
   // "application/CAP_EditRecordDialog",
    //"application/RES_AddRecordDialog",
    //"application/RES_EditRecordDialog",
   // "application/RESP_EditRecordDialog",
    //"application/RESP_AddRecordDialog"
],
    function (
        registry,array,declare,lang,dom, win, domClass, Stateful, Evented,
        domConstruct,easing,numbr,on,request, Dialog, 
        Memory, Highlight,Tooltip,Chart, Chart2D, StackedColumns, MiamiNice,
        Extent, Button, FeatureLayer, RelationshipQuery, QueryTask, Query, AttributeInspector
 //       CAP_InitiateDialog,CAP_EditRecordDialog,RES_AddRecordDialog,RES_EditRecordDialog, RESP_EditRecordDialog,RESP_AddRecordDialog
    ) {

        return declare("CAP_EditRecordDialog",
//            [Stateful, Evented, CAP_EditRecordDialog, RES_AddRecordDialog, RES_EditRecordDialog, RESP_EditRecordDialog,RESP_AddRecordDialog], { 

            [Stateful], { 
             options: {
                    selected_CapId: null,
                    selected_Capability: null,
                    current_config: null,

        },   

        ////////////////////////////////////////////////////////////////////////////////
        // Constructor creates new partner table for selected Resource
        // Passing defaule values set in CAP_Summery at function:  _resPartnerClicked()
        ////////////////////////////////////////////////////////////////////////////////
        constructor: function (options) {
            // mixin options
            var defaults = lang.mixin({}, this.options, options);
            // properties
              this.set("selected_CapId", defaults.capID);           
              this.set("selected_Capability", defaults.capName);
              this.set("current_config", defaults.this_config);

              this.configureEditDialog();

        },



        ////////////////////////////////////////////////////////////////////////////////
        // Constructor creates new partner table for selected Resource
        // Passing defaule values set in CAP_Summery at function:  _resPartnerClicked()
        ////////////////////////////////////////////////////////////////////////////////
 

      configureEditDialog: function () {
        this.inherited(arguments);

        var resArr = this.current_config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capabilities'});
        var resURL = resArr[0].originURL;

        var cap_flayer = new FeatureLayer(resURL, {
              mode: FeatureLayer.MODE_ONDEMAND,
              id: 'capResources_flayer',
              outFields: ["*"]
            }); 

          var updateFeature;
          var q = new Query();
          q.where = "GlobalId = '" + this.selected_CapId + "'"; 
          // query.where = "1=1"; 
          cap_flayer.selectFeatures(q, FeatureLayer.SELECTION_NEW, function(features){
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
              'featureLayer': cap_flayer,
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

          attInspector = new AttributeInspector({
            layerInfos: layerInfos
          }, domConstruct.create("div"));

          //add a save button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelEditButton = new Button({ label: "Cancel", "class": "cancelEditButton"},domConstruct.create("div"));
          
          var edContent = '';
              edContent += '<div class="dialog-content" id="edContent">';
              edContent += '<div id="inspector_parent"> </div>';
              edContent += '</div>';
          
          var editDialogNode = domConstruct.create('div', {
            innerHTML: edContent
          });

          domConstruct.place(editDialogNode, document.body, 'last');
          domConstruct.place(attInspector.domNode, "inspector_parent", 'last');
          domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");
          domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
          domConstruct.place(cancelEditButton.domNode, attInspector.domNode, "after");

          this._editDialog = new Dialog({
            title: "Edit " + this.selected_Capability,
            style: "height:400px;",

            draggable: true,
            id: "aiDialog"
          }, editDialogNode);

          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('updated record: ' + updates[0].objectId);
                this.hideCapEditDialog();

                  }), function(err){
                          console.log(err);
                      }
                  );
            }));

          cancelEditButton.on("click", lang.hitch(this, function() {
            this.hideCapEditDialog();
            updateFeature = [];
          }));

          attInspector.on("attribute-change", function(evt) {
            //store the updates to apply when the save button is clicked 
            updateFeature.attributes[evt.fieldName] = evt.fieldValue;
          });

          attInspector.on("next", function(evt) {
            updateFeature = evt.feature;
            console.log("Next " + updateFeature.attributes.objectid);
          });

          attInspector.on("delete", lang.hitch(this, function() {
            alert('do you really want to delete this?!?!');
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('removed record: ' + deletes[0].objectId);
                this.hideCapEditDialog();
                  }), function(err){
                          console.log(err.message);
                      }
                  );
          }));

          // this works for updating
          this._editDialog.connect(this._editDialog, "hide", lang.hitch(this, function() {
            this.hideCapEditDialog();
            updateFeature = [];
          }));
          
          this._editDialog.show();
        },

              // Function to hide attribute inspector Dialog windows
      hideCapEditDialog: function(){
          var d = dijit.byId("aiDialog");
          if(d){ d.destroyRecursive(false);} 

          var d1 = dijit.byId("rtltCmbBox");
          if(d1){ d1.destroyRecursive(false);}     
          
          var d2 = dijit.byId("rtltCmbBox2");
          if(d2){ d2.destroyRecursive(false);}   

          //this.showCAP_Resources();

          //this._hideDivElementsOnTheMap();  
      }

    });
  });