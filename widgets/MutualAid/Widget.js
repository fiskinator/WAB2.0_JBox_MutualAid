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
  './Add_NewPlan_GeographyDialog',
  './dijit/TileLayoutContainer_JF',
  './ImageNode',
  './AboutThisApp',
  './RES_TableConstructor',
  //'./CAP_InitiateDialog',

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
 TitlePane, Add_Edit_Delete_CapabilityDialog, Add_Edit_Delete_ResourceDialog, Add_Edit_Delete_PartnerDialog, Add_NewPlan_GeographyDialog,
 TileLayoutContainer_JF, ImageNode, AboutThisApp, RES_TableConstructor, Button, 
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

            //use config to store groups array
            this.config.myGroups = [];
            // this is reset every time a user changes the planning layer
            this.config.capabilitiesUrl="";
            this.config.thiraExtent="";
            this.config.capabilitiesLayerName="";
            this.config.capabilitiesDefExpression="1=1";   //start with a default that can be changed later
            this.config.previousGroupSelection="";
             
                                
            topic.subscribe("REFRESH_CAPINFO", lang.hitch(this, this.onEditCapSaved));
            topic.subscribe("DELETED_CAPABILITY", lang.hitch(this, this._onBackBtnClicked));
            topic.subscribe("ADDED_CAPABILITY", lang.hitch(this, this._onBackBtnClicked));
            topic.subscribe("REFRESH RESOURCE TABLE VIEW", lang.hitch(this, this._onResTableViewEdit));


  
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
            // -NOT SURE ABOUT THIS  . . . Check to see if vUSA widget is already logged in

            //auto login on startup (occurs after webmap switching) if login existed
            //JF todo     
            //        if (this.appConfig.vUSALogin == true) {
            //      this._onLoginBtnClicked();
            //        }



        // JF Insert Divs for table and slideshow.

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

    _getWidgetWhenLoaded: function(id) {  
        var splashWidget = registry.byId(id);  
              splashWidget.startup();
    }, 

    createDrawerMenus: function(){

        this.inherited(arguments)


            var capContent = dom.byId("thiraMenuId");

                on(capContent, 'click', lang.hitch(this, function(menuId){
                    console.log('capabilities-click-event');
                    this.showDrawerMenu("thiraContent"); 
                }));


            var aboutContent = dom.byId("aboutMenuId");

                on(aboutContent, 'click', lang.hitch(this, function(menuId){
                    console.log('about-click-event');
                    this.showDrawerMenu("aboutContent"); 
                }));


            var settingsContent = dom.byId("settingsMenuId");

                on(settingsContent, 'click', lang.hitch(this, function(menuId){
                    console.log('settings-click-event');
                    this.showDrawerMenu("settingsContent"); 
                }));



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
            // Insert Feedback Button - 
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


            // *********************************
            // Insert Splash Screen Button - 
            // *********************************
            var appSplashBtn = new Button({
                label: "Show Spash Screen",
                id:"appBtn4",
                baseClass: "AboutThisAppBtn",
                iconClass: "playScreenIcon",
                style: "padding-bottom: 5px;",
                onClick: lang.hitch(this,function(){
                // Do something:
                
                var splashWidget = this.widgetManager.getWidgetsByName("Splash");  

                if(splashWidget){
                   this._getWidgetWhenLoaded(splashWidget[0].id);// ID from config.json.  splash is an Onscreen widget and it requires that ID does not change
                }
                 
            })
            }, "appBtn4").startup();


            // *********************************
            // Insert Using This App Button - 
            // *********************************
            var appNewLayerBtn = new Button({
                label: "Create Planning Layer",
                id:"appBtn5",
                baseClass: "AboutThisAppBtn",
                iconClass: "addPlusIcon",
                style: "padding-bottom: 5px;",
                onClick: lang.hitch(this,function(){

                this._CopyFeatureService();
                   
            })
            }, "appBtn5").startup();
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
        var drawerMenu_3=dom.byId("settingsMenuId");
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

          else if(menu=="settingsContent"){
              drawerMenu_1.className = "item";
              drawerMenuPanel_1.className = "panel";
              drawerMenu_2.className = "item";
              drawerMenuPanel_2.className = "panel ";
              drawerMenu_3.className = "item item-selected";
              drawerMenuPanel_3.className = "panel panel-selected"; 


              if(this.config.curentUser){
                this.groupSelect2.attr('value', this.config.previousGroupSelection,false);
              }


          }

    },
  

// ******************************************************
// Open code used in Thira Template to create slideshow
// ******************************************************
    _openSlideShow: function(show){

       this.newSlideShow = new AboutThisApp(show);
    },

