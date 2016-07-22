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

    "./Add_Edit_Delete_ResourceDialog"

],
    function (
        registry,array,declare,lang,dom, win, domClass, Stateful, Evented,
        domConstruct,easing,numbr,on,request, Dialog,
        Memory, Highlight,Tooltip,Chart, Chart2D, StackedColumns, MiamiNice,
        Extent, Button, FeatureLayer, RelationshipQuery, QueryTask, Add_Edit_Delete_ResourceDialog
 //       CAP_InitiateDialog,CAP_EditRecordDialog,RES_AddRecordDialog,RES_EditRecordDialog, RESP_EditRecordDialog,RESP_AddRecordDialog
    ) {

        return declare("RES_TableConstructor",
//            [Stateful, Evented, CAP_EditRecordDialog, RES_AddRecordDialog, RES_EditRecordDialog, RESP_EditRecordDialog,RESP_AddRecordDialog], { 

            [Stateful], { 
             options: {
                    capID: null,
                    capIdx: null,
                    capOID: null,
                    capURL: null,
                    capName: null,
                    pageToLoad:null,
                    capResArr:null,
                    this_config: null,
        },   

        ////////////////////////////////////////////////////////////////////////////////
        // Constructor creates new partner table for selected Resource
        // Passing defaule values set in CAP_Summery at function:  _resPartnerClicked()
        ////////////////////////////////////////////////////////////////////////////////
        constructor: function (options) {
            // mixin options
            var defaults = lang.mixin({}, this.options, options);
            // properties
            this.set("capID", defaults.capID);           
            this.set("capIdx", defaults.capIdx);
            this.set("capOID", defaults.capOID);
            this.set("capURL", defaults.capURL);
            this.set("capName", defaults.capName);
            this.set("pageToLoad", defaults.pageToLoad);
            this.set("capResArr", defaults.capResArr);
            this.set("this_config", defaults.this_config);

        // ********************************************************************
        //  JF Pure CSS Table for resources - adding to domID "rTableParent"
        // ********************************************************************
            console.log("Function: Create New Resource Table");
            this.capResourceArray=[];



                var str="";
                // str += '<div class="capSummaryHeader" id="capSummaryHeaderId">';
                // str +=      '<div class="capLeftButtonsContainer">';
                // str +=           '<div class="capSumStatus" id="editCAP_Parent"><p><span class="myButtons"><button id="editCAP" baseClass="myButtons" type="button"></button><span></p></div>';
                // str +=      '</div>';

                // str +=      '<div class="capCenterContainer">';
                // str +=          '<div class="capTargetHeader">Capability Target: </div>';   
                // str +=          '<div class="capRRDetails" id="capTargetDivID"></div>';
                // str +=      '</div>';

                // str +=      '<div class="capRightButtonsContainer">';
                // str +=           '<div class="capSumStatus"><p><button id="editCAP_menuIcon2"></button></p></div>';
                // str +=           '<div class="capSumStatus"><p><button id="editCAP_menuIcon3"></button></p></div>';
                // str +=           '<div class="capSumStatus"><p><button id="editCAP_menuIcon4"></button></p></div>';
                // str +=      '</div>';
                // str += '</div>';

/*
                    str+= '<div class="slideShowHeader">';
                    str+=       '<div class="horizontal-text-with-slideShow-icon" id="slideShowHeaderId"></div>';// Used for title of slide
                    str+=       '<div class="icon-cancel-circle-slideShowHeader" id=closeSlideShowId></div>';
                    str+=       '<div class="horizontal-cont-clear"></div>';
                    str+= '</div>';


*/

            // ********************************************************
            // Insert Parent DOM Elements for Resource Table and Graph
            // ********************************************************
                  str +='<div id="gridsAndGraph" class="gridsAndGraphDIV">';


                  str+=    '<div id="tableHeaderId_2" class="tableHeader">';
                  str+=       '<div class="horizontal-text-with-table-icon" id="tableHeaderId"></div>';// Used for title of slide
                  str+=       '<div class="icon-cancel-circle-tableHeader" id="closeTableId"></div>';// <div class="horizontal-right-content" id="AddPartnerBtnId_EMACBtn">
                  str+=       '<div class="horizontal-cont-clear"></div>';
                  str+=    '</div>';


            //    str +=      '<div class="capSubHeaderContainer"/>' 
            //    str +=          '<div id="capTableTitle" class="capSubHeader">Required Resources</div>';
             //   str +=      '</div>';


                str +=      '<div id="rTableParent" class="rTableParentDiv"></div>';
                str += '</div>';

            var newNode2 = domConstruct.toDom(str);
            domConstruct.place(newNode2, dom.byId("formParentDiv"), 'first');


            var closeTableReport = dom.byId("closeTableId");

                on(closeTableReport, 'click', lang.hitch(this, function(close){
                    console.log('click-event-close-tableReport');

                    //remove grid element
                    var gridsAndGraph = dom.byId("gridsAndGraph");
                        if (gridsAndGraph) {
                            gridsAndGraph.remove();
                    }

                    this._displayDivElementsOnTheMap();

                    //document.getElementById("showerId").className="showingDiv";
                    //document.getElementById("hiderId").className="hiddenDiv";


                }));
 
            // ********************************************************
            // Inserting Buttons on CAP Header - Edit This Capability!
            // ********************************************************

            /*
            var myButton = new Button({
                label: "Edit",
                baseClass: "myIconButtons",
                iconClass: "icon-pencil-white",
                onClick: lang.hitch(this,function(capId){
                    // Do something:
                    this.initEditForm(this.capID,  this.coreCapability, this.capIdx);// located in CAP_EditRecordDialog.js
                })
            }, "editCAP").startup();

            // *********************************
            // Insert SHOW RESOURCES Button
            // *********************************
            var myButton2 = new Button({
                className: "myIconButtons myIcon-clipboard",
                id:"editCAP_menuIcon2",
                onClick: lang.hitch(this,function(){
                // Do something:
                this.showCAP_Resources();
            })
            }, "editCAP_menuIcon2").startup();

            // **************************************
            // Insert PARTNER IMPACT / REVIEW BUTTON
            // **************************************
            // This will be a CAP summary of partners and their impact on the resoures of selected capability
            var myButton3 = new Button({
                className: "myIconButtons myIcon-user",
                id:"editCAP_menuIcon3",
                onClick: lang.hitch(this,function(){
                // Do something:
                this.showCAP_Partners();
           })
            }, "editCAP_menuIcon3").startup();

            // *********************************
            // INSERT SHOW GRAPH BUTTON
            // *********************************
            var myButton4 = new Button({
                className: "myIconButtons myIcon-graph",
                id: "editCAP_menuIcon4",
                onClick: lang.hitch(this,function(){
                // Do something:
                this.showCAP_Graphs();
            })
            }, "editCAP_menuIcon4").startup();


        // **********************************************
        // Insert the Green Add Resource Button into DOM
        // **********************************************
            var addTargetStr="";   
                addTargetStr = '<div class="horizontal-cont" id="btnGreenAddResBtn">';
                addTargetStr +=     '<div class="horizontal-text-with-icon" id="AddPartnerBtnId" >Add Resource</div>';
                addTargetStr +=     '<div class="horizontal-right-content" id="AddPartnerBtnId_EMACBtn"></div>';
                addTargetStr +=     '<div class="horizontal-cont-clear"></div>';
                addTargetStr +='</div>';

            var node2 = domConstruct.toDom(addTargetStr);
                domConstruct.place(node2, dom.byId('rTableParent'), 'after');// could be "after" or "last"

            // ******************************************
            // Assign click event to the Green Add Button
            // ******************************************
            var clickAddResource = dom.byId("AddPartnerBtnId");

                on(clickAddResource, 'click', lang.hitch(this, function(capID){
                    console.log('click-event');

            // ************************************************
            // Call AttrFormManager to create AddResource Form
            // ************************************************
                    var createForm = new AttrFormsManager();
                        createForm._insertEditPanel("addRes");


                }));

            // ******************************************
            // Assign click event EMAC Button
            // ****************************************** 
            var clickEmac = dom.byId("AddPartnerBtnId_EMACBtn");

                on(clickEmac, 'click', lang.hitch(this, function(){
                    var redirectWindow = window.open('http://www.emacweb.org/', '');
                    //redirectWindow.location; : EGE - not sure what this line is doing
                }));
*/


            // **************************************************************************
            //  Get Capabilities Details from the service.  Update Form requires refresh
            // **************************************************************************   

//JF NEW    this.querySelectedCapability();  // Get Header Target Description for selected Capability.  Update via dom
            this.createCapResourceArray(this.pageToLoad);   // Get resource data fresh from service each time the function is called.

        },

// This same function also appears in widget.js

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
        //  JF Pure CSS Table for resources - adding to domID "rTableParent"
        // ********************************************************************
        createCapResourceArray:function(whichPageToLoad){
            console.log("Function: Create Capability Resource Table");
            //this.capResourceArray=[];
            var pageLoad = whichPageToLoad;
            var resourceCount=0;

                //get relationship id for the capabilities resources table
                var capItem = this.this_config.relates.filter(function(item) { return item.queryTableName === 'Capability_Resources' && item.origin=='Capabilities'; });
                
                // makes sure a good esult is returned
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
                        relatedResourcesQry.objectIds = [this.capOID];// object ID from selected capability

                    fLayer.queryRelatedFeatures(relatedResourcesQry, lang.hitch(this, function(relatedRecords) {


                  

                    if (typeof relatedRecords[this.capOID] == 'undefined') {
                        // console.log("No related resources for Capability OID: ", sourceID);

                        alert("No reources exist.  Please add resources for this capability.");


                        this._displayDivElementsOnTheMap2();

                        return;
                    }

                            // ********************************************************************
                    else{// If resources exist, proceed to create a resource array!
                            // ********************************************************************

                           resourceCount = relatedRecords[this.capOID].features.length;// may not be anny feature in the result

                            pSet = relatedRecords[this.capOID].features;

                            var totResTypes = pSet.length;// use to end the loop
                            var calcTotResReq = 0;
                            counter=0;

                            //iterate through resource list associated with each target capability
                            array.forEach(pSet, lang.hitch(this, function(index, j) {

                                counter=counter+1


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
                                    Gap: "",
                                    //NmbOfferred: 0, // this may be the same as NmbCommitted?
                                    NmbCommitted: 0, // JF Added - populated in countPartnerResources
                                    NmbResPartners: 0, // JF Added - populated in countPartnerResources
                                    Type: index.attributes.ResourceType,
                                    RTLT_Type: index.attributes.RTLT_Type,
                                    GlobalID: index.attributes.GlobalID,
                                    ObjectID: rID
                                    //assistingAgency: []
                                });

                                // ****************************************************
                                // count partner committments for this Resource 
                                this.countPartnerResources(rID,  rName, rNmbNeeded, j, counter, resourceCount);


                                 if(j==(totResTypes-1)){
                                    
                                    // Create the table immedately, and update with checkmarks via DOM.  
                                    if(pageLoad=="requiredResources"){
                                        lang.hitch(this,this.capSummaryTableHeader());
                                    }
                                    // if(pageLoad=="partnerSummary"){
                                    //     lang.hitch(this,this.partnerQuerySetup());
                                    // }
                                    // if(pageLoad=="chartSummary"){
                                    //     lang.hitch(this,this.generateGraphs());
                                    // }

                                }

                            }));

                    }// Related reource do exist for the selected capability!



                }));




                }
                else{
                    alert("Can not determine the resource table for this capability.");
                }

        },



    _displayDivElementsOnTheMap2:function(){

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


        // ********************************************************
        // Function to count partner Offers for each Resource Item
        // ********************************************************

        countPartnerResources: function(rOID, rName, reqRes, i, counter, resourceCount){
            //console.log("Function:  countPartnerResources-" + rOID);



              var resTabl = this.this_config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
                resTableUrl = resTabl[0].originURL;
                relID = resTabl[0].queryRelId;

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

                        if (typeof relatedRecords[rOID] == 'undefined') {
                            // console.log("No related resources for Capability OID: ", sourceID);
                            if(updateBalance){
                                updateBalance.innerHTML ='<div class="icon-warning-orange"></div>';
                            }


                        // ************************************************************************************
                        //  This calls the function only after the Resource statistcis array has been populated.
                        // ************************************************************************************
                        if(resourceCount==counter){// the last resource may not have resource partners

                          console.log("Updated Resource Array: TABLE CONSTRUCTOR" + this.capResourceArray);

                                    if(this.pageToLoad=="partnerSummary"){
                                        lang.hitch(this,this.partnerQuerySetup());
                                    }
                                    if(this.pageToLoad=="chartSummary"){
                                        lang.hitch(this,this.generateGraphs());
                                    }

                         }




                            return;  // this loop must count each time it passes to know when the array is fully populated
                        }

                        pSet = relatedRecords[rOID].features;

                            var rCount=0;
                            array.forEach(pSet, lang.hitch(this, function(index, i){

                                //total partner committments for a given resource
                                rCount= rCount + index.attributes.NmbCommited;// spelling error in data model

                            })) // end array 

                            // *********************************************************************
                            // Balance property on capResourceArray[i].Balance is not currently used
                            // Values are calculated directly here and updated to the table via dom 
                            // CapResourceArray for use with other functions on this page. 
                            var balance = rCount-reqRes;
                                this.capResourceArray[i].Balance = balance;
                                this.capResourceArray[i].NmbCommitted =rCount;
                                if(balance>0){
                                    this.capResourceArray[i].Gap = "Green"
                                }
                                else{
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
                                // ****************************************************************************
                                if(updateBalance){


                                    if((balance)>=0 && rCount!=0){
                                        if(balance==0){
                                            updateBalance.innerHTML='<div class="icon-checkmark-green"></div>';  
                                        }
                                        else{
                                            updateBalance.innerHTML="+" + balance;
                                            updateBalance.style.color="#009900";
                                            this.capResourceArray[i].Gap = "Green"
                                        }
                                    }

                                    if(balance<0 && rCount!=0){
                                        //updateBalance.innerHTML = balance;
                                        updateBalance.innerHTML=balance;
                                        updateBalance.style.color="red";
                                        this.capResourceArray[i].Gap = "Red"
                                     }

                                    if(balance<0 && rCount==0){
                                        updateBalance.innerHTML='<div class="icon-warning-orange"></div>';
                                    }


                                }

// ******************************************************************************
//  This calls the function only after the Resource array has been populated.
// ******************************************************************************
                        if(resourceCount==counter){



                                    console.log("Updated Resource Array: TABLE CONSTRUCTOR" + this.capResourceArray);


                                    if(this.pageToLoad=="partnerSummary"){
                                        lang.hitch(this,this.partnerQuerySetup());
                                    }
                                    if(this.pageToLoad=="chartSummary"){
                                        lang.hitch(this,this.generateGraphs());
                                    }



                         }

                        }))// end response function for related records



        },

        // ***********************************************************
        // Create Cap Summary TABLE DOM elements using capResourceArr
        // ***********************************************************
        capSummaryTableHeader:function(){
            //  Clear previous table if it exists 
            var rowsExist = dom.byId("rTableParent");

                while (rowsExist.firstChild) {
                    //alert("There must have been some table rows left in the DOM!")
                    rowsExist.removeChild(rowsExist.firstChild);
                }

            //  Insert Column Headers as the first row
            //  CSS assigns first-child properties to bold field names etc.
            var rTable="";
                rTable += '<div class="row">';
                rTable +=   '<div class="resColumn1">Balance</div>';
                rTable +=   '<div class="resColumn2">Resource Name</div>';
                rTable +=   '<div class="resColumn5"></div>';
                rTable +=   '<div class="resColumn3">Required</div>';
                rTable +=   '<div class="resColumn4">Secured</div>';
                rTable +=   '<div class="resColumn6">Definition</div>';
                //rTable +=   '<div class="resColumn7">Partners</div>';
                rTable += '</div>';

            var rTableNode = domConstruct.toDom(rTable);
                domConstruct.place(rTableNode, dom.byId('rTableParent'), 'last');

            this.refreshResourceTable();    
        },

        // ********************************************************************
        //  JF Pure CSS Table for resources - loop through new resource Array
        // ********************************************************************
        refreshResourceTable:function(){

            var clickedFrom = "REFRESH RESOURCE TABLE VIEW"// used to know which table to refresh at countPartnerResources();

            // Insert responsive count of records in the header

            document.getElementById("tableHeaderId").innerHTML='<img style="float:left;padding-top:5px;padding-right:5px;width:40px" src="./widgets/MutualAid/images/tableButtonBlue.png"><div>' + this.capResourceArray.length +  " Required Resources</div>";

            this.ccEditResNodes = [];
            this.ccResTypeNodes = [];
            this.ccResPartnerNodes = [];

            // *************************************************************
            // Loop through each resource and create an additional row
            // Insert icons into specified columns using Column specific CSS
            // *************************************************************               
            array.forEach(this.capResourceArray, lang.hitch(this, function(resItem, i){

                var rTable="";
                rTable += '<div class="row">';
                rTable +=   '<div class="resColumn1" id="resBalance-' + resItem.ObjectID + '">' + (resItem.NmbCommitted - resItem.NmbNeeded) + '</div>';
                rTable +=   '<div class="resColumn2">' + resItem.Name + '-' + resItem.Type + '</div>';
                rTable +=   '<div class="resColumn5" id="rEditIdx-' + i + '" resGlobalKey="'+ resItem.GlobalID +'">' + '<div class="icon-pencil" id="iconPencilId"></div>' + '</div>';

                rTable +=   '<div class="resColumn3">' + resItem.NmbNeeded +' </div>';
                rTable +=   '<div class="resColumn4" id="resCount-' + resItem.ObjectID + '">' + resItem.NmbCommitted  +' </div>';
                rTable +=   '<div class="resColumn6" id="rTypeDef-' + i + '">' + '<div class="icon-books"></div>' + '</div>';
            //    rTable +=   '<div class="resColumn7" id="rPartner-' + i + '">' + '<div class="icon-users" id="iconUsersId"></div>' + '</div>';
                rTable += '</div>';

                var clickEdit = "rEditIdx-" + i;
                var clickType = "rTypeDef-" + i;
                var clickPartner = "rPartner-" + i;

                var rTableNode = domConstruct.toDom(rTable);
                    domConstruct.place(rTableNode, dom.byId('rTableParent'), 'last');

                var clickNode1 = dom.byId(clickEdit);
                    this.ccEditResNodes.push(clickNode1);
                    this._ccEvent_EditRes(i, resItem.Name, resItem.ObjectID, resItem.GlobalID, clickedFrom);

                var clickNode2 = dom.byId(clickType);
                    this.ccResTypeNodes.push(clickNode2);
                    this._ccEventResTypeInfo(this.capIdx, i);

            //    var clickNode3 = dom.byId(clickPartner);
            //        this.ccResPartnerNodes.push(clickNode3);
            //        this._ccEventResPartner(i, resItem.Name, resItem.Type, resItem.ObjectID, resItem.GlobalID, clickedFrom);

            }));
        },        

        // **************************************************
        // Create Event on Edit Resource Table Cell
        // Used to create clickable list for the resources 
        // **************************************************
        _ccEvent_EditRes: function(i, rName, rOID, rID, clickedFrom){

            var resName =  rName;
            var resGID = rID;
            var resOID = rOID;

                on(this.ccEditResNodes[i], 'click', lang.hitch(this, function(){
                    var vs = win.getBox();
                    if (vs.w < this._showDrawerSize) {
                        this._drawer.toggle().then(lang.hitch(this, function () {
                            // resize map
                            this.map.resize(true);
                            // wait for map to be resized
                            setTimeout(lang.hitch(this, function () {
                                this._editResClicked(resName,resGID, clickedFrom);
                            }), 250);
                        }));
                    } else {
                        this._editResClicked(resName,resGID, clickedFrom);
                    }
                }));
        },

        // *****************************************************
        // EDIT RESOURCE ICON HAS BEEN CLICKED
        // *****************************************************
        _editResClicked: function(resName,resGID, clickedFrom){

            // ************************************************
            // Call ResourceDialog to edit Resource 
            // ************************************************

            this.this_config.selectedResGID=resGID; 
            this.this_config.selectedResName=resName;
          
                var createForm = new Add_Edit_Delete_ResourceDialog();
                    createForm._createCustomDomains("editRes", this.this_config, clickedFrom);

        },

        // *****************************************************
        // Create Event on Resource Type Info Table Cell
        // Used to create clickable list for the Type Definition 
        // *****************************************************
        _ccEventResTypeInfo: function(capIdx, i){
            var resIdx =i;
            var CAPidx = capIdx;
                on(this.ccResTypeNodes[i], 'click', lang.hitch(this, function(){
                    var vs = win.getBox();
                    if (vs.w < this._showDrawerSize) {
                        this._drawer.toggle().then(lang.hitch(this, function () {
                            // resize map
                            this.map.resize(true);
                            // wait for map to be resized
                            setTimeout(lang.hitch(this, function () {
                                this._resTypeClicked(CAPidx,resIdx);
                            }), 250);
                        }));
                    } else {
                        this._resTypeClicked(CAPidx,resIdx);
                    }
                }));
        },

        // *****************************************************
        //  RESOURCE DEFINITION BUTTON HAS BEEN CLICKED
        // *****************************************************
        _resTypeClicked: function(CAPidx, resIdx){
            
            var resID = this.capResourceArray[resIdx].ResourceID;
            var resTyp = this.capResourceArray[resIdx].RTLT_Type;
            var urlBase;

            if (resTyp == "Resource Typing Definition"){
                urlBase = 'https://rtlt.preptoolkit.org/Public/Resource/View/';
            }
            if (resTyp == "Position Qualification"){
                urlBase = 'https://rtlt.preptoolkit.org/Public/Position/View/';
            }
            if (typeof resID !== 'undefined' || resID !== null){
                window.open(urlBase+resID, '_blank');
            }
            //this needs to be fixed for nulls
            else{
                console.log('no resource ID for this resource..');
               // alert( "Show RTLT Type Definition - " + CAPidx + " " + resIdx);
            }
        },

        // ******************************************************
        // Create Event on Resource Partner  Table Cell
        // Used to create clickable list for the Resource Partner
        // ******************************************************
        _ccEventResPartner: function(i, rName, rType, rOID, rID, clickedFrom){
            //var resIdx =i;
            //var capIdx = this.capIdx;
            var resName =  rName;
            var resGID = rID;
            var resOID = rOID;
            var resType = rType;

            console.log("CHECK ON-" + this.ccResPartnerNodes[i]);
            on(this.ccResPartnerNodes[i], 'click', lang.hitch(this, function(){
                var vs = win.getBox();
                if (vs.w < this._showDrawerSize) {
                    this._drawer.toggle().then(lang.hitch(this, function () {
                        // resize map
                        this.map.resize(true);
                        // wait for map to be resized
                        setTimeout(lang.hitch(this, function () {
                            this._resPartnerClicked(this.capIdx, resName, resType, resGID, resOID, clickedFrom);
                        }), 250);
                    }));
                } else {
                    this._resPartnerClicked(this.capIdx, resName, resType, resGID, resOID, clickedFrom);
                }
            }));
        },

        // ******************************************************
        // Create Event on Resource Partner  - for direct editing in Partner Report!
        // Used to create clickable list for the Resource Partner Report
        // ******************************************************
        _ccEventResPartnerDirect: function(i, rName, pName, pGlobalID, clickedFrom){


            console.log("CHECK ON-" + this.ccResPartnerNodes[i]);
            on(this.ccResPartnerNodes[i], 'click', lang.hitch(this, function(){
                var vs = win.getBox();
                if (vs.w < this._showDrawerSize) {
                    this._drawer.toggle().then(lang.hitch(this, function () {
                        // resize map
                        this.map.resize(true);
                        // wait for map to be resized
                        setTimeout(lang.hitch(this, function () {
                            this._editParClicked(pGlobalID, i, rName, pName, clickedFrom);
                        }), 250);
                    }));
                } else {
                    this._editParClicked(pGlobalID, i, rName, pName, clickedFrom);
                }
            }));
        },



        // *****************************************************
        // EDIT PARTNER BUTTON HAD BEEN CLICKED
        // *****************************************************
        _resPartnerClicked: function(capIdx, rName, rType, rGID, rOID, clickedFrom){

             this.initPartnerEditForm(this.capID, this.capIdx, this.capOID, rGID, rName, rType, rOID, clickedFrom);
        },



        // *****************************************************
        // PARTNER ICON HAS BEEN CLICKED
        // *****************************************************

        initPartnerEditForm:function(capID, capIdx, capOID, rGID, rName, rType, rOID, clickedFrom){
            var content = '';
                content += '<div id="pTableParent">';
                content +=    '<div class="row">';
                content +=        '<div class="resColumn1">Count</div>';
                content +=        '<div class="resColumn2">Resource Partner</div>';
                content +=        '<div class="resColumn5"></div>';
                content +=        '<div class="resColumn100">City/State</div>';
                content +=        '<div class="resColumn3">Agreement</div>';
                //content +=        '<div class="resColumn4">Status</div>';
                content +=    '</div>';
                content +=  '</div>';


                var thisDialogNode = domConstruct.create('div', {
                    innerHTML: content
                });

                this.pDialog = new Dialog({
                    title: rName + "-" + rType,
                    draggable: true,
                    id: "resPartnerDialog",
                    style: "width:700px"
                }, thisDialogNode);

                this.pDialog.connect(this.pDialog, "hide", lang.hitch(this, function() {
                    var thisDialog = dijit.byId("resPartnerDialog");
                        if(thisDialog){
                            thisDialog.hide;
                            thisDialog.destroyRecursive();
                        }
                }));

                // ************************************
                // Insert the Green Add Resource Button
                // ************************************

                var addTargetStr ="";   
                    addTargetStr = '<div class="horizontal-cont">';
                    addTargetStr +=     '<div class="horizontal-text-with-icon" id="pDialog_AddPartnerBtnId" >Add Resource Partner</div>';
                    addTargetStr +=     '<div class="horizontal-right-content" id="pDialog_EMACBtn_Id"></div>';
                    addTargetStr +=     '<div class="horizontal-cont-clear"></div>';
                    addTargetStr +='</div>';

                var node2 = domConstruct.toDom(addTargetStr);

                this.pDialog.containerNode.appendChild(node2);// appending to container node seems to be critical 
                // ******************************************
                // Assign click event to the Green Add Button
                // ******************************************                
                var clickAddPartner = dom.byId("pDialog_AddPartnerBtnId");

                    on(clickAddPartner, 'click', lang.hitch(this, function(){

                        this.initAddRESPRecord(rGID, capID, rName, clickedFrom);// located in RESP_AddRecordDialog

                        this.closeParDialog();


                    }));

                // ******************************************
                // Assign click event EMAC Button
                // ****************************************** 
                var clickEmac = dom.byId("pDialog_EMACBtn_Id");
                    on(clickEmac, 'click', lang.hitch(this, function(){
                    this.closeParDialog();
                    window.open('http://www.emacweb.org/', '');
                        // redirectWindow.location;
                }));


                var resTabl = this.this_config.relates.filter(function(item) { return item.queryTableName === 'Mission_AssistingOrgs' && item.origin === 'Capability_Resources'; });
                var resTableUrl = resTabl[0].originURL;
                var relID = resTabl[0].queryRelId;

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

                        if (typeof relatedRecords[rOID] == 'undefined') {
                            // console.log("No related resources for Capability OID: ", sourceID);
                            return;
                        }
                        // console.log("--------------------------------------------");            
                        console.log("related resources for Capability OID: " + rOID);
                        pSet = relatedRecords[rOID].features;

                            array.forEach(pSet, lang.hitch(this, function(index, i){

                                //Get variables for table
                                var rCommitted = index.attributes.NmbCommited; ////
                                var pName = index.attributes.Organization;
                                var pType  = index.attributes.JurisdictionType;
                                var pAgree  = index.attributes.Agreement;
                                var status = "";// switch
                                var pGlobalID = index.attributes.GlobalID;

                                var pTable = "";
                                    pTable += '<div class="row">';
                                    pTable += '<div class="resColumn1">' + rCommitted + '</div>';
                                    pTable += '<div class="resColumn2">' + pName + '</div>';
                                    pTable += '<div class="resColumn5" id="pEditIdx-' + i + '" resGlobalKey="' + pGlobalID + '">' + '<div class="icon-pencil" id="iconPencilId"></div>' + '</div>';
                                    pTable += '<div class="resColumn100">' + pType + ' </div>';
                                    pTable += '<div class="resColumn3">' + pAgree + ' </div>';
                                    //pTable += '<div class="resColumn4" id="removeP-' + i + '"></div>';
                                    pTable += '</div>';

                                var clickEdit = "pEditIdx-" + i;
                                var clickPartner = "rPartner-" + i;

                                var pTableNode = domConstruct.toDom(pTable);
                                    domConstruct.place(pTableNode, dom.byId('pTableParent'), 'last');

                                var clickNode1 = dom.byId(clickEdit);
                                    this.ccEditParNodes.push(clickNode1);
                                    this._ccEvent_EditPar(pGlobalID, i, rName, pName, clickedFrom);

                            })); // end array 
                        }));// end response function for related records

                        this.pDialog.show();
        }, // END CONSTRUCTOR

        closeParDialog:function(){

            var thisDialog = dijit.byId("resPartnerDialog");
                if(thisDialog){
                    thisDialog.hide;
                    thisDialog.destroyRecursive();
                }
        },

        _ccEvent_EditPar: function(pGlobal, i, rName, pName, clickedFrom){


            on(this.ccEditParNodes[i], 'click', lang.hitch(this, function(){
                this._editParClicked(pGlobal, i, rName, pName, clickedFrom);
            }));


        },

        // *****************************************************
        // EDIT PARTNER ICON HAS BEEN CLICKED - this is also used by _ccEventResPartnerDirect() from the partner report
        // *****************************************************
        _editParClicked: function(pGlobal, i, rName, pName, clickedFrom){

            this.initEditRespRecord(pGlobal, rName, pName, clickedFrom);

            this.closeParDialog();
        },







        // **************************************************************************
        //  Get Capabilities Details from the service.  Update Form requires refresh
        // **************************************************************************  

        querySelectedCapability: function() {
            console.log('queryCapabilitiesLayer - task defined');
            var whereQuery = "GlobalID='" + this.capID + "'";
            var query = new esri.tasks.Query();
            var queryTask = new QueryTask(this.capURL);
            query.outFields = ['*'];
            query.where = whereQuery;
            query.returnGeometry = false;
            queryTask.execute(query).then(lang.hitch(this, this.queryCapCompleted));
        },

        // *******************************************************
        // 2) Create array from the Results of capabilities query 
        // 
        queryCapCompleted: function(results) {
            console.log('queryCapabilities - Task Completed in RES_TableConstructor' + results);

            if (results.features.length==1){

             //   dom.byId("capTargetDivID").innerHTML=results.features[0].attributes.Targets;
                this.coreCapability = results.features[0].attributes.Capability;
                this.capTarget  =results.features[0].attributes.Targets;
                this.capOID = results.features[0].attributes.OBJECTID;
            }
        },


        showCAP_Resources: function(){
           document.getElementById("rTableParent").style.display = 'block';
           document.getElementById("btnGreenAddResBtn").style.display = 'block';
           document.getElementById("capTableTitle").innerHTML="Required Resources";
            document.getElementById("capTableTitle").className="capSubHeader";
           if(dom.byId("capGraphId")){
                document.getElementById("capGraphId").style.display = 'none';
           }


           // Refresh table and capability description
                this.createCapResourceArray("requiredResources");
                this.querySelectedCapability();//make sure the Capabilty Target info is also refreshed.
        },

        showCAP_Partners:function(){
           document.getElementById("rTableParent").style.display = 'block';
           document.getElementById("btnGreenAddResBtn").style.display = 'none';

           if(dom.byId("capGraphId")){
                document.getElementById("capGraphId").style.display = 'none';
           }


 

           //document.getElementById("capTableTitle").innerHTML="Resource Partner Report";
           //document.getElementById("capTableTitle").className="capSubHeaderHandshake";

           this.createCapResourceArray("partnerSummary");// recalculate new totals before generating report
           //this.partnerQuerySetup();
        },

        showCAP_Graphs: function(){

            // *************************************************************
            // Always destroy and re-create the graph when you click.  
            // This forces the annimation to occur while you are watching ...
            // *************************************************************

      //     document.getElementById("capTableTitle").innerHTML="Resource Allocation Chart";
      //     document.getElementById("capTableTitle").className="capSubHeaderGraph";


            var getGraph = dijit.byId("capGraphId");            // I don't think this works
                if(getGraph){getGraph.destroy("capGraphId");}   // I don't think this works) {};

            var getNode = dom.byId("capGraphId");
                if(getNode){ getNode.remove();}

           // this.createCapResourceArray("chartSummary");// refesh new totals before generating graph

           this.generateGraphs();

        },

        generateGraphs: function(){


            // getHeaderHeight NOT USED
            // *********************************************************************************
            // 1) Calculate current height of parent DIV tag for capGraphId
            // 2) Subtract the height of the adjustable Summary Header 
            //var getHeaderHeight = document.getElementById("capSummaryHeaderId").offsetHeight;// must subtract header from total height

     
            // Note main.CSS .gridsAndGraphDIV calculated height to be less the height of header

            // *************************************************************
            // Format width and height dimensions text the way dojo chart likes it
            var getHeight = "height: " + (document.getElementById("gridsAndGraph").offsetHeight - (44)) + "px;";
            var getWidth = "width: " + document.getElementById("gridsAndGraph").offsetWidth + "px;";

            // *************************************************************
            // Insert the inline style for sizing that dojo graph requires
            var newNode = domConstruct.toDom('<div id="capGraphId" style="' + getWidth + ' ' + getHeight + '">');
                domConstruct.place(newNode, dom.byId('gridsAndGraph'), 'last');

            // ***********************************************************
            // Change visiblity for DIV tags when graph button is clicked
            document.getElementById("capGraphId").style.display = 'block';// display new graph element
            document.getElementById("rTableParent").style.display = 'none';// hide resource table

            var getGreenBtn = dom.byId("btnGreenAddResBtn");

            if(getGreenBtn){ 
                document.getElementById("btnGreenAddResBtn").style.display = 'none';//hide green button
            }
 
            this._createChart_A();// requires index of capability, not the ID
        },

        // ********************************************************************************
        //  FUNCTION to generate a particular Graph
        // ********************************************************************************       
        //  TODO -  Other graphs should also be availabe from this DIV  
        //  TODO:  Labels are inconsistent !
        // ********************************************************************************

        _createChart_A:function(){

            // create string of resource values to add to the parent element
            var nmbRequired = [];
            var nmbOfferred = [];
            var pctOfferred = [];
            var delta = [];
            var surplus =[];
            var baseline = [];
            var chartLbl = [];
            var startVal = 1;


            array.forEach(this.capResourceArray, function(resItem){
            var yDelta=0;
            var sDelta=0;

                // this catch is required to avoid a surplus showing up as if it is a red deficit
                if(resItem.NmbCommitted-resItem.NmbNeeded>0){// Committed resources exceed what is needed and surplus exists
                    yDelta=0;
                    sDelta=resItem.NmbCommitted-resItem.NmbNeeded;
                }else{
                    sDelta=0;
                    yDelta=resItem.NmbCommitted-resItem.NmbNeeded;
                }
                
                nmbRequired.push({
                    tooltip: resItem.Name + ": " + resItem.NmbNeeded + " needed" ,
                    // x: startVal,
                    y: resItem.NmbNeeded,
                    z: resItem.NmbCommitted,
                    i: 'r'});
                nmbOfferred.push({
                    tooltip: resItem.Name + ": " + resItem.NmbCommitted + " offered" ,
                    // x: startVal,
                    y: resItem.NmbCommitted,
                    z: 999,
                    i: 'x'});
                
                delta.push({
                    tooltip: "Delta of: " + Math.abs(resItem.NmbNeeded - resItem.NmbCommitted),
                    // x: startVal,
                    y:  Math.abs(yDelta),
                    z: 999,
                    i: 'd'});



                var pctOffer = 0;
                // var pctOffer = Math.floor((resItem.NmbOfferred/resItem.NmbNeeded) * 100 );                // pctOfferred.push({
                //     tooltip: resItem.Name + ": " + resItem.NmbOfferred + "/" + resItem.NmbNeeded + " available" ,
                //     x: startVal,
                //     y: pctOffer});
                baseline.push({
                    tooltip: resItem.Name + ": " + resItem.NmbCommitted + "/" + resItem.NmbNeeded + " available" ,
                    x: startVal,
                    y: pctOffer});
                
                chartLbl.push({
                    value: startVal,
                    text: resItem.Name.substring(0,10) + ".."});
                    // text: resItem.Name});
                startVal +=1;
            });


            if(chartOne){                           // this does not work
                chartOne.destroy();        // this does not work
            }         


            var chartOne = new Chart("capGraphId");
                

            chartOne.addPlot("default", {
                type: "StackedColumns", //ClusteredColumns
                markers: true,
                tension: 3,
                gap: 5,
                animate: { duration: 2000, easing: easing.expoln },
                styleFunc: function(item){
                if (item.i === 'r' && item.z < item.y){
                  return {
                        fill : "red"
                    };
                }
                return {};
            }
            });

                
            chartOne.setTheme(dojox.charting.themes.MiamiNice);
            chartOne.addAxis("x", 
                /*{title: "Resource Name", titleOrientation: "away"},*/ 
                {labels: chartLbl});
            chartOne.addAxis("y", 
                { vertical: true, fixLower: "major", fixUpper: "major", min: 0 });

            chartOne.addSeries("Offerred", nmbOfferred, {fill: 'green'} );
            chartOne.addSeries("delta", delta, {fill: 'red'} );


            var tip = new Tooltip(chartOne,"default");
            var hl = new dojox.charting.action2d.Highlight(chartOne,"default");

            // Add a mouseover event to the plot
            chartOne.connectToPlot("default", function(evt){
                console.warn(evt.type," on element ",evt.element," with shape ",evt.shape);
                // React to mouseover event
                // if(type == "onclick") {
                //    console.log(evt.element);
                // }
            });
            chartOne.render();
        },




        /////////////////////////////////////////////////////////
        //  Generate Partner Statistics with a Summary Request //
        //                                                     //
        //  QUERY FLOW USED TO CREATE PARTNER SUMMARY TABLE    //
        /////////////////////////////////////////////////////////

        //  1   -    Query the Partner table (within a selected capability) for creating Header Rows
        //      -    Use Output Statistics below to create unique list of partners with count.
        //      -    Loop through results to create headers for chart.  
        //      -    Append a final header with the name "unassigned resources" for resources without partners
        //      -    Use the partner Name in this Array to populate resources in the chart in step 5
        //

        //  2        Query the Partner Table (within a selected capability) for unique list of ResourceFK
        //           Use Output Statistics to get a a unique list of ResourceFK from Partner table with single Capability  
        //           CapabilityFK='afdac202-d667-4b95-8171-b4be7ac193c2' 
        // 

        //  3   -    Query all resources for given capability that have the specified Unique resourceFK 
        //      -    Make flattened working table that has a record for every partner and their assoicated resource.
        //      -    Build an array of duplicating resourceId's with partner AND Resource data with nested resource and partner loop 
        //              http://services3.arcgis.com/j2a3SeWN04oskFYa/ArcGIS/rest/services/ResourcePlanning_StClair/FeatureServer/9
        //              CapabilityFK='afdac202-d667-4b95-8171-b4be7ac193c2' AND resourceFK in(asdfsaff,aerqwerw,awerasfs)


        //  4   -    Query the Resource Table to build an array of all unassigned resources 
        //           CapabilityFK='afdac202-d667-4b95-8171-b4be7ac193c2'  AND GlobalIds NOT IN (from Step #2) 
        //      -    Build Array and add to unAssigned Resource Header via loop with clickable buttons


        //  5   -    Loop through names of partners created in step 1  with a nested loop of the 
        //           Flat PartnerResourceList array the checks for the partner name.  When it finds a name the code should
        //           Create a table row underneath the header of that name with clickable update buttons! 

        //  6 -     Create pHeaderRows for attaching sub-tables to.

 
        ////////////////////////////////////////////////////////////////////////////////////
        //  Example of using Output Statistics REST Query
        ////////////////////////////////////////////////////////////////////////////////////
 /*     //  ORDER BY FIELDS:    SummaryCount DESC
        //
        //  GROUP BY FIELDS:    Organization
        //
        //  OUTPUT STATISTICS:
        ////////////////////////////////////////////////////////////////////////////////////
        //
        //      [{
        //          "statisticType": "count",
        //          "onStatisticField": "Organization",
        //          "outStatisticFieldName": "SummaryCount"
        //      }]
        //
        ////////////////////////////////////////////////////////////////////////////////////
        EXAMPLE REST wildcard query
        ////////////////////////////////////////////////////////////////////////////////////
        //      Content like '%#IMOK%'
        //      (CropName = 'SOY') AND (IrrigationName Like '%') OR (IrrigationName Is Null)
        /////////////////////////////////////////////////////////////////////////////////////
*/

