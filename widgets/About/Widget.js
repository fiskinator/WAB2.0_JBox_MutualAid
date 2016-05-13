///////////////////////////////////////////////////////////////////////////
// NISC About Widget
// Copyright © 2016 National Information Sharing Consortium. All Rights Reserved.
// This is an updated version of the About Widget by ESRI (retained Copyright below)
// It was adapted to dynamically update the web map information to work with the vUSA Widget
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

define(['dojo/_base/declare',
    'dojo/_base/html',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-class"
  ],
  function(declare, html, query, _WidgetsInTemplateMixin, BaseWidget, dom, domConstruct, domClass) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-about',
      // clasName: 'esri.widgets.About',

      _hasContent: null,

      postCreate: function() {
        this.inherited(arguments);

        this._hasContent = this.config.about && this.config.about.aboutContent;

        
      },

      startup: function() {
        this.inherited(arguments);
        this.resize();
        

  
      },

      resize: function() {
        this._resizeContentImg();
      },
      
      _resizeContentImg: function() {
   
        var customBox = html.getContentBox(this.customContentNode);

        if (this._hasContent) {
          html.empty(this.customContentNode);

          var aboutContent = html.toDom(this.config.about.aboutContent);





                 //  dom.byId("thumbImgSrc").src= this.config.sharinghost + "/sharing/rest/content/items/" + this.item.id + "/info/" + this.item.thumbnail;
  
          // DocumentFragment or single node
          // if (aboutContent.nodeType &&
          //   (aboutContent.nodeType === 11 || aboutContent.nodeType === 1)) {
          //   var contentImgs = query('img', aboutContent);
          //   if (contentImgs && contentImgs.length) {
          //     contentImgs.style({
          //       maxWidth: (customBox.w - 20) + 'px' // prevent x scroll
          //     });
          //   } else if (aboutContent.nodeName.toUpperCase() === 'IMG') {
          //     html.setStyle(aboutContent, 'maxWidth', (customBox.w - 20) + 'px');
          //   } 
             
          // }
          
          html.place(aboutContent, this.customContentNode);
          
          ///////////////////////////////////
          //JF Insert currentWebmap Thumbail
          ///////////////////////////////////
          var calcThumbnail=this.appConfig.portalUrl + "/sharing/rest/content/items/" + this.map.itemInfo.item.id + "/info/"+ this.map.itemInfo.item.thumbnail;
          var aboutThumb = document.getElementById("about_thumbnail")
              aboutThumb.src=calcThumbnail;

          //console.log(this.appConfig.portalUrl + "/sharing/rest/content/items/" + this.map.itemInfo.item.id + "/info/"+ this.map.itemInfo.item.thumbnail);
          
          //console.log(this.map.itemInfo + "Map-ItemInfo");
          
          var titleDivider = domConstruct.create('div', {
                            innerHTML: '',
                            className: "map-divider"
                        });
          domConstruct.place(titleDivider, this.customContentNode, 'last');
          
          var titleText = domConstruct.create('div', {
                            innerHTML: this.map.itemInfo.item.title,
                            className: "map-title"
                        });
          domConstruct.place(titleText, this.customContentNode, 'last');
          console.log(this.map.itemInfo.item);
          
         var ownerText = domConstruct.create('div', {
                            innerHTML: 'Map Shared by: ' + this.map.itemInfo.item.owner,
                            className: "map-owner"
                        });
       
                        

          

          
          var summaryText = domConstruct.create('div', {
                            innerHTML: this.map.itemInfo.item.description,
                            className: "map-summary"
                        });
          domConstruct.place(summaryText, this.customContentNode, 'last');
          
          var licenseText = domConstruct.create('div', {
                            innerHTML: 'License Info: ' + this.map.itemInfo.item.licenseInfo,
                            className: "map-summary"
                        });
          domConstruct.place(licenseText, this.customContentNode, 'last');
        }
        
          var displayDate = new Date(this.map.itemInfo.item.modified);     
        
                   
          var modifiedText = domConstruct.create('div', {
                            innerHTML: 'Modified: ' + displayDate,
                            className: "map-owner"
                        });
                        
          domConstruct.place(modifiedText, this.customContentNode, 'last');
        
          var linkText = domConstruct.create('div', {
                            innerHTML: '<a target="_blank" href="' + this.appConfig.portalUrl + "/home/item.html?id=" + this.map.itemInfo.item.id + '">More information about this map</a>',
                            className: "map-link"
                        });
          domConstruct.place(linkText, this.customContentNode, 'last');
          
        
      }
    });
    return clazz;
  });