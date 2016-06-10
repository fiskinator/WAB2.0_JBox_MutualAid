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
  'dojo/_base/html',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/on',
  'dojo/mouse',
  'dojo/query'
],
function (declare, lang, html, _WidgetBase, _TemplatedMixin, on, mouse, query) {
  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: '<div class="jimu-img-result-node"></div>',
    /**
    *options:
    *img: the img url,
    *label:
    *width/height/marginTop/marginLeft: can be px or %
    **/
    constructor: function(options, dom){
      /*jshint unused: false*/
    },
    postCreate: function () {
    
// JF original Commented out  
//      this.box = html.create('div', {
 //       'class': 'node-box'
  //    }, this.domNode);
      
      this.imgBox = html.create('div', {
        id: "EEI_PanelList",
        'class': 'node-resultImg'
      }, this.domNode);

// used for image
//      html.create('img', {
//        'src': this.img
//      }, this.imgBox);

// used for count and background

      if(this.cellColor==='green'){

        html.create('div', {
        'id':this.layerId + "_count",
        'class': 'countCellGreen',
        'innerHTML':  this.count,
        }, this.imgBox);
      }

      else if (this.cellColor==="yellow"){

        html.create('div', {
        'id':this.layerId + "_count",
        'class': 'countCellYellow',
        'innerHTML':  this.count,
        }, this.imgBox);
      }

      else if (this.cellColor==="red"){

        html.create('div', {
        'id':this.layerId + "_count",
        'class': 'countCellRed',
        'innerHTML':  this.count,
        }, this.imgBox);
      }

      else if (this.cellColor==="grey"){

        html.create('div', {
        'id':this.layerId + "_count",
        'class': 'countCellGrey',
        'innerHTML':  this.count,
        }, this.imgBox);
      }


      if(this.visible==true){

        html.create('div', {
        'id': this.layerId,
        'class': 'node-label-visible',
        'innerHTML': '<p>'+this.label+'</p>',// + '<br>' + this.label2,
        title: this.label}, this.imgBox);

      }
      else if(this.visible==false){

        html.create('div', {
        'id': this.layerId, 
        'class': 'node-label-notvisible',
        'innerHTML': '<p>'+this.label + '</p>',// + '<br>' + this.label2,
        title: this.label}, this.imgBox);

      }

/* moved to visible differentiator

      html.create('div', {
        'class': 'node-label',
        'innerHTML': this.label + '<br>' + this.label2,
        title: this.label

*/

/*  not very good result
      html.create('div', {
        'class': 'node-label-count',
        'innerHTML': '<br>' + this.count,
        title: this.count

      }, this.domNode);
*/

//      this.own(on(this.domNode, 'click', lang.hitch(this, this.onClick)));


    },

    onClick: function(){

      alert("Clicked")

      query('.jimu-img-node', this.getParent().domNode).removeClass('jimu-state-selected');
      query(this.domNode).addClass('jimu-state-selected');
    },

    highLight: function(){
      query('.jimu-img-node', this.getParent().domNode).removeClass('jimu-state-selected');
      query(this.domNode).addClass('jimu-state-selected');
    },

    startup: function(){

    }

  });
});