// ******************************************************
// Create a new resource planning service, apply tags,  
//  and share it with the default sharing group
// ******************************************************
    _CopyFeatureService: function(){

      var userID = this.portal.user.username;
      var pUrl = this.portal.url + 'sharing/rest/content/users/' + userID + '/createService';
      console.log(pUrl);

      var createParameters = '{"currentVersion":10.3,"serviceDescription":"Capability and Resource Planning Data Template","hasVersionedData":false,"supportsDisconnectedEditing":false,"hasStaticData":false,"maxRecordCount":1000,"supportedQueryFormats":"JSON","capabilities":"Query,Editing,Create,Update,Delete,Sync","description":"This is a data model template that is used as a companion with the THIRA - based Capability and Resource Planning App.","copyrightText":"","allowGeometryUpdates":true,"units":"esriMeters","size":1097728,"syncEnabled":true,"syncCapabilities":{"supportsAsync":true,"supportsRegisteringExistingData":true,"supportsSyncDirectionControl":true,"supportsPerLayerSync":true,"supportsPerReplicaSync":true,"supportsSyncModelNone":true,"supportsRollbackOnFailure":true},"editorTrackingInfo":{"enableEditorTracking":false,"enableOwnershipAccessControl":false,"allowOthersToUpdate":true,"allowOthersToDelete":true},"xssPreventionInfo":{"xssPreventionEnabled":true,"xssPreventionRule":"InputOnly","xssInputRule":"rejectInvalid"},"tables":[{"id":3,"name":"ResourcePlanning_HazardsCONOPS","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":4,"name":"ResourcePlanning_Orgs","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":5,"name":"ResourceCatalog_RTLT","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":6,"name":"ResourcePlanning_Assisting","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":7,"name":"Organizations","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":8,"name":"Threats_Hazards","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":9,"name":"Capability_Resources","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0},{"id":10,"name":"Capability_List","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0}],"_ssl":false,"name":"marpPlanningLayer3","tags":["shared:thira"]}'
      //var createParameters = '{"allowGeometryUpdates":true,"capabilities":"Create,Delete,Query,Update,Editing,Extract","copyrightText":"","currentVersion":10.3,"name":"marpPlanningLayer2","description":"This is a data model template that is used as a companion with the THIRA - based Capability and Resource Planning App.","editorTrackingInfo":{"allowAnonymousToDelete":true,"allowAnonymousToUpdate":true,"allowOthersToDelete":true,"allowOthersToQuery":true,"allowOthersToUpdate":true,"enableEditorTracking":false,"enableOwnershipAccessControl":false},"fullExtent":{"spatialReference":{"latestWkid":3857,"wkid":102100},"xmax":-9174771.9899,"xmin":-9239096.9872,"ymax":5337707.9830000028,"ymin":5241756.9870999977},"hasStaticData":false,"hasVersionedData":false,"initialExtent":{"spatialReference":{"latestWkid":3857,"wkid":102100},"xmax":-9152701.3169543426,"xmin":-9279940.6810826082,"ymax":5353977.9344786974,"ymin":5290984.01977913},"layers":[{"defaultVisibility":true,"id":0,"maxScale":0,"minScale":0,"name":"Capabilities","parentLayerId":-1,"subLayerIds":null},{"defaultVisibility":true,"id":1,"maxScale":0,"minScale":0,"name":"CommittedResources","parentLayerId":-1,"subLayerIds":null}],"maxRecordCount":1000,"serviceDescription":"Capability and Resource Planning Data Template","size":385024,"spatialReference":{"latestWkid":3857,"wkid":102100},"supportedQueryFormats":"JSON","supportsApplyEditsWithGlobalIds":true,"supportsDisconnectedEditing":false,"syncEnabled":false,"tables":[{"defaultVisibility":true,"id":2,"maxScale":0,"minScale":0,"name":"RequiredResources","parentLayerId":-1,"subLayerIds":null}],"units":"esriMeters","xssPreventionInfo":{"xssInputRule":"rejectInvalid","xssPreventionEnabled":true,"xssPreventionRule":"InputOnly"}}'

      var newParams = {
      'outputType': 'featureservice',
      'createParameters': createParameters,
      'token': this.config.token,
      'f': 'json'
      };

      var newRequest = esriRequest({
        url: pUrl,// + "?token=" + this.config.token, 
        content: newParams,
        handleAs: "json"
        },

        {usePost: true
      });

     //fire off request and then add definition (service layers, fields) to new service
     newRequest.then(lang.hitch(this,function(data){
   
        //console.log("Data: ", data); // print the data to browser's console

        //share new capability service with the default thira sharing group
        var shareURL = this.portal.url + '/sharing/rest/content/users/' + this.portal.user.username + '/shareItems';
        var shareParams = {
          'items': data.itemId,
          'groups': this.config.defaultGroupId,
          'token': this.config.token,
          'f': 'json'
        };        

        var shareRequest = esriRequest({
          url: shareURL,
          content: shareParams,
          handleAs: "json"
          },
          {usePost: true
        });

        shareRequest.then(this._requestSucceeded, this._requestFailed);   

        //update the capability service with tags and description
        var updateURL = "http://www.arcgis.com/sharing/rest/content/users/" + this.portal.user.username + "/items/" + data.itemId + "/update";
        var updateParams = {
          'tags':'shared:marp',
          'snippet': 'This is a data model template, used as a companion with the THIRA-based Capability and Resource Planning App.',
          'token': this.config.token,
          'f': 'json'
        };

        var updateRequest = esriRequest({
            url: updateURL,
            content: updateParams,
            handleAs: "json"
            },
            {usePost: true
          });

        updateRequest.then(this._requestSucceeded, this._requestFailed);   

        // add service definition to the new service
        var serviceURL = data.serviceurl;
        var defParameters =  '{"layers":[{"currentVersion":10.3,"id":0,"name":"Resources","type":"Feature Layer","displayField":"Title","description":"","copyrightText":"","defaultVisibility":false,"editingInfo":{"lastEditDate":1446586546239},"relationships":[],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"geometryType":"esriGeometryPoint","minScale":0,"maxScale":0,"extent":{"xmin":-13471550.81732936,"ymin":2773527.0060945987,"xmax":-7650209.3657860095,"ymax":6383818.249802011,"spatialReference":{"wkid":102100}},"drawingInfo":{"renderer":{"type":"simple","symbol":{"type":"esriSMS","style":"esriSMSCircle","color":[133,0,11,255],"size":4,"angle":0,"xoffset":0,"yoffset":0,"outline":{"color":[0,0,0,255],"width":1}},"label":"","description":""},"transparency":0,"labelingInfo":null},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Title","type":"esriFieldTypeString","alias":"Title","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Description","type":"esriFieldTypeString","alias":"Description","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Department","type":"esriFieldTypeString","alias":"Department","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Vehicle_Type","type":"esriFieldTypeString","alias":"Vehicle Type","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Unit_Number","type":"esriFieldTypeString","alias":"Unit Number","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"NIMS_Type","type":"esriFieldTypeString","alias":"NIMS Type","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Location","type":"esriFieldTypeString","alias":"Location","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Modified","type":"esriFieldTypeDate","alias":"Modified","sqlType":"sqlTypeOther","length":8,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Latitude","type":"esriFieldTypeDouble","alias":"Latitude","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Longitude","type":"esriFieldTypeDouble","alias":"Longitude","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Path","type":"esriFieldTypeString","alias":"Path","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Category","type":"esriFieldTypeString","alias":"Category","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_HazMat","type":"esriFieldTypeInteger","alias":"Response_HazMat","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_Fire_Urban","type":"esriFieldTypeString","alias":"Response_Fire_Urban","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_Fire_Wild","type":"esriFieldTypeString","alias":"Response_Fire_Wild","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_Weather","type":"esriFieldTypeString","alias":"Response_Weather","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_WinterWeather","type":"esriFieldTypeString","alias":"Response_WinterWeather","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_DrinkingWater","type":"esriFieldTypeString","alias":"Response_DrinkingWater","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_NaturalDisaster","type":"esriFieldTypeString","alias":"Response_NaturalDisaster","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_MassCasualty","type":"esriFieldTypeString","alias":"Response_MassCasualty","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_Terrorism","type":"esriFieldTypeString","alias":"Response_Terrorism","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Land","type":"esriFieldTypeInteger","alias":"Land","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Water","type":"esriFieldTypeString","alias":"Water","sqlType":"sqlTypeOther","length":256,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"GlobalID_idx","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"user_3578.NISC_Resource_Planning_Demo_Resources_Shape_sidx","fields":"Shape","isAscending":false,"isUnique":false,"description":"Shape Index"},{"name":"PK__NISC_Res__F4B70D859E01A2A6","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Resources_SCC","description":"","drawingTool":"esriFeatureEditToolPoint","prototype":{"attributes":{"Water":null,"Title":null,"Description":null,"Department":null,"Vehicle_Type":null,"Unit_Number":null,"NIMS_Type":null,"Location":null,"Modified":null,"Latitude":null,"Longitude":null,"Path":null,"Category":null,"Response_HazMat":null,"Response_Fire_Urban":null,"Response_Fire_Wild":null,"Response_Weather":null,"Response_WinterWeather":null,"Response_DrinkingWater":null,"Response_NaturalDisaster":null,"Response_MassCasualty":null,"Response_Terrorism":null,"Land":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync","adminLayerInfo":{"geometryField":{"name":"Shape","srid":102100}}},{"currentVersion":10.3,"id":1,"name":"Mission_AssistingOrgs","type":"Feature Layer","displayField":"Organization","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"geometryType":"esriGeometryPoint","minScale":0,"maxScale":0,"extent":{"xmin":-13471550.81732936,"ymin":2773527.0060945987,"xmax":-7650209.3657860095,"ymax":6383818.249802011,"spatialReference":{"wkid":102100}},"drawingInfo":{"renderer":{"type":"simple","symbol":{"type":"esriSMS","style":"esriSMSCircle","color":[156,83,0,255],"size":4,"angle":0,"xoffset":0,"yoffset":0,"outline":{"color":[0,0,0,255],"width":1}},"label":"","description":""},"transparency":0,"labelingInfo":null},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Organization","type":"esriFieldTypeString","alias":"Organization","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"JurisdictionType","type":"esriFieldTypeString","alias":"Partner Type","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"JurisType","codedValues":[{"name":"City","code":"City"},{"name":"County","code":"County"},{"name":"State","code":"State"},{"name":"Private Sector","code":"Private Sector"},{"name":"Non-profit","code":"Non-profit"},{"name":"National Guard","code":"National Guard"},{"name":"Federal","code":"Federal"},{"name":"Other","code":"Other"}]},"defaultValue":null},{"name":"Agreement","type":"esriFieldTypeString","alias":"Agreement","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"Y/N","codedValues":[{"name":"Yes","code":"Yes"},{"name":"No","code":"No"}]},"defaultValue":null},{"name":"Comments","type":"esriFieldTypeString","alias":"Comments","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"NmbCommited","type":"esriFieldTypeSmallInteger","alias":"# Commited","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceKey","type":"esriFieldTypeString","alias":"ResourceKey","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"AgreementDetails","type":"esriFieldTypeString","alias":"AgreementDetails","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"CapabilityFK","type":"esriFieldTypeGUID","alias":"CapabilityFK","sqlType":"sqlTypeOther","length":38,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceFK","type":"esriFieldTypeGUID","alias":"ResourceFK","sqlType":"sqlTypeOther","length":38,"nullable":true,"editable":true,"domain":null,"defaultValue":null}],"indexes":[{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G12ResourceFK","fields":"ResourceFK","isAscending":true,"isUnique":false,"description":""},{"name":"G12CapabilityFK","fields":"CapabilityFK","isAscending":true,"isUnique":false,"description":""},{"name":"G12Organization","fields":"Organization","isAscending":true,"isUnique":false,"description":""},{"name":"G12ResourceKey","fields":"ResourceKey","isAscending":true,"isUnique":false,"description":""},{"name":"user_3578.NISC_Resource_Planning_Demo_Mission_AssistingOrgs_Shape_sidx","fields":"Shape","isAscending":false,"isUnique":false,"description":"Shape Index"},{"name":"PK__NISC_Res__F4B70D8532CDBFE9","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Mission_AssistingOrgs","description":"","drawingTool":"esriFeatureEditToolPoint","prototype":{"attributes":{"ResourceFK":null,"Organization":null,"JurisdictionType":null,"Agreement":null,"Comments":null,"NmbCommited":null,"ResourceKey":null,"AgreementDetails":null,"CapabilityFK":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync","adminLayerInfo":{"geometryField":{"name":"Shape","srid":102100}}},{"currentVersion":10.3,"id":2,"name":"Capabilities","type":"Feature Layer","displayField":"Capability","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"geometryType":"esriGeometryPolygon","minScale":0,"maxScale":0,"extent":{"xmin":-13471550.81732936,"ymin":2773527.0060945987,"xmax":-7650209.3657860095,"ymax":6383818.249802011,"spatialReference":{"wkid":102100}},"drawingInfo":{"renderer":{"type":"simple","label":"","description":"","symbol":{"color":[0,197,255,255],"outline":{"color":[26,26,26,211],"width":3.75,"type":"esriSLS","style":"esriSLSSolid"},"type":"esriSFS","style":"esriSFSSolid"}},"transparency":60},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Capability","type":"esriFieldTypeString","alias":"Capability","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"Core_Capability","codedValues":[{"name":" Access Control and Identity Verification","code":" Access Control and Identity Verification"},{"name":" Community Resilience","code":" Community Resilience"},{"name":" Critical Transportation","code":" Critical Transportation"},{"name":" Cybersecurity","code":" Cybersecurity"},{"name":" Economic Recovery","code":" Economic Recovery"},{"name":" Environmental Response/Health and Safety","code":" Environmental Response/Health and Safety"},{"name":" Fatality Management Services","code":" Fatality Management Services"},{"name":" Forensics and Attribution","code":" Forensics and Attribution"},{"name":" Health and Social Services","code":" Health and Social Services"},{"name":" Housing","code":" Housing"},{"name":" Infrastructure Systems","code":" Infrastructure Systems"},{"name":" Intelligence and Information Sharing","code":" Intelligence and Information Sharing"},{"name":" Interdiction and Disruption","code":" Interdiction and Disruption"},{"name":" Long-term Vulnerability Reduction","code":" Long-term Vulnerability Reduction"},{"name":" Mass Care Services","code":" Mass Care Services"},{"name":" Mass Search and Rescue Operations","code":" Mass Search and Rescue Operations"},{"name":" Natural and Cultural Resources","code":" Natural and Cultural Resources"},{"name":" On-scene Security and Protection","code":" On-scene Security and Protection"},{"name":" Operational Communications","code":" Operational Communications"},{"name":" Operational Coordination","code":" Operational Coordination"},{"name":" Physical Protective Measures","code":" Physical Protective Measures"},{"name":" Planning","code":" Planning"},{"name":" Public and Private Services and Resources","code":" Public and Private Services and Resources"},{"name":" Public Health and Medical Services","code":" Public Health and Medical Services"},{"name":" Public Information and Warning","code":" Public Information and Warning"},{"name":" Risk and Disaster Resilience Assessment","code":" Risk and Disaster Resilience Assessment"},{"name":" Risk Management for Protection Programs and Activities","code":" Risk Management for Protection Programs and Activities"},{"name":" Screening, Search, and Detection","code":" Screening, Search, and Detection"},{"name":" Situational Assessment","code":" Situational Assessment"},{"name":" Supply Chain Integrity and Security","code":" Supply Chain Integrity and Security"},{"name":" Threats and Hazard Identification","code":" Threats and Hazard Identification"}]},"defaultValue":null},{"name":"Outcomes","type":"esriFieldTypeString","alias":"Outcomes","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Impacts","type":"esriFieldTypeString","alias":"Impacts","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Targets","type":"esriFieldTypeString","alias":"Targets","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Jurisdiction","type":"esriFieldTypeString","alias":"Jurisdiction","sqlType":"sqlTypeOther","length":254,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ESF","type":"esriFieldTypeString","alias":"ESF","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"ESF","codedValues":[{"name":"ESF-1 - Transportation","code":"ESF-1"},{"name":"ESF-2 – Communications","code":"ESF-2"},{"name":"ESF-3 – Public Works","code":"ESF-3 Works"},{"name":"ESF-4 – Firefighting","code":"ESF-4"},{"name":"ESF-5 – Emergency Management","code":"ESF-5 Management"},{"name":"ESF-6 – Mass Care","code":"ESF-6 Care"},{"name":"ESF-7 – Logistics/Resource Support","code":"ESF-7"},{"name":"ESF-8 – Public Health/Medical","code":"ESF-8 "},{"name":"ESF-9 – Search and Rescue","code":"ESF-9"},{"name":"ESF-10 – Oil/HAZMAT Response","code":"ESF-10"},{"name":"ESF-11 – Ag/Natural Resources","code":"ESF-11"},{"name":"ESF-12 – Energy","code":"ESF-12"},{"name":"ESF-13 – Public Safety & Security","code":"ESF-13"},{"name":"ESF-14 – Long-Term Recovery","code":"ESF-14"},{"name":"ESF-15 – External Affairs","code":"ESF-15"},{"name":"ESF-16 – Law Enforcement","code":"ESF-16"},{"name":"ESF-17 – Animal Protection","code":"ESF-17"},{"name":"ESF-18 – Business Continuity","code":"ESF-18"},{"name":"ESF-19 – Military Support","code":"ESF-19"},{"name":"ESF-20 - DSCA","code":"ESF-20"}]},"defaultValue":null},{"name":"Threat_Hazard","type":"esriFieldTypeString","alias":"Threat_Hazard","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G14Threat_Hazard","fields":"Threat_Hazard","isAscending":true,"isUnique":false,"description":""},{"name":"user_3578.NISC_Resource_Planning_Demo_Capabilities_Shape_sidx","fields":"Shape","isAscending":false,"isUnique":false,"description":"Shape Index"},{"name":"PK__NISC_Res__F4B70D85F2157ECB","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Missions","description":"","drawingTool":"esriFeatureEditToolPolygon","prototype":{"attributes":{"Threat_Hazard":null,"Capability":null,"Outcomes":null,"Impacts":null,"Targets":null,"Jurisdiction":null,"ESF":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync","adminLayerInfo":{"geometryField":{"name":"Shape","srid":102100}}}],"tables":[{"currentVersion":10.3,"id":3,"name":"ResourcePlanning_HazardsCONOPS","type":"Table","displayField":"Threat","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"relationships":[],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Threat","type":"esriFieldTypeString","alias":"Threat","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"CONOPS","type":"esriFieldTypeString","alias":"CONOPS","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Type","type":"esriFieldTypeString","alias":"Type","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ESF_1","type":"esriFieldTypeString","alias":"ESF_1","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"GlobalID_idx","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""}],"types":[],"templates":[{"name":"ResourcePlanning_HazardsCONOPS","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"Type":null,"ESF_1":null,"Threat":null,"CONOPS":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":4,"name":"ResourcePlanning_Orgs","type":"Table","displayField":"OrgName","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"relationships":[],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"OrgName","type":"esriFieldTypeString","alias":"OrgName","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"POC","type":"esriFieldTypeString","alias":"POC","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"OrgFK","type":"esriFieldTypeString","alias":"OrgFK","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"GlobalID_idx","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"PK__NISC_Res__F4B70D856C7BD74A","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"ResourcePlanning_Orgs","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"POC":null,"OrgFK":null,"OrgName":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":5,"name":"ResourceCatalog_RTLT","type":"Table","displayField":"Name","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"relationships":[],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"ID","type":"esriFieldTypeString","alias":"ID","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Type","type":"esriFieldTypeString","alias":"Type","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Name","type":"esriFieldTypeString","alias":"Name","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Category","type":"esriFieldTypeString","alias":"Category","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Primary_Core_Capability","type":"esriFieldTypeString","alias":"Primary_Core_Capability","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Status","type":"esriFieldTypeString","alias":"Status","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"View_Page","type":"esriFieldTypeString","alias":"View_Page","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"PDF","type":"esriFieldTypeString","alias":"PDF","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"GlobalID_idx","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"PK__NISC_Res__F4B70D85E8BC7511","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"ResourceCatalog_RTLT","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"View_Page":null,"PDF":null,"ID":null,"Type":null,"Name":null,"Category":null,"Primary_Core_Capability":null,"Status":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":6,"name":"ResourcePlanning_Assisting","type":"Table","displayField":"AgencyName","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"relationships":[],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Response","type":"esriFieldTypeString","alias":"Response","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Agency","type":"esriFieldTypeString","alias":"Agency","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Objective","type":"esriFieldTypeString","alias":"Objective","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Responsibility","type":"esriFieldTypeString","alias":"Responsibility","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Response_Function","type":"esriFieldTypeString","alias":"Response_Function","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Responding_Jurisdiction_Type","type":"esriFieldTypeString","alias":"Responding_Jurisdiction_Type","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Disaster_Size","type":"esriFieldTypeString","alias":"Disaster_Size","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"AgencyName","type":"esriFieldTypeString","alias":"AgencyName","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"POC_Name","type":"esriFieldTypeString","alias":"POC_Name","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"POC_Phone","type":"esriFieldTypeString","alias":"POC_Phone","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Threat_Tornado","type":"esriFieldTypeString","alias":"Threat_Tornado","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Threat_WinterStorm","type":"esriFieldTypeString","alias":"Threat_WinterStorm","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"F__","type":"esriFieldTypeString","alias":"F__","sqlType":"sqlTypeOther","length":1073741822,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResponseESF","type":"esriFieldTypeString","alias":"ResponseESF","sqlType":"sqlTypeOther","length":8,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"GlobalID_idx","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""}],"types":[],"templates":[{"name":"ResourcePlanning_Assisting","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"F__":null,"ResponseESF":null,"Response":null,"Agency":null,"Objective":null,"Responsibility":null,"Response_Function":null,"Responding_Jurisdiction_Type":null,"Disaster_Size":null,"AgencyName":null,"POC_Name":null,"POC_Phone":null,"Threat_Tornado":null,"Threat_WinterStorm":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":7,"name":"Organizations","type":"Table","displayField":"OrganizationName","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"OrganizationName","type":"esriFieldTypeString","alias":"OrganizationName","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"OrgType","type":"esriFieldTypeString","alias":"OrgType","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"POC_Name","type":"esriFieldTypeString","alias":"POC_Name","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"POC_Address","type":"esriFieldTypeString","alias":"POC_Address","sqlType":"sqlTypeOther","length":255,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"POC_Phone","type":"esriFieldTypeString","alias":"POC_Phone","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Comments","type":"esriFieldTypeString","alias":"Comments","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G13OrganizationN","fields":"OrganizationName","isAscending":true,"isUnique":false,"description":""},{"name":"PK__NISC_Res__F4B70D85F25E0201","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Organizations","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"Comments":null,"POC_Phone":null,"OrganizationName":null,"OrgType":null,"POC_Name":null,"POC_Address":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":8,"name":"Threats_Hazards","type":"Table","displayField":"Category","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Category","type":"esriFieldTypeString","alias":"Category","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Threat_Hazard","type":"esriFieldTypeString","alias":"Threat_Hazard","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Context","type":"esriFieldTypeString","alias":"Context","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G16Threat_Hazard","fields":"Threat_Hazard","isAscending":true,"isUnique":false,"description":""},{"name":"PK__NISC_Res__F4B70D857D20E74D","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Threats_Hazards","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"Context":null,"Threat_Hazard":null,"Category":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":9,"name":"Capability_Resources","type":"Table","displayField":"ResourceName","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"ResourceID","type":"esriFieldTypeString","alias":"ResourceID","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceName","type":"esriFieldTypeString","alias":"Resource Name","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceType","type":"esriFieldTypeString","alias":"Resource Type","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"NIMS_Type","codedValues":[{"name":"Type I","code":"Type I"},{"name":"Type II","code":"Type II"},{"name":"Type III","code":"Type III"},{"name":"Type IV","code":"Type IV"},{"name":"Type V","code":"Type V"}]},"defaultValue":null},{"name":"NbrRequired","type":"esriFieldTypeSmallInteger","alias":"# Required","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Category","type":"esriFieldTypeString","alias":"Category","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"CapabilityFK","type":"esriFieldTypeGUID","alias":"CapabilityFK","sqlType":"sqlTypeOther","length":38,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"RTLT_Type","type":"esriFieldTypeString","alias":"RTLT Type","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null}],"indexes":[{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G15CapabilityFK","fields":"CapabilityFK","isAscending":true,"isUnique":false,"description":""},{"name":"G15ResourceID","fields":"ResourceID","isAscending":true,"isUnique":false,"description":""},{"name":"PK__NISC_Res__F4B70D851A22E4ED","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Capability_Resources","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"Category":null,"CapabilityFK":null,"ResourceID":null,"ResourceName":null,"ResourceType":null,"NbrRequired":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"},{"currentVersion":10.3,"id":10,"name":"Capability_List","type":"Table","displayField":"Core_Capability","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1446586546239},"relationships":[],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Core_Capability","type":"esriFieldTypeString","alias":"Core_Capability","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Description","type":"esriFieldTypeString","alias":"Description","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Mission_Area","type":"esriFieldTypeString","alias":"Mission_Area","sqlType":"sqlTypeOther","length":8000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null}],"indexes":[{"name":"GlobalID_idx","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"PK__NISC_Res__F4B70D85F0856139","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"}],"types":[],"templates":[{"name":"Capability_List","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"Description":null,"Mission_Area":null,"Core_Capability":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"capabilities":"Query,Editing,Create,Update,Delete,Sync"}]}';
        //var defParameters =  '{"layers":[{"currentVersion":10.3,"id":0,"name":"Capabilities","type":"Feature Layer","displayField":"Capability","description":"","copyrightText":"","defaultVisibility":true,"relationships":[{"id":0,"name":"RequiredResources","relatedTableId":2,"cardinality":"esriRelCardinalityOneToMany","role":"esriRelRoleOrigin","keyField":"GlobalID","composite":true}],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"supportsApplyEditsWithGlobalIds":true,"supportsMultiScaleGeometry":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryRelatedPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true,"supportsQueryWithResultType":true,"supportsSqlExpression":true,"supportsReturningGeometryCentroid":true},"useStandardizedQueries":false,"geometryType":"esriGeometryPolygon","minScale":0,"maxScale":0,"extent":{"xmin":-9239096.9872,"ymin":5241756.9870999977,"xmax":-9174771.9899,"ymax":5337707.9830000028,"spatialReference":{"wkid":102100,"latestWkid":3857}},"drawingInfo":{"renderer":{"type":"simple","symbol":{"type":"esriSFS","style":"esriSFSSolid","color":[201,242,208,255],"outline":{"type":"esriSLS","style":"esriSLSSolid","color":[110,110,110,255],"width":0.40000000000000002}},"label":"","description":""},"transparency":0,"labelingInfo":null},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Capability","type":"esriFieldTypeString","alias":"Capability","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ShortDescription","type":"esriFieldTypeString","alias":"Short Description","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"MissionArea","type":"esriFieldTypeString","alias":"Mission Area","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"HazardScenario","type":"esriFieldTypeString","alias":"Hazard Scenario","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"Jurisdiction","type":"esriFieldTypeString","alias":"Jurisdiction","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ESF","type":"esriFieldTypeString","alias":"ESF","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"ESF","codedValues":[{"name":"ESF-1 - Transportation","code":"ESF-1"},{"name":"ESF-2 – Communications","code":"ESF-2"},{"name":"ESF-3 – Public Works","code":"ESF-3 Works"},{"name":"ESF-4 – Firefighting","code":"ESF-4"},{"name":"ESF-5 – Emergency Management","code":"ESF-5 Management"},{"name":"ESF-6 – Mass Care","code":"ESF-6 Care"},{"name":"ESF-7 – Logistics/Resource Support","code":"ESF-7"},{"name":"ESF-8 – Public Health/Medical","code":"ESF-8 "},{"name":"ESF-9 – Search and Rescue","code":"ESF-9"},{"name":"ESF-10 – Oil/HAZMAT Response","code":"ESF-10"},{"name":"ESF-11 – Ag/Natural Resources","code":"ESF-11"},{"name":"ESF-12 – Energy","code":"ESF-12"},{"name":"ESF-13 – Public Safety & Security","code":"ESF-13"},{"name":"ESF-14 – Long-Term Recovery","code":"ESF-14"},{"name":"ESF-15 – External Affairs","code":"ESF-15"},{"name":"ESF-16 – Law Enforcement","code":"ESF-16"},{"name":"ESF-17 – Animal Protection","code":"ESF-17"},{"name":"ESF-18 – Business Continuity","code":"ESF-18"},{"name":"ESF-19 – Military Support","code":"ESF-19"},{"name":"ESF-20 - DSCA","code":"ESF-20"}]},"defaultValue":null},{"name":"CapabilityTarget","type":"esriFieldTypeString","alias":"CapabilityTarget","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"CapabilityImpact","type":"esriFieldTypeString","alias":"Capability Impact","sqlType":"sqlTypeOther","length":5000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"URL","type":"esriFieldTypeString","alias":"URL","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null}],"indexes":[{"name":"PK__MA_PLANN__F4B70D85AAE1CDDB","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"},{"name":"user_3578.MA_PLANNERTEST_CAPABILITIES_Shape_sidx","fields":"Shape","isAscending":false,"isUnique":false,"description":"Shape Index"},{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G9CapabilityTarg","fields":"CapabilityTarget","isAscending":true,"isUnique":false,"description":""}],"types":[],"templates":[{"name":"Capabilities","description":"","drawingTool":"esriFeatureEditToolPolygon","prototype":{"attributes":{"URL":null,"Capability":null,"ShortDescription":null,"MissionArea":null,"HazardScenario":null,"Jurisdiction":null,"ESF":null,"CapabilityTarget":null,"CapabilityImpact":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"standardMaxRecordCount":4000,"tileMaxRecordCount":4000,"maxRecordCountFactor":1,"capabilities":"Create,Delete,Query,Update,Editing,Extract"},{"currentVersion":10.3,"id":1,"name":"CommittedResources","type":"Feature Layer","displayField":"Organization","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1469535360860},"relationships":[{"id":1,"name":"RequiredResources","relatedTableId":2,"cardinality":"esriRelCardinalityOneToMany","role":"esriRelRoleDestination","keyField":"ResourceFK","composite":true}],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"supportsApplyEditsWithGlobalIds":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryRelatedPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true,"supportsQueryWithResultType":true,"supportsSqlExpression":true,"supportsReturningGeometryCentroid":false},"useStandardizedQueries":false,"geometryType":"esriGeometryPoint","minScale":0,"maxScale":0,"extent":{"xmin":-9205238.574,"ymin":5315545.5296000019,"xmax":-9205238.574,"ymax":5315545.5296000019,"spatialReference":{"wkid":102100,"latestWkid":3857}},"drawingInfo":{"renderer":{"type":"simple","symbol":{"type":"esriSMS","style":"esriSMSCircle","color":[104,0,133,255],"size":4,"angle":0,"xoffset":0,"yoffset":0,"outline":{"color":[0,0,0,255],"width":1}},"label":"","description":""},"transparency":0,"labelingInfo":null},"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeAsHTMLText","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"Organization","type":"esriFieldTypeString","alias":"Organization","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"PartnerType","type":"esriFieldTypeString","alias":"Partner Type","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"JurisType","codedValues":[{"name":"City","code":"City"},{"name":"County","code":"County"},{"name":"State","code":"State"},{"name":"Private Sector","code":"Private Sector"},{"name":"Non-profit","code":"Non-profit"},{"name":"National Guard","code":"National Guard"},{"name":"Federal","code":"Federal"},{"name":"Other","code":"Other"}]},"defaultValue":null},{"name":"AgreementType","type":"esriFieldTypeString","alias":"Agreement","sqlType":"sqlTypeOther","length":100,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"AgreementType","codedValues":[{"name":"No Agreement","code":"No Agreement"},{"name":"Informal","code":"Informal"},{"name":"Legal","code":"Legal"},{"name":"Unknown","code":"Unknown"}]},"defaultValue":null},{"name":"Comments","type":"esriFieldTypeString","alias":"Comments","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"NumCommitted","type":"esriFieldTypeSmallInteger","alias":"# Committed","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceConstraints","type":"esriFieldTypeString","alias":"ResourceConstraints","sqlType":"sqlTypeOther","length":1000,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"AgreementDetails","type":"esriFieldTypeString","alias":"AgreementDetails","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"CapabilityFK","type":"esriFieldTypeGUID","alias":"CapabilityFK","sqlType":"sqlTypeOther","length":38,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceFK","type":"esriFieldTypeGUID","alias":"ResourceFK","sqlType":"sqlTypeOther","length":38,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceStatus","type":"esriFieldTypeString","alias":"Resource Status","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceDefinitionURL","type":"esriFieldTypeString","alias":"ResourceDefinitionURL","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"AdvanceNotice","type":"esriFieldTypeString","alias":"AdvanceNotice","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ContactInfo","type":"esriFieldTypeString","alias":"ContactInfo","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceName","type":"esriFieldTypeString","alias":"Resource Name","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceType","type":"esriFieldTypeString","alias":"Resource Type","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null}],"indexes":[{"name":"PK__MA_PLANN__F4B70D85F65B3F19","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"},{"name":"user_3578.MA_PLANNERTEST_COMMITTEDRESOURCES_Shape_sidx","fields":"Shape","isAscending":false,"isUnique":false,"description":"Shape Index"},{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G11ResourceFK","fields":"ResourceFK","isAscending":true,"isUnique":false,"description":""},{"name":"G11Organization","fields":"Organization","isAscending":true,"isUnique":false,"description":""},{"name":"G11CapabilityFK","fields":"CapabilityFK","isAscending":true,"isUnique":false,"description":""}],"types":[],"templates":[{"name":"CommittedResources","description":"","drawingTool":"esriFeatureEditToolPoint","prototype":{"attributes":{"ContactInfo":null,"Organization":null,"PartnerType":null,"AgreementType":null,"Comments":null,"NumCommitted":null,"ResourceConstraints":null,"AgreementDetails":null,"AdvanceNotice":null,"CapabilityFK":null,"ResourceFK":null,"ResourceStatus":null,"ResourceDefinitionURL":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"standardMaxRecordCount":32000,"tileMaxRecordCount":8000,"maxRecordCountFactor":1,"capabilities":"Create,Delete,Query,Update,Editing,Extract"}],"tables":[{"currentVersion":10.3,"id":2,"name":"RequiredResources","type":"Table","displayField":"ResourceName","description":"","copyrightText":"","defaultVisibility":true,"editingInfo":{"lastEditDate":1467230365352},"relationships":[{"id":1,"name":"CommittedResources","relatedTableId":1,"cardinality":"esriRelCardinalityOneToMany","role":"esriRelRoleOrigin","keyField":"GlobalID","composite":true},{"id":0,"name":"Capabilities","relatedTableId":0,"cardinality":"esriRelCardinalityOneToMany","role":"esriRelRoleDestination","keyField":"CapabilityFK","composite":true}],"isDataVersioned":false,"supportsCalculate":true,"supportsAttachmentsByUploadId":true,"supportsRollbackOnFailureParameter":true,"supportsStatistics":true,"supportsAdvancedQueries":true,"supportsValidateSql":true,"supportsCoordinatesQuantization":true,"supportsApplyEditsWithGlobalIds":true,"advancedQueryCapabilities":{"supportsPagination":true,"supportsQueryRelatedPagination":true,"supportsQueryWithDistance":true,"supportsReturningQueryExtent":true,"supportsStatistics":true,"supportsOrderBy":true,"supportsDistinct":true,"supportsQueryWithResultType":true,"supportsSqlExpression":true,"supportsReturningGeometryCentroid":false},"useStandardizedQueries":false,"allowGeometryUpdates":true,"hasAttachments":false,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"OBJECTID","globalIdField":"GlobalID","typeIdField":"","fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"ResourceName","type":"esriFieldTypeString","alias":"Resource Name","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceType","type":"esriFieldTypeString","alias":"Resource Type","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"NIMS_Type","codedValues":[{"name":"Type I","code":"Type I"},{"name":"Type II","code":"Type II"},{"name":"Type III","code":"Type III"},{"name":"Type IV","code":"Type IV"},{"name":"Type V","code":"Type V"}]},"defaultValue":null},{"name":"NbrRequired","type":"esriFieldTypeSmallInteger","alias":"# Required","sqlType":"sqlTypeOther","nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResourceDescription","type":"esriFieldTypeString","alias":"Resource Description","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"GlobalID","type":"esriFieldTypeGlobalID","alias":"GlobalID","sqlType":"sqlTypeOther","length":38,"nullable":false,"editable":false,"domain":null,"defaultValue":null},{"name":"CapabilityFK","type":"esriFieldTypeGUID","alias":"CapabilityFK","sqlType":"sqlTypeOther","length":38,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"CoreCapability","type":"esriFieldTypeString","alias":"Core Capability","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"RTLT","type":"esriFieldTypeString","alias":"RTLT","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"ResDefinitionURL","type":"esriFieldTypeString","alias":"Resource URL","sqlType":"sqlTypeOther","length":500,"nullable":true,"editable":true,"domain":null,"defaultValue":null},{"name":"MRP","type":"esriFieldTypeString","alias":"MRP","sqlType":"sqlTypeOther","length":50,"nullable":true,"editable":true,"domain":{"type":"codedValue","name":"Y/N","codedValues":[{"name":"Yes","code":"Yes"},{"name":"No","code":"No"}]},"defaultValue":null}],"indexes":[{"name":"PK__MA_PLANN__F4B70D85995285D6","fields":"OBJECTID","isAscending":true,"isUnique":true,"description":"clustered, unique, primary key"},{"name":"FDO_GlobalID","fields":"GlobalID","isAscending":true,"isUnique":true,"description":""},{"name":"G10CapabilityFK","fields":"CapabilityFK","isAscending":true,"isUnique":false,"description":""}],"types":[],"templates":[{"name":"RequiredResources","description":"","drawingTool":"esriFeatureEditToolNone","prototype":{"attributes":{"ResDefinitionURL":null,"MRP":null,"ResourceName":null,"ResourceType":null,"NbrRequired":null,"ResourceDescription":null,"RTLT":null,"CapabilityFK":null,"CoreCapability":null}}}],"supportedQueryFormats":"JSON","hasStaticData":false,"maxRecordCount":1000,"standardMaxRecordCount":32000,"tileMaxRecordCount":8000,"maxRecordCountFactor":1,"capabilities":"Create,Delete,Query,Update,Editing,Extract"}]}';
        var addURL = serviceURL + '/addToDefinition';
        var addURL = addURL.replace("rest/services", "rest/admin/services");        
        var addParams = {
          'outputType': 'featureservice',
          'addToDefinition': defParameters,
          'token': this.config.token,
          'f': 'json'
        };

        var addRequest = esriRequest({
          url: addURL,
          content: addParams,
          handleAs: "json"
          },
          {usePost: true
        });

        newRequest.then(this._requestSucceeded, this._requestFailed);    

      }), this._requestFailed);
      },

    _requestSucceeded: function(data) {
      console.log("Success, Data: ", data); // print the data to browser's console
    },  

    _requestFailed: function(error) {
      console.log("Error: ", error.message);
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
                    this.config.curentUser = loggedInUser.userName;

                    // ********************************************
                    // Get all groups that the user belongs to
                    // ********************************************

                    loggedInUser.getGroups().then(lang.hitch( this,function(groups) {
                        console.log("create group array");

                        array.forEach(groups, lang.hitch( this,function(group, i) {

                            if(group.id==this.config.defaultGroupId){

                              // This is important for showing the group that is seleted in the list.
                              // previousGroupSelection is reset every time the groupSelection "change" event is fired.
                              this.config.previousGroupSelection = group.id// + ", group";
                            }
                            else{
                            }


                            thumb = group.thumbnailUrl;

                            if (!thumb) {
                                thumb = self.folderUrl + 'images/folder.png';
                            }

                            var item = '<div class="ma-select-option"><img src=' + thumb + '>' + '<div class="ma-select-title">' + group.title + '</div></div>'

                            this.config.myGroups.push({
                                name: group.title,
                                id:  group.id,// + ",group",
                                label: item
                            });

                            // only place drop down after it has been loaded.  Does not count array proplerly outside of this loop
                            if(i == groups.length-1){
                                this._placeGroupSelect(); // this will be in the settings section
                            } 

                        }));

                         this._showUserName();

                    }));


                    // ********************************
                    // 1 - load default planning layer from config
                    this._getDefaultThiraLayer();
                    // ********************************
                    // 2 - load default planning group from config

                   // this._getGroupContents();

                    //this._getSharedMARP();
                }))
      },


            // Here is a sample for swapping memory store of a select dijit

            // _updateGroupList: function() {
            //   console.log("updateGroupList");

            //     var groupArray = this.config.myGroups;

            //     var groupStore = new Memory({
            //         idProperty: "id",
            //         data: groupArray
            //     });

            //     this.groupSelect.setStore(groupStore);

            // },

            _showUserName: function() {

                console.log("Show User Name in Settings Panel")
                //domConstruct.destroy("LoginButton");

                //domConstruct.place("<div class='userLabel' id='userName'>" + this.config.userName + "</div>", "userName", "replace");



            },


   

