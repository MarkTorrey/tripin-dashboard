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
  'dijit/_WidgetBase',
  'dojo/topic',
  'dojo/on',
  'dojo/aspect',
  'dojo/cookie',
  'dojo/Deferred',
  'dojo/promise/all',
  'dojo/_base/fx',
  'dojo/fx',
  './WidgetManager',
  './ConfigManager',
  './PanelManager',
  './MapManager',
  './utils',
  './PreloadWidgetIcon',
  './WidgetPlaceholder'
],

function(declare, lang, array, html, _WidgetBase, topic, on, aspect,
  cookie, Deferred, all, baseFx, fx, WidgetManager, ConfigManager, PanelManager, MapManager, utils,
  PreloadWidgetIcon, WidgetPlaceholder) {
  var instance = null, clazz;

  clazz = declare([_WidgetBase], {
    constructor: function(options, domId) {
      this.widgetManager = WidgetManager.getInstance();
      this.panelManager = PanelManager.getInstance();
      
      topic.subscribe("appConfigLoaded", lang.hitch(this, this.onAppConfigLoaded));
      topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged));

      topic.subscribe("mapLoaded", lang.hitch(this, this.onMapLoaded));
      topic.subscribe("mapChanged", lang.hitch(this, this.onMapChanged));

      topic.subscribe("actionTriggered", lang.hitch(this, this.onActionTriggered));

      //these two arrays store the placeholders, preload widget icons and preload not-in-panel widgets, which is use to
      //relayout the app. 
      this.widgetPlaceholders = [];
      this.preloadWidgetIcons = []; //preload widgets that in panel
      this.preloadNotInPanelWidgets = [];
      this.preloadGroupPanels = [];

      this.poolWidgetPanels = [];
      this.poolGroupPanels = [];
      this.poolNotInPanelsWidgets = [];

      on(window, 'resize', lang.hitch(this, this.resize));

      this.id = domId;
    },

    postCreate: function(){
      this.containerNode = this.domNode;
    },

    map: null,
    mapId: 'map',

    animTime: 500,

    resize: function(){
      //resize widgets. the panel's resize is called by the panel manager.
      //widgets which is in panel is resized by panel
      array.forEach(this.widgetManager.getAllWidgets(), function(w){
        if(w.clazz.inPanel === false){
          w.resize();
        }
      }, this);
    },

    getChildById: function(id){
      for(var i = 0; i < this.getChildren().length; i++){
        if(this.getChildren()[i].id === id){
          return this.getChildren()[i];
        }
      }
      return null;
    },

    onAppConfigLoaded: function(config){
      this.appConfig = lang.clone(config);
      if(this.appConfig.theme){
        this._loadThemeStyle(this.appConfig.theme);
      }
      this._loadMap();
    },

    onAppConfigChanged: function(appConfig, reason, changeData){
      appConfig = lang.clone(appConfig);
      //deal with these reasons only
      switch(reason){
      case 'themeChange':
        this._onThemeChange(appConfig);
        break;
      case 'styleChange':
        this._onStyleChange(appConfig);
        break;
      case 'layoutChange':
        this._onLayoutChange(appConfig);
        break;
      case 'widgetChange':
        this._onWidgetChange(appConfig, changeData);
        break;
      case 'widgetPoolChange':
        this._onWidgetPoolChange(appConfig);
        break;
      case 'resetConfig':
        this._onResetConfig(appConfig);
        break;
      }
      this.appConfig = appConfig;
    },

    loadPoolWidget: function(widgetConfig){
      var def = new Deferred();
      //widgets in pool must be in panel
      this.panelManager.showPanel(widgetConfig).then(lang.hitch(this, function(panel){
        if(!array.some(this.poolWidgetPanels, function(_panel){
          return panel.id === _panel.id;
        })){
          this.poolWidgetPanels.push(panel);
        }
        
        def.resolve(panel);
      }));
      return def;
    },

    loadPoolGroup: function(groupConfig){
      var def = new Deferred();
      //widgets in group must display in panel
      this.panelManager.showPanel(groupConfig).then(lang.hitch(this, function(panel){
        if(!array.some(this.poolGroupPanels, function(_panel){
          return panel.id === _panel.id;
        })){
          this.poolGroupPanels.push(panel);
        }
        
        def.resolve(panel);
      }));
      return def;
    },

    _onWidgetChange: function(appConfig, widgetConfig){
      widgetConfig = appConfig.getConfigElementById(widgetConfig.id);
      array.forEach(this.widgetPlaceholders, function(placeholder){
        if(placeholder.configId === widgetConfig.id){
          placeholder.destroy();
          this._loadPreloadWidget(widgetConfig);
        }
      }, this);
      this._removeDestroyed(this.widgetPlaceholders);

      array.forEach(this.preloadWidgetIcons, function(icon){
        if(icon.configId === widgetConfig.id){
          var state = icon.state;
          icon.destroy();
          this._loadPreloadWidget(widgetConfig).then(function(iconNew){
            if(state === 'opened'){
              iconNew.onClick();
            }
          });
        }
      }, this);
      this._removeDestroyed(this.preloadWidgetIcons);

      array.forEach(this.preloadNotInPanelWidgets, function(widget){
        if(widget.configId === widgetConfig.id){
          widget.destroy();
          this._loadPreloadWidget(widgetConfig);
        }
      }, this);
      this._removeDestroyed(this.preloadNotInPanelWidgets);

      array.forEach(this.preloadGroupPanels, function(panel){
        panel.reloadWidget(widgetConfig);
      }, this);

      this._reloadOneWidgetInPool(appConfig, widgetConfig);

      this._updatePlaceholder(appConfig);
    },

    _updatePlaceholder: function (appConfig) {
      array.forEach(this.widgetPlaceholders, function(placehoder){
        placehoder.setIndex(appConfig.getConfigElementById(placehoder.configId).placeholderIndex);
      }, this);
    },

    _reloadOneWidgetInPool: function(appConfig, widgetConfig){
      array.forEach(this.poolWidgetPanels, function(panel){
        panel.reloadWidget(widgetConfig);
      }, this);

      array.forEach(this.poolNotInPanelsWidgets, function(widget){
        if(widget.id === widgetConfig.id){
          widget.destroy();
          this.loadPoolWidget(widgetConfig);
        }
      }, this);
      this._removeDestroyed(this.poolNotInPanelsWidgets);

      array.forEach(this.poolGroupPanels, function(panel){
        panel.reloadWidget(widgetConfig);
      }, this);
    },

    _reloadWholePool: function(){
      array.forEach(this.poolWidgetPanels, function(panel){
        var config = panel.config;
        this.panelManager.destroyPanel(panel);
        this.loadPoolWidget(config);
      }, this);
      this._removeDestroyed(this.poolWidgetPanels);

      array.forEach(this.poolNotInPanelsWidgets, function(widget){
        widget.destroy();
        this.loadPoolWidget(widget);
      }, this);
      this._removeDestroyed(this.poolNotInPanelsWidgets);

      array.forEach(this.poolGroupPanels, function(panel){
        var config = panel.config;
        this.panelManager.destroyPanel(panel);
        this.loadPoolWidget(config);
      }, this);
      this._removeDestroyed(this.poolGroupPanels);
    },

    _onWidgetPoolChange: function(appConfig){

      this._removeDestroyed(this.preloadNotInPanelWidgets);
      
      this._reloadWholePool();
    },

    _removeDestroyed: function(_array){
      var willBeDestroyed = [];
      array.forEach(_array, function(e){
        if(e._destroyed){
          willBeDestroyed.push(e);
        }
      });
      array.forEach(willBeDestroyed, function(e){
        var i = _array.indexOf(e);
        _array.splice(i, 1);
      });
    },

    _destroyPreloadWidgetIcons: function(){
      array.forEach(this.preloadWidgetIcons, function(icon){
        icon.destroy();
      }, this);
      this.preloadWidgetIcons = [];
    },

    _destroyPreloadNotInPanelWidgets: function(){
      array.forEach(this.preloadNotInPanelWidgets, function(widget){
        this.widgetManager.destroyWidget(widget);
      }, this);
      this.preloadNotInPanelWidgets = [];
    },

    _destroyWidgetPlaceholders: function(){
      array.forEach(this.widgetPlaceholders, function(placeholder){
        placeholder.destroy();
      }, this);
      this.widgetPlaceholders = [];
    },

    _destroyPreloadGroupPanels: function(){
      array.forEach(this.preloadGroupPanels, function(panel){
        this.panelManager.destroyPanel(panel);
      }, this);
      this.preloadGroupPanels = [];
    },

    _destroyPoolWidgetPanels: function(){
      array.forEach(this.poolWidgetPanels, function(panel){
        this.panelManager.destroyPanel(panel);
      }, this);
      this.poolWidgetPanels = [];
    },

    _destroyPoolGroupPanels: function(){
      array.forEach(this.poolGroupPanels, function(panel){
        this.panelManager.destroyPanel(panel);
      }, this);
      this.poolGroupPanels = [];
    },

    _destroyPoolNotInPanelsWidgets: function(){
      array.forEach(this.poolNotInPanelsWidgets, function(panel){
        this.panelManager.destroyPanel(panel);
      }, this);
      this.poolNotInPanelsWidgets = [];
    },

    _changeMapPosition: function(appConfig){
      var style = {
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        top: 'auto',
        width: 'auto',
        height: 'auto'
      };
      style = lang.mixin(style, utils.getPositionStyle(appConfig.map.position));
      html.setStyle(this.mapId, style);
      this.map.resize();
      return;
    },

    _onThemeChange: function(appConfig){
      this._destroyPreloadWidgetIcons();
      this._destroyWidgetPlaceholders();
      this._destroyPreloadNotInPanelWidgets();

      this._destroyPoolGroupPanels();
      this._destroyPoolWidgetPanels();
      this._destroyPoolNotInPanelsWidgets();
      
      this._updateCommonStyle(appConfig);
      this._onStyleChange(appConfig);
      this._changeMapPosition(appConfig);
      this._loadPreloadWidgets(appConfig);
    },

    _onResetConfig: function(appConfig){
      if(appConfig.map.itemId !== this.appConfig.map.itemId){
        topic.publish('appConfigChanged', appConfig, 'mapChange', appConfig);
      }

      this._onThemeChange(appConfig);
    },
    
    _updateCommonStyle : function(appConfig){
      var currentTheme = this.appConfig.theme;
      html.destroy(this._getThemeCommonStyleId(currentTheme));
      this._loadThemeCommonStyle(appConfig.theme);
      // remove old theme name
      html.removeClass(this.domNode, currentTheme.name);
    },

    _onStyleChange: function(appConfig){
      var currentTheme = this.appConfig.theme;
      if(currentTheme.styles !== appConfig.theme.styles){
        html.destroy(this._getThemeCurrentStyleId(currentTheme));
        this._loadThemeCurrentStyle(appConfig.theme);
        // remove old style name if not equal
        if (currentTheme.styles[0] !== appConfig.theme.styles[0]){
          html.removeClass(this.domNode, currentTheme.styles[0]);
        }
      }
    },

    _onLayoutChange: function(appConfig){
      var style = {
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        top: 'auto',
        width: 'auto',
        height: 'auto'
      };
      //relayout map
      style = lang.mixin(style, utils.getPositionStyle(appConfig.map.position));
      html.setStyle(this.mapId, style);
      this.map.resize();

      //relayout placehoder
      array.forEach(this.widgetPlaceholders, function(placeholder){
        placeholder.moveTo(appConfig.getConfigElementById(placeholder.configId).panel.position);
      }, this);

      //relayout icons
      array.forEach(this.preloadWidgetIcons, function(icon){
        icon.moveTo(appConfig.getConfigElementById(icon.configId).panel.position);
      }, this);

      //relayout no-inpanel widget
      array.forEach(this.preloadNotInPanelWidgets, function(widget){
        style = {
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            top: 'auto',
            width: 'auto',
            height: 'auto'
          };
        style = lang.mixin(style, utils.getPositionStyle(appConfig.getConfigElementById(widget.id).panel.position));
        html.setStyle(widget.domNode, style);
        //because change the position style of the widget will make the widget's dimension will not conform the widget state,
        //so, change state here
        if(widget.defaultState){
          this.widgetManager.changeWindowStateTo(widget, widget.defaultState);
        }else{
          widget.resize();
        }
      }, this);

      //relayout groups
      array.forEach(this.preloadGroupPanels, function(panel){
        style = {
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            top: 'auto',
            width: 'auto',
            height: 'auto'
          };
        style = lang.mixin(style, utils.getPositionStyle(appConfig.getConfigElementById(panel.config.id).panel.position));
        html.setStyle(panel.domNode, style);
        panel.resize();
      }, this);
    },

    _loadSplash: function() {
      if (!this.appConfig.splashPage) {
        return;
      }
      if(cookie('isfirst') === 'false'){
        return;
      }
      var widgetConfig = {};

      widgetConfig.uri = this.appConfig.splashPage;
      widgetConfig.id = this.appConfig.splashPage + '_1';
      widgetConfig.label = 'splashPage';

      this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget) {
        html.place(widget.domNode, this.id);
        widget.startup();
      }));
    },

    _loadThemeStyle: function(theme) {
    //summary:
    //    load theme style, including common and current style(the first)
      this._loadThemeCommonStyle(theme);
      this._loadThemeCurrentStyle(theme);
    },

    _loadThemeCommonStyle: function(theme) {
      utils.loadStyleLink(this._getThemeCommonStyleId(theme), 'themes/' + theme.name + '/common.css');
      // append theme name for better selector definition
      html.addClass(this.domNode, theme.name);
    },

    _loadThemeCurrentStyle: function(theme) {
      utils.loadStyleLink(this._getThemeCurrentStyleId(theme), 'themes/' + theme.name + '/styles/' + theme.styles[0] + '/style.css');
      // append theme style name for better selector definitions
      html.addClass(this.domNode, theme.styles[0]);
    },

    _getThemeCommonStyleId: function(theme){
      return 'theme_' + theme.name + '_style_common';
    },

    _getThemeCurrentStyleId: function(theme){
      return 'theme_' + theme.name + '_style_' + theme.styles[0];
    },

    _loadMap: function() {
      var mapDiv = html.create('div', {
        id: this.mapId,
        style: lang.mixin({
          position: 'absolute',
          backgroundColor: '#EEEEEE',
          overflow: 'hidden'
        }, utils.getPositionStyle(this.appConfig.map.position))
      });

      html.place(mapDiv, this.id);

      MapManager.getInstance(this.appConfig, this.mapId).showMap();
    },

    _createPreloadWidgetPlaceHolder: function(widgetConfig){
      var pid;
      if(widgetConfig.panel.positionRelativeTo === 'map'){
        pid = this.mapId;
      }else{
        pid = this.id;
      }
      var cfg = lang.clone(widgetConfig);
      delete cfg.position.width;
      delete cfg.position.height;
      var style = utils.getPositionStyle(cfg.position);
      var phDijit = new WidgetPlaceholder({
        index: cfg.placeholderIndex,
        configId: widgetConfig.id
      });
      html.setStyle(phDijit.domNode, style);
      html.place(phDijit.domNode, pid);
      this.widgetPlaceholders.push(phDijit);
      return phDijit;
    },

    _createPreloadWidgetIcon: function(widgetConfig){
      var iconDijit = new PreloadWidgetIcon({
        panelManager: this.panelManager,
        widgetConfig: widgetConfig,
        configId: widgetConfig.id
      });

      if(widgetConfig.panel.positionRelativeTo === 'map'){
        html.place(iconDijit.domNode, this.mapId);
      }else{
        html.place(iconDijit.domNode, this.id);
      }
      //icon position doesn't use width/height
      html.setStyle(iconDijit.domNode, utils.getPositionStyle({
        top: widgetConfig.position.top,
        left: widgetConfig.position.left,
        right: widgetConfig.position.right,
        bottom: widgetConfig.position.bottom
      }));
      iconDijit.startup();

      this.preloadWidgetIcons.push(iconDijit);
      return iconDijit;
    },

    _loadPreloadWidgets: function(appConfig) {
      //load widgets
      array.forEach(appConfig.preloadWidgets.widgets, function(widgetConfig) {
        this._loadPreloadWidget(widgetConfig);
      }, this);

      //load groups
      array.forEach(appConfig.preloadWidgets.groups, function(groupConfig) {
        this._loadPreloadGroup(groupConfig);
      }, this);
      
    },

    _loadPreloadWidget: function(widgetConfig) {
      var def = new Deferred();

      if(this.appConfig.mode === 'config' && !widgetConfig.uri){
        var placeholder = this._createPreloadWidgetPlaceHolder(widgetConfig);
        def.resolve(placeholder);
        return def;
      }else if(!widgetConfig.uri){
        //in run mode, when no uri, do nothing
        def.resolve(null);
        return def;
      }

      this.widgetManager.isWidgetInPanel(widgetConfig).then(lang.hitch(this, function(inPanel){
        var iconDijit;
        if(inPanel){
          iconDijit = this._createPreloadWidgetIcon(widgetConfig);
          def.resolve(iconDijit);
        }else{
          this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget){
            if(widget.panel.positionRelativeTo === 'map'){
              html.place(widget.domNode, this.mapId);
            }else{
              html.place(widget.domNode, this.id);
            }
            html.setStyle(widget.domNode, utils.getPositionStyle(widget.position));
            html.setStyle(widget.domNode, 'position', 'absolute');
            widget.startup();
            if(widgetConfig.defaultState){
              this.widgetManager.changeWindowStateTo(widget, widgetConfig.defaultState);
            }
            
            widget.configId = widgetConfig.id;
            this.preloadNotInPanelWidgets.push(widget);
            def.resolve(widget);
          }));
        }
      }));
      return def;
    },

    _loadPreloadGroup: function(groupConfig) {
      this.panelManager.showPanel(groupConfig).then(lang.hitch(this, function(panel){
        this.preloadGroupPanels.push(panel);
      }));
    },

    onMapLoaded: function(map) {
      this.map = map;
      this.panelManager.map = map;
      this._loadSplash();
      this._loadPreloadWidgets(this.appConfig);
    },

    onMapChanged: function(map){
      this.map = map;
      this.panelManager.map = map;
      this.panelManager.destroyAllPanels();
      //when map changed, use destroy and then create to simplify the widget development
      this._destroyPreloadNotInPanelWidgets();
      this._destroyWidgetPlaceholders();
      this._destroyPreloadWidgetIcons();
      this._loadPreloadWidgets(this.appConfig);
    },

    onActionTriggered: function(id, action, data){
      /* jshint unused:false */
      if(action === 'highLight'){
        array.forEach(this.widgetPlaceholders, function(placehoder){
          if(placehoder.configId === id){
            placehoder.highLight();
          }
        }, this);
      }
      if(action === 'removeHighLight'){
        array.forEach(this.widgetPlaceholders, function(placehoder){
          if(placehoder.configId === id){
            placehoder.removeHighLight();
          }
        }, this);
      }
    }
  });

  clazz.getInstance = function(options, domId) {
    if (instance === null) {
      instance = new clazz(options, domId);
    }
    return instance;
  };
  return clazz;
});