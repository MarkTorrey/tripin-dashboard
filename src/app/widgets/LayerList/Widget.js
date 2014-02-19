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
    'jimu/BaseWidget',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom',
    'dojo/on',
    'dojo/_base/unload',
    'dojo/aspect',
    'dojo/query',
    'jimu/dijit/Selectionbox',
    './LayerListView',
    './PopupMenu',
    'dojo/dom-style',
    './NlsStrings',
    './LayerInfos'
  ],
  function(BaseWidget, declare, lang, array, domConstruct, domGeometry, dom, on, baseUnload, aspect, query,
    Selectionbox, LayerListView, PopupMenu, domStyle, NlsStrings, LayerInfos) {
    var clazz = declare([BaseWidget], {
      //these two properties is defined in the BaseWiget 
      baseClass: 'jimu-widget-layerList',
      name: 'layerList',

      //layerListView: Object{}
      //  A module is responsible for show layers list
      layerListView: null,

      //operLayerInfos: Object{}
      //  operational layer infos
      operLayerInfos: null,

      startup: function() {
        NlsStrings.value = this.nls;
        // summary:
        //    this function will be called when widget is started.
        // description:
        //    according to webmap or basemap to create LayerInfos instance and initialize operLayerInfos 
        //    show layers list
        //    bind events of layerList and create popup menu.
        var mapLayers;
        if (this.map.itemId) {
          this.operLayerInfos = new LayerInfos(this.map.itemInfo.itemData.baseMap.baseMapLayers, this.map.itemInfo.itemData.operationalLayers, this.map);
        } else {
          mapLayers = this._obtainMapLayers();
          this.operLayerInfos = new LayerInfos(mapLayers.basemapLayers, mapLayers.operationalLayers, this.map);
        }

        this.showLayers();
        this.bindEvents();

        
        //this._createPopupMenu();
        dom.setSelectable(this.layersSection, false);
      },

      _obtainMapLayers: function() {
        // summary:
        //    obtain basemap layers and operational layers if the map is web map.
        var basemapLayers = [],
          operLayers = [],
          layer;
        array.forEach(this.map.layerIds.concat(this.map.graphicsLayerIds), function(layerId) {
          layer = this.map.getLayer(layerId);
          if (layer.isOperationalLayer) {
            operLayers.push({
              layerObject: layer,
              title: layer.label || layer.title || layer.name || layer.id || " ",
              id: layer.id || " "
            });
          } else {
            basemapLayers.push({
              layerObject: layer,
              id: layer.id || " "
            });
          }
        }, this);
        return {
          basemapLayers: basemapLayers || [],
          operationalLayers: operLayers || []
        };
      },

      showLayers: function() {
        // summary:
        //    create a LayerListView module used to draw layers list in browser.
        var legendTr, legendTd, legendWidgetNode;
        legendTr = domConstruct.create('tr', {
          innerHTML: ""
        }, this.layersList);
        legendTd = domConstruct.create('td', {
          colspan: 5
        }, legendTr);
        legendWidgetNode = domConstruct.create('div', {}, legendTd);
        this.layerListView = new LayerListView({
          operLayerInfos: this.operLayerInfos,
          layersListNode: this.layersList,
          layersList: this,
          config: this.config
        }, legendWidgetNode);
      },

      _createPopupMenu: function() {
        // summary:
        //    popup menu is a dijit used to do some operations of layer
        this.popupMenu = new PopupMenu({
          layersList: this
        });
        domConstruct.place(this.popupMenu.domNode, this.domNode);
      },


      moveUpLayer: function(id) {
        // summary:
        //    move up layer in layer list.
        // description:
        //    call the moveUpLayer method of LayerInfos to change the layer order in map, and update the data in LayerInfos
        //    then, clear layer list in browser and redraw it
        this.operLayerInfos.moveUpLayer(id);
        this._clearLayers();
        this.showLayers();
      },

      moveDownLayer: function(id) {
        // summary:
        //    move down layer in layer list.
        // description:
        //    call the moveDownLayer method of LayerInfos to change the layer order in map, and update the data in LayerInfos
        //    then, clear layer list in browser and redraw it
        this.operLayerInfos.moveDownLayer(id);
        this._clearLayers();
        this.showLayers();
      },

      _clearLayers: function() {
        // summary:
        //    clear layer list 
        domConstruct.empty(this.layersList);
      },

      _createEmptyRow: function() {
        // summary:
        //    the purpose is layer list format 
        var node = domConstruct.create('tr', {
          'class': 'jimu-widget-row-selected'
        }, this.layersList);

        domConstruct.create('td', {
          'class': 'col col-showLegend'
        }, node);
        domConstruct.create('td', {
          'class': 'col-select'
        }, node);

        domConstruct.create('td', {
          'class': 'col-layer-label'
        }, node);
        domConstruct.create('td', {
          'class': 'col col-popupMenu'
        }, node);
      },

      bindEvents: function() {
        // summary:
        //    bind events are listened by this module
        var handleRemove, handelRemoves;
        aspect.after(this.map, "onLayerAddResult", lang.hitch(this, this._onLayersChange));
        handleRemove = aspect.after(this.map, "onLayerRemove", lang.hitch(this, this._onLayersChange));
        //aspect.after(this.map, "onLayerReorder", lang.hitch(this, this._onLayersChange));
        aspect.after(this.map, "onLayersAddResult", lang.hitch(this, this._onLayersChange));
        handleRemoves =  aspect.after(this.map, "onLayersRemoved", lang.hitch(this, this._onLayersChange));
        //aspect.after(this.map, "onLayersReorder", lang.hitch(this, this._onLayersChange));

        baseUnload.addOnUnload(function(){
          handleRemove.remove();
          handleRemoves.remove();
        });
      },

      _onLayersChange: function(evt) {
        // summary:
        //    response to any layer change.
        // description:
        //    udate LayerInfos data, cleare layer list and redraw
        this.operLayerInfos.update();
        this._clearLayers();
        this.showLayers();
      },

    });
    //clazz.hasConfig = false;
    return clazz;
  });