// ***************************************************************************************
//  Function 1  Get default ThiraUrl / Capabilities Layer to Map from FeatureLayer itemId
// ***************************************************************************************

      _getDefaultThiraLayer: function (){
            console.log("getting new MARP layer")        
            //this._getDefaultGroup();// get details of the default group
        
            esri.arcgis.utils.getItem(this.config.defaultMARPItemId).then(lang.hitch(this,function (results) {


                this.config.capabilitiesUrl=results.item.url + "/" + this.config.capabilitiesRESTLyrId;
                this.config.defaultMARPUrl=results.item.url + "/" + this.config.capabilitiesRESTLyrId;
                this.config.defaultMARPTitle=results.item.title;
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
                // 2 - Create relatedTable query parameters
                this.setGlobalQueryParameters(this.config.capabilitiesUrl);

                // *************************************************************
                // 3 - add default layer to map
                this.newLayer(this.config.capabilitiesUrl, this.config.token, results.item.title)// add featureLayer to webmap.  Featurelayer seems to be added automatically when webmap changes.


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

          this.hazardSelect.attr('value', "All Hazards",false); // "false" parameter changes the selection, but does not trigger an onchange@


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
      //    console.log("QueryCapabilitiesLayer");
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
                  ThumbnailUrl: "widgets/MutualAid/images/esri_icons/xtra_AddCapability65x.png"
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

        this.displayBookmarks(this.capArr);// after creating the Icon Array


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

            // ***********************************************************
            // This is where the new geography code detects an empty plan!
            // ***********************************************************
             
              var newPlan = new Add_NewPlan_GeographyDialog();

                  newPlan.initializeNewPlan("newPlan", this.config,this.config.capabilitiesUrl);


          }

      },




// ***********************************************************************************************************************
//  PLACE GROUP Selection Menu.  Eventually this will have orgs to search for data with the necessary tag - "Shared:thira"
// ***********************************************************************************************************************

// *******************************
//  TODO
//  Get groups with shared:MARP tag from portal user
//  put groups in a combobox
//  pass selected group ID to the function that creates the list of shared layers.
//  update the memory store of the planningLayer Selection Box
//  update

//  2 selectBoxes:
//    # 1 is not needed until after the app has loaded--> MARP Groups
//    # 2 requires a default groupID --> Default Group Contents

            _placeGroupSelect: function() {
                console.log("Place Group Select " + this.config.myGroups);

                if (!this.groupSelect2) {
                    var groupArray = this.config.myGroups;

                    groupArray.reverse();

                    //var groupNode = dijit.byId('groupSelectBox2');
                    //if (!groupNode) {
                        //groupNode.destroyRecursive();
                   

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
                            labelAttr: "label",
                            //displayedValue: this.config.previousGroupSelection
                            //value: this.config.previousGroupSelection

                        }, "groupSelectBox2");

                    domConstruct.place(this.groupSelect2.domNode, "map_groupheader2", "replace");

                    this.groupSelect2.startup();


                    var content='<div class="userLabel" id="currentUserId"></div>';
                    var groupMSG = domConstruct.toDom(content);
                        domConstruct.place(groupMSG, dom.byId('settingsGroupId'), 'last');// could be "after" or "last"

                    this._getGroupItems(this.config.defaultGroupId);// this is only called once when app is opened




                    // ********************************************************************************
                    // Select different group - Capture GroupID - Search for layer with shared:MARP tag
                    // ********************************************************************************
                    this.groupSelect2.on("change", lang.hitch(this, function(value) {
                        //var update = value.split(",");

                        this.config.previousGroupSelection=value;
                        //this.bookmarks = [];
                        // this.currentIndex = -1;
                        
                        //this.groupSelect2.attr('value', this.config.previousGroupSelection,false); // "false" parameter changes the selection, but does not trigger an onchange@

                        this.config.selectedGroupId=value; //update[0];// this sets the value of the last selected GroupId

                        // these is called when a user selects a group in the group menu;   
                        this._getGroupItems(value);    
                        //this._getGroupItems(update[0]); // first value contains the groupId;

                    }));

                }// end if
                else{

                  alert("group select was called a second time!");
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

                      if(response.total==0){
                        dom.byId("currentUserId").innerHTML="0 Resource planning layers in this group";
                        dom.byId("currentUserId").style.color = "red";
                        dom.byId("currentUserId").style.fontWeight = "bold";
                      }

                      if(response.total>1){
                        dom.byId("currentUserId").innerHTML= response.total + " resource planning layers in this group";
                        dom.byId("currentUserId").style.color = "black";
                        dom.byId("currentUserId").style.fontWeight = "normal";
                      }

                      if(response.total==1){
                        dom.byId("currentUserId").innerHTML="1 Resource planning layer in this group";
                        dom.byId("currentUserId").style.color = "black";
                        dom.byId("currentUserId").style.fontWeight = "normal";
                      }

                      // *********************************************************************
                      // only populate layer selection
                      // pass selected group and check to see if it is the configured group
                      if(response.total>0){
                        dom.byId("thiraMenuId").click();// this 
                        this.config.defaultGroupItems = response.results;// reset items in the selected group
                        this._createMARPSelectionLayerArray(response.results, groupId);
                      }

                   })); // END RESULTS HANDLING     
      },
            // ************************************************************************************
            // read the results and build the new bookmark array that contains target capabilities
            // create array of planning layers for the dropdown menu.
            // If selected group does not have MARP layers this function is never called
            // ************************************************************************************
            _createMARPSelectionLayerArray: function(sharedMARPLyrs, selectedGroupId){


                this.config.planningLayersMenuArr = [];
                var defaultLyrUrl="";
                var defaultLyrTitle="";
                var idString="";
                array.forEach(sharedMARPLyrs, lang.hitch(this, function(lyrItem,i) {                

                    // create uniqueId for layers in the dropdown list, including the url and thumbnails
                    var item = '<div class="ma-select-option"><img src=' + lyrItem.thumbnailUrl + '>' + '<div class="ma-select-title">' + lyrItem.title + '</div></div>';
                    var thiraLyrUrl = lyrItem.url + "/" + this.config.capabilitiesRESTLyrId;

                    this.config.planningLayersMenuArr.push({
                      name: lyrItem.title,
                      id: lyrItem.id + "," + thiraLyrUrl + "," + lyrItem.title,
                      label: item,
                      owner: lyrItem.owner,
                      url:   thiraLyrUrl, 
                      title: lyrItem.title
                      //urlKey: gData("portal").urlkey,
                      //hostName:gData.portal.portalHostname
                    });

                    // If default MARP layer is ever in a group that is selected, autoselected that layer as the default
                    if(lyrItem.id==this.config.defaultMARPItemId){
                      defaultItemId = lyrItem.id;
                      defaultLyrUrl= lyrItem.url + "/" + this.config.capabilitiesRESTLyrId;
                      defaultLyrTitle = lyrItem.title;
                      idString = defaultItemId + "," + defaultLyrUrl + "," + defaultLyrTitle;

                    }
                    else if(i==0){
                      defaultItemId = lyrItem.id;
                      defaultLyrUrl = lyrItem.url + "/" + this.config.capabilitiesRESTLyrId;
                      defaultLyrTitle = lyrItem.title;
                      idString = defaultItemId + "," + defaultLyrUrl + "," + defaultLyrTitle;
                    }

                }), this);

                      // Only place drop down after it has been loaded.  Does not count array proplerly outside of this loop
                      if(this.config.planningLayersMenuArr.length==this.config.defaultGroupItems.length){
                        this._placeLayerSelectionMenu(selectedGroupId, this.config.planningLayersMenuArr, idString); // this shows the current planning layer
                      } 

            },



            // **************************************************************************
            //  PLACE MARP LAYER SELECT DIJIT  
            //  If selected group does not have MARP layers this function is never called
            // **************************************************************************
            // DOM elemet to attach selection dijit
            // Array of items from selected Group
            // show Selected Layer as selected 

            _placeLayerSelectionMenu: function(selectedGroupId, marpLayers, selectValueIdString) {

                this.inherited(arguments);

                console.log("Populate Layers Selection Menu " + marpLayers);

                if (!this.marpSelect) {
                    var groupArray = marpLayers;

                    groupArray.reverse();

                    var groupNode = dijit.byId('marpSelectBox');
                    if (groupNode) {
                        groupNode.destroyRecursive();
                    }

                    var groupStore = new Memory({
                        idProperty: "id",
                        data: groupArray
                    });

                    // groupSelect is the new dijit name for group select.
                    // dijit ID is assigned at the end.
                    this.marpSelect = new Select({
                        id: "marpSelectionDijit",
                        style: {
                            width: '100%'
                        },
                        store: groupStore,
                        sortByLabel: false,
                        labelAttr: "label",
                        value: selectValueIdString
                    }, "marpSelectBox");

                    // ***************************************************
                    // onChange controls flow of app & Plan Switching!
                    // ***************************************************
                    this.marpSelect.on("change", lang.hitch(this, function(value) {
                        var selection = value.split(",");

                        this.currentIndex = -1;

                        var planLyrUrl   = selection[1];
                        var planLyrTitle = selection[2];

                        // *******************************************************************
                        // !Important! - reset the config for a New MARP layer selection here!

                        this.config.capabilitiesUrl=planLyrUrl;

                        this.setGlobalQueryParameters(planLyrUrl);

                        this.newLayer(planLyrUrl, this.config.token, planLyrTitle);//

                    }));

                    //initiate hazard dropdown
                    domConstruct.place(this.marpSelect.domNode, "planningLayer_groupheader", "replace");
                    this.marpSelect.startup();
                }

                else{

                    console.log("refresh MARP Layer select box");

                    var MARPArray = marpLayers;
                        MARPArray.reverse();

                    var marpStore = new Memory({
                        idProperty: "id",
                        data: MARPArray
                    });
                    
                    this.marpSelect.setStore(marpStore);

                    // *********************************************************
                    // If selected group is the default group, reset the default  
                    // *********************************************************
                    if(selectedGroupId==this.config.defaultGroupId){
                        var defaultMARPString="";
                            defaultMARPString=this.config.defaultMARPItemId + "," + this.config.defaultMARPUrl + "," +  this.config.defaultMARPTitle;
                        
                            this.marpSelect.attr("value", defaultMARPString);
                    }

                    // *******************************************************************************
                    // If selected group is NOT the default group, select the first layer in the list 
                    // *******************************************************************************
                    else{
                        var defaultMARPString="";
                            defaultMARPString=this.config.capabilitiesUrl + "," + this.config.defaultMARPUrl + "," +  this.config.defaultMARPTitle;

                            this.marpSelect.attr("value", selectValueIdString);
                    }

                }
            },


