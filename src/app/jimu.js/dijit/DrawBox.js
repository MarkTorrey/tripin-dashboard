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
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/DrawBox.html',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/query',
  'esri/layers/GraphicsLayer',
  'esri/graphic',
  'esri/toolbars/draw',
  'esri/symbols/jsonUtils',
  'dojo/i18n!../nls/main'
],
function(declare, _WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin, template, lang, html, array, on, query,
  GraphicsLayer,Graphic,Draw,jsonUtils,mainNls) {
  return declare([_WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin], {
    templateString:template,
    baseClass: 'jimu-draw-box',
    nls:null,
    types:null,//['point','polyline','polygon','text']
    pointSymbol:null,
    lineSymbol:null,
    polygonSymbol:null,
    textSymbol:null,
    map:null,
    drawLayer:null,
    drawToolBar:null,
    showClear:false,

    postMixInProperties:function(){
      this.nls = mainNls.drawBox;
    },

    postCreate:function(){
      this.inherited(arguments);
      this.drawLayer = new GraphicsLayer();
      this._initDefaultSymbols();
      this._initTypes();
      var items = query('.draw-item',this.domNode);
      this.own(items.on('click',lang.hitch(this,this._onItemClick)));
      this.own(on(this.btnClear,'click',lang.hitch(this,this.clear)));
      if(this.map){
        this.setMap(this.map);
      }
      var display = this.showClear === true ? 'block' : 'none';
      html.setStyle(this.btnClear,'display',display);
    },

    setMap:function(map){
      if(map){
        this.map = map;
        this.map.addLayer(this.drawLayer);
        this.drawToolBar = new Draw(this.map);
        this.drawToolBar.setMarkerSymbol(this.pointSymbol);
        this.drawToolBar.setLineSymbol(this.lineSymbol);
        this.drawToolBar.setFillSymbol(this.polygonSymbol);
        this.own(on(this.drawToolBar,'draw-end',lang.hitch(this,this._onDrawEnd)));
      }
    },

    setPointSymbol:function(symbol){
      this.pointSymbol = symbol;
      this.drawToolBar.setMarkerSymbol(this.pointSymbol);
    },

    setLineSymbol:function(symbol){
      this.lineSymbol = symbol;
      this.drawToolBar.setLineSymbol(symbol);
    },

    setPolygonSymbol:function(symbol){
      this.polygonSymbol = symbol;
      this.drawToolBar.setFillSymbol(symbol);
    },

    setTextSymbol:function(symbol){
      this.textSymbol = symbol;
    },

    clear:function(){
      this.drawLayer.clear();
      this.onClear();
    },

    deactivate:function(){
      if(this.drawToolBar){
        this.drawToolBar.deactivate();
      }
    },

    onIconSelected:function(target,geotype,commontype){},

    onDrawEnd:function(geometry,geotype,commontype){},

    onClear:function(){},

    addGraphic:function(g){
      this.drawLayer.add(g);
    },

    removeGraphic:function(g){
      this.drawLayer.removeGraphic(g);
    },

    _initDefaultSymbols:function(){
      var pointSys = {"style":"esriSMSCircle","color":[0,0,128,128],"name":"Circle","outline":{"color":[0,0,128,255],"width":1},"type":"esriSMS","size":18};
      var lineSys = {"style":"esriSLSSolid","color":[79,129,189,255],"width":3,"name":"Blue 1","type":"esriSLS"};
      var polygonSys = {"style":"esriSFSSolid","color":[79,129,189,128],"type":"esriSFS","outline":{"style":"esriSLSSolid","color":[54,93,141,255],"width":1.5,"type":"esriSLS"}};
      if(!this.pointSymbol){
        this.pointSymbol = jsonUtils.fromJson(pointSys);
      }
      if(!this.lineSymbol){
        this.lineSymbol = jsonUtils.fromJson(lineSys);
      }
      if(!this.polygonSymbol){
        this.polygonSymbol = jsonUtils.fromJson(polygonSys);
      }
    },

    _initTypes:function(){
      if(!(this.types instanceof Array)){
        this.types = ['point','polyline','polygon'];
      }
      var items = query('.draw-item',this.domNode);
      items.style('display','none');
      array.forEach(items,lang.hitch(this,function(item){
        var commonType = item.getAttribute('data-commontype');
        var display = array.indexOf(this.types,commonType) >= 0 ? 'block' : 'none';
        html.setStyle(item,'display',display);
      }));
    },

    _onItemClick:function(event){
      var target = event.target||event.srcElement;
      var items = query('.draw-item',this.domNode);
      items.removeClass('selected');
      html.addClass(target,'selected');
      var geotype = target.getAttribute('data-geotype');
      var commontype = target.getAttribute('data-commontype');
      var tool = Draw[geotype];
      this.drawToolBar.activate(tool);
      this.onIconSelected(target,geotype,commontype);
    },

    _onDrawEnd:function(event){
      this.drawToolBar.deactivate();
      var geometry = event.geometry;
      var type = geometry.type;
      var symbol = null;
      if (type === "point" || type === "multipoint") {
        if(html.hasClass(this.textIcon,'selected')){
          symbol = this.textSymbol;
        }
        else{
          symbol = this.pointSymbol;
        }
      } else if (type === "line" || type === "polyline") {
        symbol = this.lineSymbol;
      } else {
        symbol = this.polygonSymbol;
      }
      var g = new Graphic(geometry,symbol,null,null);
      this.drawLayer.add(g);
      var selectedItem = query('.draw-item.selected',this.domNode)[0];
      var geotype = selectedItem.getAttribute('data-geotype');
      var commontype = selectedItem.getAttribute('data-commontype');
      query('.draw-item',this.domNode).removeClass('selected');
      this.onDrawEnd(g,geotype,commontype);
    },

    destroy:function(){
      if(this.map && this.drawLayer){
        this.map.removeLayer(this.drawLayer);
      }
      this.inherited(arguments);
    }

  });
});