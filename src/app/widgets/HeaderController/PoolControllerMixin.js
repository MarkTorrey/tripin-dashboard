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
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/topic',
  'dojo/aspect',
  'dojo/Deferred',
  'jimu/WidgetManager',
  'jimu/PanelManager',
  'jimu/utils'
], function(declare, lang, array, html, topic, aspect, Deferred, WidgetManager, PanelManager, utils){
  /* global jimuConfig */
  var clazz = declare(null, {
    // summary:
    //    this mixin process the widgets in the widget pool.
    // description:
    //    the widget should have a config object, which has two properties: groups, widgets.
    //    Both of them are optional.
    //groups: String[]|String
    //    If array, is array of gropus label. If String, "all" means read all of the groups.
    //    If not set, do not read any group.
    //widgets: String[]|String
    //    If array, is array of widgets label. If String, "all" means read all of the widgets.
    //    If not set, do not read any widget.

    constructor: function(){
      this.widgetManager = WidgetManager.getInstance();
      this.panelManager = PanelManager.getInstance();
      this.isController = true;
    },

    getAllConfigs: function(){
      var ret = [];
      ret = ret.concat(this.getWidgetConfigs(), this.getGroupConfigs());
      return ret.sort(function(a, b){
        return a.index - b.index;
      });
    },

    widgetIsControlled: function(appConfig, widgetId){
      var ret = false;
      appConfig.visitElement(function(e, i, gid, isPreload){
        if(!isPreload && e.id === widgetId){
          ret = true;
        }
      });
      return ret;
    },

    getGroupConfigs: function(){
      var ret = [];
      if(!this.appConfig.widgetPool){
        return ret;
      }
      if(this.appConfig.widgetPool.groups){
        array.forEach(this.appConfig.widgetPool.groups, function(g){
          if(this.config.groups){
            if(Array.isArray(this.config.groups)){
              if(this.config.groups.indexOf(g.label) > -1){
                ret.push(g);
              }
            }else if(this.config.groups === 'all'){
              ret.push(g);
            }
          }
        }, this);
      }
      
      return ret;
    },

    getWidgetConfigs: function(){
      var ret = [];
      if(!this.appConfig.widgetPool){
        return ret;
      }
      if(this.appConfig.widgetPool.widgets){
        array.forEach(this.appConfig.widgetPool.widgets, function(w){
          if(this.config.widgets){
            if(Array.isArray(this.config.widgets)){
              if(this.config.widgets.indexOf(w.label) > -1){
                ret.push(w);
              }
            }else if(this.config.widgets === 'all'){
              ret.push(w);
            }
          }
        }, this);
      }
      
      return ret;
    },

    getConfigByLabel: function(label){
      var config;
      if(!this.appConfig.widgetPool){
        return null;
      }
      array.forEach(this.appConfig.widgetPool.widgets, function(w){
        if(w.label === label){
          config = w;
        }
      });

      array.forEach(this.appConfig.widgetPool.groups, function(g){
        if(g.label === label){
          config = g;
        }else{
          array.forEach(g.widgets, function(w){
            if(w.label === label){
              config = w;
            }
          });
        }
      });
      return config;
    }
  });

  return clazz;
});