// ********************************************************************************************
// List Capabilities from selected Plan using ImageNode and tileLayout Container Display Dijit
// ********************************************************************************************

    displayBookmarks: function(coreCaps) {

        console.log("SHOWING CAPABILITIES" + coreCaps)
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
            thumbnail = this.folderUrl + 'images/esri_icons/xtra_UndefinedCapability65x.png';
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
    //
    //    CLICK TO SHOW CAPABILITY PANEL 
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

          var createForm = new Add_Edit_Delete_CapabilityDialog();
              createForm.createCapFormComponents("addCap",this.config);


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

          
        }

    },

    // ****************************************************
    // This is called with a topic message from each Dialog
    // This is how the left panel is refeshed.  
    // Refresh was an issue with prototype
    // ****************************************************

    removeCapInfoDijitBtns: function(){

      this._removeTitleListDijit(this.capResourceArray.length);    

      this._removePartnerTitlePaneDijits(this.config.tpPartnerCount);

               // removing CapInfo TP Dijit
      var rmCapInfoTP = dijit.byId("capTitlePane_Id1")
          if(rmCapInfoTP){
              rmCapInfoTP.destroyRecursive();
          }

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

    // ******************************************************************************************************************
    //
    // This is necessary for memory management, since it seems like the TitlePane Dijit creates new dijit ID's infinately
    //
    // ******************************************************************************************************************

    _removeTitleListDijit: function(resCount){

        for (i = 0; i < resCount; i++) {
          var rmItem = "tpId_" + i;
              console.log("removeLoop   " + rmItem)
          var rmElement = dijit.byId(rmItem)
            if(rmElement){

                rmElement.destroyRecursive();

                console.log("removing " + rmItem);
            }

        }
    },

   
    // ******************************************************
    // loop though  title pane dijits for the Partner Report
    _removePartnerTitlePaneDijits: function(uniquePartnerCount){

          for (i = 0; i < uniquePartnerCount; i++) {
              var rmItem = "tpCapParId_" + i;
                  console.log("removePartnerTPDijits   " + rmItem)
              var rmElement = dijit.byId(rmItem)
              if(rmElement){
                  rmElement.destroyRecursive();
                  console.log("removing " + rmItem);
              }
          }

    },



    //  *********************************************************************************************
    //    Clears ALL left hand elements and resource table.
    //    Back button restores map visibility
    //    Refreshes refreshes all aspects of Capability List, including rebuilding the Hazards Array.
    //  *********************************************************************************************

    _onBackBtnClicked: function(){


        this._createHazArray(this.config.capabilitiesUrl);// refreshes all aspects of the capability table.
        this.queryCapabilitiesLayer2(this.config.capabilitiesUrl, "1=1");
        this.removeCapInfoDijitBtns();// removes dijit btns for refreshing the info pane after every update

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

         // removing CapInfo TP Dijit
         var rmCapInfoTP = dijit.byId("capTitlePane_Id1")
            if(rmCapInfoTP){

                rmCapInfoTP.destroyRecursive();
            }

          document.getElementById("showerId").className="showingDiv";
          document.getElementById("hiderId").className="hiddenDiv";

          document.getElementById("selectedCoreCapImg").src="";
          document.getElementById("selectedCoreCapTitle").innerHTML="";

          this.resize();

    },

    //  Automate the refresh of table view after editing it - called by topic.publish
    _onResTableViewEdit: function(){

      this._clickCapTableBtn();

    },

      // ******************************************************************************************
      //  FUNCTION: onEditCapSaved
      //  TOPIC Subscribe Listener is called by this function due to subscribe listener
      //  Triggers a refresh for lefthand CapInfo Panel
      //     
      // ******************************************************************************************
    onEditCapSaved: function(){
        this.inherited(arguments);
        this.removeCapInfoDijitBtns();
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
    //
    //    CREATE LEFT PANEL DETAIL PAGE CAPABILITY
    //
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

                 var content="";
                     content+='<div class="capInfoTextContainer" id="capInfoId">'
                      // Create 2 parts here. Add parents to DOM before creating the TP
                     content+='<p><div id="capInfoEditPanel" class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maEditCAP" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;Target Capability</div></p>';

                     content+='<div class="cap-info-text">' +coreCap.Target + '</div>';
                     content+='<div id="capInfoSection_A"></div>';
                     content+=   '<p><div id="placeAttrInsp_addRes" class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maReqResTable" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;<div id="reqResCountId" style="display:inline"></div>&nbsp;Required Resources<span style:"float:right" class="ma-jimu-btn-green"><button  id="maAddResource" type="button"></button></span></div></p>';
                     content+=   '<div id="capInfo-resources" class="cap-info-resources"></div>';
                     content+=   '<div class="cap-info-text"></div>';
                     content+=   '<p><div class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maPartnerTable" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;<div id="partnerCountId" style="display:inline">0</div>&nbsp;Resource Partnerships</div></p>';
                     content+=   '<div id="capInfo-partners" class="cap-info-fix"></div>';
                     content+=   '<p><div class="cap-info-btn-heading"><span class="ma-jimu-btn-blue"><button id="maGapTable" baseClass="ma-jimu-btn-blue" type="button"></button></span>&nbsp;Chart Resource Gaps</div></p>';
                     content+=   '<div id="capInfo-gap-graph" class="cap-info-text"></div>';
                     content+='</div>';
                    
                 var newDIV = domConstruct.toDom(content);
                     domConstruct.place(newDIV, dom.byId('selectedCoreCap'), 'after');// could be "after" or "last"

                     capContent="";
                     capContent+=   '<div class="cap-info-heading">Threats / Hazards</div>';
                     capContent+=   '<div class="cap-info-text">' + coreCap.Threat_Hazard  +'</div>';
                     capContent+=   '<div class="cap-info-heading">Jurisdiction</div>';
                     capContent+=   '<div class="cap-info-text">' + coreCap.Jurisdiction + '</div>';
                     capContent+=   '<div class="cap-info-heading">ESF</div>';
                     capContent+=   '<div class="cap-info-text">' + coreCap.ESF + '</div>';
                     capContent+=   '<div class="cap-info-heading">Impacts</div>';
                     capContent+=   '<div class="cap-info-text">' +  coreCap.Impact  + '</div>';
                     capContent+=   '<div class="cap-info-heading">Outcomes</div>';
                     capContent+=   '<div class="cap-info-text-bottom-border">' + coreCap.Outcome + '</div>';

                 var capInfo_TPID = "capTitlePane_Id1"; 

                    // Create TilePane for each Resource Item
                    var capTP = new TitlePane({
                        id: capInfo_TPID,
                        title:"Show More . . .", 
                        content:capContent,
                        onClick: lang.hitch(this,function(){

                          var newTitle = dijit.byId("capTitlePane_Id1");

                              if(newTitle.title=="Show More . . ."){
                                 newTitle.set("title", "Show Less . . .");
                              }
                              else{
                                  newTitle.set("title", "Show More . . .");
                              }
                        })

                    });

                    dom.byId("capInfoSection_A").appendChild(capTP.domNode);

                     capTP.attr('open', false);
                     capTP.startup();

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

              

    },

    // *********************************
    // Create Edit Capability Form
    //
    //
    //
    //  ALL FIRST LEVEL BUTTONS BELOW
    //
    //
    // *********************************
    _clickCapEditBtn:function(){
        this.inherited(arguments);

        var createForm = new Add_Edit_Delete_CapabilityDialog();
            //createForm._insertEditPanel("editCap", this.config);
            createForm.createCapFormComponents("editCap", this.config);

    },


    _clickAddResourceToCap:function(){
        this.inherited(arguments);

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
                  this_config: this.config
              });


    },


    _hideDivElementsOnTheMap: function(){

        // remove grid elment before creating another one
        var gridsAndGraph = dom.byId("gridsAndGraph");
            if (gridsAndGraph) {
                  gridsAndGraph.remove();
                }

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

                      //  alert("No reources exist.  Please add resources for this capability.");

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

                                    console.log("Required Resources: " + pSet.length  + " " + (j+1));
                                    console.log("Completed First Cut of capResourceArray");


                                    this.getUniquePartnerList(this.capResourceArray[0].CapID) // used for left hand capability panel display
                                    //this.getUniquePartnersForEntirePlan();// used for partner domain values

                                    this.countResourceItemsWithNoGaps();

                                    // Call function to create Resource Panel once array is populated
                                    console.log("Time to Calculate Partner Committments and Resource Balance");

                                    this.calcResourceBalance();

                                    // ! IMPORTANT !
                                    // this.createResourceListInPanel(); // Create initial resource list for cap Info Panel
                                    // ABOVE WAS MOVED TO this.calcResourceBalance(); so I can color code the Resources as RED OR GREEEN
                                }

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

        createResourceListInPanel: function(){

                console.log("Function: createResourceListInPanel")
                this.ccPanelResEditNodes = [];// used for clickable buttons
                this.ccPanelAddPartnerNodes=[];// used for add partner buttons

                // ******************************************************************************************************
                // This code will create the Required Resource Section of the left Panel
                // Content Pane and dijits and listeners are created prior when Capability is clicked the first time
                // Closing capability removes the title pane dijits.
                // Clicking on a resource pane will always call a refresh that will update content in the title pane dijit
                //    Single updates are triggerd by the onClick event for each title pane in this function.
                //
                // This insures the data is never obsolute when simultaneous edits occur.
                // *******************************************************************************************************
                array.forEach(this.capResourceArray, lang.hitch(this, function(item,i) {

                    // create linkable URL to an an online resource definition.  This can be an MRP definition if necessary.
                    var resID = item.ObjectID;
                    var resGID = item.GlobalID;
                    var typeID = item.ResourceID;
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
                        if (typeof typeID !== 'undefined' || typeID !== null){
                            //window.open(urlBase+resID, '_blank');
                            resDefUrl=urlBase+typeID;
                            resDefLabel='<a href="' + resDefUrl + '" target="_blank">Resource Definition</a>';
                        }
                        // **********************************************************************************
                        // If this is a NON - FEMA typed resource is selected, then no definition is available.  
                        // This will require a change to the data model!
                        // ************************************************************************************
                          if (typeof typeID == 'undefined' || typeID == null || typeID == ""){
                            console.log('no resource ID for this resource..');
                            resDefLabel="No Resource Definition";
                        }



                    //  Below ID's are used to create unique domNodes for controlling events.  These are removed and re-created with each Capability
                    var resClickId="resEditClickID-" + i; // used to capture click event
                    var addParClickId="addParClickID-" + i; // used to capture and event

                    var resBalanceId="resBalanceID-" + resGID;// This ID is used to update via dom after it is calculated
                    var resCommittedId="resCommittedID-" + resGID;// This ID is used to update via DOM after it is calculated
                    var resRequiredId = "resRequiredID-" + resGID;

                    var resPartnerArrowId="resPartnerArrow-" + i;// used to determine toggle status - up or down

                    var resPartnerHeaderId="resPartnerHeader-" + i; // used to contain number of resources
                    var resPartnerDivParent="resPartnerDivParent-" + i;// used as a parent to display partner content and is removed and re-created 

                    var rTitle= " " + item.Name + " - " + item.Type;

                    var rContent="";
                        rContent+='<div class="edit-resource-item-node">';
                        rContent+=    '<div tooltip="Edit Resource" class="node-box" style="float:right;">';
                        rContent+=        '<div id="' + resClickId + '" class="icon-pencil-edit-btn"></div>';
                        rContent+=     '</div>';
                        rContent+=     '<table id="resItemTable-' + resGID + '" class="edit-resource-item-table">';
                        rContent+=         '<tr><td id="' + resRequiredId + '" class="edit-resource-item-status95px">' + item.NmbNeeded +'  Required</td><td id="'+ resCommittedId + '" class="edit-resource-item-status95px">' + item.NmbCommitted + ' Committed</td>'
                        rContent+=              '<td id="' + resBalanceId + '" class="edit-resource-item-status40px">'+  item.Balance +'</td>';          
                        rContent+=          '</tr>';
                        rContent+=    '</table>';
                        rContent+='</div>';

                        rContent+='<div id="resItemSum-' + resGID + '">';
                        rContent+=    '<p><div class="cap-info-text">Resource Type:  '  + item.Type +'</div></p>';
                        rContent+=    '<p><div class="cap-info-text">Category Type:  '  + item.Category +'</div></p>';
                        rContent+=    '<p><div class="cap-info-text-bottom-border">FEMA RTLT:  '  + resDefLabel +'</div></p>';
                        rContent+='</div>'

                        rContent+='<div class="expand-partner-item-node">';
                        rContent+=    '<div tooltip="Add Partner" class="node-box" style="float:right;padding-right:5px;">';
                        rContent+=        '<div id="' + addParClickId + '" class="icon-green-plus-btn"></div>';
                        rContent+=     '</div>';                                          
                        rContent+=     '<div id="' + resPartnerHeaderId + '" class="resource-info-heading"><img style="float:left;padding-right:5px;" src="./widgets/MutualAid/images/carratRight20x.png" id="' + resPartnerArrowId + '"/>Resource Partners</div>'; 
                        rContent+=     '<div id="' + resPartnerDivParent + '"></div>';// This is the parent that is removed with the toggle button
                        rContent+='</div>';      

                    var tpId = "tpId_" + i; 

                    // var colorCode=""

                    // if(item.Gap=="red"){
                    //   colorCode= ""
                    // }else if(item.Gap=="green"){
                    //   colorCode
                    // }

                    // tpOpenStatus is necessary to leave the panel open so user does not loose track of what they were doing after an update!
                    var tpOpenStatus=false;
                    if(tpId==this.clickedResTitlePane){
                      tpOpenStatus = true;
                    }
                    else{
                      tpOpenStatus = false;
                    }

                    // Create TilePane for each Resource Item
                    var tp = new TitlePane({
                        id: tpId,
                        title: rTitle,
                        open: tpOpenStatus, 
                        content:rContent,
                        onClick: lang.hitch(this,function(value){// OnClick allows seletive refresh of each content pane without re-creating the 

                          //var clickedResTitlePane = dijit.byId(value.currentTarget.id);
                          //var str = clickedResTitlePane.containerNode.innerHTML;
                          this.clickedResTitlePane = value.currentTarget.id;


                          // refresh content from the service every time it is clicked
                          if(this.showingResTP){

                              this.refreshClickedResTP(value.currentTarget.id, rTitle, resGID, this.config.selectedCap.GlobalID );
                          }

                          // clear content when hidden.  May be necessary to remove button listeners - but do not do it currenlty.
                          if(!this.ResshowingTP){

                            //console.log("Title Pane is closing")
                              
                          }

                        }),
                        

                        /* **********************************************************************************  
                        /* This does not pass a click event to know which dijit was clicked! and is not used
                        /* ***********************************************************************************/
                        onShow: lang.hitch(this,function(event){
                          this.showingResTP=true;
                        }),

                        onHide:lang.hitch(this,function(event){
                          this.showingResTP=false;
                        })
                      });// end title Pane dijit


                        dom.byId("capInfo-resources").appendChild(tp.domNode);

                        // if(tp.id==this.partnerResourceTileId){
                        //   tp.attr('open', true);
                        // }
                        // else{
                        //   tp.attr('open', false);
                        // }

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
                        this._ccPanelEditResBtn(i, item.Name, item.ObjectID, item.GlobalID, "");

                    // *******************************************************
                    // Create listeners for an edit button for each resource
                    // *******************************************************
                    var clickAddParNode = dom.byId(addParClickId);
                        this.ccPanelAddPartnerNodes.push(clickAddParNode);
                        this._ccPanelAddParBtn(i, item.Name, item.ObjectID, item.GlobalID, "");

                }))


        },

        // **************************************************
        // Create Event on Edit Resource Table Cell
        //
        //
        //
        //  ALL TILE-PANE RESOURCE BUTTONS
        //
        //
        //
        //
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


        // ******************************************************************************
        // EDIT RESOURCE ICON HAS BEEN CLICKED
        // NO REFRESH DOES NOT RESET LEFT PANEL and lose track of where you were editing!
        // ******************************************************************************
        _panelEditResClicked: function(resName,resGID, clickedFrom){

            this.config.selectedResGID=resGID; 
            this.config.selectedResName=resName;
          
            // ************************************************
            // Call ResourceDialog to create AddResource Form
            // ************************************************
                var createForm = new Add_Edit_Delete_ResourceDialog();
                    createForm._createCustomDomains("editRes", this.config, clickedFrom);

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
                
                 createForm._createPartnerDomainFromPlan("addPar", this.config, resGID, this.config.selectedCap.GlobalID, null, clickedFrom);

        },


        // ************************************************************************************
        // Individual RESOURCE TITLE PANE HAS BEEN CLICKED!
        //
        // Update clicked pane with new resource data
        //    1) Query clicked resource by GUID
        //    2) Query partnerCommittments Table to determine balance for that resource
        //    3) Update HTML via domID
        // ************************************************************************************

        refreshClickedResTP: function(clickedTP_DijitId, tpTitle, resGID, selectedCAPID){

           var resTable = this.config.relates.filter(function(item) { return item.queryTableName === 'Capabilities' && item.origin === 'Capability_Resources'; });   
               resTableUrl = resTable[0].originURL;
               relID = resTable[0].queryRelId;

          // ***************************************************************************
          // Query resource record + Update Summary via HTML, 
          // Pass required resource value to balance calc function for clicked resource
          // ***************************************************************************
          var rContent="";

          var whereQuery = "GlobalID='" + resGID + "'";
          var queryTask = new QueryTask(resTableUrl);
          var query = new esri.tasks.Query();
              query.outFields = ['*'];
              query.where = whereQuery;
              query.returnGeometry = false;
              queryTask.execute(query).then(lang.hitch(this, function(response){

                    // Logic to display link to RTLT if it exists.
                    // TODO: This is where we can insert link to MRP or other resource description url!
                    var reqResNum = response.features[0].attributes.NbrRequired;
                    var typeID = response.features[0].attributes.ResourceID;
                    var resTyp = response.features[0].attributes.RTLT_Type;
                    var urlBase="";
                    var resDefUrl="";
                    var resDefLabel="";

                        if (resTyp == "Resource Typing Definition"){
                            urlBase = 'https://rtlt.preptoolkit.org/Public/Resource/View/';
                        }
                        if (resTyp == "Position Qualification"){
                            urlBase = 'https://rtlt.preptoolkit.org/Public/Position/View/';
                        }
                        if (typeof typeID !== 'undefined' || typeID !== null){
                            //window.open(urlBase+resID, '_blank');
                            resDefUrl=urlBase+typeID;
                            resDefLabel='<a href="' + resDefUrl + '" target="_blank">Resource Definition</a>';
                        }
                        // **********************************************************************************
                        // If this is a NON - FEMA typed resource is selected, then no definition is available.  
                        // This will require a change to the data model!
                        // ************************************************************************************
                          if (typeof typeID == 'undefined' || typeID == null || typeID == ""){
                            console.log('no resource ID for this resource..');
                            resDefLabel="No Resource Definition";
                        }
                
                        //console.log(response.features);

                        var updateItem = "resItemSum-" + resGID;// create DOM ID to query
                        var updateElem = dom.byId(updateItem);

                        if(updateElem){
                            rContent='<p><div class="cap-info-text">Resource Type:  '  + response.features[0].attributes.ResourceType +'</div></p>';
                            rContent+='<p><div class="cap-info-text">Category Type:  '  + response.features[0].attributes.Category +'</div></p>';
                            rContent+='<p><div class="cap-info-text-bottom-border">FEMA RTLT:  '  + resDefLabel +'</div></p>';
                            updateElem.innerHTML=rContent;
                        }

                    // *******************************************************************
                    //
                    // Next, query all partners for the clicked resource to re-calc the balance
                    //
                    // *******************************************************************

                    var pTabl = this.config.relates.filter(function(item) { return item.queryTableName === 'Capability_Resources' && item.origin === 'Mission_AssistingOrgs'; });   
                        pTableUrl = pTabl[0].originURL;

                    var whereQuery = "ResourceFK='" + resGID + "'";
                    var queryTask = new QueryTask(pTableUrl);
                    var query = new esri.tasks.Query();
                        query.outFields = ['*'];
                        query.orderByFields=['Organization'];
                        query.where = whereQuery;
                        query.returnGeometry = false;
                        queryTask.execute(query).then(lang.hitch(this, function(response){

                            var committedResources = this.sumCommittedRes(response.features) 
                            var rBalance = committedResources-reqResNum;
                            var updateItem = "resItemTable-" + resGID;// create DOM ID to query
                            var updateElem = dom.byId(updateItem);

                            var resBalanceId="resBalanceID-" + resGID;// This ID is used to update via dom after it is calculated
                            var resCommittedId="resCommittedID-" + resGID;// This ID is used to update via DOM after it is calculated
                            var resRequiredId = "resRequiredID-" + resGID;

                            var rContent="";

                                rContent= '<tr><td id="' +resRequiredId + '" class="edit-resource-item-status95px">' + reqResNum +'  Required</td><td id="' + resCommittedId + '" class="edit-resource-item-status95px">' + committedResources + ' Committed</td>'
                                rContent+=    '<td id="' + resBalanceId + '" class="edit-resource-item-status40px">'+  rBalance +'</td>';          
                                rContent+= '</tr>';

                            if(updateElem){
                              updateElem.innerHTML=rContent;
                              this.colorBalanceRes(resBalanceId, rBalance, committedResources);
                            }

                        }));  // End committed resource

                })); // End resoure query 


        },

          // ************************************************
          // Update Resource count Values and Balance via DOM 
          // ************************************************ 
          colorBalanceRes:function(findBalanceElement, balance, rCount){

                  var updateBalance = document.getElementById(findBalanceElement);
                  if(updateBalance){

                      if((balance)>=0 && rCount!=0){
                          updateBalance.innerHTML="+" + balance;
                          updateBalance.style.color="#009900";
                          //this.capResourceArray[i].Gap = "Green"
                      }

                      if(balance<0 && rCount!=0){
                          updateBalance.innerHTML=balance;
                          updateBalance.style.color="red";
                          //this.capResourceArray[i].Gap = "Red"
                      }

                      if(balance<0 && rCount==0){
                          updateBalance.innerHTML= balance; // "N/A";
                          updateBalance.style.color="red";
                      }
                  }
         },

        // Used above
        sumCommittedRes:function(parArr){

            var committedItems=0;

            // ******************************************************************************************
            // re-calc the committed resources
            // ******************************************************************************************
            array.forEach(parArr, lang.hitch(this, function(item, i) {

                  committedItems = committedItems + item.attributes.NmbCommited;

              }));
            
            return committedItems;

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
                  //var insertUpdateId = "partnerCommittment-tp" + this.partnerResourceTileId + "-" + i;

                    var pContent="";
                        pContent+='<div id="UPDATE THIS IF IT EXISTS WITH ENTIRE PARTNER LIST" class="edit-partner-item-node">';
                        pContent+=    '<div tooltip="Edit Partner" class="node-box" style="float:right;padding-right:5px;">';
                        pContent+=        '<div id="' + parEditClickedId + '" class="icon-pencil-edit-btn"></div>';
                        pContent+=     '</div>';
                        
                        //pContent+=   '<div id="partnerCommittment-tp'+this.partnerResourceTileId + '-' + i +'">';
                        pContent+=     '<table class="edit-partner-item-table">';
                        pContent+=         '<tr><td class="edit-partner-item-status60px"><b>' + results.features[i].attributes.NmbCommited +'</b></td><td class="edit-partner-item"><b>' + results.features[i].attributes.Organization + '</b></td></tr>';
                        pContent+=     '</table>';

                        pContent+=     '<p><div class="cap-info-text">Agreement: '  + results.features[i].attributes.Agreement +'</div></p>';
                        pContent+=     '<p><div class="cap-info-text">Details: '  + results.features[i].attributes.AgreementDetails +'</div></p>';
                        pContent+=     '<p><div class="cap-info-text-bottom-border">Comments: '  + results.features[i].attributes.Comments +'</div></p>';
                        //pContent+=   '<div>';

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
                        this._ccPanelPartnerEditBtn(i, editpGID, editpOrg, resGID, "");
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

            var capID  = this.config.selectedCap.GlobalID;
          
            // ************************************************
            // Call Add Edit Delete Partner Dialog
            // ************************************************
                var createForm = new Add_Edit_Delete_PartnerDialog();
                    createForm._createPartnerDomainFromPlan("editPar", this.config, resGID, this.config.selectedCap.GlobalID, parGID, clickedFrom);
        },




        // ***************************************************************
        // Count partner Rsources and Calculate balance for each resource
        //
        // ***************************************************************       
        calcResourceBalance: function(){

              var resTabl = this.config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
                  resTableUrl = resTabl[0].originURL;
                  relID = resTabl[0].queryRelId;

                // setup new featurelayer for capabilities; used soley for relationship queries
                var fLayer = new FeatureLayer(resTableUrl);

                array.forEach(this.capResourceArray, lang.hitch(this, function(item,i) {

                    console.log("Loop for:  countPartnerResources-" + item.ObjectID + " Res# " + i);

                    var pSet=[];
          
                    //define relationship query 
                    var relatedResourcesQry = new RelationshipQuery();
                        relatedResourcesQry.outFields = ["*"];
                        relatedResourcesQry.relationshipId = relID;
                        relatedResourcesQry.objectIds = [item.ObjectID];
                        this.ccEditParNodes = [];

                    fLayer.queryRelatedFeatures(relatedResourcesQry, lang.hitch(this, function(relatedRecords) {

                       var findBalance = "resBalanceID-" + item.GlobalID;
                       var findCommitted = "resCommittedID-" + item.GlobalID;

                      // ***********************************************************************
                      // 
                        if (typeof relatedRecords[item.ObjectID] == 'undefined') {

                                console.log("Undefined Partner iteration: " + i + " reqResources: " + this.capResourceArray.length);

                                var updateBalance = document.getElementById(findBalance);
                                if(updateBalance){
                                        updateBalance.innerHTML="N/A";
                                }

                            return;

                        }

                        pSet = relatedRecords[item.ObjectID].features;

                            var rCount=0;
                            array.forEach(pSet, lang.hitch(this, function(index, a){

                                //total partner committments for a given resource
                                rCount= rCount + index.attributes.NmbCommited;// spelling error in data model

                            })) // end array 

                            // *************************************************************
                            // Balance property on capResourceArray[i].Balance 
                            // are calculated directly here and updated to the table via dom 
                            // CapResourceArray for possible use with other functions. 
                            // *************************************************************
                            var balance = (rCount-item.NmbNeeded);

                            console.log("balance:" + balance + " -loop");

                                this.capResourceArray[i].Balance = balance;
                                this.capResourceArray[i].NmbCommitted =rCount;



                            // ************************************************
                            // Update Resource count Values and Balance via DOM 
                            // ************************************************ 

                                var updateCommitted = document.getElementById(findCommitted);
                                if(updateCommitted){
                                    updateCommitted.innerHTML = rCount + " Committed";
                                }

                                var updateBalance = document.getElementById(findBalance);
                                if(updateBalance){

                                    if((balance)>=0 && rCount!=0){
                                        updateBalance.innerHTML="+" + balance;
                                        updateBalance.style.color="#009900";
                                        this.capResourceArray[i].Gap = "Green"
                                    }

                                    if(balance<0 && rCount!=0){
                                        updateBalance.innerHTML=balance;
                                        updateBalance.style.color="red";
                                        this.capResourceArray[i].Gap = "Red"
                                    }

                                    if(balance<0 && rCount==0){
                                        updateBalance.innerHTML=balance; //"N/A";
                                        updateBalance.style.color="red";
                                        //updateBalance.innerHTML='<div class="icon-warning-orange"></div>';
                                    }
                                }

              }))// end response function for related partner loop


              }))// end response function for resource loop

             this.createResourceListInPanel(); // Create initial resource list for cap Info Panel using balance values

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

            var resourceHeading = dom.byId("reqResCountId");// update with resourceCount

                      if(this.capResourceArray.length==1){
                          // resourceCount.innerHTML=this.capResourceArray.length + " required resource";
                          if(resourceHeading){resourceHeading.innerHTML =  "1 ";  }
                      }

                      if(this.capResourceArray.length>1){
                          // resourceCount.innerHTML=this.capResourceArray.length + " types of resources"
                          if(resourceHeading){resourceHeading.innerHTML = this.capResourceArray.length;  }
                      }

        },
