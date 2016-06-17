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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/connect',
  'jimu/BaseWidget',
  'dojo/on',
  'dojo/aspect',
  'dojo/string',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/topic',
  'dojo/promise/all',

  'dojo/store/Memory',
  'dijit/registry',
  'dijit/form/Form',
  'dijit/form/Select',


  'dijit/form/FilteringSelect',

  'dijit/TitlePane',
  './Add_Edit_Delete_CapabilityDialog',
  './Add_Edit_Delete_ResourceDialog',
  './Add_Edit_Delete_PartnerDialog',
  './dijit/TileLayoutContainer_JF',
  './ImageNode',
  './AboutThisApp',
  './RES_TableConstructor',
  './CAP_AddRecordDialog',
  './CAP_EditRecordDialog',

  'dijit/form/Button',
  'jimu/utils',
  'esri/arcgis/Portal',
  'esri/request',
  'esri/InfoTemplate',
  'esri/layers/FeatureLayer',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/renderers/SimpleRenderer',
  'esri/Color',
  'jimu/tokenUtils',

  'esri/tasks/QueryTask',
  'esri/tasks/RelationshipQuery'


],
function(declare, lang, array, html, connect, BaseWidget, on, aspect, string, dom, domConstruct, topic, all, Memory, registry, Form, Select, FilteringSelect, 
 TitlePane, Add_Edit_Delete_CapabilityDialog, Add_Edit_Delete_ResourceDialog, Add_Edit_Delete_PartnerDialog, TileLayoutContainer_JF, ImageNode, AboutThisApp, RES_TableConstructor, CAP_AddRecordDialog, CAP_EditRecordDialog, Button, 
 utils,   esriPortal, esriRequest, InfoTemplate, FeatureLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer, Color, tokenUtils, 
 QueryTask, RelationshipQuery) {

  return declare([BaseWidget], {
    //these two properties is defined in the BaseWidget
    baseClass: 'jimu-widget-mutualaid',
    name: 'MutualAid',

    //bookmarks: Object[]
    //    all of the bookmarks, the format is the same as the config.json
    //bookmarks: [],

    coreCaps: [],


    startup: function(){
      // summary:
      //    this function will be called when widget is started.

            this.inherited(arguments);

             
            //topic.subscribe("REFRESH_CAPINFO", lang.partial(this._insertCapInfo, this.config.selectedCap));                                   
            topic.subscribe("REFRESH_CAPINFO", lang.hitch(this, this.onEditCapSaved));
            topic.subscribe("DELETED_CAPABILITY", lang.hitch(this, this._onBackBtnClicked));
            topic.subscribe("ADDED_CAPABILITY", lang.hitch(this, this._onBackBtnClicked));
            //topic.subscribe("REFRESH_CAP_ARRAY", lang.hitch(this, this.onCapSaved));

            // *********************************************************************************************
            // 1st TileLayout Containter digit s used for listing Core Capabilities of Planning Layer
            // Uses coreCapListNode in widget.html because igit must be parsed with dojo parser at login.
            // *********************************************************************************************

            this.coreCapList = new TileLayoutContainer_JF({
                strategy: 'fixWidth',
                itemSize: {
                    width: 335,
                    height: 53
                }, //image size is: 100*60,  200x133 = 80 x 53
                maxCols: 1,
                hmargin: 15,
                vmargin: 2,
                className: "coreCapList"
            }, this.coreCapListNode);


            this.coreCapList.startup();

            // *********************************************************************************************
            // 2nd TileLayout Containter dijit is used for listing layers in the configured groups
            // Uses resultItemListNode in widget.html because igit must be parsed with dojo parser at login.
            // *********************************************************************************************



          //Get Image data from slideShow.json
            //var ppd8Ar = [];
              dojo.xhrGet({
                  url: "widgets/MutualAid/mutualAid_configs/ppd8icons.json",
                  handleAs: "json",
                  load: lang.hitch(this, function(obj) {
                      /* here, obj will already be a JS object deserialized from the JSON response */
                              //ppd8Ar=obj;
                              this.config.ppd8Icons=obj;
                  }),
                  error: function(err) {
                        /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
                      console.log(err);
                  }
              });





        // EGE added this snippet to get unique values out of any array
        // exaple: var newArray = oldArray.getUnique(true)
        // This will populate newArray with the unique values of oldArray. 
        // Alternatively, you can just do oldArray.getUnique(), which will 
        // get rid of all duplicates in the original array.
        
        Array.prototype.getUnique = function (createArray) {
            createArray = createArray === true ? true : false;
            var temp = JSON.stringify(this);
            temp = JSON.parse(temp);
            if (createArray) {
                var unique = temp.filter(function (elem, pos) {
                    return temp.indexOf(elem) == pos;
                }.bind(this));
                return unique;
            }
            else {
                var unique = this.filter(function (elem, pos) {
                    return this.indexOf(elem) == pos;
                }.bind(this));
                this.length = 0;
                this.splice(0, 0, unique);
            }
        };


            // *********************************************************************************************
            // Since this app assumes that Check to see if vUSA widget is already logged in

            //auto login on startup (occurs after webmap switching) if login existed
            //JF todo     
            //        if (this.appConfig.vUSALogin == true) {
            //      this._onLoginBtnClicked();
            //        }








// JF Insert Divs for table and slideshow.
//  to make this visible must add class="esriMapContainer" when the button is clicked.


            var insertDIV="";   
                insertDIV = '<div id="slideShowDiv"></div>';// JF Inserted to contain alternate window to replace mapDiv -->

            var newDIV = domConstruct.toDom(insertDIV);
                domConstruct.place(newDIV, dom.byId('main-page'), 'before');// could be "after" or "last"

            var insertTable="";
                insertTable+=   '<div id="formParentDiv" dir="ltr"></div';

            var newDIV = domConstruct.toDom(insertTable);
                domConstruct.place(newDIV, dom.byId('map'), 'first');

    },




    onOpen: function(){

      this.createDrawerMenus();

    },

    onClose: function(){

    },

    onMinimize: function(){
      this.resize();
    },

    onMaximize: function(){
      this.resize();
    },


    destroy: function(){
 //     this.bookmarkList.destroy();

        this.inherited(arguments);


    },

    createDrawerMenus: function(){

        this.inherited(arguments)


            var capContent = dom.byId("thiraMenuId");

                on(capContent, 'click', lang.hitch(this, function(menuId){
                    console.log('click-event');
                    this.showDrawerMenu("thiraContent"); //located in RES_AddRecordDialog;
                }));


            var aboutContent = dom.byId("aboutMenuId");

                on(aboutContent, 'click', lang.hitch(this, function(menuId){
                    console.log('click-event');
                    this.showDrawerMenu("aboutContent"); //located in RES_AddRecordDialog;
                }));


            var planPicker = dom.byId("planPickerMenuId");

                on(planPicker, 'click', lang.hitch(this, function(menuId){
                    console.log('click-event');
                    this.showDrawerMenu("planPicker"); //located in RES_AddRecordDialog;
                }));


        // **********************************************
        // Insert the About Button
        // **********************************************
            // var addMenuItem="";   
            //     addMenuItem = '<div class="item" id="aboutMenuId">';
            //     addMenuItem +=     '<div class="item-container" title="About">';
            //     addMenuItem +=        '<div class="title">';
            //     addMenuItem +=          '<div class="playScreenIconNoPadding"></div>';
            //     addMenuItem +=          '<div class="icon-text">About</div>';
            //     addMenuItem +=        '</div>';
            //     addMenuItem +=        '<div class="arrow"></div>';
            //     addMenuItem +=     '</div>'
            //     addMenuItem +='</div>'
            //     addMenuItem +='<div class="clear"></div>';


            // var insertNode = domConstruct.toDom(addMenuItem);
            //     domConstruct.place(insertNode, dom.byId('drawer-menu-button-parent'), 'last');// could be "after" or "last"



           this.createDrawerMenuPanels();
    },


    // this should only be called at startup of widget.
    createDrawerMenuPanels: function(){

          this.inherited(arguments);

          this._portalLogin();// When called in startup it seems to be to early to function.  This 

            // **********************************************************
            // Insert OVERVIEW Buttons ID is contained in the widget.html
            // **********************************************************
            var appOverviewBtn = new Button({
                label: "Overview",
                id:"appOverviewBtn",
                baseClass: "AboutThisAppBtn",
                iconClass: "playScreenIcon",
                style: "padding-bottom: 5px;",
                onClick: lang.hitch(this,function(){
                // Do something:
                  this._openSlideShow("overview");
            })
            }, "appOverviewBtn").startup();

            // *********************************
            // Insert Deploy and Configure Button
            // *********************************
            var appDeployConfigBtn = new Button({
                label: "Transition and Configure",
                id:"appDeployConfigBtn",
                baseClass: "AboutThisAppBtn",
                iconClass: "playScreenIcon",
                style: "padding-bottom: 5px;",
                onClick: lang.hitch(this,function(){
                // Do something:
                  this._openSlideShow("deploy");
            })
            }, "appDeployConfigBtn").startup();

            // *********************************
            // Insert Using This App Button - 
            // *********************************
            var appDemoBtn = new Button({
                label: "Feedback",
                id:"appBtn3",
                baseClass: "AboutThisAppBtn",
                iconClass: "playScreenIcon",
                style: "padding-bottom: 5px;",
                onClick: lang.hitch(this,function(){
                // Do something:
                  this._openSlideShow("feedback");
            })
            }, "appBtn3").startup();



            // **********************************************************
            // Insert OVERVIEW Buttons ID is contained in the widget.html
            // **********************************************************
/*
            var removeBackBtn=dijit.byId("appBackBtn");
                if(removeBackBtn){

                    removeBackBtn.destroyRecursive();

                    var maBackBtn = new Button({
                        label: "Back",
                        id:"appBackBtn",
                        onClick: lang.hitch(this,function(){
                            // Do something:
                            //this._openSlideShow("overview");
                            alert("clicked")
                         })
                    }, "maBackBtn").startup();

                }

                else{
                    var maBackBtn = new Button({
                        label: "Back",
                        id:"appBackBtn",
                        onClick: lang.hitch(this,function(){
                            // Do something:
                            //this._openSlideShow("overview");
                            alert("clicked")
                         })
                    }, "maBackBtn").startup();

                }
  */

    },

// *****************************************************************************************************************
// * Must manipulate DOM manually to achieve same behavior as DrawerMenu dijit used in Public Information Template.
// *
// * CSS classes control visibility of items and selected panels
// * Order of menu and panels matter, as does the ID of the selected MenuId
// *****************************************************************************************************************
    showDrawerMenu: function(menu){


        var drawerMenu_1=dom.byId("thiraMenuId");
        var drawerMenuPanel_1 = dom.byId("drawer-menu-panel-1");
        var drawerMenu_2=dom.byId("aboutMenuId");
        var drawerMenuPanel_2 = dom.byId("drawer-menu-panel-2");
        var drawerMenu_3=dom.byId("planPickerMenuId");
        var drawerMenuPanel_3 = dom.byId("drawer-menu-panel-3");
          

          //CSS Class change will switch visiblity of auto generated content.  This replicates the "drawerMenu.js" class from PublicInfo Template which cause problem with WAB framework
          if(menu=="thiraContent"){
              drawerMenu_1.className = "item item-selected";
              drawerMenuPanel_1.className = "panel panel-selected";
              drawerMenu_2.className = "item";
              drawerMenuPanel_2.className = "panel";
              drawerMenu_3.className = "item";
              drawerMenuPanel_3.className = "panel";             
          }

          else if(menu=="aboutContent"){

              drawerMenu_1.className = "item";
              drawerMenuPanel_1.className = "panel";
              drawerMenu_2.className = "item item-selected";
              drawerMenuPanel_2.className = "panel panel-selected";
              drawerMenu_3.className = "item ";
              drawerMenuPanel_3.className = "panel"; 

          }

          else if(menu=="planPicker"){
              drawerMenu_1.className = "item";
              drawerMenuPanel_1.className = "panel";
              drawerMenu_2.className = "item";
              drawerMenuPanel_2.className = "panel ";
              drawerMenu_3.className = "item item-selected";
              drawerMenuPanel_3.className = "panel panel-selected"; 

          }

    },
  

// ******************************************************
// Open code used in Thira Template to create slideshow
// ******************************************************
    _openSlideShow: function(show){

       this.newSlideShow = new AboutThisApp(show);
    },




// **********************************************************************
//  Initiate identity manager
//
//  Necessary to query default thira sharing group and items within it.
// **********************************************************************
      _portalLogin:function(){


               console.log("portalLogin");

                if (!this.portal) {
                    this.portal = new esriPortal.Portal(this.appConfig.map.portalUrl);
                }

                var self = this;

                this.portal.signIn().then(lang.hitch( this, function(loggedInUser) {

                    this.config.token = loggedInUser.credential.token;
                    // ********************************
                    // 1 - load default planning layer from config
                    this._getDefaultThiraLayer();
                    // ********************************
                    // 2 - load default planning group from config
                    this._getGroupDetails();
                }))
      },


   

// ***************************************************************************************
//  Function 1  Get default ThiraUrl / Capabilities Layer to Map from FeatureLayer itemId
// ***************************************************************************************

      _getDefaultThiraLayer: function (){
            console.log("get thira layer")        
            //this._getDefaultGroup();// get details of the default group
        
            esri.arcgis.utils.getItem(this.config.defaultLayerItemId).then(lang.hitch(this,function (results) {
              //console.log("handleWebmapIdResults");
                //this.thiraLayers=results.item;
                //hard code the capabilities layer position


                this.config.capabilitiesUrl="";
                this.config.capabilitiesUrl=results.item.url +"/2";
                console.log(this.config.capabilitiesUrl);

                // this value is not ready by the time I need it in setGlobalQueryParams
                this.config.thiraExtent=results.item.extent;

                this.config.capabilitiesLayerName=results.item.title;
           
                //start with a default that can be changed later
                this.config.capabilitiesDefExpression="1=1"; // if no filter exists use all features.

                // *************************************************************
                // 1 - Dynamically create Hazard array from data
                this._createHazArray(this.config.capabilitiesUrl);

                // *************************************************************            
                // 2 - Create relatedTable query parameters - may not work!!
                this.setGlobalQueryParameters(this.config.capabilitiesUrl);

                // *************************************************************
                // 3 - add default layer to map
                this.newLayer(this.config.capabilitiesUrl, this.config.token, results.item.title)// add featureLayer to webmap.  Featurelayer seems to be added automatically when webmap changes.

                // *************************************************************
                // 4 - Create thumbnailUrl from default layer item
                //     Sample format for Url:  http://www.arcgis.com/sharing/rest/content/items/5bb8c221afb547c4ac642045f9d85b79/info/thumbnail/S_26T_RESCON_Logo.png?token=
                //var createImgUrlAtLogin = "http://www.arcgis.com/sharing/rest/content/items/";
                //    createImgUrlAtLogin += this.config.defaultLayerItemId;
                //    createImgUrlAtLogin += "/info/" + results.item.thumbnail;
                //    createImgUrlAtLogin += "?token=" + this.config.token;

                // required to get thumbnail on login, without using preset image
                // this.insertSelectedLayerAsHeader(thiraUrl, createImgUrlAtLogin, results.item.title)

          })); // END RESULTS HANDLING

      },




// ****************************************************
// CREATE HAZARDS SELECTION MENU TO FILTER CAPABILITIES
// ****************************************************
      _createHazArray: function (url) {
          var queryTask = new QueryTask(url);
          var query = new esri.tasks.Query();
          query.where = "1=1"; 
          query.outFields = ["Threat_Hazard"];
          query.returnGeometry = false;
          query.returnDistinctValues = true;
          queryTask.execute(query).then(lang.hitch(this, this._queryHazardsCompleted));      

          //console.log("Hazard query " + url );                      
      },
      
      _queryHazardsCompleted: function(results) {
          var hazArr = [];
          this.hazArrInUse = [];
          var hazString = "";

          for (var i = 0; i < results.features.length; i++) {
              var feature = results.features[i].attributes.Threat_Hazard;
              if(!feature){
                  console.log('no hazard defined');
              }
              else{
                  feature = feature.replace(/^\s+|\s+$/g,'');
                  feature = feature.replace(/['"]+/g, '');  
                  feature = feature.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ',');
                  feature = feature.replace(/\s*,\s*/g, ',');
                  feature = feature.trim();                      
                  hazString = hazString + feature + ",";
              }
          }

          hazString = hazString + ",All Hazards";
          hazString = hazString.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ',');
          hazArr = hazString.split(',');
          hazArr.getUnique(); 

          //console.log(hazArr);

          //now loop through temp hazard array and populate name/id object pairs into new array
          for (var j = 0; j < hazArr[0].length; j++) {    
              var item = hazArr[0][j];
              if (!item){
              }
              else{
                  this.hazArrInUse[j] = {
                      name: item,
                      id: item
                  };
              }
          }
          this._placeHazardSelect(this.hazArrInUse);
      },

//    NOTE:  This is replaced every time a layer is selected.  instead, it should replace the Array, not the entire dijit.

      _placeHazardSelect: function(arr){

          var hazArray = arr;
          var hazNode = dijit.byId('hazardSelectId');
          if (hazNode){
              hazNode.destroyRecursive();
          }

          var hazStore = new Memory({
              idProperty: "id",
              data: hazArray
          });

          this.hazardSelect = new Select({
                id: "hazardSelectId",
                className: "hazardSelect",
                store: hazStore,
                searchAttr: "name",
                labelAttr: "name",
                displayedValue: "All Hazards",
                style: {fontSize: "14pt"}
            }, "hazardSelect");


          this.hazardSelect.on("change", lang.hitch(this, function(value) {
          //  console.log("my value:", value);
            var defQuery = "";

            if (value == 'All Hazards'){
              defQuery = "1=1";
            }
            else{
              defQuery = "Threat_Hazard Like '%" + value + "%'";
            }

            this.queryCapabilitiesLayer2(this.config.capabilitiesUrl, defQuery);
          }));

          //insert hazard dropdown in dom
          domConstruct.place(this.hazardSelect.domNode, "placeHazardFilterId", "after");
          this.hazardSelect.startup();

          this.hazardSelect.attr('value', "All Hazards");

      },

// *******************************************************
// QUERY CAPABILITIES LAYER
// *******************************************************



      // Required to improve performance of initial attribute list.  Geometries dramatically slow performance of app.

      queryToZoomToSingleFeature: function(url, defQuery){
      //    console.log('queryCapabilitiesLayer - task defined');
          var whereQuery = defQuery; // 1=1 is the default set at handleItemResults()
          var queryTask = new QueryTask(url);
          var query = new esri.tasks.Query();
          query.outFields = ['ESF,Capability,Jurisdiction,Threat_Hazard,GlobalID,OBJECTID'];
          query.where = whereQuery;
          query.returnGeometry = true;
          query.num=1;
          queryTask.execute(query).then(lang.hitch(this, this.zoomToExtentOfSingleFeature));
      },


      // ************************************************************
      // 1) List Core Capabilities from specified Capabilities layer
      // ************************************************************
      queryCapabilitiesLayer2: function(url, defQuery) {
      //    console.log('queryCapabilitiesLayer - task defined ' + url);
          var whereQuery = defQuery; // 1=1 is the default set at handleItemResults()
          var queryTask = new QueryTask(url);
          var query = new esri.tasks.Query();
          query.outFields = ['*'];
          query.orderByFields=['Capability'];
          query.where = whereQuery;
          query.returnGeometry = false;
          queryTask.execute(query).then(lang.hitch(this, this.queryCapabilitiesCompleted2));
      },

      queryCapabilitiesCompleted2: function(results) {
          console.log('queryCapabilities - Task Completed');
          this.capArr = []; // reset the array
          var count=0

          for (var i = 0; i < results.features.length; i++) {
              this.capArr.push({
                  Capability: results.features[i].attributes.Capability,
                  Threat_Hazard: results.features[i].attributes.Threat_Hazard,
                  Jurisdiction: results.features[i].attributes.Jurisdiction,
                  Target: results.features[i].attributes.Targets,
                  Impact: results.features[i].attributes.Impacts,
                  Outcome: results.features[i].attributes.Outcomes,
                  ESF: results.features[i].attributes.ESF,
                  GlobalID: results.features[i].attributes.GlobalID,
                  ObjectID: results.features[i].attributes.OBJECTID,
                  ThumbnailUrl: ""
              });

              count++;

              var sourceID = results.features[i].attributes.OBJECTID;
          } // end loop
          
         // *************************************************************
         // Insert "Add Capability Target" into array to use as a button
         // wait until loop is finished to add the button at the end.
         if(count==results.features.length){
        
              this.capArr.push({
                  Capability: "Add Capability Target",
                  Jurisdiction: "",
                  Target: "",
                  Impact: "",
                  Outcome: "",
                  ESF: "",
                  GlobalID: "",
                  Threat_Hazard: "",
                  ObjectID: "",
                  ThumbnailUrl: "widgets/mutualAid/images/esri_icons/xtra_AddCapability65x.png"
              });

              this.capabilityIcons(this.capArr); 
          }
          
      },


      capabilityIcons: function(capArr){

        array.forEach(capArr, lang.hitch(this, function(cap, i){   
          var coreCap = "";
              // Make sure there is value in the data
              if(cap.Capability){
                  coreCap = cap.Capability.toLowerCase().trim();

                  this.config.ppd8Icons.forEach(lang.hitch(this, function(item) {
                      var ppd8 = "";
                          ppd8 = item.PPD8.toLowerCase().trim();

                      //console.log(coreCap  + " - " + ppd8);

                      if(coreCap===ppd8){
                        this.capArr[i].ThumbnailUrl = "widgets/MutualAid/images/esri_icons/" + item.icon;                                
                        console.log("found!")
                      }

                  }))
              }

        }))

        this.gotoTest();
      },

      gotoTest: function(){

          this.displayBookmarks(this.capArr);

      },

      // ******************************************************
      // Called when the layer is switched.
      // Must check to see if the layer has features
      // ******************************************************
      zoomToExtentOfSingleFeature: function(result){

          if(result.features.length>0){// some planning layers could be empty
                if (result.features[0].geometry){
                  console.log('update Extent has geometries');
                  var extent = esri.graphicsExtent(result.features); 
                }
            
                //set map extent to features extent
                if(extent) {
              
                  this.map.setExtent(extent.expand(1.5));
                }

          }
          else{

              alert("This planning layer has no records.  Would you like to initialize this layer?")

          }

      },




// **********************************************************************************************************
//  POPULATE DEFAULT GROUP with shared:thira featureLayers within that group from groupId in the config.json
// **********************************************************************************************************
      _getGroupDetails: function(){
        console.log("get group details");

              this.config.myGroups=[];

              array.forEach(this.config.configuredGroups, lang.hitch(this, function(group) {

                var q3 =  "+id:\"" +  group.id + "\"";
                var params = {
                    q:  q3,
                    sortField:'modified',
                    sortOrder:'desc',
                    num:20  //find 20 items - max is 100
                  };

                  this.portal.queryGroups(params).then(lang.hitch(this, function (response) {

                      var gData = response.results;

                      var item = '<div class="ma-select-option"><img src=' + gData[0].thumbnailUrl + '>' + '<div class="ma-select-title">' + gData[0].title + '</div></div>';

                      this.config.myGroups.push({
                        name: gData[0].title,
                        id: gData[0].id + "," + "group",
                        label: item,
                        owner: gData[0].owner
                        //urlKey: gData("portal").urlkey,
                        //hostName:gData.portal.portalHostname
                      });

                      // only place drop down after it has been loaded.  Does not count array proplerly outside of this loop
                      if(this.config.myGroups.length==this.config.configuredGroups.length){
                          this._placeGroupSelect(); // this will be in the settings section
                      } 

                  }))

                }));// end loop of configured groups;

      },




// ***********************************************************************************************************************
//  PLACE GROUP Selection Menu.  Eventually this will have orgs to search for data with the necessary tag - "Shared:thira"
// ***********************************************************************************************************************

            //place group info to create select
            _placeGroupSelect: function() {
                console.log("Place Group Select " + this.config.myGroups);

                if (!this.groupSelect2) {
                    var groupArray = this.config.myGroups;

                    groupArray.reverse();

                    var groupNode = dijit.byId('groupSelectBox2');
                    if (groupNode) {
                        groupNode.destroyRecursive();
                    }

                    var groupStore = new Memory({
                        idProperty: "id",
                        data: groupArray
                    });

                    // groupSelect is the new dijit name for group select.
                    // dijit ID is assigned at the end.
                    this.groupSelect2 = new Select({
                        id: "thiraGroupSelect",
                        style: {
                            width: '100%'
                        },
                        store: groupStore,
                        sortByLabel: false,
                        labelAttr: "label"
                    }, "groupSelectBox2");

                    //dojo.style(dijit.byId("groupSelect").closeButtonNode,"display","none");

                    this.groupSelect2.on("change", lang.hitch(this, function(value) {
                        var update = value.split(",");

                        this.bookmarks = [];
                        this.currentIndex = -1;

                        console.log("selected " + update[0]);
                        //this.config.defaultGroupId = update[0];// set selected group
                        this._getGroupItems(update[0]);// this is not connected to the menu yet!

                        this._createSelectionLayerArray() // 


//JF possble issue here with gettiing group items twice


                    }));

                    //initiate hazard dropdown
                    domConstruct.place(this.groupSelect2.domNode, "map_groupheader2", "replace");
                    this.groupSelect2.startup();

                    this._getGroupItems(this.config.defaultGroupId);// this is not connected to the menu yet!


                }
            },





// **********************************************************************
//  Get items from default group and populate list
//  This is also called when the group is changed in the settings panel.
// **********************************************************************
      _getGroupItems: function(groupId){
            console.log("get Group items")

            // Example query filters
            //var qTemp = "+type:\"Web Map\" AND\"" + "" + "\" -type:\"Web Mapping Application\"";
            //var qTemp2 = "+type:\"Feature Service\"";
            //var qTemp3 =  "\"" +  searchtxt + "\" +title:\"geoform\"  +type:\"Web Mapping Application\"";
            var q= "+tags:\"shared:thira\" +type:\"Feature Service\"";  // This requires the specificed tag to be present on feature service types only

            params = {

                     q: "group:\"" + groupId + "\"AND " + q,
                  
                      sortField: "modified",
                      sortOrder: "desc",
                      num: 100,
                      start: 0,
                      f: "json"
                    };

                    console.log(params);
                    this.portal.queryItems(params).then(lang.hitch(this, function(response) {

                        this.config.defaultGroupItems = response.results;// reset items in the selected group

                        //this.bookmarks = [];

                        //this._readItemResultList();

                        this._createSelectionLayerArray();


           })); // END RESULTS HANDLING     
      },

            //read the results and build the new bookmark array  
            // create array of planning layers for the dropdown menu.
            _createSelectionLayerArray: function(){

                this.config.planningLayersInGroup = [];
                var defaultLyrUrl="";
                var defaultLyrTitle="";

                array.forEach(this.config.defaultGroupItems, lang.hitch(this, function(lyrItem) {


                    if(lyrItem.id==this.config.defaultLayerItemId){
                      defaultLyrUrl= lyrItem.url + "/2";
                      defaultLyrTitle = lyrItem.title;
                    }

                    // create uniqueId for layers in the dropdown list, including the url and thumbnails
                    var item = '<div class="ma-select-option"><img src=' + lyrItem.thumbnailUrl + '>' + '<div class="ma-select-title">' + lyrItem.title + '</div></div>';
                    var thiraLyr = lyrItem.url + "/2";

                    this.config.planningLayersInGroup.push({
                      name: lyrItem.title,
                      id: lyrItem.id + "," + thiraLyr + "," + lyrItem.title,
                      label: item,
                      owner: lyrItem.owner,
                      url:  thiraLyr, 
                      title: lyrItem.title
                      //urlKey: gData("portal").urlkey,
                      //hostName:gData.portal.portalHostname
                    });

                }), this);


                      // Only place drop down after it has been loaded.  Does not count array proplerly outside of this loop
                      if(this.config.planningLayersInGroup.length==this.config.defaultGroupItems.length){
                        this._placeLayerSelectionMenu(this.config.planningLayersInGroup, defaultLyrUrl, defaultLyrTitle); // this shows the current planning layer
                      } 

            },



// ***********************************************************************************************************************
//  PLACE Layer selection Menu.  Eventually this will have orgs to search for data with the necessary tag - "Shared:thira"
// ***********************************************************************************************************************

// I need: DOM elemet to attach selection dijit
// I need: Array of items from selected Group
// I need: show Selected Layer as selected 

            //place group info to create select

            _placeLayerSelectionMenu: function(planLayers, defaultLyr, defaultLyrTitle) {

                this.inherited(arguments);

                console.log("Populate Layers Selection Menu " + planLayers);

                var idString="";
                    idString=this.config.defaultLayerItemId + "," + defaultLyr + "," +  defaultLyrTitle;

                console.log("idString: " + idString); // Note: this.config.capabilitiesUrl is not ready to use.  had to pass URL from previous function

                if (!this.planningSelect) {
                    var groupArray = planLayers;

                    groupArray.reverse();

                    var groupNode = dijit.byId('planningSelectBox');
                    if (groupNode) {
                        groupNode.destroyRecursive();
                    }

                    var groupStore = new Memory({
                        idProperty: "id",
                        data: groupArray
                    });

                    // groupSelect is the new dijit name for group select.
                    // dijit ID is assigned at the end.
                    this.planningSelect = new Select({
                        id: "planSelectionDijit",
                        style: {
                            width: '100%'
                        },
                        store: groupStore,
                        sortByLabel: false,
                        labelAttr: "label",
                        value: idString
                    }, "planningSelectBox");

                    //dojo.style(dijit.byId("groupSelect").closeButtonNode,"display","none");

                    // Select the default layer set in the configuration.  The id value must match exactly.  This does not always fire soon enough. 

                    //this.planningSelect.attr('value', String(idString.trim()));




                    this.planningSelect.on("change", lang.hitch(this, function(value) {
                        var selection = value.split(",");

                        this.currentIndex = -1;

                        var planLyrUrl   = selection[1];
                        var planLyrTitle = selection[2];


                        this.setGlobalQueryParameters(planLyrUrl);


                        this.newLayer(planLyrUrl, this.config.token, planLyrTitle);// add featureLayer to webmap.  Featurelayer seems to be added automatically when webmap changes.
// Important
// New layer sele
                        this.config.capabilitiesUrl=planLyrUrl;

                    }));

                    //initiate hazard dropdown
                    domConstruct.place(this.planningSelect.domNode, "planningLayer_groupheader", "replace");
                    this.planningSelect.startup();


                    // Must create a string that mirrors the selection id for the dijit.  
                    // Use this value to preset the menu the first time it opens.


                }
            },



  



// ******************************************************
// List Shared Plans from selected Group using tileDisplay List Digit
// ******************************************************

    displayBookmarks: function(coreCaps) {
        // summary:
        //    remove all and then add
        var items = [];
        this.coreCapList.empty();
        array.forEach(coreCaps, function(coreCap) {
            items.push(this._createBookMarkNode(coreCap));
        }, this);

        this.coreCapList.addItems(items);

        this.resize();
    },

    resize: function() {
        var box = html.getMarginBox(this.domNode);
        var listHeight = box.h - 37 - 21 - 61 - 59; // JF added 55 to make room for the insert item. 

        //fix for IE8
        if (listHeight < 0) {
            listHeight = 0;
        } 
        html.setStyle(this.coreCapListNode, 'height', listHeight + 'px');
        //html.setStyle(this.coreCapListNode, 'width', '100%');
        if (this.coreCapList) {
             this.coreCapList.resize();
         }
    },

    // create the individual item bookmark nodes    
    _createBookMarkNode: function(coreCapItem) {
        var thumbnail, node;

        if (coreCapItem.ThumbnailUrl) {
            thumbnail = coreCapItem.ThumbnailUrl;
        } else {
            thumbnail = this.folderUrl + 'images/defaultThumbnail.png';
        }

        node = new ImageNode({
            img: thumbnail,
            label: coreCapItem.Capability,

        });
        on(node.domNode, 'click', lang.hitch(this, lang.partial(this._onBookmarkClick, coreCapItem)));

        return node;
    },


// ********************************************************
//  CLICK ON CAPABILITY - BEGIN RELATIONSHIP QUERIES FROM 
//           PASS THE OBJECTID OF THE SELECTED CAPABILITY
//
//      CLICK TO SHOW CAPABILITY PANEL 
//  
//      CLICK TO SHOW ADD CAPABILITY FORM
//
// ********************************************************
    _onBookmarkClick: function(coreCap) {
     
        this.config.selectedCap=[];

        // ***********************************************
        // Get all Capability Values and hold as variable
        // ***********************************************

        this.config.selectedCap = coreCap;

        console.log(coreCap.Capability);

        // *************************************************************************
        // ADD NEW CAPABILITY TARGET HAS BEEN CLICKED!
        //   
        // This calls the logic to create form in the left panel - AttrFormsManager
        // *************************************************************************

        if(coreCap.Capability=="Add Capability Target"){

          document.getElementById("showerId").className="hiddenDiv";
          document.getElementById("hiderId").className="showingDiv";

          document.getElementById("selectedCoreCapImg").src=coreCap.ThumbnailUrl;
          document.getElementById("selectedCoreCapTitle").innerHTML=coreCap.Capability;


          var createForm = new Add_Edit_Delete_CapabilityDialog();
              createForm._insertEditPanel("addCap",this.config);


        }
        else{

        // *************************************************************************
        // SHOW CAPABILITY SUMMARY - Left panel cap Info Panel
        // *************************************************************************

          document.getElementById("showerId").className="hiddenDiv";
          document.getElementById("hiderId").className="showingDiv";

          document.getElementById("selectedCoreCapImg").src=coreCap.ThumbnailUrl;
          document.getElementById("selectedCoreCapTitle").innerHTML=coreCap.Capability;   // + "(" + coreCap.Jurisdiction + ")";  // parethesis does not work well here

          this._insertCapInfo(coreCap);

          this.createCapResourceArray_0(coreCap.ObjectID);// create summaryArray



          //document.getElementById("selectedCoreCapSubTitle").innerHTML=coreCap.Jurisdiction;

          //document.getElementById("capInfo-rCount").innerHTML ="";
          //document.getElementById("capInfo-rFully").innerHTML ="";
          //document.getElementById("capInfo-pCount").innerHTML ="";


        }

      // possible way to change the title of the viewer.
      // onAppConfigChanged: function(appConfig, reason, changedData){
      // topic.publish("appConfigChanged", lang.hitch(this, this.onAppConfigChanged)));
      // this.TitleNode.set('value', new Date());
    
    },



      // ******************************************************************************************
      //  FUNCTION: onEditCapSaved
      //  TOPIC Subscribe Listener is called by this function due to subscribe listener
      //  Triggers a refresh for lefthand CapInfo Panel
      //     
      // ******************************************************************************************
    onEditCapSaved: function(){
        this.inherited(arguments);

        this._createHazArray(this.config.capabilitiesUrl);// refreshes all aspects of the capability table.
        this._refreshCapInfo();

    },

      // ******************************************************************************************
      // Called from onEditCapSaved() when the capabilty is saved - AttrFormsManager 
      // Refresh is called in 2 places:  1) Back button clicked  & 2) when edits are made to a Cap.
      // Re-Creates the lefthand CapInfoId Panel using updated content
      // ******************************************************************************************
      // onEditCapSaved() also calls refresh for the Hazards, icons, partner, resource statistics etc.
      // ******************************************************************************************
    _refreshCapInfo: function(){

      // ************************************************************
      // Get Capabilities from specified Capabilities layer
      // ************************************************************
          console.log('queryCapabilitiesLayer - task defined ' + this.config.capabilitiesUrl);
          var whereQuery = "GlobalID='" + this.config.selectedCap.GlobalID + "'";
          var queryTask = new QueryTask(this.config.capabilitiesUrl);
          var query = new esri.tasks.Query();
          query.outFields = ['*'];
          query.orderByFields=['Capability'];
          query.where = whereQuery;
          query.returnGeometry = false;
          queryTask.execute(query).then(lang.hitch(this, this.queryGetCapInfo));
      },

      // ******************************************************************
      // Create and object with updated values to pass to the details page
      // ******************************************************************
      queryGetCapInfo: function(results) {

          console.log('queryCapabilities - Create updated Object of selected Capability');
          var newCoreCap = new Object();

          for (var i = 0; i < results.features.length; i++) {

                newCoreCap.Capability = results.features[i].attributes.Capability,
                newCoreCap.Threat_Hazard = results.features[i].attributes.Threat_Hazard,
                newCoreCap.Jurisdiction = results.features[i].attributes.Jurisdiction,
                newCoreCap.Target = results.features[i].attributes.Targets,
                newCoreCap.Impact = results.features[i].attributes.Impacts,
                newCoreCap.Outcome = results.features[i].attributes.Outcomes,
                newCoreCap.ESF = results.features[i].attributes.ESF,
                newCoreCap.GlobalID = results.features[i].attributes.GlobalID,
                newCoreCap.ObjectID = results.features[i].attributes.OBJECTID,
                newCoreCap.ThumbnailUrl = ""


          } // end loop

          this._insertCapInfo(newCoreCap);

          this.createCapResourceArray_0(newCoreCap.ObjectID);// create Summary, create Resource List, create Partner list

    },






    // ***********************************************************************************************
    // Called by _onBookmarkClick. - with click of Capability.  
    //    Creates the lefthand CapInfoId Panel for Capability summary 
    //    Uses coreCap Array previoulsy created for capabilit list.   Not from a fresh query. 
    //    Refresh is called in 2 places:  1) Back button clicked  & 2) when edits are made to a Cap.
    // ***********************************************************************************************
    _insertCapInfo: function(coreCap){

      var val = dom.byId("capInfoId");

           if(val){

                val.remove();
                alert("Capability Info Panel was removed! ")

           }


    //      <img style="width:45px;float:right;" id="addResourceImg" src="./widgets/MutualAid/images/esri_icons/xtra_AddCapability65x.png"/>


                  var content="";
                     content+='<div class="capInfoTextContainer" id="capInfoId">'
                     content+=   '<p><div id="capInfoEditPanel" class="cap-info-btn-heading" style="padding:2px"><span class="ma-jimu-btn-blue"><button id="maEditCAP" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;Capability Target</div></p>';
                     content+=   '<div class="cap-info-text">' +coreCap.Target + '</div>';
                     content+=   '<div class="cap-info-heading">Threats / Hazards</div>';
                     content+=   '<div class="cap-info-text">' + coreCap.Threat_Hazard  +'</div>';
                     content+=   '<div class="cap-info-heading">Jurisdiction</div>';
                     content+=   '<div class="cap-info-text">' + coreCap.Jurisdiction + '</div>';
                     content+=   '<div class="cap-info-heading">ESF</div>';
                     content+=   '<div class="cap-info-text">' + coreCap.ESF + '</div>';
                     content+=   '<div class="cap-info-heading">Impacts</div>';
                     content+=   '<div class="cap-info-text">' +  coreCap.Impact  + '</div>';
                     content+=   '<div class="cap-info-heading">Outcomes</div>';
                     content+=   '<div class="cap-info-text-bottom-border">' + coreCap.Outcome + '</div>';
                     content+=   '<p><div id="placeAttrInsp_addRes" class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maReqResTable" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;<div id="reqResCountId" style="display:inline"></div>&nbsp;Required Resources<span style:"float:right" class="ma-jimu-btn-green"><button  id="maAddResource" type="button"></button></span></div></p>';
                     content+=   '<div id="capInfo-resources" class="cap-info-resources"></div>';
                     content+=   '<div class="cap-info-text"></div>';
                     content+=   '<p><div class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maPartnerTable" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;<div id="partnerCountId" style="display:inline">0</div>&nbsp; Total Partnerships</div></p>';
                     content+=   '<div id="capInfo-partners" class="cap-info-text"></div>';
                     content+=   '<p><div class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maGapTable" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;Resource Gaps</div></p>';
                     content+=   '<div id="capInfo-gap-graph" class="cap-info-text"></div>';
                     content+='</div>';

                var newDIV = domConstruct.toDom(content);
                    domConstruct.place(newDIV, dom.byId('selectedCoreCap'), 'after');// could be "after" or "last"


                // *************************************************************************
                // Inserting Edit Button for Capabilities  - Edit This Capability!
                // **************************************************************************
                var myButton = new Button({
                    //label: "Edit",
                    baseClass: "ma-jimu-btn-blue",
                    iconClass: "icon-pencil-btn",
                    onClick: lang.hitch(this,function(capId){
                        // Do something:
                        //this.initEditForm(this.capID,  this.coreCapability, this.capIdx);// located in CAP_EditRecordDialog.js
                        this._clickCapEditBtn();
                    })
                }, "maEditCAP").startup();

           
                var myButton = new Button({
                    //label: "Edit",
                    baseClass: "ma-jimu-btn-blue",
                    iconClass: "icon-table-btn",
                    onClick: lang.hitch(this,function(capId){
                        // Do something:
                        //this.initEditForm(this.capID,  this.coreCapability, this.capIdx);// located in CAP_EditRecordDialog.js
                        this._clickCapTableBtn();
                    })
                }, "maReqResTable").startup();

                var myButton = new Button({
                    //label: "Edit",
                    baseClass: "ma-jimu-btn-green",
                    iconClass: "icon-plus-btn",
                    onClick: lang.hitch(this,function(capId){
                        // Do something:
                        //this.initEditForm(this.capID,  this.coreCapability, this.capIdx);// located in CAP_EditRecordDialog.js
                        this._clickAddResourceToCap();
                    })
                }, "maAddResource").startup();


                var myButton = new Button({
                    //label: "Edit",
                    baseClass: "ma-jimu-btn-blue",
                    iconClass: "icon-people-btn",
                    onClick: lang.hitch(this,function(capId){
                        // Do something:
                        //this.initEditForm(this.capID,  this.coreCapability, this.capIdx);// located in CAP_EditRecordDialog.js
                        this._clickPartnerReportBtn();
                    })
                }, "maPartnerTable").startup();

                var myButton = new Button({
                    //label: "Edit",
                    baseClass: "ma-jimu-btn-blue",
                    iconClass: "icon-bar-graph-btn",
                    onClick: lang.hitch(this,function(capId){
                        // Do something:
                        //this.initEditForm(this.capID,  this.coreCapability, this.capIdx);// located in CAP_EditRecordDialog.js
                        this._clickGraphCapBtn();
                    })
                }, "maGapTable").startup();

                



                // Add clickEvent to AddResource Image.  This is an alternative way



  //        }

  //         else{// 

  //              val.remove();

  //              alert("Capability Info Panel was not removed")
  //        }



    },

    removeCapInfoDijitBtns: function(){

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

      var removeGraphBtn = dijit.byId("maGapTable");
          if(removeGraphBtn){
             removeGraphBtn.destroyRecursive();
          } 
          
          

    },


    //  *********************************************************************************************
    //  Clears ALL left hand elements and resource table.
    //    Back button restores map visibility
    //    Refreshes refreshes all aspects of Capability List, including rebuilding the Hazards Array.
    //  *********************************************************************************************

    _onBackBtnClicked: function(){

        this._createHazArray(this.config.capabilitiesUrl);// refreshes all aspects of the capability table.
        this.removeCapInfoDijitBtns();// removeds dijit btns for refreshing the info pane

        // removes edit panel if it was open
         var inspectorDiv = dom.byId("capEditId")
             if(inspectorDiv){
               inspectorDiv.remove();
             }

         var val = document.getElementById("capInfoId");
         if(val){
            val.remove();
            this._displayDivElementsOnTheMap();

            //remove grid element
            var gridsAndGraph = dom.byId("gridsAndGraph");
                if (gridsAndGraph) {
                      gridsAndGraph.remove();
                }
         }

          document.getElementById("showerId").className="showingDiv";
          document.getElementById("hiderId").className="hiddenDiv";

          document.getElementById("selectedCoreCapImg").src="";
          document.getElementById("selectedCoreCapTitle").innerHTML="";

          this.resize();

    },



    // ****************************
    // Create Edit Capability Form
    // ****************************
    _clickCapEditBtn:function(){
        this.inherited(arguments);

         // var val = document.getElementById("capInfoId");
         // val.remove();

        var createForm = new Add_Edit_Delete_CapabilityDialog();
            createForm._insertEditPanel("editCap", this.config);

    },


    _clickAddResourceToCap:function(){
        this.inherited(arguments);

         // var val = document.getElementById("capInfoId");
         // val.remove();

            // *************************************************
            // Call AttrFormManager to create AddResource Dialog
            // *************************************************
                var createForm = new Add_Edit_Delete_ResourceDialog();
                    createForm._createCustomDomains("addRes", this.config);

    },


    _clickCapTableBtn:function(){

        this.inherited(arguments);
        this._hideDivElementsOnTheMap();


              console.log("SelectedCAP: " + this.config.selectedCap);

              //JF Call Summary as a constructor.
              this.resTable = new RES_TableConstructor ({// this calls the constructor.  No need for analysis functions
                  capID: this.config.selectedCap.GlobalID,
                  capIdx: 1,
                  capOID: this.config.selectedCap.ObjectID,
                  capURL: this.config.capabilitiesUrl,
                  capName: this.config.selectedCap.Capability,
                  pageToLoad: "requiredResources",
                  //capResArr: this.capResourceArray,
                  this_config: this.config
              });
    },


    _clickPartnerReportBtn:function(){

          this._hideDivElementsOnTheMap();

              console.log("SelectedCAP: " + this.config.selectedCap);

              //JF Call Summary as a constructor.
              this.resTable = new RES_TableConstructor ({// this calls the constructor.  No need for analysis functions
                  capID: this.config.selectedCap.GlobalID,
                  capIdx: 1,
                  capOID: this.config.selectedCap.ObjectID,
                  capURL: this.config.capabilitiesUrl,
                  capName: this.config.selectedCap.Capability,
                  pageToLoad: "partnerSummary",
                  //capResArr: this.capResourceArray,
                  this_config: this.config
              });
    },

    _clickGraphCapBtn:function(){

        this._hideDivElementsOnTheMap();

              console.log("SelectedCAP: " + this.config.selectedCap);

              //JF Call Summary as a constructor.
              this.resTable = new RES_TableConstructor ({// this calls the constructor.  No need for analysis functions
                  capID: this.config.selectedCap.GlobalID,
                  capIdx: 1,
                  capOID: this.config.selectedCap.ObjectID,
                  capURL: this.config.capabilitiesUrl,
                  capName: this.config.selectedCap.Capability,
                  pageToLoad: "chartSummary",
                  //capResArr: this.capResourceArray,
                  this_config: this.config
              });


    },


    _hideDivElementsOnTheMap: function(){

        // hide actual map element and show the parent Element for table
        var hide = dom.byId("map_root")
            hide.style.display="none";
        var show = dom.byId("formParentDiv");
            show.style.display="block";

          var classesToHide=["onscreen","mylocation","homebutton", "search", "overview", "scalebar","zoomslider","coordinate"];

          var c = document.getElementById("map").children;

          for (i = 0; i < c.length; i++) {

              var str=c[i].className;

              array.forEach(classesToHide, function(keyword) {

                  if(str.indexOf(keyword)!=-1){

                        c[i].style.display="none";
                  }
            
              }, this);

          }// end loop of child elements
    },

    _displayDivElementsOnTheMap:function(){

        // return visibility to map element and hide the parent Element containing mutual aid table
          var hide = dom.byId("map_root")
              hide.style.display="block";
          var show = dom.byId("formParentDiv");
              show.style.display="none";

          //  Classnames of elements on the map div.  this does not hide using widgetId that can change
          var classesToHide=["onscreen","mylocation","homebutton", "search", "overview", "scalebar","zoomslider","coordinate"];

          var c = document.getElementById("map").children;

          for (i = 0; i < c.length; i++) {

              var str=c[i].className;

              array.forEach(classesToHide, function(keyword) {

                  if(str.indexOf(keyword)!=-1){

                        c[i].style.display="block";
                  }
            
              }, this);

          }// end loop of child elements
    },




        // ********************************************************************
        //  New Code to create Capabilities Array with Summary Statistics
        //  
        //  the capabilities URL is not the one that is currently selected!
        // ********************************************************************
        createCapResourceArray_0:function(capOID){
            console.log("Function: Create Capability Resource Stats");

            this.capResourceArray=[];

                //get relationship id for the capabilities resources table
                var capItem = this.config.relates.filter(function(item) { return item.queryTableName === 'Capability_Resources' && item.origin=='Capabilities'; });
                
                // makes sure a good result is returned
                if(capItem.length==1){

                    var relID = capItem[0].queryRelId;
                    var capURL = capItem[0].originURL;
 
                    // setup new featurelayer for capabilities; used soley for relationship queries
                    var fLayer = new FeatureLayer(capURL);
                    // var fLayer = new FeatureLayer(this.this_config.resTableUrl.toString());
                    var pSet=[];

                    //define relationship query */
                    var relatedResourcesQry = new RelationshipQuery();
                        relatedResourcesQry.outFields = ["*"];
                        relatedResourcesQry.relationshipId = relID;
                        //relatedResourcesQry.orderBy = ["ResourceName"];
                        relatedResourcesQry.objectIds = [capOID];// object ID PASSSED from selected capability

                    fLayer.queryRelatedFeatures(relatedResourcesQry, lang.hitch(this, function(relatedRecords) {


                    // If no resoures exist for the selected capability  
                    if (typeof relatedRecords[capOID] == 'undefined') {

                        //alert("No reources exist.  Please add resources for this capability.");

                        //var resourceCount = dom.byId("capInfo-rCount");
                        //    if(resourceCount){
                        //        resourceCount.innerHTML="No resources allocated.";
                        //    }
                        var resourceCount2 = dom.byId("reqResCountId");
                          if(resourceCount2){resourceCount2.innerHTML =  "0";  }

                        return;
                    }

                            // ********************************************************************
                    else{// If resources exist, proceed to create a resource array!
                            // ********************************************************************

                            pSet = relatedRecords[capOID].features;

                            var totResTypes = pSet.length;// use to end the loop
                            var calcTotResReq = 0;

                            //iterate through resource list associated with each target capability
                            array.forEach(pSet, lang.hitch(this, function(index, j) {

                                var rName = index.attributes.ResourceName;
                                var rNmbNeeded = index.attributes.NbrRequired;
                                var rID = index.attributes.OBJECTID;

                                calcTotResReq = calcTotResReq + rNmbNeeded;

                                this.capResourceArray.push({
                                    CapID: index.attributes.CapabilityFK,
                                    Category: index.attributes.Category,
                                    Name: rName,
                                    ResourceID: index.attributes.ResourceID,
                                    NmbNeeded: rNmbNeeded,
                                    Balance: 0, // Required Resources number is is updated directly via DOM
                                    Gap:"",
                                    //NmbOfferred: 0, // this may be the same as NmbCommitted?
                                    NmbCommitted: 0, // JF Added - populated in countPartnerResources
                                    NmbResPartners: 0, // JF Added - populated in countPartnerResources
                                    Type: index.attributes.ResourceType,
                                    RTLT_Type: index.attributes.RTLT_Type,
                                    GlobalID: index.attributes.GlobalID,
                                    ObjectID: rID
                                    //assistingAgency: []
                                });

                                // Update the summary Info Section
                                if(pSet.length==j+1){
                                    
                                        console.log("Completed First Cut of capResourceArray")

                                }

                                // ****************************************************
                                // count partner committments for this Resource 
                                this.countPartnerResources_0(rID,  rName, rNmbNeeded, j);


                                // if(j==(totResTypes-1)){
                                    
                                //     if(pageLoad=="requiredResources"){
                                //         lang.hitch(this,this.capSummaryTableHeader());
                                //     }
                                //     if(pageLoad=="partnerSummary"){
                                //         lang.hitch(this,this.partnerQuerySetup());
                                //     }
                                //     if(pageLoad=="chartSummary"){
                                //         lang.hitch(this,this.generateGraphs());
                                //     }

                                // }

                            }));

                    }// Related reources do exist for the selected capability!
                }));

                }
                else{
                    alert("Can not determine the resource table for this capability.  Problem with the name of the relate.");
                }

        },
        // ******************************************************************************
        // ******************************************************************************
        // Accordion Panel for Resources AKA TitlePane Dijit
        //
        // Called by Function countPartnerResources_0 - after resource array is populated
        // ******************************************************************************
        // ******************************************************************************
        createResourceListInPanel: function(){
                this.ccPanelResEditNodes = [];// used for clickable buttons
                this.ccPanelAddPartnerNodes=[];// used for add partner buttons

                // *********************************************
                // list all Resources at the bottom of the info panel
                array.forEach(this.capResourceArray, lang.hitch(this, function(item,i) {

                    // create linkable URL to an an online resource definition.  This can be an MRP definition if necessary.
            
                    var resID = item.ResourceID;
                    var resTyp = item.RTLT_Type;
                    var urlBase="";
                    var resDefUrl="";
                    var resDefLabel="";

                        if (resTyp == "Resource Typing Definition"){
                            urlBase = 'https://rtlt.preptoolkit.org/Public/Resource/View/';
                        }
                        if (resTyp == "Position Qualification"){
                            urlBase = 'https://rtlt.preptoolkit.org/Public/Position/View/';
                        }
                        if (typeof resID !== 'undefined' || resID !== null){
                            //window.open(urlBase+resID, '_blank');
                            resDefUrl=urlBase+resID;
                            resDefLabel='<a href="' + resDefUrl + '" target="_blank">Resource Definition</a>';
                        }
                        // **********************************************************************************
                        // If an a NON - FEMA typed resource is selected, then no definition is available.  
                        // This will require a change to the data model. 
                        // ************************************************************************************
                          if (typeof resID == 'undefined' || resID == null || resID == ""){
                            console.log('no resource ID for this resource..');
                            resDefLabel="No Resource Definition";
                           // alert( "Show RTLT Type Definition - " + CAPidx + " " + resIdx);
                        }



                    // used to create unique domNode for creating event
                    var resClickId="resEditClickID-" + i;
                    var addParClickId="addParClickID-" + i;

                    var resPartnerArrowId="resPartnerArrow-" + i;

                    var resPartnerHeaderId="resPartnerHeader-" + i;
                    var resPartnerDivParent="resPartnerDivParent-" +i;

                    var rTitle= " " + item.Name + " - " + item.Type;

                    var rContent="";
                         //<img id="addResourceImg" style="width:40px;" src="./widgets/MutualAid/images/esri_icons/xtra_AddCapability65x.png"/>
                        rContent+='<div class="edit-resource-item-node">';
                        rContent+=    '<div tooltip="Edit Resource" class="node-box" style="float:right;padding-right:10px;">';
                        rContent+=        '<div id="' + resClickId + '" class="icon-pencil-edit-btn"></div>';
                        rContent+=     '</div>';
                        
                        rContent+=     '<table class="edit-resource-item-table">';
                        rContent+=         '<tr><td class="edit-resource-item-status95px">' + item.NmbNeeded +'  Required</td><td class="edit-resource-item-status95px">' + item.NmbCommitted + ' secured</td><td class="edit-resource-item-status40px">'+  item.Balance +'</td></tr>';
                        rContent+=     '</table>';                   
                        rContent+='</div>';

                        rContent+='<p><div class="cap-info-text">Resource Type:  '  + item.Type +'</div></p>';
                        rContent+='<p><div class="cap-info-text">Category Type:  '  + item.Category +'</div></p>';
                        rContent+='<p><div class="cap-info-text-bottom-border">FEMA RTLT:  '  + resDefLabel +'</div></p>';   


                        rContent+='<div class="expand-partner-item-node">';
                        rContent+=    '<div tooltip="Add Partner" class="node-box" style="float:right;padding-right:10px;">';
                        rContent+=        '<div id="' + addParClickId + '" class="icon-green-plus-btn"></div>';
                        rContent+=     '</div>';
                                               
                        // set globalID as Attribute                       
                        rContent+=     '<div id="' + resPartnerHeaderId + '" class="resource-info-heading"><img style="float:left;padding-right:5px;" src="./widgets/MutualAid/images/carratRight20x.png" id="' + resPartnerArrowId + '"/>Resource Partners</div>'; 
                        rContent+=     '<div id="' + resPartnerDivParent + '"></div>';// This is the parent that is removed with the toggle button
                           
                        rContent+='</div>';      





                    // Create TilePane for each Resource Item
                    var tp = new TitlePane({title:rTitle, content:rContent });
                        dom.byId("capInfo-resources").appendChild(tp.domNode);

                        tp.attr('open', false);
                        tp.startup();

                    // ***************************************************************************************
                    // Create a Resource Partner Toggle so that partners are not shown unless clicked to show
                    // This makes the query less complicated and results show faster
                    //
                    // Calls:   createSingleResPartnerList(ResID) show partners for selected resource
                    //
                    // ****************************************************************************************
                    var resPartnerToggleDiv = dom.byId(resPartnerHeaderId);
                        on(resPartnerToggleDiv, 'click', lang.hitch(this, function(showPartner){


                              var img = document.getElementById(resPartnerArrowId).src;
                              if (img.indexOf('Down20x')!=-1) {
                                  document.getElementById(resPartnerArrowId).src  = './widgets/MutualAid/images/carratRight20x.png';
                              
                                // Remove Partner Pane
                                this.removeSingleResPartnerList(resPartnerDivParent);

                              }
                               else {
                                 document.getElementById(resPartnerArrowId).src = './widgets/MutualAid/images/carratDown20x.png';
                                 // pass the DivID to append a partner List to selected DIV
                                this.showPartnersTargetDivId = resPartnerDivParent;

                                // *********************************************************************************
                                //  Must create uniqueID for each partnerEdit Button within each resource
                                //  partnerResourceTileId is used in  createSingleResPartnerList() 
                                // *********************************************************************************

                                this.partnerResourceTileId = i;

                                this.getSingleResPartnerList(item.GlobalID)

                             }




                        }));


                    // *******************************************************
                    // Create listeners for an edit button for each resource
                    // *******************************************************
                    var clickResNode = dom.byId(resClickId);
                        this.ccPanelResEditNodes.push(clickResNode);
                        this._ccPanelEditResBtn(i, item.Name, item.ObjectID, item.GlobalID, "clickedFrom");

                    // *******************************************************
                    // Create listeners for an edit button for each resource
                    // *******************************************************
                    var clickAddParNode = dom.byId(addParClickId);
                        this.ccPanelAddPartnerNodes.push(clickAddParNode);
                        this._ccPanelAddParBtn(i, item.Name, item.ObjectID, item.GlobalID, "clickedFrom");

                }))



        },





     // **************************************************
        // Create Event on Edit Resource Table Cell
        // Used to create clickable list for the resources 
        // **************************************************
        _ccPanelEditResBtn: function(i, rName, rOID, rID, clickedFrom){

            var resName =  rName;
            var resGID = rID;
            var resOID = rOID;

                on(this.ccPanelResEditNodes[i], 'click', lang.hitch(this, function(){

                        this._panelEditResClicked(resName,resGID, clickedFrom);
                   
                }));
        },


        // *****************************************************
        // EDIT RESOURCE ICON HAS BEEN CLICKED
        // *****************************************************
        _panelEditResClicked: function(resName,resGID, clickedFrom){

            this.config.selectedResGID=resGID; 
            this.config.selectedResName=resName;
          
            // ************************************************
            // Call AttrFormManager to create AddResource Form
            // ************************************************
                var createForm = new Add_Edit_Delete_ResourceDialog();
                    createForm._createCustomDomains("editRes", this.config);

        },

        // **************************************************
        // Create Event on Add Partner Resource Table Cell
        // Used to create clickable list for the resources 
        // **************************************************
        _ccPanelAddParBtn: function(i, rName, rOID, rID, clickedFrom){

            var resName =  rName;
            var resGID = rID;
            var resOID = rOID;

                on(this.ccPanelAddPartnerNodes[i], 'click', lang.hitch(this, function(){

                        this._panelAddParClicked(resName,resGID, clickedFrom);
                   
                }));
        },

        // *****************************************************
        // + ADD Partner RESOURCE ICON HAS BEEN CLICKED
        //  no parGID exists yet.
        // *****************************************************
        _panelAddParClicked: function(resName,resGID, clickedFrom){

            this.config.selectedResGID=resGID; 
            this.config.selectedResName=resName;
          
            // ************************************************
            // Call AttrFormManager to create AddResource Form
            // ************************************************
                var createForm = new Add_Edit_Delete_PartnerDialog();
                    createForm._createParFormComponents("addPar", this.config, resGID, this.config.selectedCap.GlobalID, null);



        },
        // ************************************************************************************
        // resPartnerToggleDiv HAS BEEN CLICKED!
        //
        // Get array of Partners for selected Resource & insert a new div with partner details
        // ************************************************************************************
        getSingleResPartnerList: function(resGID){

           var resTabl = this.config.relates.filter(function(item) { return item.queryTableName === 'Capability_Resources' && item.origin === 'Mission_AssistingOrgs'; });   
               resTableUrl = resTabl[0].originURL;
               relID = resTabl[0].queryRelId;

          // ************************************************************
          // Get create query to get Partners for a resource
          // ************************************************************
         // console.log('getPartnersForSingleResource-' + resTableUrl);

          var whereQuery = "ResourceFK='" + resGID + "'";
          var queryTask = new QueryTask(resTableUrl);
          var query = new esri.tasks.Query();
          query.outFields = ['*'];
          query.orderByFields=['Organization'];
          query.where = whereQuery;
          query.returnGeometry = false;
          queryTask.execute(query).then(lang.hitch(this, this.createSingleResPartnerList));
        },


        // ********************************************
        // Removes Partner Expansion
        // ********************************************
        removeSingleResPartnerList: function(removeDiv){

            var myNode = document.getElementById(removeDiv)
            
            while (myNode.firstChild) {
                  myNode.removeChild(myNode.firstChild);
            }


        },

        // **************************************************
        //
        // Create expanding item for each resource Partner
        //
        // **************************************************
        createSingleResPartnerList: function(results){

              this.ccPanelPartnerEditNodes = [];

              // Update Label with count of resource partners
     
              for (var i = 0; i < results.features.length; i++) {

                  var parEditClickedId = "parEditClickedId-r" + this.partnerResourceTileId + "-p" + i;

                    var pContent="";
                        pContent+='<div class="edit-partner-item-node">';
                        pContent+=    '<div tooltip="Edit Partner" class="node-box" style="float:right;padding-right:10px;">';
                        pContent+=        '<div id="' + parEditClickedId + '" class="icon-pencil-edit-btn"></div>';
                        pContent+=     '</div>';
                        
                        pContent+=     '<table class="edit-partner-item-table">';
                        pContent+=         '<tr><td class="edit-partner-item-status60px">' + results.features[i].attributes.NmbCommited +'</td><td class="edit-partner-item">' + results.features[i].attributes.Organization + '</td></tr>';
                        pContent+=     '</table>';                   

                        pContent+=     '<p><div class="cap-info-text">Committed Resources: '  + results.features[i].attributes.NmbCommited + '</div></p>';
                        pContent+=     '<p><div class="cap-info-text">Agreement Type: '  + results.features[i].attributes.Agreement +'</div></p>';
                        pContent+=     '<p><div class="cap-info-text">Agreement Details: '  + results.features[i].attributes.AgreementDetails +'</div></p>';
                        pContent+=     '<p><div class="cap-info-text-bottom-border">Comments: '  + results.features[i].attributes.Comments +'</div></p>';
                        
                        pContent+='</div>';

                    var newDIV = domConstruct.toDom(pContent);
                        domConstruct.place(newDIV, dom.byId(this.showPartnersTargetDivId), 'last');// could be "after" or "last"

                    var editpGID=results.features[i].attributes.GlobalID;
                    var editpOrg=results.features[i].attributes.Organization;
                    var resGID =results.features[i].attributes.ResourceFK;

                    // *******************************************************
                    // Create listeners for an edit button for each resource
                    // *******************************************************
                    var clickPartnerNode = dom.byId(parEditClickedId);// made unique with ResourceCount + partnerCount
                        this.ccPanelPartnerEditNodes.push(clickPartnerNode);
                        this._ccPanelPartnerEditBtn(i, editpGID, editpOrg, resGID, "clickedFrom");
              }  
          
        },



        // **************************************************
        // Create Event on Edit Partner Table Cell
        // Used to create clickable list for Partners
        // **************************************************
        _ccPanelPartnerEditBtn: function(i, parGID, pOrg, resGID, clickedFrom){

                on(this.ccPanelPartnerEditNodes[i], 'click', lang.hitch(this, function(){
                      this._panelPartnerEditClicked(i, parGID, pOrg, resGID, clickedFrom);                  
                }));
        },

        // *****************************************************
        // EDIT PARTNER ICON HAS BEEN CLICKED
        // *****************************************************
        _panelPartnerEditClicked: function(i,parGID, pOrg, resGID, clickedFrom){

            this.config.selectedPartnerGID=parGID; 
            this.config.selectedPartnerOrg=pOrg;
            this.config.selectedResGID = resGID;

            //var rName  = this.config.selectedResName;
            //var resGID = this.config.selectedResGID;
            var capID  = this.config.selectedCap.GlobalID;
          
            // ************************************************
            // Call Add Edit Delete Partner Dialog
            // ************************************************
                var createForm = new Add_Edit_Delete_PartnerDialog();
                    //TODO - add code to create a domain of partners already entered.
                    //createForm._createCustomDomains("editPar", this.config, resGID, capID, rName);
                    createForm._createParFormComponents("editPar", this.config, resGID, capID, parGID);
        },




        // ***************************************************************
        // Count partner Rsources and Calculate balance for each resource
        //
        countPartnerResources_0: function(rOID, rName, reqRes, i){
            console.log("Function:  countPartnerResources-" + rOID);

              var resTabl = this.config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
                  resTableUrl = resTabl[0].originURL;
                  relID = resTabl[0].queryRelId;

              var iteration=i;    

                // setup new featurelayer for capabilities; used soley for relationship queries
                var fLayer = new FeatureLayer(resTableUrl);
                // var fLayer = new FeatureLayer(this.this_config.resTableUrl.toString());
                var pSet=[];
          

                 //define relationship query 
                var relatedResourcesQry = new RelationshipQuery();
                    relatedResourcesQry.outFields = ["*"];
                    relatedResourcesQry.relationshipId = relID;
                    relatedResourcesQry.objectIds = [rOID];
                    this.ccEditParNodes = [];

                    fLayer.queryRelatedFeatures(relatedResourcesQry, lang.hitch(this, function(relatedRecords) {

                       var findBalance = "resBalance-" + rOID;
                       var updateBalance = dom.byId(findBalance)



//! Important       *****************************************************************************************************
//                     This this checks to see that the resource balance analysis for partners has been fully populated
//                  *****************************************************************************************************
                      if(this.capResourceArray.length==iteration+1){
                          
                          // Calling Partnership Counter
                          this.getUniquePartnerList(this.capResourceArray[0].CapID)
                          // Calling Balance Statitics for summary panel
                          this.countResourceItemsWithNoGaps();
                          this.createResourceListInPanel(); // Create initial resource list for cap Info Panel
                                                            // Call function to create Resource Panel once array is populated
                      }
                      // ***********************************************************************
                      // This may not be needed here, since it is used to to update table icons
                        if (typeof relatedRecords[rOID] == 'undefined') {
                            // console.log("No related resources for Capability OID: ", sourceID);
                            if(updateBalance){
                                updateBalance.innerHTML ='<div class="icon-warning-orange"></div>';
                            }

                            return;
                        }

                        pSet = relatedRecords[rOID].features;

                            var rCount=0;
                            array.forEach(pSet, lang.hitch(this, function(index, i){

                                //total partner committments for a given resource
                                rCount= rCount + index.attributes.NmbCommited;// spelling error in data model

                            })) // end array 

                            // *************************************************************
                            // Balance property on capResourceArray[i].Balance 
                            // are calculated directly here and updated to the table via dom 
                            // CapResourceArray for use with other functions on this page. 
                            var balance = rCount-reqRes;

                                this.capResourceArray[i].Balance = balance;
                                this.capResourceArray[i].NmbCommitted =rCount;
                                if((balance)>=0 && rCount!=0){
                                    this.capResourceArray[i].Gap = "Green"
                                }

                               if(balance<0 && rCount!=0){
                                    this.capResourceArray[i].Gap = "Red"
                                }

                            // ************************************************
                            // Update Resource count Values and Balance via DOM 
                            // ************************************************ 
                            var findResCount = "resCount-" + rOID;
                            var updateResCount = dom.byId(findResCount)
                                if(updateResCount){
                                    updateResCount.innerHTML = rCount
                                }

                                // ***************************************************************************
                                // If related partner records exist, apply appropriate symbol to balance value
                                // TODO - expand the datamodel so it has status value
                                // ****************************************************************************
                                if(updateBalance){

                                    if((balance)>=0 && rCount!=0){
                                        //updateBalance.innerHTML='<div class="icon-checkmark-green"></div>';
                                    }

                                    if(balance<0 && rCount!=0){
                                       //updateBalance.innerHTML = balance;
                                     }

                                    if(balance<0 && rCount==0){
                                        //updateBalance.innerHTML='<div class="icon-warning-orange"></div>';
                                    }

                                }


                        }))// end response function for related records



        },

        // ************************************************
        //  UPDATE Resource COUNTS via DOM on capInfo Panel 
        // ************************************************

        countResourceItemsWithNoGaps: function(){
            var countGreens=0;
            array.forEach(this.capResourceArray, lang.hitch(this, function(item) {

              if(item.Gap=="Green"){
                  console.log(item.Balance + " " + item.Name);
                  countGreens=countGreens+1;
   //               dom.byId("capInfo-rFully").innerHTML= countGreens + " resource types with no gaps";
              }

            }))

            //var resourceCount = dom.byId("capInfo-rCount");
            var resourceHeading = dom.byId("reqResCountId");// update with resourceCount
             
                  //if(resourceCount){

                      if(this.capResourceArray.length==1){
                          // resourceCount.innerHTML=this.capResourceArray.length + " required resource";
                          if(resourceHeading){resourceHeading.innerHTML =  "1 ";  }
                      }


                      if(this.capResourceArray.length>1){
                          // resourceCount.innerHTML=this.capResourceArray.length + " types of resources"
                          if(resourceHeading){resourceHeading.innerHTML = this.capResourceArray.length;  }
                      }


                //}

        },



        // ******************************************************************************
        //  Get list of unique Partners from Partner Table for specified capability.  
        //  This is called after
        // ****************************************************************************** 
        //! possible replace with uniqueArrayFunction from basic partner table query      
        getUniquePartnerList:function(capID){

                var qTable = this.config.relates.filter(function(item) { return item.origin === 'Mission_AssistingOrgs'; });
                var qTableUrl = qTable[0].originURL;

                console.log('getUniquePartnerList - task defined');

                var whereQuery = "CapabilityFK='" + capID + "'";
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
                    query.orderBy = "SummaryCount DESC";
                    queryTask.execute(query).then(lang.hitch(this, this.qComplete_UniquePartners));

        },

        // ********************************************************
        // This provides the summary of partners in the left panel 
        // ********************************************************
        qComplete_UniquePartners: function(results) {

                // *********************************************
                // Update Capability Summary with partner count

                var uPartnersArr=results.features;// save for layer use
                    if(uPartnersArr.length){// if 

                      console.log(uPartnersArr.length)
                      console.log(results);

                     // if(dom.byId("capInfo-pCount")){
                     //     dom.byId("capInfo-pCount").innerHTML= uPartnersArr.length + " partners supporting this capability";
                     // }

                     // **********************
                     // More than 0 Partners
                      if(dom.byId("partnerCountId")){
                       dom.byId("partnerCountId").innerHTML=uPartnersArr.length;// overwrite the "0"
                      }

                    }                                            
                    else{
                      // **********************************
                      // ZERO PARTNERS is the default
                      console.log("unassigned resource in partner results")
                   


                    }


                //var val = dom.byId("capInfo-partners");
                // *********************************************
                // list partners at the bottom of the info panel
                array.forEach(uPartnersArr, lang.hitch(this, function(item) {
                    var content="";
                        content='<div class="cap-info-text">' + item.attributes.Organization + '</div>';

                    var newDIV = domConstruct.toDom(content);
                                 domConstruct.place(newDIV, dom.byId('capInfo-partners'), 'last');// could be "after" or "last"
                }))



        },

// *****************************************************************************************************************
// List Core Capabilities with Images
// ToDo:  From this list, user should click item and selected item appears on a new page with tools and information
// ***************************************************************************************************************** 


/*
        maximizeWidget: function(widget) {
          if (typeof widget === 'string') {
            widget = this.getWidgetById(widget);
            if (!widget) {
              return;
            }
          }
          if (widget.state === 'closed') {
            this.openWidget(widget);
          }

          widget.setWindowState('maximized');
          try {
            widget.onMaximize();
          } catch (err) {
            console.log(console.error('fail to maximize widget ' + widget.name + '. ' + err.stack));
          }
        },


        //normal, minimized, maximized
        changeWindowStateTo: function(widget, state) {
          if (state === 'normal') {
            this.normalizeWidget(widget);
          } else if (state === 'minimized') {
            this.minimizeWidget(widget);
          } else if (state === 'maximized') {
            this.maximizeWidget(widget);
          } else {
            console.log('error state: ' + state);
          }
        },


*/



// Set Related Tables as application variables
      setGlobalQueryParameters:function(srcUrl){
          var requestHandle = esriRequest({
              "url": srcUrl,
              "content": {
                "f": "json"
              },
              "callbackParamName": "callback"
              });

          // requestHandle.then(lang.hitch(this, this.requestSucceeded, this.requestFailed));
          requestHandle.then(
            lang.hitch(this,

            function(response, io){
                var relationshipArr = io.relationships;
                var srcURL = this.config.capabilitiesUrl;
                var trimURL = this.config.capabilitiesUrl;
                    trimURL = trimURL.substring(0, trimURL.length - 2); // JF not necessary for capabilities layer

                // var resTableName = this.config.relatedResourceTableName;
                // var parTableName = this.config.relatedPartnerTableName;
                // var hazTableName = this.config.relatedHazardsTableName;

                this.config.keyTables =[];
                this.config.relates = [];

                //JF Must first create an array of key tables.  
                //   Capabilities are a key table that is not returned in the relationshipArr
                //   Create artificial record for capabilities table
                this.config.keyTables.push({
                    tableName : "Capabilities",
                    tableUrl : srcURL,  // JF changed to url, not related table url, since this needs to the the url of the source layer
                });

                // Loop through returned keyTables
                array.forEach(relationshipArr, lang.hitch(this, function(table, i){                     
                  var relURL = trimURL + "/" + table.relatedTableId;
                        this.config.keyTables.push({

                          tableName : table.name,
                          tableUrl : relURL  // JF changed to url, not related table url, since this needs to the the url of the source layer
                        });
 
                      //JF  Send the array of KeyTables to function to determine relationshipID for each key table
                      if(i==relationshipArr.length-1){
                        this.setGlobalQueryParameters_again(this.config.keyTables);
                        console.log(this.config.keyTables);
                      }

                }));// END LOOP for relationshipArr

            },// END Response function

            function(error){
                  alert(error);
            }));

      },

      //sets related table global variables for tables related to capabilities
      setGlobalQueryParameters_again:function(keyTablesArr){

      array.forEach(keyTablesArr, lang.hitch(this, function(srcTable, i){   

        var requestHandle = esriRequest({
            "url": srcTable.tableUrl, // use the url for each Key Table
            "content": {
              "f": "json"
            },
            "callbackParamName": "callback"
            });

          // requestHandle.then(lang.hitch(this, this.requestSucceeded, this.requestFailed));
          requestHandle.then(
            lang.hitch(this,
            function(response, io){
                var relationshipArr = io.relationships;
                var trimURL = this.config.capabilitiesUrl;
                newURL = trimURL.substring(0, trimURL.length - 2) + "/" + relationshipArr[0].relatedTableId;

                array.forEach(relationshipArr, lang.hitch(this, function(table){    

                  this.config.relates.push({
                    origin: srcTable.tableName,// Jf Insure that the source remains the same, while the relatedTableID is calculated in reference to it
                    originURL: srcTable.tableUrl, // JF Keep the Source url the same, but change the related tablename and the RelationhipID
                    queryTableName : table.name,
                    queryRelId : table.id
                  });

                }));// END LOOP for thira webmap
              },
              function(error){
                alert(error);
              }));

      }));// end loop through keyTables    

      console.log(this.config.relates);

      },


  



// ********************************************************
//  Function 3  Adds and Removes Capabilities Layer to Map
// ********************************************************
 newLayer: function (url, token, newTitle) {
 //     this.hideCapSummary(); // remove table window 
        console.log("Begin adding Planning Layer");

        if(this.featureLayer){

            this.map.removeLayer(this.featureLayer);
        }
                
                if(typeof url == 'undefined'){
                    console.log('url is undefined..');
                    alert("this is a new layer!  Initiate new layer.")

                    this.initCapabilityForm();
                }

                
               var newurl='';
               if (token){
                 newurl=url.toString()+"?token="+token;
                 this.url = newurl;

               }
               else{
                 newurl=url.toString();
                 this.url = newurl;
               }
      

            // *******************************************************************
            // When a new url is selected the app must change numerous settings
            // 
            // - First Remove previous feature layer from map  
            // - Clear left panel.  reset config.defaults
            //
            // 1)  Zoom to new feature location zoom to selected layer
            // 2)  Query for new Attributes
            // 3)  Create a new Hazard Array
            // *******************************************************************

            this.config.capabilitiesUrl = url;  // this does not contain token.  it is re-used in numerous places

            this.queryToZoomToSingleFeature(newurl, "1=1");

            // get attributes for planning layer
            this.queryCapabilitiesLayer2(newurl, "1=1");

            // reset the hazards list based on the current plan
            this._createHazArray(newurl);



               
            var content = "<b>Capability</b>: ${Capability}" +
                "<br><b>Outcomes</b>: ${Outcomes}" +
                "<br><b>Impacts</b>: ${Impacts}" +
                "<br><b>Targets</b>: ${Targets}" +
                "<br><b>Jurisdiction</b>: ${Jurisdiction}" +
                "<br><b>ESF</b>: ${ESF}" +
                "<br><b>Threat Hazard</b>: ${Threat_Hazard}";
                
      
          var json = {title: newTitle,content: content};

                // default infoTemplate
                 var infoTemplate = new InfoTemplate(json);

               
               this.featureLayer = new FeatureLayer(newurl.toString(), {
                    id: this.id,
                    title: this.title,
                    minScale: this.minScale,
                    maxScale: this.maxScale,
                    outFields: ["*"],
                    infoTemplate: infoTemplate,
                    visible: this.visible,
                    maxRecordCount: "1"

                });
            
                this.featureLayer.setDefinitionExpression("1=1");

                var ringColorArray=this.config.capabilitiesColorBoundary;
                var ringWidth=this.config.capabilitiesWidth;
                var newRenderer = new SimpleRenderer(

                //new SimpleLineSymbol("solid", new Color([79, 131, 197]), 5)
                new SimpleLineSymbol("solid", new Color(ringColorArray), ringWidth)
                );
            

                // var newRenderer = new SimpleRenderer();
                // var fillSymbol = new SimpleFillSymbol("solid", null, new Color([79, 131, 197]));
                // // fillSymbol.setColor(new Color([146, 172, 211, 0]));
                // fillSymbol.outline.setColor(new Color([0, 0, 0, 0.5]));
                // fillSymbol.outline.setWidth(5);
                // newRenderer.backgroundFillSymbol = fillSymbol;

                this.featureLayer.setDefinitionExpression(this.defQuery);
                this.featureLayer.setRenderer(newRenderer);
                this.featureLayer.setOpacity(.9);
            
            // add to map
            this.map.addLayer(this.featureLayer);

            if(newTitle){ // changes name of selected Thira layer in Panel  
//              this.updateThiraName(newTitle);
            }

            console.log("finished adding")



        }



// *************************************************************************
//  Function 4  Get Hazards from Capabilities layer
// *************************************************************************   




// *************************************************************************
//  Function 5  Create Operations List (Core Capabilities List)
// *************************************************************************   





  });
});