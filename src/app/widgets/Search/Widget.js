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
    'jimu/dijit/TabContainer',
    'jimu/dijit/List',
    'jimu/utils',
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/layers/GraphicsLayer",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/Polyline",
    "esri/symbols/SimpleLineSymbol",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleFillSymbol",
    "esri/toolbars/draw",
    "esri/InfoTemplate",
    "dijit/ProgressBar",
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',
    "dojo/dom-style",
    "dijit/form/Select",
    "dijit/form/TextBox"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidget,
    TabContainer,
    List,
    utils,
    Query,
    QueryTask,
    GraphicsLayer,
    Graphic,
    Point,
    SimpleMarkerSymbol,
    PictureMarkerSymbol,
    Polyline,
    SimpleLineSymbol,
    Polygon,
    SimpleFillSymbol,
    Draw,
    InfoTemplate,
    ProgressBar,
    lang,
    on,
    dom,
    domStyle) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'Search',
      baseClass: 'jimu-widget-search',
      graphicsLayer: null,
      layerIndex1: 0,
      layerIndex2: 0,
      progressBar: null,
      searchResults: null,
      drawToolbar: null,
      tabContainer: null,
      list: null,
      selectedShapeId: null,

      onChange1: function(newValue) {
        this.layerIndex1 = newValue;
      },

      onChange2: function(newValue) {
        this.layerIndex2 = newValue;
        this.labelSearchName.textContent = this.config.layers[newValue].textsearchlabel;
        this.inputSearchName.set("placeHolder", this.config.layers[newValue].textsearchhint);
      },


      startup: function() {
        this.tabContainer = new TabContainer({
          tabs: [{
            title: this.nls.selectFeatures,
            content: this.tabNode1
          }, {
            title: this.nls.selectByAttribute,
            content: this.tabNode2
          }, {
            title: this.nls.results,
            content: this.tabNode3
          }],
          selected: this.nls.conditions
        }, this.tabSearch);
        this.tabContainer.startup();
        utils.setVerticalCenter(this.tabContainer.domNode);

        var option = [];
        var len = this.config.layers.length;
        for (var i = 0; i < len; i++) {
          option[i] = {};
          option[i].label = this.config.layers[i].name;
          option[i].value = i;
          if (i === 0) {
            option[i].selected = true;
          }
        }

        if (len > 0) {
          this.selectLayer1.addOption(option);
          this.selectLayer2.addOption(option);
          this.labelSearchName.textContent = this.config.layers[0].textsearchlabel;
          this.inputSearchName.set("placeHolder", this.config.layers[0].textsearchhint);
        }
        this.own(on(this.selectLayer1, "change", lang.hitch(this, this.onChange1)));
        this.own(on(this.selectLayer2, "change", lang.hitch(this, this.onChange2)));

        this.graphicsLayer = new GraphicsLayer();
        this.map.addLayer(this.graphicsLayer);

        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        this.progressBar.domNode.style.display = "none";

        this.list = new List({}, this.divResultList);
        this.list.startup();
        this.drawToolbar = new Draw(this.map);
        this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, this.addGraphic)));
        this.own(on(this.searchDrawInfo, "click", lang.hitch(this, this.bindDrawToolbar)));
        this.own(on(this.list, "click", lang.hitch(this, this.selectedResult)));
        this.own(on(this.btnClear, "click", lang.hitch(this, this.clear)));
      },

      onClose: function() {
        if (this.selectedShapeId) {
          domStyle.set(this.selectedShapeId, "background-color", "");
        }
        if (this.drawToolbar) {
          this.drawToolbar.deactivate();
        }
      },

      bindDrawToolbar: function(evt) {
        if (evt.target.id === "searchDrawInfo") {
          return;
        }
        var tool = evt.target.id.toLowerCase();
        this.map.disableMapNavigation();
        this.graphicsLayer.clear();
        this.drawToolbar.activate(tool);
        this.selectedShapeId = dom.byId(evt.target.id);
        domStyle.set(this.selectedShapeId, "background-color", "#C0C0C0");
      },

      addGraphic: function(evt) {
        //deactivate the toolbar and clear existing graphics 
        this.drawToolbar.deactivate();
        this.map.enableMapNavigation();

        // figure out which symbol to use
        var symbol;
        if (evt.geometry.type === "point" || evt.geometry.type === "multipoint") {
          symbol = new SimpleMarkerSymbol();
        } else if (evt.geometry.type === "line" || evt.geometry.type === "polyline") {
          symbol = SimpleLineSymbol();
        } else {
          symbol = SimpleFillSymbol();
        }

        this.graphicsLayer.add(new Graphic(evt.geometry, symbol));
        this.search(null, evt.geometry, this.layerIndex1);
      },

      onSearch: function(evt) {
        this.search(evt, null, this.layerIndex2);
      },

      search: function(evt, geometry, layerIndex) {
        var content;
        var query = new Query();
        this.list.clear();
        this.tabContainer.selectTab(this.nls.results);

        if (geometry) {
          if (this.selectedShapeId) {
            domStyle.set(this.selectedShapeId, "background-color", "");
          }
          query.geometry = geometry;
        } else {
          this.graphicsLayer.clear();
          content = this.inputSearchName.value;
          if (!content || !this.config.layers.length) {
            return;
          }
          var where = this.config.layers[layerIndex].expression;
          where = where.replace('[value]', content);
          query.where = where;
        }

        this.progressBar.domNode.style.display = "";
        this.divResult.style.display = "none";
        var fields = [];
        if (this.config.layers[layerIndex].fields.all) {
          fields[0] = "*";
        } else {
          for (var i = 0, len = this.config.layers[layerIndex].fields.field.length; i < len; i++) {
            fields[i] = this.config.layers[layerIndex].fields.field[i].name;
          }
        }

        var url = this.config.layers[layerIndex].url;
        var queryTask = new QueryTask(url);
        query.returnGeometry = true;
        query.outFields = fields;
        queryTask.execute(query, lang.hitch(this, this.showResults, layerIndex), lang.hitch(this, this.queryError));
      },

      clear: function() {
        if (this.graphicsLayer) {
          this.graphicsLayer.clear();
        }
        this.list.clear();
        this.divResultMessage.textContent = this.nls.noResults;
        return false;
      },

      queryError: function(error) {
        this.progressBar.domNode.style.display = "none";
        this.divResult.style.display = "";
        this.graphicsLayer.clear();
        alert(error);
      },

      showResults: function(layerIndex, results) {
        this.progressBar.domNode.style.display = "none";
        this.divResult.style.display = "";
        this.searchResults = results;
        this.graphicsLayer.clear();

        this.list.clear();
        var
        title = "",
          titlefield = "";
        var len = results.features.length;
        if (len === 0) {
          this.divResultMessage.textContent = this.nls.noResults;
          return;
        } else {
          this.divResultMessage.textContent = this.nls.featuresSelected + results.features.length;
        }
        for (var i = 0; i < len; i++) {
          var featureAttributes = results.features[i].attributes;

          var line = "",
            br = "",
            label = "",
            content = "";
          for (var att in featureAttributes) {
            label = label + line + this.getAlias(att, layerIndex) + ": " + featureAttributes[att];
            line = ", ";
            titlefield = this.config.layers[layerIndex].titlefield;
            if (att.toLowerCase() === titlefield.toLowerCase()) {
              title = featureAttributes[att];
            } else {
              content = content + br + this.getAlias(att, layerIndex) + ": " + featureAttributes[att];
              br = "<br>";
            }
          }
          this.list.add({
            id: "id_" + i,
            label: label,
            title: title,
            content: content
          });
        }
        this.drawResults(results);
      },

      getAlias: function(att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase() && item.alias) {
            return item.alias;
          }
        }
        return att;
      },

      drawResults: function(results) {
        for (var i = 0, len = results.features.length; i < len; i++) {

          var type = results.features[i].geometry.type;
          var json = {};
          var geometry, symbol, graphic, centerpoint;
          json.spatialReference = results.features[i].geometry.spatialReference;
          switch (type) {
            case "multipoint":
            case "point":
              json.x = results.features[i].geometry.x;
              json.y = results.features[i].geometry.y;
              geometry = new Point(json);
              if (this.config.symbols.simplemarkersymbol) {
                symbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
              } else {
                if (this.config.symbols.picturemarkersymbol) {
                  symbol = new PictureMarkerSymbol(this.config.symbols.picturemarkersymbol);
                }
                symbol = new SimpleMarkerSymbol();
              }
              centerpoint = geometry;
              break;
            case "polyline":
              json.paths = results.features[i].geometry.paths;
              geometry = new Polyline(json);
              if (this.config.symbols.simplelinesymbol) {
                symbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
              } else {
                symbol = new SimpleLineSymbol();
              }
              centerpoint = geometry.getPoint(0, 0);
              break;
            case "extent":
            case "polygon":
              json.rings = results.features[i].geometry.rings;
              geometry = new Polygon(json);
              if (this.config.symbols.simplefillsymbol) {
                symbol = new SimpleFillSymbol(this.config.symbols.simplefillsymbol);
              } else {
                symbol = new SimpleFillSymbol();
              }
              centerpoint = geometry.getPoint(0, 0);
              break;
            default:
              break;
          }
          graphic = new Graphic(geometry, symbol);
          this.list.items[i].centerpoint = centerpoint;
          this.list.items[i].graphic = graphic;

          var title = this.list.items[i].title;
          var content = this.list.items[i].content;
          var it = new InfoTemplate(title, title + "<br>" + content);
          graphic.setInfoTemplate(it);
          this.graphicsLayer.add(graphic);
        }
      },

      selectedResult: function(index, item) {
        var point = this.list.items[this.list.selectedIndex].centerpoint;
        this.map.centerAt(point).then(lang.hitch(this, this.showInfoWindow, item));
      },

      showInfoWindow: function(item) {
        this.map.infoWindow.setFeatures([item.graphic]);
        this.map.infoWindow.setTitle(item.title);
        this.map.infoWindow.setContent(item.content);
        if(this.map.infoWindow.reposition){
          this.map.infoWindow.reposition();
        }
        this.map.infoWindow.show(item.centerpoint);
      }


    });
  });
