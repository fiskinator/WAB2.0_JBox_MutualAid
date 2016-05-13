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

  //'jimu/dijit/TileLayoutContainer',
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
  TileLayoutContainer_JF, ImageNode, AboutThisApp, RES_TableConstructor, CAP_AddRecordDialog, CAP_EditRecordDialog, Button, 
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
/*
            this.resultItemList = new TileLayoutContainer_JF({
                strategy: 'fixWidth',
                itemSize: {
                    width: 340,
                    height: 55
                }, //image size is: 100*60,  200x133 = 80 x 53
                maxCols: 1,
                hmargin: 15,
                vmargin: 2
            }, this.resultItemListNode);


            this.resultItemList.startup();
*/




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
               // insertTable+= '<div class="slideShowHeader">';
                insertTable+=   '<div id="formParentDiv" dir="ltr"></div';
               // insertTable+=       '<div class="horizontal-text-with-slideShow-icon" id="slideShowHeaderId"></div>';// Used for title of slide
               // insertTable+=       '<div class="icon-cancel-circle-slideShowHeader" id=closeSlideShowId></div>';// <div class="horizontal-right-content" id="AddPartnerBtnId_EMACBtn">
               // insertTable+=       '<div class="horizontal-cont-clear"></div>';
               // insertTable+=    '</div>';
               // insertTable+= '</div>'; //JF Inserted to contain additional DIV window to replace mapDiv -->

            var newDIV = domConstruct.toDom(insertTable);
                domConstruct.place(newDIV, dom.byId('map'), 'first');


 //           <div id="slideShowDiv" dir="ltr"></div><!--  JF Inserted to contain alternate window to replace mapDiv -->

    },


    onOpen: function(){

      // alert("ON OPEN");
      // this.displayBookmarks();

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
            var maBackBtn = new Button({
                label: "Back",
                id:"appBackBtn",
                //baseClass: "AboutThisAppBtn",
                //iconClass: "playScreenIcon",
                //style: "padding-bottom: 5px;",
                onClick: lang.hitch(this,function(){
                // Do something:
                  //this._openSlideShow("overview");
                  alert("clicked")
            })
            }, "maBackBtn").startup();

          //this._startupGroupContentListDijit();// startup dijit that will manage the "bookmarkList" Dijit created in panel 2

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

     // ***********************************************************************************************
     //  Function updates a header that shows the active Planning layer name and thumbnail
     //           Called by _getDefaultThiraLayer AND by  _onBookmarkClick when changing planning layers
     // ***********************************************************************************************
//      insertSelectedLayerAsHeader:function(selectedLyrUrl, selectedLyrThumb, selectedLyrTitle){

//       this.inherited(arguments);

        // reset configured capabilitiesUrl for later use.
//        this.config.capabilitiesUrl = selectedLyrUrl;

//        var showHeader = document.getElementById("selectedLyrHeaderId");
//          if(showHeader){
//                  showHeader.style.display='block';    
//         }


// Name of planning layer.  This does not show the name at the moment.
// Could change the name of the viewer


  //      var getSelectedLyrImg = document.getElementById("selectedLyrImgId");
  //          getSelectedLyrImg.src=selectedLyrThumb;

  //      var getSelectedLyrTitle = document.getElementById("selectedLyrTitleId");
  //          getSelectedLyrTitle.innerHTML=selectedLyrTitle;

        // Switching layer does not have definition filter by default.

//      },





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

          console.log("Hazard query " + url );                      
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

          console.log(hazArr);

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
            console.log("my value:", value);
            var defQuery = "";

            if (value == 'All Hazards'){
              defQuery = "1=1";
            }
            else{
              defQuery = "Threat_Hazard Like '%" + value + "%'";
            }
 //TODO     this.hideCapSummary(); // remove table window
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
/*
      // ************************************************************
      // 1) List Core Capabilities from specified Capabilities layer
      // ************************************************************
      queryCapabilitiesLayer: function(url, defQuery) {
          console.log('queryCapabilitiesLayer - task defined');
          var whereQuery = defQuery; // 1=1 is the default set at handleItemResults()
          var queryTask = new QueryTask(url);
          var query = new esri.tasks.Query();
          query.outFields = ['ESF,Capability'];
          query.where = whereQuery;
          query.returnGeometry = false;
          queryTask.execute(query).then(lang.hitch(this, this.queryCapabilitiesCompleted));
      },


      queryCapabilitiesCompleted: function(results) {
          console.log('queryCapabilities - Task Completed');
          this.capArr = []; // reset the array

          for (var i = 0; i < results.features.length; i++) {
              //var feature = features[i];
              this.capArr.push({
                  Capability: results.features[i].attributes.Capability,
                  ESF: results.features[i].attributes.ESF,
                  GlobalID: results.features[i].attributes.GlobalID,
                  //Impacts: results.features[i].attributes.Impacts,
                  Jurisdiction: results.features[i].attributes.Jurisdiction,
                  //Outcomes: results.features[i].attributes.Outcomes,
                  ResourceID: results.features[i].attributes.ResourceID,
                  //Targets: results.features[i].attributes.Targets,
                  Threat_Hazard: results.features[i].attributes.Threat_Hazard,
                  ObjectID: results.features[i].attributes.OBJECTID,
                  resCount: "0",
                  resTotal: "0",
                  totResourcesReq: "0", // JF Populated in _qryRelatedResources
                  totResourcesCommit: "0",
                  totResourceTypes: "0", // JF Populated in _qryRelatedResources
                  totResPartnerCount: 0, // JF Populated in _qryAssistingJuris
                  resCommitted: "0",
                  pctResourced: "0",
                  countComplete: "0 of " + (i + i) + ' Required Resources Fulfilled',
                  resourceArray: [], // array of resources assoc with capability
                  assistingArray: [], // array of assisting agencies assoc with capability
              });
              var sourceID = results.features[i].attributes.OBJECTID;
              //this._qryRelatedResources(sourceID, this.featureLayer, i); // this.featureLayer is set in ThiraLayer.js
          } // end loop

//TODO          this._placeThiraCoreCapList(this.capArr);
          
          console.log('zoomToThira: true or false');

          console.log(this.capArr);
          
      
      this._updateExtent(results);
      

          
          
      },
*/



      // Required to improve performance of initial attribute list.  Geometries dramatically slow performance of app.

      queryToZoomToSingleFeature: function(url, defQuery){
          console.log('queryCapabilitiesLayer - task defined');
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
          console.log('queryCapabilitiesLayer - task defined ' + url);
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
          //this.capArr=results.features;

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


//TODO   this._placeThiraCoreCapList(this.capArr);
          
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


        // console.log("COMPLETED " + this.capArr)


        //         array.forEach(this.capArr, function(coreCap) {
        //             //bookmark.isInWebmap = true;
        //             coreCaps.title = coreCap.Capability;
        //             console.log("bookmark: " + bookmark.capability);

        //             var repeat = 0;
        //             for (var i = 0; i < this.coreCaps.length; i++) {
        //                 if (this.coreCaps[i].title === coreCap.Capability) {
        //                     repeat++;
        //                 }
        //             }
        //             if (!repeat) {
        //                 this.coreCaps.push(coreCap);
        //             }
        //         }, this);
 
        //         console.log(this.coreCaps);

                this.displayBookmarks(this.capArr);

      },


      zoomToExtentOfSingleFeature: function(results){

        if (results.features[0].geometry){
          console.log('update Extent has geometries');
          var extent = esri.graphicsExtent(results.features); 
        }
    
        //set map extent to features extent
        if(extent) {
      
          this.map.setExtent(extent.expand(1.5));
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


          // This should be used for 

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
        var listHeight = box.h - 37 - 21 - 61 - 55; // JF added 55 to make room for the insert item. 

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
//  BEGIN RELATIONSHIP QUERIES FROM CLICKING ON CAPABILITY
//    PASS THE OBJECTID OF THE SELECTED CAPABILITY
// ********************************************************
    _onBookmarkClick: function(coreCap) {
     
        this.config.selectedCap=[];

        this.config.selectedCap = coreCap;


        //var thiraUrl=coreCap.url + '/2';

        console.log(coreCap.Capability);

        if(coreCap.Capability=="Add Capability Target"){

          alert("Add Cap has been clicked")
        }
        else{

          this._insertCapInfo(coreCap);

          this.createCapResourceArray_0(coreCap.ObjectID);// create summaryArray

          document.getElementById("showerId").className="hiddenDiv";
          document.getElementById("hiderId").className="showingDiv";

          document.getElementById("selectedCoreCapImg").src=coreCap.ThumbnailUrl;
          document.getElementById("selectedCoreCapTitle").innerHTML=coreCap.Capability;
        }

      // possible way to change the title of the viewer.
      //onAppConfigChanged: function(appConfig, reason, changedData){
      //topic.publish("appConfigChanged", lang.hitch(this, this.onAppConfigChanged)));

        //this.TitleNode.set('value', new Date());
    
    },



    // InfoPanel left hand side of
    _insertCapInfo: function(coreCap){

      var content="";
           content+='<div class="capInfoTextContainer" id="capInfoId">'
           content+=   '<div class="cap-info-heading">Capability Summary</div>';
           content+=   '<div id="capInfo-rCount" class="cap-info-text"></div>';
           content+=   '<div id="capInfo-rFully" class="cap-info-text"></div>';
           content+=   '<div id="capInfo-pCount" class="cap-info-text"></div>';
           content+=   '<div class="cap-info-heading">Jurisdiction</div>';
           content+=   '<div class="cap-info-text">' + coreCap.Jurisdiction + '</div>';
           content+=   '<div class="cap-info-heading">Threats / Hazards</div>';
           content+=   '<div class="cap-info-text">' + coreCap.Threat_Hazard  +'</div>';
           content+=   '<div class="cap-info-heading">Target Capability</div>';
           content+=   '<div class="cap-info-text">' +coreCap.Target + '</div>';
           content+=   '<div class="cap-info-heading">Impacts</div>';
           content+=   '<div class="cap-info-text">' +  coreCap.Impact  + '</div>';
           content+=   '<div class="cap-info-heading">ESF</div>';
           content+=   '<div class="cap-info-text">' + coreCap.ESF + '</div>';
           content+=   '<div class="cap-info-heading">Outcomes</div>';
           content+=   '<div class="cap-info-text">' + coreCap.Outcome + '</div>';
           content+=   '<div class="cap-info-heading">Resource Partners</div>';
           content+=   '<div id="capInfo-partners" class="cap-info-text"></div>';
           content+='</div>';

      var val = dom.byId("capInfoId");

          if(!val){

            var newDIV = domConstruct.toDom(content);
                domConstruct.place(newDIV, dom.byId('selectedCoreCap'), 'after');// could be "after" or "last"

          }
          else{// this should not ever occur, since the element is removed when back button is clicked

            alert("removed cap-info DOM elements");
            val.remove();

            var newDIV = domConstruct.toDom(content);
                domConstruct.place(newDIV, dom.byId('selectedCoreCap'), 'after');// could be "after" or "last"

          }


    },


    _onBackBtnClicked: function(){

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




    _clickCapEditBtn:function(){
        this.inherited(arguments);

        alert("This is an edit window");

                    //JF Call Summary as a constructor.
                    this.capEdit = new CAP_EditRecordDialog ({// this calls the constructor.  No need for analysis functions
                        capID: this.config.selectedCap.GlobalID,
                        capName: this.config.selectedCap.Capability,
                        this_config: this.config
                    });


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


              //this.minimizeWidget();

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
        //  New Code to createCapArray
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

                    if (typeof relatedRecords[capOID] == 'undefined') {

                        //alert("No reources exist.  Please add resources for this capability.");

                        var resourceCount = dom.byId("capInfo-rCount");
                            if(resourceCount){
                                resourceCount.innerHTML="No resources allocated.";
                            }

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

                    }// Related reource do exist for the selected capability!
                }));

                }
                else{
                    alert("Can not determine the resource table for this capability.  Problem with relates.");
                }

        },




        countPartnerResources_0: function(rOID, rName, reqRes, i){
            //console.log("Function:  countPartnerResources-" + rOID);
// test comment
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
                          
                          console.log("Updated Resource Array: " + this.capResourceArray)
                          console.log("calling ");
                          // Calling Partnership Counter
                          this.getUniquePartnerList(this.capResourceArray[0].CapID)
                          // Calling Balance Statitics for summary panel
                          this.countResourceItemsWithNoGaps();

                      }


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


                            //if(this.capResourceArray.length==i+1){



                            //}


                        }))// end response function for related records



        },


        countResourceItemsWithNoGaps: function(){
            var countGreens=0;
            array.forEach(this.capResourceArray, lang.hitch(this, function(item) {

              if(item.Gap=="Green"){
                  console.log(item.Balance + " " + item.Name);
                  countGreens=countGreens+1;
                  dom.byId("capInfo-rFully").innerHTML= countGreens + " resource types with no gaps";
              }

            }))

            var resourceCount = dom.byId("capInfo-rCount");
                if(resourceCount){

                  if(this.capResourceArray.length==1){
                      resourceCount.innerHTML=this.capResourceArray.length + " resource required"
                  }
                  else{
                       resourceCount.innerHTML=this.capResourceArray.length + " types of resources"
                  }

                }

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

// UPDATE SUMMARY

        qComplete_UniquePartners: function(results) {

                // *********************************************
                // Update Capability Summary with partner count
                var uPartnersArr=results.features;// save for layer use
                    if(uPartnersArr.length){// if 

                      if(dom.byId("capInfo-pCount")){

                          dom.byId("capInfo-pCount").innerHTML= uPartnersArr.length + " partners supporting this capability";

                      }


                    }                                            
                    else{
                      console.log("unassigned resource in partner results")
                    }


                var val = dom.byId("capInfo-partners");
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





// Dynamically create the bookmarList dijit
// Must be running when the content is ready to add to add to it.
/*
      _startupGroupContentListDijit: function(){
                console.log("Place ThiraPicker Contents");

                this.inherited(arguments);

                if (!this.groupContentList) {// this is the new "bookmarkList" object used in the tileLayout container


                    var bookmarkNode = dijit.byId('groupContentListId');
                    if (bookmarkNode) {
                        bookmarkNode.destroyRecursive();
                    }


                    this.groupContentList = new TileLayoutContainer({
                        id: "thiraLayerList",
                        strategy: 'fixWidth',
                        itemSize: {
                            width: 100,
                            height: 92
                        }, //image size is: 100*60,
                        hmargin: 15,
                        vmargin: 5
                      }, "groupContentListId");


                    //initiate hazard dropdown
                    domConstruct.place(this.groupContentList.domNode, "thiraLayerPicker", "replace");

                    this.groupContentList.startup();
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


  



// **************************************************
//  Function 3  Add Capabilities Layer to Map
// **************************************************
 newLayer: function (url, token, newTitle) {
 //               this.hideCapSummary(); // remove table window 
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
      
//ToDo              this.queryCapabilitiesLayer(newurl, this.defQuery);
//ToDo               this._createHazArray(newurl);
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
//                this.updateThiraName(newTitle);
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