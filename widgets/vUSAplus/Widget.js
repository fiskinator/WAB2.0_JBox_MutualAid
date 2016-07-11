///////////////////////////////////////////////////////////////////////////
// NISC vUSA GeoForm Widget
// Copyright © 2016 National Information Sharing Consortium. All Rights Reserved.
// Parts of this widget are based off the Bookmark Widget by ESRI (retained Copyright below)
// It was adapted to allow configuring groups and organizations to query and return
// Web Maps as bookmarks for switching the configuration of the Application
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
        'jimu/BaseWidget',
        'dojo/on',
        'dojo/aspect',
        'dojo/string',
        'esri/SpatialReference',
        'esri/layers/FeatureLayer',
        './ImageNode',
        'jimu/dijit/TileLayoutContainer',
        'jimu/utils',
        'libs/storejs/store',
        'esri/arcgis/Portal',

        'dojo/topic',
        'dojo/store/Memory',
        "dijit/registry",
        'dijit/form/Form',
        'dijit/form/Select',
        'dijit/form/RadioButton',
        'dojo/dom',
        'dojo/dom-construct',
        'jimu/tokenUtils'


    ],
    function(declare, lang, array, html, BaseWidget, on, aspect, string,
        SpatialReference, FeatureLayer, ImageNode, TileLayoutContainer, utils, store, esriPortal, topic, Memory, registry, Form, Select, RadioButton, dom, domConstruct, tokenUtils) {
        return declare([BaseWidget], {
            //these two properties is defined in the BaseWidget
            baseClass: 'jimu-widget-vusa-plus',
            name: 'vUSAplus',

            //bookmarks: Object[]

            bookmarks: [],


            //currentIndex: int
            //    the current selected bookmark index
            currentIndex: -1,

            startup: function() {
                // summary:
                //    this function will be called when widget is started.
                // description:
                //    see dojo's dijit life cycle.
                this.inherited(arguments);

                this.bookmarkList = new TileLayoutContainer({
                    strategy: 'fixWidth',
                    itemSize: {
                        width: 100,
                        height: 92
                    }, //image size is: 100*60,
                    hmargin: 15,
                    vmargin: 5
                }, this.bookmarkListNode);

				//use config to store groups array
                this.config.myGroups = [];
                //create group list based off of config
                this._createGroupHeader();
                
                //auto login on startup (occurs after webmap switching) if login existed
                if (this.appConfig.vUSALogin == true) {
                    this._onLoginBtnClicked();

                }

                this.bookmarkList.startup();

                this.own(on(this.inputSearch, 'keydown', lang.hitch(this, function(evt) {
                    var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
                    if (keyNum === 13) {
                        this._onSearchBtnClicked();
                    }
                })));

                this.own(on(this.btnMap, 'click', lang.hitch(this, function(evt) {
  
                        this._clickItemTypeRadio(evt);

                })));


//JF Sort of works, but requires universal popup logic for added layers

//                this.own(on(this.btnLayer, 'click', lang.hitch(this, function(evt) {
//  
//                        this._clickItemTypeRadio(evt);
//
//               })));

                this.own(on(this.btnGeoForm, 'click', lang.hitch(this, function(evt) {

                        this._clickItemTypeRadio(evt);

                })));

                this.own(on(this.btnOpsDash, 'click', lang.hitch(this, function(evt) {

                        this._clickItemTypeRadio(evt);

                })));

                this.own(on(this.btnApp, 'click', lang.hitch(this, function(evt) {

                        this._clickItemTypeRadio(evt);

                })));



            },// End startup


            //events    

            onOpen: function() {

                //new query every time widget opens to get any recently shared webmaps

               // this.queryGroupItems();  // adding logic to intercept the query to ckeck the item type

                  this.createItemQuery();
            },

            onClose: function() {
                // summary:
                //    see description in the BaseWidget
                this.bookmarks = [];
                this.currentIndex = -1;
            },

            onMinimize: function() {
                this.resize();
            },

            onMaximize: function() {
                this.resize();
            },

            resize: function() {
                var box = html.getMarginBox(this.domNode);
                var listHeight = box.h - 37 - 21 - 61;

                //fix for IE8
                if (listHeight < 0) {
                    listHeight = 0;
                }
                html.setStyle(this.bookmarkListNode, 'height', listHeight + 'px');
                if (this.bookmarkList) {
                    this.bookmarkList.resize();
                }
            },


            //JF used for getting click event for Radio Button
             _clickItemTypeRadio: function(evt){

                this.createItemQuery();//evt.srcElement.id

            },

            // JF get query selection.  Needed to combine with user filter for each type and when changing Groups
            getCheckedBtn: function(){

                var selectedBtn;

                if(document.getElementById("btnMap").checked){
                    selectedBtn="btnMap";
                }
                // removed to develop layers further

                //else if(document.getElementById("btnLayer").checked){
                //    selectedBtn="btnLayer";
                //}
                else if(document.getElementById("btnGeoForm").checked){
                    selectedBtn="btnGeoForm";
                }
                else if(document.getElementById("btnOpsDash").checked){
                    selectedBtn="btnOpsDash";
                }
                else if(document.getElementById("btnApp").checked){
                    selectedBtn="btnApp";
                }

                return selectedBtn;

            },


            createItemQuery: function(){

                var qType=this.getCheckedBtn();

                searchtxt = string.trim(this.inputSearch.value);

                if (!searchtxt) {
                    searchtxt = '';
                }



                var q;  // create the query that will be used in the next group / org query function


                if (qType=="btnMap"){

                    q = "+type:\"Web Map\" AND\"" + searchtxt + "\" -type:\"Web Mapping Application\"";

                }

                else if (qType=="btnLayer"){

                     //q =  "\" AND\"" + searchtxt + "\" +type:\"Feature Service\"";

                    q = "\"" +  searchtxt + "\" +type:\"Feature Service\"";
                }

                else if(qType=="btnGeoForm"){

                    q =  "\"" +  searchtxt + "\" +title:\"geoform\"  +type:\"Web Mapping Application\"";



                }

                else if(qType=="btnOpsDash"){
                    
                    //q = "\"AND \"" + searchtxt + "\" +type:\"Operation View\"";
                    q = "\"" + searchtxt + "\" +type:\"Operation View\"";

                }

                else if(qType=="btnApp"){
                    
                    //q = "\"AND \"" + searchtxt + "\" +type:\"Web Mapping Application\" AND -type:\"Operation View\" AND  -title:\"geoform\" AND -title:\"geo form\"";
                    q =  "\"" + searchtxt + "\" +type:\"Web Mapping Application\" AND -type:\"Operation View\" AND  -title:\"geoform\" AND -title:\"geo form\"";
                }


                this.queryGroupItems(q);

            },


            //start query and processing results
            //query the group or org for the items
            queryGroupItems: function(q) {

                //add case for arcgis online

                if (this.config.startingGroupOrg.id == "1") {

                    params = {
                        //q: " +type:\"Web Map\" AND\"" + searchtxt + "\" -type:\"Web Mapping Application\"",
                        q: q,
                        sortField: "numRatings",
                        sortOrder: "desc",
                        num: 100,
                        start: 0,
                        f: "json"
                    };



                } else {


                    if (this.config.startingGroupOrg.id) {

                        // group params
                        this.groupid = this.config.startingGroupOrg.id;

                        if (this.config.startingGroupOrg.type == "org") {

                            params = {
 //                           q: "orgid:\"" + this.groupid + "\"AND +type:\"Web Map\" AND\"" + searchtxt + "\" -type:\"Web Mapping Application\"",
                               
                              q: "orgid:\"" + this.groupid + "\"AND " + q,
            
                                sortField: "modified",
                                sortOrder: "desc",
                                num: 100,
                                start: 0,
                                f: "json"
                            };


                        } else {

                            params = {
                 //            q: "group:\"" + this.groupid + "\"AND +type:\"Web Map\" AND\"" + searchtxt + "\" -type:\"Web Mapping Application\"",

                                q: "group:\"" + this.groupid + "\"AND " + q,
                                sortField: "modified",
                                sortOrder: "desc",
                                num: 100,
                                start: 0,
                                f: "json"
                            };

                        }
                    }

                }


                if (!this.portal) {

                    this.portal = new esriPortal.Portal(this.appConfig.map.portalUrl);

                }

                console.log(params)

                this.portal.queryItems(params).then(lang.hitch(this, function(response) {
                    console.log('queryItems');

                    this.config.webMaps = response.results;

                    //message to indicate that no results were found:

                    if(this.config.webMaps.length>0){
                    var message=document.getElementById("msg");
                        message.style.display = "none";
                        message.innerHTML="";

                    }
                    else{
                    var message=document.getElementById("msg");
                        message.style.display = "block";
                        message.innerHTML="No results found.";
                    }


                    // *******************************************************************************
                    // JF Clear Results array from bookmarks - formerly only necesary with new search
                    // *******************************************************************************
                    this.bookmarks = [];
                    this.currentIndex = -1;

                    this._readWebmaps();


                }), function(error) {
                    console.log(error);
                });

            },


            //read the results and build the new bookmark array  

            _readWebmaps: function() {
                if (!this.config.webMaps) {
                    return;
                }
                array.forEach(this.config.webMaps, function(bookmark) {
                    bookmark.isInWebmap = true;
                    bookmark.name = bookmark.title;
                    //console.log(bookmark);

                    var repeat = 0;
                    for (var i = 0; i < this.bookmarks.length; i++) {
                        if (this.bookmarks[i].name === bookmark.name) {
                            repeat++;
                        }
                    }
                    if (!repeat) {
                        this.bookmarks.push(bookmark);
                    }
                }, this);

                this.displayBookmarks();
            },

            //loop through the build the bookmark display     

            displayBookmarks: function() {
                // summary:
                //    remove all and then add
                var items = [];
                this.bookmarkList.empty();
                array.forEach(this.bookmarks, function(bookmark) {
                    items.push(this._createBookMarkNode(bookmark));
                }, this);

                this.bookmarkList.addItems(items);

                this.resize();
            },

            // create the individual item bookmark nodes    
            _createBookMarkNode: function(bookmark) {
                var thumbnail, node;

                if (bookmark.thumbnailUrl) {
                    thumbnail = bookmark.thumbnailUrl;
                } else {
                    thumbnail = this.folderUrl + 'images/defaultThumbnail.png';
                }

                node = new ImageNode({
                    img: thumbnail,
                    label: bookmark.name
                });
                on(node.domNode, 'click', lang.hitch(this, lang.partial(this._onBookmarkClick, bookmark)));

                return node;
            },

            //added section for querying group to create header for webmap selection
            //sets all the web map layer items in _createWebMap from group query response
            _createGroupHeader: function() {
                console.log("create group header");

                var selectOrgs = this.config.configuredGroupsOrgs;

                for (var i = 0; i < selectOrgs.length; i++) {

                    //console.log("selected orgs: " + selectOrgs[i].title);

                    thumb = this.folderUrl + selectOrgs[i].thumbnailUrl;
                    if (!thumb) {
                        thumb = this.folderUrl + 'images/defaultThumbnail.png';
                    }

                    var item = '<div class="groupOption"><img src=' + thumb + '>' + '<div class="groupTitle">' + selectOrgs[i].title + '</div></div>';

                    this.config.myGroups.push({
                        name: selectOrgs[i].title,
                        id: selectOrgs[i].id + "," + selectOrgs[i].type,
                        label: item

                    });

                }

                var AGOLitem = '<div class="groupOption"><img src=' + this.folderUrl + 'images/agol.png>' + '<div class="groupTitle">ArcGIS Online</div></div>';

                this.config.myGroups.push({
                    name: "ArcGIS Online",
                    id: "1",
                    label: AGOLitem

                });

                //take response from config group to add item to myGroups

                var thumb = this.config.startingGroupOrg.thumbnailUrl;
                var title = this.config.startingGroupOrg.title;

                if (!thumb) {
                    thumbnail = this.folderUrl + 'images/defaultThumbnail.png';
                }

                var item = '<div class="groupOption"><img src=' + this.folderUrl + thumb + '>' + '<div class="groupTitle">' + title + '</div></div>';

                this.config.myGroups.push({
                    name: title,
                    id: this.config.startingGroupOrg.id + ',' + this.config.startingGroupOrg.type,
                    label: item

                });

                this._placeGroupSelect();

            },

            //vUSA
            //place group info to create select
            _placeGroupSelect: function() {
                console.log(this.myGroups);

                if (!this.groupSelect) {
                    var groupArray = this.config.myGroups;

                    groupArray.reverse();

                    var groupNode = dijit.byId('groupSelectBox');
                    if (groupNode) {
                        groupNode.destroyRecursive();
                    }

                    var groupStore = new Memory({
                        idProperty: "id",
                        data: groupArray
                    });


                    this.groupSelect = new Select({
                        id: "groupSelect",
                        style: {
                            width: '100%'
                        },
                        store: groupStore,
                        sortByLabel: false,
                        labelAttr: "label"
                    }, "groupSelectBox");


                    //dojo.style(dijit.byId("groupSelect").closeButtonNode,"display","none");

                    this.groupSelect.on("change", lang.hitch(this, function(value) {
                        var update = value.split(",");

                        console.log(update[0]);

                        this.config.startingGroupOrg.id = update[0];

                        this.config.startingGroupOrg.type = update[1];
                        searchtxt = string.trim(this.inputSearch.value);

                        this.bookmarks = [];
                        this.currentIndex = -1;

//JF event now checks for itemType first
    
                        this.createItemQuery("btnMap");
    
//                        this.queryGroupItems(searchtxt);


                    }));

                    //initiate hazard dropdown
                    domConstruct.place(this.groupSelect.domNode, "map_groupheader", "replace");
                    this.groupSelect.startup();


                }
            },




            //click events

            // JF must create alternative listeners for non-webmap items so that a mapChange is not issued

            _onBookmarkClick: function(bookmark) {


                //update webmap and subtitle
                this.appConfig.map.itemId = bookmark.id;
                this.appConfig.subtitle = bookmark.title;

                //publish topic for appConfigChanged

                // JF added - check to only publish change if a webmap was clicked

                if(bookmark.type=="Web Map"){

                    console.log("Web Map-" + bookmark.type)

                    topic.publish('appConfigChanged', this.appConfig, 'mapChange');

                }
               

               // If type is operations view, must create a link to open the app, 

               else if(bookmark.type=="Operation View"){

                    var dashLink = bookmark.portal.url + "/apps/dashboard/index.html#/" + bookmark.id;

                    console.log("Operations View " +dashLink)
                    window.open(dashLink);

               }

                // holding for adding code to add feature layer to the map.
               else if (bookmark.type=="Feature Service"){

                    var featureService=bookmark.url.toString();

                    var testForFeatureServer=featureService;
                    if(testForFeatureServer.indexOf('FeatureServer') >= 0){
                       featureService=featureService + "/0";
                       //alert(featureService);
                    }
                 
                    console.log("FeatureService-" + featureService);


                    var addFeatureLayer = new FeatureLayer(featureService.toString(), {
                        id: bookmark.id,
                        title: bookmark.title,
                        minScale: this.minScale,
                        maxScale: this.maxScale,
                        outFields: ["*"],
                        //infoTemplate: infoTemplate,
                        visible: true
                    });
            

                console.log(addFeatureLayer);
                // add to map
                this.map.addLayer(addFeatureLayer);
                //topic.publish('appConfigChanged', this.appConfig, 'mapChange');


                }

               else{// Geoform and other apps

                    console.log("Other-" + bookmark.type)
                    window.open(bookmark.url);

                }

            },



            _onAddBtnClicked: function() {
                if (string.trim(this.bookmarkName.value).length === 0) {
                    html.setStyle(this.errorNode, {
                        visibility: 'visible'
                    });
                    this.errorNode.innerHTML = this.nls.errorNameNull;
                    return;
                }
                if (array.some(this.bookmarks, function(b) {
                        if (b.name === this.bookmarkName.value) {
                            return true;
                        }
                    }, this)) {
                    html.setStyle(this.errorNode, {
                        visibility: 'visible'
                    });
                    this.errorNode.innerHTML = this.nls.errorNameExist;
                    return;
                }

                this._createBookmark();

                html.setStyle(this.errorNode, {
                    visibility: 'hidden'
                });
                this.errorNode.innerHTML = '&nbsp;';
                this.bookmarkName.value = '';

                this.displayBookmarks();

            },



            _onLoginBtnClicked: function() {
                console.log("onLoginBtnClicked");

                this.inputSearch.value=""; // clear search term after login.

                if (!this.portal) {

                    this.portal = new esriPortal.Portal(this.appConfig.map.portalUrl);

                }

                var self = this;

                this.portal.signIn().then(function(loggedInUser) {

                    //left these commented out variables to show how to get credential and token
                    var credential = loggedInUser.credential;

                    self.appConfig.vUSALogin = true;
                    //topic.publish('userSignIn', credential);

                    //self.config.token = credential.token;
                    self.config.userName = loggedInUser.username;
                    console.log(loggedInUser);

                    loggedInUser.getGroups().then(function(groups) {
                        console.log("groups");
                        console.log(groups);


                        array.forEach(groups, function(group, i) {

                            thumb = group.thumbnailUrl;

                            if (!thumb) {
                                thumb = self.folderUrl + 'images/folder.png';
                            }

                            if(i==0){
                                var item = '<div class="groupOptionWithBorder"><img src=' + thumb + '>' + '<div class="groupTitle">' + group.title + '</div></div>'
                            }
                            else{
                                var item = '<div class="groupOption"><img src=' + thumb + '>' + '<div class="groupTitle">' + group.title + '</div></div>'
                            }
 

                            self.config.myGroups.push({
                                name: group.title,
                                id: group.id + ",group",
                                label: item

                            });


                        });

                        //self.groupSelect.destroy();
                        self._updateGroupList();
                        self._showUserName();

                    });



                });


            },


            _updateGroupList: function() {
            	console.log("updateGroupList");

                var groupArray = this.config.myGroups;

                var groupStore = new Memory({
                    idProperty: "id",
                    data: groupArray
                });

                this.groupSelect.setStore(groupStore);


            },
            _showUserName: function() {
                domConstruct.destroy("LoginButton");

                domConstruct.place("<div class='userLabel' id='userName'>" + this.config.userName + "</div>", "userName", "replace");



            },

            _onSearchBtnClicked: function() {
                // this.bookmarkList.empty();
                this.bookmarks = [];
                this.currentIndex = -1;

                searchtxt = string.trim(this.inputSearch.value);

             //JF   this.queryGroupItems(searchtxt);

                this.createItemQuery()
            },



        });
    });