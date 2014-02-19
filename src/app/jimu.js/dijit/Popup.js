///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2013 Esri. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
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
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/fx',
  'dojo/on',
  'dijit/_WidgetBase'
],
function(declare, lang, html, baseFx, on, _WidgetBase) {
  /* global jimuConfig */
  return declare(_WidgetBase, {
    //summary:
    //  show a popup window

    'class': 'jimu-popup',

    //titleLabel: String
    //  the popup window title. if this property is empty, no title display
    titleLabel: '',

    //content: DOM|Dijit|String
    content: null,

    //container: String|DOM
    //  this popup parent dom node
    container: jimuConfig.layoutId,

    //buttons: Object[]
    //  this is the object format
    /*=====
      //label: String
      label: '',
      //onClick: function
      onClick: null, if this function return false, the popup will not close, or the popup will close after button click.
    =====*/
    buttons: [],

    //onClose: function
    //  callback function when click the close button. If this function return false, the popup will not close
    onClose: null,

    width: 800,
    height: 600,

    constructor: function(){
      this.buttons = [];
    },

    postCreate: function(){
      if(this.titleLabel){
        this.titleNode = html.create('div', {
          'class': 'title'
        }, this.domNode);
        this.titleLabeNode = html.create('div', {
          'class': 'title-label',
          innerHTML: this.titleLabel
        }, this.titleNode);
        this.closeBtnNode = html.create('div', {
          'class': 'close-btn'
        }, this.titleNode);
        this.own(on(this.closeBtnNode, 'click', lang.hitch(this, this.close)));
      }

      this.contentContainerNode = html.create('div', {
        'class': 'content'
      }, this.domNode);

      if(this.content){
        if(typeof this.content === 'string'){
          this.contentContainerNode.innerHTML = this.content;
        }else if(this.content.domNode){
          this.content.placeAt(this.contentContainerNode);
          this.content.popup = this;
        }else{
          html.place(this.content, this.contentContainerNode);
        }
      }

      html.create('div', {
        'class': 'line'
      }, this.domNode);

      this.buttonContainer = html.create('div', {
        'class': 'button-container'
      }, this.domNode);

      if(this.buttons.length === 0){
        this.buttons.push({
          label: 'Ok',
          onClick: lang.hitch(this, this.close)
        });
      }
      for(var i = this.buttons.length - 1; i > -1; i --){
        this._createButton(this.buttons[i]);
      }

      //position the popup
      var box = html.getContentBox(this.container);
      var left = (box.w - this.width) / 2;
      var top = (box.h - this.height) / 2;
      html.setStyle(this.domNode, {
        left: left + 'px',
        top: top + 'px',
        width: this.width + 'px',
        height: this.height + 'px'
      });
      html.place(this.domNode, this.container);

      html.setStyle(this.contentContainerNode, {
        height: (this.height - 75 - 40 - 40) + 'px'
      });

      this.overlayNode = html.create('div', {
        'class': 'popup-overlay'
      }, this.container);

      baseFx.animateProperty({
        node: this.domNode,
        properties: {opacity: 1},
        duration: 200
      }).play();
    },

    close: function(){
      if(this.onClose && this.onClose() === false){
        return;
      }
      baseFx.animateProperty({
        node: this.domNode,
        properties: {opacity: 0},
        duration: 200,
        onEnd: lang.hitch(this, function(){
          html.destroy(this.overlayNode);
          this.destroy();
        })
      }).play();
    },

    addButton: function(btn){
      this._createButton(btn);
    },

    _createButton: function(button){
      var node = html.create('div', {
        'class': 'jimu-btn',
        innerHTML: button.label
      }, this.buttonContainer);
      this.own(
        on(node, 'click', lang.hitch(this, function(evt){
          //we don't close popup because that maybe the
          //listener function is async
          if(button.onClick){
            button.onClick(evt);
          }else{
            this.close();
          }
        }))
      );
    }

  });
});