/*
        // **********************************************************************************************
        // Create Domain of All partners for use in Add_Edit_Delete_PartnerDialog.js
        // Passed via this.config - Called after every partner edit, every newlayer() and every backBtn
        // **********************************************************************************************
            getUniquePartnersForEntirePlan: function(){

                    this.config.partnersAddedToEntirePlanArr=[];
                    var qTable = this.config.relates.filter(function(item) { return item.origin === 'Mission_AssistingOrgs'; });
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
                                          this.config.partnersAddedToEntirePlanArr.push({
                                              Organization: item.attributes.Organization,
                                              SummaryCount: item.attributes.SummaryCount
                                          });
                                        }// End if to remove blanks
                                      }));// end loop

                                      console.log(this.config.partnersAddedToEntirePlanArr)

                                      }), function(err){
                                          console.log(err);
                                        }   
                                  );
                      }
                      else{
                        console.log("Error determining URL to Partner committments Table")
                        alert("Error determining URL to Partner Committments Table")
                      }
        },

*/

        // ******************************************************************************
        //  Get list of unique Partners from Partner Table for specified capability.  
        //  This is called after
        // ****************************************************************************** 
        //! possible replace with uniqueArrayFunction from basic partner table query   
        //  Show More . . . and Show Less could limit partner loop to 5 or less 
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
                    ///query.orderBy = "SummaryCount";
                    queryTask.execute(query).then(lang.hitch(this, this.qComplete_UniquePartners));

        },

        // ********************************************************
        //
        // This provides the summary of partners in the left panel 
        //
        // ********************************************************
        qComplete_UniquePartners: function(results) {
                // *****************************************************
                // this is used in getResourceNamesForSelectedPartner()
                this.config.tpPartnerResFK_ID_String="";// the array here is used by back button to remove listeners from edit partner button.  i.e var array = string.split(',');

                var uPartnersArr=results.features;// save for layer use
                    if(uPartnersArr.length){// 

                      this.config.tpPartnerCount=uPartnersArr.length;

                     // ********************************************************************
                     // More than 0 Partners - update the partner count in the left header
                      if(dom.byId("partnerCountId")){
                       dom.byId("partnerCountId").innerHTML=uPartnersArr.length;// overwrite the "0"
                      }

                    }                                            
                    else{
                      // **********************************
                      // ZERO PARTNERS is the default
                      console.log("unassigned resource in partner results")
                   
                    }

                // *********************************************
                // list partners at the bottom of the info panel
                array.forEach(uPartnersArr, lang.hitch(this, function(item, i) {

                    var tpTitle=item.attributes.Organization;
                    var tpCapFK=item.attributes.CapabilityFK;
                    var loadingContent='<div class="loadingElipsis">Refreshing Content</div>';
              

                    // this allows the last clicked title pane to open, showing the results of the previous edit.
                    var tpPartners = "tpCapParId_" + i; 
                    var tpOpenStatus=false;

                    if(tpPartners==this.clickedParTitlePane){
                      tpOpenStatus = true;
                    }
                    else{
                      tpOpenStatus = false;
                    }


                    // Create TilePane for each Resource Item
                    var tp = new TitlePane({
                        id: tpPartners,
                        title:tpTitle,
                        open: tpOpenStatus,
                        content:loadingContent,
                        
                        onClick: lang.hitch(this,function(value){

                          this.clickedParTitlePane = value.currentTarget.id;


                          // refresh content from the service every time it is clicked
                          if(this.showingTP){
  
                              this.getResourcesForCap_AND_Partner(value.currentTarget.id, tpTitle, this.config.selectedCap.GlobalID);
                          }

                          // clear content when hidden.  May be necessary to remove button listeners - but do not do it currenlty.
                          if(!this.showingTP){


                              
                          }

                        }),
                        

                      /* **********************************************************************************  
                      /* This does not pass a click event to know which dijit was clicked! and is not used
                      /* ***********************************************************************************/
                        onShow: lang.hitch(this,function(event){
                          this.showingTP=true;
                        }),

                        onHide:lang.hitch(this,function(event){
                          this.showingTP=false;
                        })

                      });

                        dom.byId("capInfo-partners").appendChild(tp.domNode);
                        //tp.attr('open', false);
                        tp.startup();

                        // when refreshed, open the last clicked partner title pane
                        if(tpPartners==this.clickedParTitlePane){
                              this.getResourcesForCap_AND_Partner(this.clickedParTitlePane, tpTitle, this.config.selectedCap.GlobalID);
                            
                        }

                }))
      },

      // **************************************************************************
      //  Get list of resources that a partner has committed for a given capability
      //
      //  Called by qComplete_UniquePartners()
      //  Requires current Capability ID and Name of Partner Organization, which must be unique.  
      //  Capabilty is set in onBookmarkClick
      //  Query Committments Table for partner that was clicked
      //       CapabilityFK = "ZZZ" AND Organization="YYY" gets list of committments, but missing name of resource
      //       Returns list of ResourceFK that are used to get the name and required count
      getResourcesForCap_AND_Partner: function(clickedTP_DijitId, partnerOrg, CapFk){

          // This filter may be able to be elimitated if partner queryURL was re-set 

          var resTabl = this.config.relates.filter(function(item) { return item.queryTableName === 'Capability_Resources' && item.origin === 'Mission_AssistingOrgs'; });   
              parTableUrl = resTabl[0].originURL;
              relID = resTabl[0].queryRelId;


          var whereQuery = "CapabilityFK='" + CapFk + "' AND Organization='" + partnerOrg + "'" ;
          var queryTask = new QueryTask(parTableUrl);
          var query = new esri.tasks.Query();
              query.outFields = ['*'];
              query.orderByFields=['Organization'];
              query.where = whereQuery;
              query.returnGeometry = false;

              //alert(whereQuery);

              // Create new content string for Title Pane
              queryTask.execute(query).then(lang.hitch(this, function(response){

                    if(response.features.length>0){  // check for length
                      this.config.clickedPartnerPaneAR=[];// used in checkForOrphanResources() in real time.  Overwritten each tp click.
                      this.config.tpPartnerResPaneArr=[]; // used to record last opened partner tp with resource name and type.
                                                          // not needed if reource name and type is in the partner table.

                      var ResourceFK_String="";// used to query Resource table since resource Name is not also in the partner Table. Overwritten each tp click.
                                               // ResFK is also used as a DomID for edit partner edit buttons to make it easier to clean up listeners
                      
                      array.forEach(response.features, lang.hitch(this, function(item,i) {

                        var pContent="";// do not concatenate HTML, since some resource items in partner table may be orphaned
                                        // orphan is determined when resourceFK in PartnerTable can not be found in resource Table

                           ResourceFK_String=ResourceFK_String + ",'" + item.attributes.ResourceFK + "'";
                           
                            this.config.clickedPartnerPaneAR.push({
                                pOrg: item.attributes.Organization,
                                capFK: item.attributes.CapabilityFK,
                                resFK: item.attributes.ResourceFK,
                                attributes: item.attributes
                            });


                      }));

                      
                      this.getResourceNamesForSelectedPartner(ResourceFK_String, clickedTP_DijitId, partnerOrg);
                      

                    }

                    
                    else{

                          // No resource records for Partner.


                    }


                  }), function(err){

                        console.log(err);

                        content='<div class="cap-info-text" status="NoRecord">Data error detected with the query</div>';

                        var updateParTitlePane = dijit.byId(clickedTP_DijitId);
                            updateParTitlePane.set("content", content);// reset the selected panel
                      }
              );      
      },
      // *******************************************
      // Called by getResourcesForCap_AND_Partner()
      getResourceNamesForSelectedPartner: function(resGlobalID_String, clickedTP_DijitId, pOrg){
        // returns list of resources

          var newStr = resGlobalID_String.replace(/^,/, '');
          var pOrgId = pOrg + "_id"; // used for domId of removePartnerBtn

          // this.config.tpPartnerResFK_ID_String=this.config.tpPartnerResFK_ID_String + "," + newStr
          // this could be concat indefinately and then unduplicated when back button is clicked to remove listeners

          var resTabl = this.config.relates.filter(function(item) { return item.queryTableName === 'Capabilities' && item.origin === 'Capability_Resources'; });   
              resTableUrl = resTabl[0].originURL;
              relID = resTabl[0].queryRelId;

          //  GlobalID IN('b1ce8f3b-9ba4-4ae6-b7f5-95b34099d95d', '3180ae5a-1905-4737-9a5f-364af2519d37','cc7ca22d-6a71-49ef-b9f1-b7858ee21b4a')
          var whereQuery = "GlobalID IN(" + newStr + ")" ;
          //alert(whereQuery);
          var queryTask = new QueryTask(resTableUrl);
          var query = new esri.tasks.Query();
              query.outFields = ['*'];
              //query.orderByFields=['Organization'];
              query.where = whereQuery;
              query.returnGeometry = false;

              queryTask.execute(query).then(lang.hitch(this, function(response){

                  if(response.features.length>0){  // check for length
                      var nonOrphanedResHTML="";
                      var rmPartnerElem = "";
                      var noResources="";

                      // create HTMLObj of the resources that were committed by a single partner and update the title pane that was clicked
                      array.forEach(response.features, lang.hitch(this, function(item,i) {
                          nonOrphanedResHTML= nonOrphanedResHTML + this.checkForOrphanResources(item.attributes.GlobalID, item.attributes.ResourceName,item.attributes.ResourceType);                 
                      }));

                        var updateParTitlePane = dijit.byId(clickedTP_DijitId);
                            updateParTitlePane.set("content", nonOrphanedResHTML);// reset the selected panel

                            //console.log("Inserting " + nonOrphanedResHTML);

                            this.createListenersForPartnerReportEditBtns();
                    }

                    else{
                            noResources='<table class="remove-partner-item">';
                            noResources+=     '<tr><td class="cap-info-text"><b>No Specified Resource Committments</b></td></tr>';
                            noResources+='</table>';
                            noResources+='<div class="remove-partner-item-node">';
                            noResources+=    '<div tooltip="Remove Partner" class="node-box" style="float:right;padding-right:5px;">';
                            noResources+=        '<div id="' + pOrgId + '" class="icon-cross-remove-btn"></div>';
                            noResources+=     '</div>';
                            noResources+=     '<table class="edit-partner-item-table">';
                            noResources+=         '<tr><td class="remove-partner-item">Remove this partner and its resources</td></tr>';
                            noResources+=     '</table>';                   
                            noResources+='</div>';

                        var updateParTitlePane = dijit.byId(clickedTP_DijitId);
                            updateParTitlePane.set("content", noResources);

                        }

                  }), function(err){
                        alert("THERE IS AN ERROR WITH THE QUERY - " + err);
                        console.log(err);
                      }
              );

      },


      // *********************************************************************************************************************************************
      // Create HTML object of the resouce committment(with with Resource Name + Type) for the partner when resoureID is found in the resource Table
      //
      //  Callec by getResourceNamesForSelectedPartner()
      // *********************************************************************************************************************************************
      checkForOrphanResources: function(resFK, resName, resType){

          var pContent="";

          array.forEach(this.config.clickedPartnerPaneAR, lang.hitch(this, function(item,i) {

              // resourceFK was found in ResourceTable
              // create Array of non orphaned Resources for that partner
              if(resFK==item.resFK){

                        var editParBtn="editParBtn-" + item.attributes.GlobalID;// used to remove listener
                        var resItemHTML="";

                            pContent+='<div class="edit-partner-item-node">';
                            pContent+=    '<div tooltip="Edit Partner" class="node-box" style="float:right;padding-right:5px;">';
                            pContent+=        '<div id="' + editParBtn + '" class="icon-pencil-edit-btn"></div>';
                            pContent+=     '</div>';
                            pContent+=     '<table class="edit-partner-item-table">';
                            pContent+=         '<tr><td class="edit-partner-item-status60px"><b>' + item.attributes.NmbCommited +'</b></td><td class="edit-partner-item"><b>' + resName + '(' + resType + ')</b></td></b></tr>';
                            pContent+=     '</table>';                   
                            pContent+=     '<p><div class="cap-info-text">Agreement: '  + item.attributes.Agreement +'</div></p>';
                            pContent+=     '<p><div class="cap-info-text">Details: '  + item.attributes.AgreementDetails +'</div></p>';
                            pContent+=     '<p><div class="cap-info-text">Comments: '  + item.attributes.Comments +'</div></p>';
                            pContent+='</div>';

                        this.config.tpPartnerResPaneArr.push({
                                pOrg: item.attributes.Organization,
                                capFK: item.attributes.CapabilityFK,
                                resFK: item.attributes.ResourceFK,
                                pGlobalID: item.attributes.GlobalID,
                                resName: resName,
                                resType: resType,
                                attributes: item.attributes
                        });
              }
          }))

          return pContent
          

      },


      
      // *******************************************************
      // Create listeners for an edit button for each resource
      // Called by getResourceNamesForSelectedPartner()
      // *******************************************************
      createListenersForPartnerReportEditBtns: function(){
              this.ccPartnerReportEditResNodes=[];

              array.forEach(this.config.tpPartnerResPaneArr, lang.hitch(this, function(item,i) {

                      var clickParReportResNode = dom.byId("editParBtn-"+item.pGlobalID);

                      if(clickParReportResNode){
                          this.ccPartnerReportEditResNodes.push(clickParReportResNode);
                          this._ccTP_EditParReportBtn(i, item.pGlobalID, item.pOrg, item.resFK, "NO REFRESH");
                      }
              }))
      },

      // **************************************************
      // Create Event on Edit Partner Table Cell
      // Used to create clickable list for Partners
      // **************************************************
      _ccTP_EditParReportBtn: function(i, parGID, pOrg, resGID, clickedFrom){

                on(this.ccPartnerReportEditResNodes[i], 'click', lang.hitch(this, function(){
                     this._panelPartnerEditClicked(i, parGID, pOrg, resGID, clickedFrom);                  
                }));
      },


      // called by clicking the _onBackBtnClicked() - NOT USED
      removeListenersForPartnerEditBtns: function(parBtn){


      },

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

      //console.log(this.config.relates);

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

            this.map.infoWindow.resize(330, 300);
               
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

            console.log("finished adding")

        },

        

// *************************************************************************
//  Function 4  Get Hazards from Capabilities layer
// *************************************************************************   




// *************************************************************************
//  Function 5  Create Operations List (Core Capabilities List)
// *************************************************************************   





  });
});