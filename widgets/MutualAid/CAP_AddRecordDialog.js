define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",

    //"application/ThiraLayer",
    "dojo/on",
    "esri/geometry/Polygon",

    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/graphic",
    
    "esri/layers/FeatureLayer",
    "esri/dijit/AttributeInspector",

    "esri/request",
    "dijit/Dialog",
    "dijit/form/Button"
],
  function (
    declare,
    lang,
    event,
    dom,
    domConstruct,
    domStyle,
    domAttr,
    //ThiraLayer,
    on,
    Polygon,
    QueryTask,
    Query,
    Graphic,
    FeatureLayer,
    AttributeInspector,
    esriRequest,
    Dialog,
    Button
  ) {
    return declare("", null, {
      initAddRecord: function (geometry) {
        // css classes for social layers
        //this.set("selected_CapId", capId);


        // 1) Insert Record into Capabilities Feature Layer with no attributes
        // 1) Using the snippet containing logic for getting rings from an individual capability you figured out a few weeks back
        // 2) Get the ObjectId that was assigned to that record
        // 3) Open Attribute Inspector for that given Object ID
        // 4) provide a cancel button to delete that object ID if it was clicked erronously
        //

        // social layer infos
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

        if (typeof geometry == 'undefined') {
          this._getGeometry();
        }
        else{
          this._addCapability(geometry);
        }
        

        // this.configureAddDialog();

      },  

        _getGeometry: function(){
          var geomURL = this.featureLayer.url;
          var getGeometryTask = new QueryTask(geomURL);
          var query = new Query();
            query.where = '1=1';
            query.returnGeometry = true;
            query.returnCount = '1';
          getGeometryTask.execute(query).then(lang.hitch(this,this._addCapability));
       
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

          this.featureLayer.applyEdits([graphic], null, null, 
            lang.hitch(this, function(addResults) {

              console.log('inserted record: '); 
              console.log(addResults[0].objectId);
              this.configureAddDialog(addResults[0].objectId);
            }), function(err){
                    console.log(err);
                }
            );

        },

      configureAddDialog: function (oid) {

          var objectID = oid;
          var updateFeature;
          var query = new Query();
          query.where = "ObjectID = '" + objectID + "'"; 

          this.featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features){
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
              'featureLayer': this.featureLayer,
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

          //add a save button next to the delete button
          var saveButton = new Button({ label: "Save", "class": "saveButton"},domConstruct.create("div"));
          var cancelButton = new Button({ label: "Cancel", "class": "cancelButton"},domConstruct.create("div"));

          var addContentDiv = '';
          addContentDiv += '<div class="' + this.socialCSS.dialogContent +' id="addContentDiv">';

          addContentDiv += '<div id="add_inspector_parent"> </div>';
          addContentDiv += '</div>';
          
          var addDialogNode = domConstruct.create('div', {
            innerHTML: addContentDiv
          });

          domConstruct.place(addDialogNode, document.body, 'last');
          domConstruct.place(attInspector.domNode, "add_inspector_parent", 'last');
          domConstruct.place(attInspector.deleteBtn.domNode, attInspector.domNode, "after");
          domConstruct.place(saveButton.domNode, attInspector.domNode, "after");
          domConstruct.place(cancelButton.domNode, attInspector.domNode, "after");          

          this._addDialog = new Dialog({
            title: "Add New Capability",
            draggable: true,
            id: 'aiDialog'
          }, addDialogNode);
          
          saveButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, [updateFeature], null,
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('saved record: ' + updates[0].objectId);
                this.removeDOMElements_IfTheyExist('aiDialog');
                this.hideDialog();
                  }), function(err){
                          console.log(err);
                      }
                  );
            }));

          cancelButton.on("click", lang.hitch(this, function() {
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('removed record: ' + deletes[0].objectId);
                this.removeDOMElements_IfTheyExist('aiDialog');
                this.hideDialog();
                  }), function(err){
                          console.log(err.message);
                      }
                  );
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
                this.removeDOMElements_IfTheyExist('aiDialog');
                this.hideDialog();
                  }), function(err){
                          console.log(err.message);
                      }
                  );
            }));
        
          this._addDialog.connect(this._addDialog, "hide", lang.hitch(this, function(){
            updateFeature.getLayer().applyEdits(null, null, [updateFeature],
              lang.hitch(this, function(adds,updates,deletes) {
                console.log('removed record: ' + deletes[0].objectId);
                this.removeDOMElements_IfTheyExist('aiDialog');
                this.hideDialog();
                  }), function(err){
                          console.log(err);
                      }
                  );
            }));
                  
          this._addDialog.show();
        }

    });
  });