/*  USING JSAPI TO DO OUTPUT STATISTICS

    // use new 10.1 query statistic definition to find 
        // the value for the most populous county in New England
        var popQueryTask = new esri.tasks.QueryTask(countiesUrl);
        var popQuery = new esri.tasks.Query();
        var statDef = new esri.tasks.StatisticDefinition();
        statDef.statisticType = "max";
        statDef.onStatisticField = "POP2007";
        statDef.outStatisticFieldName = "maxPop";
        
        popQuery.returnGeometry = false;
        popQuery.where = newEnglandDef;
        popQuery.outFields = outFields;
        popQuery.outStatistics = [ statDef ];
        popQueryTask.execute(popQuery, handlePopQuery);
*/



        // ********************************************************************
        //  JF Pure CSS Table for resources - adding to domID "rTableParent"
        // ********************************************************************
        partnerQuerySetup:function(){

            this.getUniquePartnerList();

             document.getElementById("tableHeaderId").innerHTML='<img style="float:left;padding-top:5px;padding-right:5px;width:40px" src="./widgets/MutualAid/images/partnerButtonBlue.png"><div>' + " Resource Partner Report</div>";

            // resource queries begin in createPHeaders() to insure DOM is ready.
        },

        // ******************************************************************************
        //  1) Get list of unique Partners from Partner Table for specified capability.  
        // ****************************************************************************** 
        //! possible replace with uniqueArrayFunction from basic partner table query      
        getUniquePartnerList:function(){

                var qTable = this.this_config.relates.filter(function(item) { return item.origin === 'Mission_AssistingOrgs'; });
                var qTableUrl = qTable[0].originURL;

                console.log('getUniquePartnerList - task defined');

                var whereQuery = "CapabilityFK='" + this.capID + "'";
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
        //! possible replace with uniqueArrayFunction
        // Calling createPHeaders
        qComplete_UniquePartners: function(results) {
                var uPartnersArr=results.features;// save for layer use
                    if(uPartnersArr.length){// if 
                        this.createPHeaders(true, uPartnersArr); // parter list is passed to createPHeaders to create Partner DOM pHeader Elements first
                        //this.uPartnersArr = uPartnersArr;        // parnter list for this CAP is saved for use in mergeResAndPartners() - difficult to pass directly
                                                                 // multiple successive queries allow enought time for use of query
                        this.getAllPartnersForCapability();

                    }                                            
                    else{
                        this.createPHeaders(false, null);// Create Only Unassigned Header
                    }


                //console.log("Unique Partners: " + results)
                //console.log('queryCapabilities - Task Completed in RES_TableConstructor');
        },


        createPHeaders:function(pExist, pArr){

            // insert a count of records in the header
//            var coreCap = document.getElementById("app_Title").innerHTML
//                document.getElementById("app_Title").innerHTML = this.capName + " (" + pArr.length + " resource partners)";


            //  Clear previous table if it exists 
            var rowsExist = dom.byId("rTableParent");

                while (rowsExist.firstChild) {
                    //alert("There must have been some table rows left in the DOM!")
                    rowsExist.removeChild(rowsExist.firstChild);
                }


                var table="";
                    table += '<div class="pGroupHeader" id="pHeaderNoPartner">';
                    table +=   '<div class="pGroupHeader resColumn1"><div class="icon-warning-yellow"></div></div>';
                    table +=   '<div class="pGroupHeader resColumn2">Unassigned Resources</div>';
                    table += '</div>';

                var rTableNode = domConstruct.toDom(table);
                    domConstruct.place(rTableNode, dom.byId('rTableParent'), 'last');


            if(pExist){
                var pArr=pArr;

                array.forEach(pArr, lang.hitch(this, function(item, i){

                    //  Insert Column Headers as the first row
                    //  CSS assigns first-child properties to bold field names etc.
                    var table="";
                        table += '<div class="pGroupHeader" id="pHeaderId-' + i + '">';

                        //table +=   '<div class="pGroupHeader resColumn1"><div class="icon-users"></div></div>';

                        table +=   '<div class="pGroupHeader resColumn2" id="pName-' + item.attributes.Organization + '">' + item.attributes.Organization + '</div>';
                            //rTable +=   '<div class="resColumn5"></div>';


                        table += '</div>';

                    var rTableNode = domConstruct.toDom(table);
                        domConstruct.place(rTableNode, dom.byId('rTableParent'), 'last');
                }))


            }


        },



        // Need to loop through each unique organization name and get globalID for Partner list
        getAllPartnersForCapability: function(){


                var qTable = this.this_config.relates.filter(function(item) { return item.origin === 'Mission_AssistingOrgs'; });
                var qTableUrl = qTable[0].originURL;
 
                console.log('queryCapabilitiesLayer - task defined');
                var whereQuery = "CapabilityFK='" + this.capID + "'";
                var query = new esri.tasks.Query();
                var queryTask = new QueryTask(qTableUrl);
                query.outFields = ['*'];
                query.where = whereQuery;
                query.returnGeometry = false;
                queryTask.execute(query).then(lang.hitch(this, this.qCompleted_AllPartners));
           

        },

        qCompleted_AllPartners: function(results){

           // create Array for layer use
           this.allPartners=[];
           this.pReportArr=[];
           this.allPartners=results.features;

            array.forEach(this.allPartners, lang.hitch(this, function(pItem, i){

                array.forEach(this.capResourceArray, lang.hitch(this, function(resItem, i){

                    if(pItem.attributes.ResourceFK==resItem.GlobalID){


                        this.pReportArr.push({
                            CapID: pItem.attributes.CapabilityFK,
                            POID:  pItem.attributes.OBJECTID,
                            PGID:  pItem.attributes.GlobalID, 
                            POrg:  pItem.attributes.Organization,
                            PNmbCommitted: pItem.attributes.NmbCommited,
                            PAgreement: pItem.attributes.Agreement,
                            PType: pItem.attributes.JurisdictionType, 
                            PResFK: pItem.attributes.ResourceFK, 
                            RName: resItem.Name,
                            RCategory: resItem.Category,
                            RID: resItem.ResourceID,
                            RNmbNeeded: resItem.NmbNeeded,
                            RBalance: resItem.Balance, // 
                            RCountNmbCommitted: resItem.NmbCommitted, 
                            RNmbResPartners: resItem.NmbResPartners, 
                            RType: resItem.Type,
                            RGlobalID: resItem.GlobalID,
                            ROID: resItem.ObjectID
                        });


                    }
                }));

            }));

            this.pReportToDOM(this.pReportArr)

            console.log(this.pReportArr);
        },


        // Create the Partner Report Table
        pReportToDOM:function(pReportArr){


            this.ccEditResNodes = [];
            this.ccResTypeNodes = [];
            this.ccResPartnerNodes = [];
            var _i;
            var clickedFrom = "partnerSummary" // used to know which table to refresh at countPartnerResources();

            // Loop through only records that have work left to do
            var todoCapResArr= this.capResourceArray.filter(function(item) { return item.Balance <0 || item.NmbCommitted==0; });

                array.forEach(todoCapResArr, lang.hitch(this, function(resItem, i){

                    var pTable="";
                        pTable += '<div class="row">';
                        pTable +=   '<div class="resColumn35"></div>';
                        pTable +=   '<div class="resColumn135">' + resItem.NmbCommitted + ' of ' + resItem.NmbNeeded + ' Committed </div>'; //(' + resItem.NmbCommitted +')                                     
                        pTable +=   '<div class="resColumn2">' + resItem.Name + '-' + resItem.Type + '</div>';
                       // pTable +=   '<div class="resColumn5" id="rEditIdx-' + i + '" resGlobalKey="'+ resItem.GlobalID +'">' + '<div class="icon-pencil" id="iconPencilId"></div>' + '</div>';
                        //rTable +=   '<div class="resColumn4" id="rCount-' + resItem.attributes.ObjectID + '">' + resItem.attributes.NmbCommitted  +' </div>';
                        pTable +=   '<div class="resColumn6" id="rTypeDef-' + i + '">' + '<div class="icon-books"></div>' + '</div>';
                       // pTable +=   '<div class="resColumn7" id="rPartner-' + i + '">' + '<div class="icon-users" id="iconUsersId"></div>' + '</div>';
                        pTable += '</div>';


                        var clickEdit = "rEditIdx-" + i;
                        var clickType = "rTypeDef-" + i;
                        var clickPartner = "rPartner-" + i;


                        var pTableNode = domConstruct.toDom(pTable);
                            domConstruct.place(pTableNode, dom.byId('pHeaderNoPartner'), 'last');

                        //var clickNode1 = dom.byId(clickEdit);
                        //    this.ccEditResNodes.push(clickNode1);                      
                        //    this._ccEvent_EditRes(i, resItem.Name, resItem.ObjectID, resItem.GlobalID, clickedFrom);

                        var clickNode2 = dom.byId(clickType);
                            this.ccResTypeNodes.push(clickNode2);
                            this._ccEventResTypeInfo(this.capIdx, i);

                        //var clickNode3 = dom.byId(clickPartner);
                        //    this.ccResPartnerNodes.push(clickNode3);
                        //    this._ccEventResPartner(i, resItem.Name, resItem.Type, resItem.ObjectID, resItem.GlobalID, clickedFrom);


                    _i=i;// continnue the index value to the next loop

                }));

            // Loop through Partners
            array.forEach(pReportArr, lang.hitch(this, function(pItem, z){

                _i=_i+1 

                    var pTable="";
                        pTable += '<div class="row">';
                        pTable +=   '<div class="resColumn35"></div>';
                        pTable +=   '<div class="resColumn135">' + pItem.PNmbCommitted +' Committed</div>';
                        pTable +=   '<div class="resColumn2">' + pItem.RName + '-' + pItem.RType + '</div>';
                    //    pTable +=   '<div class="resColumn5" id="rEditIdx-' + _i + '" resglobalKey="'+ pItem.RGlobalID +'">' + '<div class="icon-pencil" id="iconPencilId"></div>' + '</div>';
                        pTable +=   '<div class="resColumn6" id="rTypeDef-' + _i + '">' + '<div class="icon-books"></div>' + '</div>';
                    //    pTable +=   '<div class="resColumn7" id="rPartner-' + _i + '">' + '<div class="icon-users" id="iconUsersId"></div>' + '</div>';
                        pTable += '</div>';

                    var clickEdit = "rEditIdx-" + _i;
                    var clickType = "rTypeDef-" + _i;
                    var clickPartner = "rPartner-" + _i;

                    // reuse click events by continning index value where the top table left off. 
                    //  This will change with every refresh.

                    var pElem = "pName-"+ pItem.POrg
                    var pTableNode = domConstruct.toDom(pTable);
                        domConstruct.place(pTableNode, dom.byId(pElem), 'after');

                   // var clickNode1 = dom.byId(clickEdit);
                   //     this.ccEditResNodes.push(clickNode1);                      
                   //     this._ccEvent_EditRes(_i, pItem.RName, pItem.ROID, pItem.RGlobalID, clickedFrom);

                    var clickNode2 = dom.byId(clickType);
                        this.ccResTypeNodes.push(clickNode2);
                        this._ccEventResTypeInfo(this.capIdx, _i);
 

                  //  var clickNode3 = dom.byId(clickPartner);
                  //      this.ccResPartnerNodes.push(clickNode3);
                  //      this._ccEventResPartnerDirect(_i, pItem.RName, pItem.POrg, pItem.PGID, clickedFrom);

            }))
        }

        // ********************************************************************************************
        //  2) Get list of unique resource IDs (resourceFK) from partner table for specified Capability  
        // ******************************************************************************************** 

/*
        getUniqueResourceFKsFromPartners:function(){

                var qTable = this.this_config.relates.filter(function(item) { return item.origin === 'Mission_AssistingOrgs'; });
                var qTableUrl = qTable[0].originURL;

                console.log('Function: getUniqueResourceFKsFromPartners - define Query');

                var whereQuery = "CapabilityFK='" + this.capID + "'";
                var query = new esri.tasks.Query();

                // Set statistic to create unique list of Partners for a capability
                var statDef = new esri.tasks.StatisticDefinition();
                    statDef.statisticType = "count";
                    statDef.onStatisticField = "ResourceFK";
                    statDef.outStatisticFieldName = "SummaryCount";

                // Define query to group by Organization and sort in decending order 
                var queryTask = new QueryTask(qTableUrl);
                    //query.outFields = ['SummaryCount','Organization'];
                    query.where = whereQuery;
                    query.groupByFieldsForStatistics = ["ResourceFK"];
                    query.outStatistics = [ statDef ];
                    query.returnGeometry = false;
                    query.orderBy = "SummaryCount DESC";
                    queryTask.execute(query).then(lang.hitch(this, this.qComplete_allResourceFKsFromPTable));
        },

        qComplete_allResourceFKsFromPTable:function(results){

                var resArr= results.features;
                var idStr="";

                array.forEach(resArr, lang.hitch(this, function(item, i){

                    idStr= idStr + "'"+item.attributes.ResourceFK + "',";// spelling error in data model

                })) // end array

 
                idStr = idStr.substring(0, idStr.length - 1)
                //console.log("Unique ResFK: " + idStr)

                // This below logic does not show resources that have partners but are not assigned.
                // Instead, it shows only resources with 0 partners.
                // It seems more useful to have all remaining unassigned resources in a list.
                // For this reason the below code is beautiful, it is commented out

                // this.getResourcesWithNoProvidingPartners(idStr)  // <----- Not used, but functions below are saved

                this.getResourcesForPartners_assignedToSelectedCapability(idStr);
               

                 this.partnerToDoList();
        },

        getResourcesForPartners_assignedToSelectedCapability:function(resIds){

                var qTable = this.this_config.relates.filter(function(item) { return item.origin === 'Capability_Resources'; });
                var qTableUrl = qTable[0].originURL;

                console.log('Function: getListOfUnassignedResource - define query');
                 var whereQuery = "CapabilityFK='" + this.capID + "' AND GlobalID IN(" + resIds + ")";
                var query = new esri.tasks.Query();


                // Define query to group by Organization and sort in decending order 
                var queryTask = new QueryTask(qTableUrl);
                    query.outFields = ['*'];
                    query.where = whereQuery;
                    query.returnGeometry = false;
                    query.orderBy = "ResourceName";
                    queryTask.execute(query).then(lang.hitch(this, this.qComplete_ResForSpecifiedPartners));
        },



        // Loop through results
        qComplete_ResForSpecifiedPartners:function(results){

            //this.ccEditResNodes = [];
            //this.ccResTypeNodes = [];
            //this.ccResPartnerNodes = [];

                // *************************************************************
                // Loop through each resource and create an additional row
                // Insert icons into specified columns using Column specific CSS
                // *************************************************************   
                  var pArray=this.uPartnersArr;            
                array.forEach(results.features, lang.hitch(this, function(resItem, i){

                    var resGID=resItem.GlobalID


                    array.forEach(this.uPartnersArr, lang.hitch(this, function(pItem, i){

                        if(pItem.resourceFK==resGID){

                            console.log("NEW Partner Report " + pItem.Organization + " - " + resItem.attributes.ResourceName + resItem.attributes.R); 
                        }

                    }))


             

                }));
            


        },

        // ***************************************************************************
        // Compare Resource Array for partners that are part of selected capability
        //
        mergeResAndPartners: function(Arr){

             console.log("This is where the partner merge takes place")

        },


        partnerToDoList:function (){

            this.ccEditResNodes = [];
            this.ccResTypeNodes = [];
            this.ccResPartnerNodes = [];

            var todoCapResArr= this.capResourceArray.filter(function(item) { return item.Balance <0 || item.NmbCommitted==0; });

                    array.forEach(todoCapResArr, lang.hitch(this, function(resItem, i){

                    var pTable="";
                        pTable += '<div class="row">';
                        pTable +=   '<div class="resColumn35"></div>';
                        pTable +=   '<div class="resColumn135">' + resItem.NmbCommitted + ' of ' + resItem.NmbNeeded + ' Required </div>'; //(' + resItem.NmbCommitted +')                                     
                        pTable +=   '<div class="resColumn2">' + resItem.Name + '-' + resItem.Type + '</div>';
                        pTable +=   '<div class="resColumn5" id="rEditIdx-' + i + '" resGlobalKey="'+ resItem.GlobalID +'">' + '<div class="icon-pencil" id="iconPencilId"></div>' + '</div>';
                        //rTable +=   '<div class="resColumn4" id="rCount-' + resItem.attributes.ObjectID + '">' + resItem.attributes.NmbCommitted  +' </div>';
                        pTable +=   '<div class="resColumn6" id="rTypeDef-' + i + '">' + '<div class="icon-books"></div>' + '</div>';
                        pTable +=   '<div class="resColumn3" id="rPartner-' + i + '">' + '<div class="icon-users" id="iconUsersId"></div>' + '</div>';
                        pTable += '</div>';



                        var clickEdit = "rEditIdx-" + i;
                        var clickType = "rTypeDef-" + i;
                        var clickPartner = "rPartner-" + i;


                        var pTableNode = domConstruct.toDom(pTable);
                            domConstruct.place(pTableNode, dom.byId('pHeaderNoPartner'), 'last');

                        var clickNode1 = dom.byId(clickEdit);
                            this.ccEditResNodes.push(clickNode1);                      
                            this._ccEvent_EditRes(i, resItem.Name, resItem.ObjectID, resItem.GlobalID);

                        var clickNode2 = dom.byId(clickType);
                            this.ccResTypeNodes.push(clickNode2);
                            this._ccEventResTypeInfo(this.capIdx, i);

                        var clickNode3 = dom.byId(clickPartner);
                            this.ccResPartnerNodes.push(clickNode3);
                            this._ccEventResPartner(i, resItem.Name, resItem.Type, resItem.ObjectID, resItem.GlobalID);

                    }));


        }
*/
        // *************************************************************************
        //  CURRENTLY NOT IN USE!
        //
        // The below logic show only those resource items with 0 partners.
        //
        // It seems more useful to have all remaining unassigned resources in a list.
        // For this reason the below code, though beautiful, it is commented out ):
        // *************************************************************************
        //  3) Get list of "unassigned" resources that do not have a partner listed  
        //  
        //  Executes this Query:  
        //
        //  CapabilityFK='59e4a263-896b-4e06-9466-8bd487507820' AND GlobalID NOT IN('3180ae5a-1905-4737-9a5f-364af2519d37','4265f038-5d4e-4c0f-acf7-4804cc207035','b1ce8f3b-9ba4-4ae6-b7f5-95b34099d95d','cc7ca22d-6a71-49ef-b9f1-b7858ee21b4a')
        // *************************************************************************

/*
        getResourcesWithNoProvidingPartners:function(resIds){

                var qTable = this.this_config.relates.filter(function(item) { return item.origin === 'Capability_Resources'; });
                var qTableUrl = qTable[0].originURL;

                console.log('Function: getListOfUnassignedResource - define query');
                 var whereQuery = "CapabilityFK='" + this.capID + "' AND GlobalID NOT IN(" + resIds + ")";
                var query = new esri.tasks.Query();


                // Define query to group by Organization and sort in decending order 
                var queryTask = new QueryTask(qTableUrl);
                    query.outFields = ['*'];
                    query.where = whereQuery;
                    query.returnGeometry = false;
                    query.orderBy = "ResourceName";
                    queryTask.execute(query).then(lang.hitch(this, this.qComplete_ResWithNoPartners));
        },

        qComplete_ResWithNoPartners:function(results){

            this.ccEditResNodes = [];
            this.ccResTypeNodes = [];
            this.ccResPartnerNodes = [];

                // *************************************************************
                // Loop through each resource and create an additional row
                // Insert icons into specified columns using Column specific CSS
                // *************************************************************               
                array.forEach(results.features, lang.hitch(this, function(resItem, i){

                    var pTable="";
                    pTable += '<div class="row">';
                    pTable +=   '<div class="resColumn1"></div>';
                    pTable +=   '<div class="resColumn1">' + resItem.attributes.NbrRequired +' </div>';
                    pTable +=   '<div class="resColumn2">' + resItem.attributes.ResourceName + '-' + resItem.attributes.ResourceType + '</div>';
                    pTable +=   '<div class="resColumn5" id="rEditIdx-' + i + '" resGlobalKey="'+ resItem.GlobalID +'">' + '<div class="icon-pencil" id="iconPencilId"></div>' + '</div>';
  

                    //rTable +=   '<div class="resColumn4" id="rCount-' + resItem.attributes.ObjectID + '">' + resItem.attributes.NmbCommitted  +' </div>';
                    //rTable +=   '<div class="resColumn6" id="rTypeDef-' + i + '">' + '<div class="icon-books"></div>' + '</div>';
                    pTable +=   '<div class="resColumn7" id="rPartner-' + i + '">' + '<div class="icon-users" id="iconUsersId"></div>' + '</div>';
                    pTable += '</div>';

                    var clickEdit = "rEditIdx-" + i;
                    //var clickType = "rTypeDef-" + i;
                    var clickPartner = "rPartner-" + i;


                    var pTableNode = domConstruct.toDom(pTable);
                        domConstruct.place(pTableNode, dom.byId('pHeaderNoPartner'), 'last');

                    var clickNode1 = dom.byId(clickEdit);
                        this.ccEditResNodes.push(clickNode1);                      
                        this._ccEvent_EditRes(this.capIdx, i);

                    //var clickNode2 = dom.byId(clickType);
                    //    this.ccResTypeNodes.push(clickNode2);
                    //    this._ccEventResTypeInfo(this.capIdx, i);

                    var clickNode3 = dom.byId(clickPartner);
                        this.ccResPartnerNodes.push(clickNode3);
                        this._ccEventResPartner(i, resItem.attributes.ResourceName, resItem.attributes.ResourceType, resItem.attributes.OBJECTID, resItem.attributes.GlobalID);


             

                }));
            


        },
*/






    });
});