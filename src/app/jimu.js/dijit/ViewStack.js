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
  'dijit/_WidgetBase'
],

function(declare, lang, html, _WidgetBase) {
  return declare(_WidgetBase, {
    // summary: 
    //    a dijit which can hold many views but display only one at on time
    // description:
    //    the constructor params is {views: []}, every view should have a property: label.
    //    View can be a dijit or dom
    baseClass: 'jimu-viewstack',

    postCreate: function() {
      this.inherited(arguments);
      if(!this.views){
        this.views = [];
      }
      this.views.forEach((function(view){
        if(this.viewType === 'dom'){
          html.place(view, this.domNode);
          html.addClass(view, 'view');
        }else{
          html.place(view.domNode, this.domNode);
          html.addClass(view.domNode, 'view');
        }
      }).bind(this));
    },

    startup: function() {
      this.inherited(arguments);
      if(this.views.length > 0){
        this.switchView(0);
      }
    },

    getViewByLabel: function(label){
      for(var i = 0; i < this.views.length; i++){
        if(label === this.views[i].label){
          return this.views[i];
        }
      }
      return null;
    },

    addView: function(view){
      this.views.push(view);
      if(this.viewType === 'dom'){
        html.place(view, this.domNode);
        html.addClass(view, 'view');
      }else{
        html.place(view.domNode, this.domNode);
        html.addClass(view.domNode, 'view');
      }
    },

    switchView: function(v){
      var view, dom;
      if(typeof v === 'number'){
        view = this.views[v];
      }else if(typeof v === 'string'){
        view = this.getViewByLabel(v);
      }else{
        view = v;
      }
      this.views.forEach((function(_v){
        if(this.viewType === 'dom'){
          dom = _v;
        }else{
          dom = _v.domNode;
        }
        if(_v === view){
          if(this.viewType === 'dijit' && !_v._started){
            _v.startup();
          }
          html.setStyle(dom, 'display', 'block');
        }else{
          html.setStyle(dom, 'display', 'none');
        }
      }).bind(this));
      this.onViewSwitch(view);
    },

    onViewSwitch: function(){}
  });
});