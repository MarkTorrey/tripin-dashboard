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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'esri/dijit/Legend',
    "esri/arcgis/utils"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidget,
    Legend,
    arcgisUtils) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'Legend',
      baseClass: 'jimu-widget-legend',
      layerInfos: [],
      legend: null,

      startup: function() {
        this.inherited(arguments);
        this.openLegend();
      },

      onOpen: function() {
        this.inherited(arguments);

        this.layerInfos.length = 0;
        if (this.appConfig.map.itemId) {
          this.initLayerInfosWebmap();
        } else {
          this.initLayerInfosConfig();
        }
        this.legend.refresh(this.layerInfos);
      },

      initLayerInfosConfig: function() {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        var title = "";

        for (var i = 0; i < len; i++) {
          var layer1 = this.map.getLayer(ids[i]);
          title = this.getOperationalLayerTitle(layer1.url);
          if (title) {
            this.layerInfos.push({
              layer: layer1,
              title: title
            });
          }
        }
        ids = this.map.layerIds;
        len = ids.length;
        for (var n = 0; n < len; n++) {
          var layer2 = this.map.getLayer(ids[n]);
          title = this.getOperationalLayerTitle(layer2.url);
          if (title) {
            this.layerInfos.push({
              layer: layer2,
              title: title
            });
          }
        }
      },

      initLayerInfosWebmap: function() {
        var infos = arcgisUtils.getLegendLayers({
          itemInfo: this.map.itemInfo,
          map: this.map
        });
        var len = infos.length;
        for (var i = 0; i < len; i++) {
          this.layerInfos.push(infos[i]);
        }
      },

      getOperationalLayerTitle: function(url) {
        if (!this.appConfig.map || !this.appConfig.map.operationallayers) {
          return "";
        }
        if (!url) {
          url = "";
        }
        var len = this.appConfig.map.operationallayers.length;
        for (var i = 0; i < len; i++) {
          if (this.appConfig.map.operationallayers[i].url.toLowerCase() === url.toLowerCase()) {
            return this.appConfig.map.operationallayers[i].label;
          }
        }
        return "";
      },

      openLegend: function() {
        var json = this.config.legend;
        json.map = this.map;
        json.layerInfos = this.layerInfos;
        this.legend = new Legend(json, this.legendDiv);
        this.legend.startup();
      }

    });

    clazz.hasLocale = false;
    return clazz;
  });