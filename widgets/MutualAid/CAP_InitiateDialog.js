//This dialog will be called when the app opens to a new THIRA/capability service with no records
//

define([
    "dojo/_base/array",  
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/_base/connect",    
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/store/Memory", 
    "dojo/data/ItemFileReadStore",
    "dojo/promise/all",
    "dijit/form/FilteringSelect",
    "dijit/registry",
    "application/ThiraLayer",
    // "application/RES_TableConstructor",
    "dojo/on",
    "esri/geometry/Polygon",
    "esri/graphic",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/request",
    "dijit/Dialog",
    "dijit/form/Button"
],
  function (
    array,
    declare,
    lang,
    event,
    connect,
    dom,
    domConstruct,
    domStyle,
    domAttr,
    Memory,
    ItemFileReadStore,
    all,
    FilteringSelect,
    registry,
    ThiraLayer,
    // RES_TableConstructor,
    on,
    Polygon,
    Graphic,
    QueryTask,
    Query,
    FeatureLayer,
    esriRequest,
    Dialog,
    Button
  ) {
    return declare("", null, {
      initCapabilityForm: function () {
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

        this.set("capURL", this.url);
        this.stateData = [];
        this.countyData = [];
        this.stateURL = "http://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0";
        this.countyURL = "http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/0";
        this.stateName = ""; 
        this.countyName = ""; 
        this.configureEditDialog();
      },  

      configureEditDialog: function () {
        
        this.stateStore = new ItemFileReadStore({
          url: require.toUrl("config/stateList.json")
        });

        this.countyStore = new ItemFileReadStore({
          url: require.toUrl("config/countyList.json") 
          // typeMap: { "Name": esri.geometry.Extent}
         });
        
        this.stateFS = new FilteringSelect({
          id: "stateCmbBox",
          name:  "stateCmbBox",
          store: this.stateStore,
          searchAttr: "name"
        }, "stateCmbBox");

        this.countyFS = new FilteringSelect({
          id: "countyCmbBox",
          name:  "countyCmbBox",
          displayedValue: "Please select a state first.",
          label: "name",
          store: this.countyStore,
          searchAttr: "name"
        }, "countyCmbBox");
       
        //add a save button next to the delete button
        var saveButton = new Button({ label: "Save", "class": "saveButton", "id": "saveButton"},domConstruct.create("div"));
        var cancelEditButton = new Button({ label: "Cancel", "class": "cancelEditButton"},domConstruct.create("div"));

        var edContent = '';
        edContent += '<div class="' + this.socialCSS.dialogContent +' id="initCapDialog">';
        edContent += '<div>This application has detected that the THIRA Capability Layer has not been initialized. ' +
                      'Please identify the jurisdiction that your plans correspond to below.</div>';
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

        connect.connect(this.stateFS, "onChange", this, this.stateChange);
        connect.connect(this.countyFS, "onChange", this, this.countyChange);
        
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
        
        var query = new Query();
        var geomURL, promises;

        if (typeof countyName == 'undefined') {
          geomURL = this.stateURL;
          query.where = "STATE_NAME = '" + stateName + "'";
        }
        else{
          geomURL = this.countyURL;
          query.where = "STATE_NAME = '" + stateName + "' AND NAME = '" + countyName + "'";
        }
        var getGeometryTask = new QueryTask(geomURL);
        query.returnGeometry = true;
        query.returnCount = '1';

        var getPlaceGeom = getGeometryTask.execute(query);
        promises = getPlaceGeom;

        //open initAddRecord on Cap_AddRecordDialog.js
        promises.then(lang.hitch(this, this.initAddRecord));
      },

      stateChange: function(){  
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

        // this.showCAP_Resources();  
        // var defQuery = ["1=1"];
        // var url = this.this_config.capabilitiesUrl;
        // this.queryCapabilitiesLayer(url, defQuery);
        //this.removeDOMElements_IfTheyExist("aiDialog");

      }
    });
  });