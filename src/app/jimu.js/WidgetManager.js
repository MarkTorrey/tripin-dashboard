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
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/Deferred',
  'dojo/topic',
  'dojo/aspect',
  'dojo/on',
  'dojo/request/xhr',
  'dojo/i18n',
  'dojo/promise/all',
  'dojo/query',
  'dojo/NodeList-traverse',
  'dojo/dom-geometry',
  'dojo/dom-style',
  './utils',
  './tokenUtils'],
function (declare, lang, array, html, Deferred, topic, aspect, on, xhr, i18n,
  all, query, nlt, domGeometry, domStyle, utils, tokenUtils) {
  var instance = null, clazz = declare(null, {

    constructor: function () {
      //the loaded widget list
      this.loaded = [];

      //action is triggered, but the widget has not been loaded
      //{id: widgetId, action: {}}
      this.missedActions = [];

      topic.subscribe("appConfigLoaded", lang.hitch(this, this.onAppConfigLoaded));
      topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged));

      topic.subscribe("mapLoaded", lang.hitch(this, this.onMapLoaded));
      topic.subscribe("mapChanged", lang.hitch(this, this.onMapChanged));

      topic.subscribe('userSignIn', lang.hitch(this, this.onUserSignIn));
      topic.subscribe('userSignOut', lang.hitch(this, this.onUserSignOut));

      //events from builder
      topic.subscribe('actionTriggered', lang.hitch(this, this.onActionTriggered));
    },
    
    loadWidget: function (setting) {
      // summary:
      //    load and create widget, return deferred. when defer is resolved,
      //    widget is returned.
      // description:
      //    setting should contain 2 properties:
      //    id: id should be unique, same id will return same widget object.
      //    uri: the widget's main class

      var def = new Deferred(), findWidget, setting2 = lang.clone(setting);
      utils.processWidgetSetting(setting2);

      findWidget = this.getWidgetById(setting2.id);

      if(findWidget) {
        //widget have loaded(identified by id)
        def.resolve(findWidget);
      }else{
        this.loadWidgetClass(setting2).then(lang.hitch(this, function(clazz){
          this.loadWidgetResources(setting2, clazz).then(lang.hitch(this, function(resouces){
            var widget = this.createWidget(setting2, clazz, resouces);
            //use timeout to let the widget can get the correct dimension in startup function
            setTimeout(function(){
              def.resolve(widget);
            }, 50);
            
          }));
        }));
      }
      return def;
    },

    loadWidgetClass: function(setting){
      // summary:
      //    load the widget's main class, and return deferred
      var def = new Deferred();

      require(utils.getRequireConfig(), [setting.uri], lang.hitch(this, function (clazz) {
        if(clazz.inPanel === undefined){
          clazz.inPanel = true;
        }
        def.resolve(clazz);
      }));
      return def;
    },

    loadWidgetResources: function(setting, clazz){
      // summary:
      //    load the widget's resources(local, style, etc.), and return deferred

      var def = new Deferred(), defConfig, defI18n, defStyle, defTemplate, defs = [];
      
      var setting2 = lang.clone(setting);
      utils.processWidgetSetting(setting2);

      setting2.hasLocale = clazz.hasLocale;
      setting2.hasStyle = clazz.hasStyle;
      setting2.hasConfig = clazz.hasConfig;
      setting2.hasUIFile = clazz.hasUIFile;

      defConfig = this.tryLoadWidgetConfig(setting2);
      defI18n = this._tryLoadResource(setting2, 'i18n');
      defStyle = this._tryLoadResource(setting2, 'style');
      defTemplate = this._tryLoadResource(setting2, 'template');

      defs.push(defConfig);
      defs.push(defI18n);
      defs.push(defTemplate);
      defs.push(defStyle);

      all(defs).then(lang.hitch(this, function(results){
        var res = {};
        res.config = results[0];
        res.i18n = results[1];
        res.template = results[2];
        res.style = results[3];
        def.resolve(res);
      }), function(err){
        console.log(err);
      });

      return def;
    },

    createWidget: function(setting, clazz, resouces){
      var widget;

      //here, check whether widget have loaded again because loading and create a widget
      //needs some time. If in this period time, more then one loading request will create
      //more widgets with the same id, it's a error.

      if(this.getWidgetById(setting.id)){
        return this.getWidgetById(setting.id);
      }

      //the config can contain i18n placeholders
      if(resouces.config && resouces.i18n){
        resouces.config = utils.replacePlaceHolder(resouces.config, resouces.i18n);
      }

      setting.rawConfig = setting.config;
      setting.config = resouces.config || {};
      if(this.appConfig.agolConfig){
        this._mergeAgolConfig(setting);
      }
      setting.nls = resouces.i18n || {};
      if(resouces.template){
        setting.templateString = resouces.template;
      }

      setting['class'] = 'jimu-widget';
      if(!setting.label){
        setting.label = setting.name;
      }
      if(this.map){
        setting.map = this.map;
      }
      setting.appConfig = this.appConfig;

      try{
        widget = new clazz(setting);
        widget.clazz = clazz;
        aspect.after(widget, 'startup', lang.hitch(this, this.postWidgetStartup, widget));
        aspect.before(widget, 'destroy', lang.hitch(this, this.onDestroyWidget, widget));
        this.loaded.push(widget);
        console.log('widget [' + setting.uri + '] created.');
      }catch(err){
        console.log('create [' + setting.widget + '] error:' + err.stack);
      }

      return widget;
    },

    isWidgetInPanel: function(widgetSetting){
      var def = new Deferred();
      if(widgetSetting.inPanel === true){
        def.resolve(true);
      }else if(widgetSetting.inPanel === false){
        def.resolve(false);
      }else{
        this.loadWidgetClass(widgetSetting).then(lang.hitch(this, function(clazz){
          if(clazz.inPanel){
            def.resolve(true);
          }else{
            def.resolve(false);
          }
        }));
      }
      return def;
    },

    _mergeAgolConfig: function (setting) {
      var i, j;

      function doMerge(values, preKey){
        for (var key in values){
          if(key.startWith(preKey)){
            utils.setConfigByTemplate(setting.config, key.substr(preKey.length, key.length), values[key]);
          }
        }
      }

      if(this.appConfig.preloadWidgets){
        if(this.appConfig.preloadWidgets.groups){
          for(i = 0; i < this.appConfig.preloadWidgets.groups.length; i++){
            for(j = 0; j < this.appConfig.preloadWidgets.groups[i].widgets.length; j++){
              if(this.appConfig.preloadWidgets.groups[i].widgets[j].label === setting.label){
                doMerge(this.appConfig.agolConfig.values, 'app_preloadWidgets_groups[' + i + ']_widgets[' + j + ']_');
                return;
              }
            }
          }
        }

        if(this.appConfig.preloadWidgets.widgets){
          for(i = 0; i < this.appConfig.preloadWidgets.widgets.length; i++){
            if(this.appConfig.preloadWidgets.widgets[i].label === setting.label){
              doMerge(this.appConfig.agolConfig.values, 'app_preloadWidgets_widgets[' + i + ']_');
              return;
            }
          }
        }
      }

      if(this.appConfig.widgetPool){
        if(this.appConfig.widgetPool.groups){
          for(i = 0; i < this.appConfig.widgetPool.groups.length; i++){
            for(j = 0; j < this.appConfig.widgetPool.groups[i].widgets.length; j++){
              if(this.appConfig.widgetPool.groups[i].widgets[j].label === setting.label){
                doMerge(this.appConfig.agolConfig.values, 'app_widgetPool_groups[' + i + ']_widgets[' + j + ']_');
                return;
              }
            }
          }
        }

        if(this.appConfig.widgetPool.widgets){
          for(i = 0; i < this.appConfig.widgetPool.widgets.length; i++){
            if(this.appConfig.widgetPool.widgets[i].label === setting.label){
              doMerge(this.appConfig.agolConfig.values, 'app_widgetPool_widgets[' + i + ']_');
              return;
            }
          }
        }
      }
    },

    getAllWidgets: function(){
      return this.loaded;
    },

    destroyAllWidgets: function(){
      this.loaded.forEach(function (widget) {
        widget.destroy();
      });
      this.loaded = [];
    },

    onUserSignIn: function(credential){
      array.forEach(this.loaded, function (m) {
        m.onSignIn(credential);
      }, this);
    },

    onUserSignOut: function(){
      array.forEach(this.loaded, function (m) {
        m.onSignOut();
      }, this);
    },

    onAppConfigLoaded: function(appConfig){
      this.appConfig = appConfig;
      tokenUtils.setPortalUrl(appConfig.portalUrl);
    },

    onMapLoaded: function(map){
      this.map = map;
    },

    onMapChanged: function(map){
      this.map = map;
    },

    onAppConfigChanged: function(appConfig, reason, changedData){
      this.appConfig = appConfig;
      array.forEach(this.loaded, function (w) {
        w.onAppConfigChanged(appConfig, reason, changedData);
        if(reason === 'widgetChange'){
          this.onConfigChanged(changedData.id, changedData.config);
        }
        w.appConfig = appConfig;
      }, this);
    },

    onConfigChanged: function(id, config){
      //summary:
      //  widget which care it's own config change should override onConfigChanged function
      var w = this.getWidgetById(id);
      if(!w){
        return;
      }
      
      w.onConfigChanged(config);
      lang.mixin(w.config, config);
    },

    onActionTriggered: function(id, action, data){
      if(id === 'map' || id === 'app'){
        return;
      }
      var m = this.getWidgetById(id);
      if(!m){
        this.missedActions.push({
          id: id,
          action: {
            name: action,
            data: data
          }
        });
        return;
      }
      m.onAction(action, data);
    },

    //load the widget setting page class and create setting page object
    //do not cache for now.
    loadWidgetSettingPage: function(setting){
      var def = new Deferred();
      setting = lang.clone(setting);
      utils.processWidgetSetting(setting);

      setting.id = setting.id + '_setting';
      require(utils.getRequireConfig(), [setting.folderUrl + 'setting/Setting.js'], lang.hitch(this, function (clazz) {
        var defI18n, defStyle, defTemplate, defs = [];

        setting.hasSettingUIFile = clazz.hasSettingUIFile;
        setting.hasSettingLocale = clazz.hasSettingLocale;
        setting.hasSettingStyle = clazz.hasSettingStyle;
        
        defI18n = this._tryLoadResource(setting, 'settingI18n');
        defTemplate = this._tryLoadResource(setting, 'settingTemplate');
        defStyle = this._tryLoadResource(setting, 'settingStyle');

        defs.push(defI18n);
        defs.push(defTemplate);
        defs.push(defStyle);

        all(defs).then(lang.hitch(this, function(results){
          var settingObject, i18n = results[0], template = results[1];// style = results[2]

          setting.nls = i18n || {};
          if(template){
            setting.templateString = template;
          }
          setting.appConfig = this.appConfig;
          setting.map = this.map;
          setting['class'] = 'jimu-widget-setting';
          settingObject = new clazz(setting);
          aspect.before(settingObject, 'destroy', lang.hitch(this, this.onDestroyWidgetSetting, settingObject));
          def.resolve(settingObject);
        }), function(err){
          console.log(err);
        });

      }));
      return def;
    },

    postWidgetStartup: function(widgetObject){
      widgetObject.started = true;
      utils.setVerticalCenter(widgetObject.domNode);
      aspect.after(widgetObject, 'resize', lang.hitch(this, utils.setVerticalCenter, widgetObject.domNode));
      this.openWidget(widgetObject);
      if(widgetObject.defaultState){
        this.changeWindowStateTo(widgetObject, widgetObject.defaultState);
      }

      if(tokenUtils.userHaveSignIn()){
        widgetObject.onSignIn(tokenUtils.getCredential());
      }else{
        widgetObject.onSignOut();
      }
      this.triggerMissedAction(widgetObject);
    },

    triggerMissedAction: function(widget){
      this.missedActions.forEach(function(info){
        if(info.id === widget.id){
          widget.onAction(info.action.name, info.action.data);
        }
      });
    },

    _remove: function(id){
      return array.some(this.loaded, function (w, i) {
        if(w.id === id) {
          this.loaded.splice(i, 1);
          return true;
        }
      }, this);
    },

    getWidgetById: function(id){
      var ret;
      array.some(this.loaded, function (w) {
        if(w.id === id) {
          ret = w;
          return true;
        }
      }, this);
      return ret;
    },

    tryLoadWidgetConfig: function(setting){
      var def = new Deferred();
      setting = utils.processWidgetSetting(setting);
      //need load config first, because the template may be use the config data
      if(setting.config && lang.isObject(setting.config)){
        //if widget is configurated in the app config.json, the i18n has beed processed
        def.resolve(setting.config);
        return def;
      }else if(setting.config){
        return xhr(setting.config, {
          handleAs: "json"
        });
      }else{
        return this._tryLoadResource(setting, 'config');
      }
    },

    _tryLoadResource: function(setting, flag){
      var file, hasp,
      def = new Deferred(),
      doLoad = function(){
        var loadDef;
        if(flag === 'config'){
          loadDef = this.loadWidgetConfig(setting);
        }else if(flag === 'style'){
          loadDef = this.loadWidgetStyle(setting);
        }else if(flag === 'i18n'){
          loadDef = this.loadWidgetI18n(setting);
        }else if(flag === 'template'){
          loadDef = this.loadWidgetTemplate(setting);
        }else if(flag === 'settingTemplate'){
          loadDef = this.loadWidgetSettingTemplate(setting);
        }else if(flag === 'settingStyle'){
          loadDef = this.loadWidgetSettingStyle(setting);
        }else if(flag === 'settingI18n'){
          loadDef = this.loadWidgetSettingI18n(setting);
        }else{
          return def;
        }
        loadDef.then(function(data){
          def.resolve(data);
        },function(err){
          def.reject(err);
        });
      };

      if(flag === 'config'){
        file = setting.folderUrl + 'config.json';
        setting.configFile = file;
        hasp = 'hasConfig';
      }else if(flag === 'style'){
        file = setting.folderUrl + 'css/style.css';
        setting.styleFile = file;
        hasp = 'hasStyle';
      }else if(flag === 'i18n'){
        file = setting.folderUrl + 'nls/strings.js';
        setting.i18nFile = 'strings';
        hasp = 'hasLocale';
      }else if(flag === 'template'){
        file = setting.folderUrl + 'Widget.html';
        setting.templateFile = file;
        hasp = 'hasUIFile';
      }else if(flag === 'settingTemplate'){
        file = setting.folderUrl + 'setting/Setting.html';
        setting.settingTemplateFile = file;
        hasp = 'hasSettingUIFile';
      }else if(flag === 'settingI18n'){
        file = setting.folderUrl + 'setting/nls/strings.js';
        setting.settingI18nFile = 'strings';
        hasp = 'hasSettingLocale';
      }else if(flag === 'settingStyle'){
        file = setting.folderUrl + 'setting/css/style.css';
        setting.settingStyleFile = file;
        hasp = 'hasSettingStyle';
      }else{
        return def;
      }

      if(setting[hasp] === false){
        def.resolve(null);
      }else if(setting[hasp] === true){
        doLoad.apply(this);
      }else{
        utils.checkFileExist(file).then((function(exist){
          if(exist){
            doLoad.apply(this);
          }else{
            def.resolve(null);
          }
        }).bind(this));
      }
      return def;
    },

    /*
    * Load the css file in a widget.
    * This function load the widget's css file and insert it into the HTML page through <link>.
    * It also ensure that the css file is inserted only one time.
    */
    loadWidgetStyle: function(widgetSetting){
      var id = 'widget/style/' + widgetSetting.uri, def = new Deferred();
      id = this.replaceId(id);
      if(html.byId(id)){
        def.resolve('load');
        return def;
      }
      return utils.loadStyleLink(id, widgetSetting.styleFile);
    },

    loadWidgetSettingStyle: function(widgetSetting){
      var id = 'widget/style/' + widgetSetting.uri + '/setting', def = new Deferred();
      id = this.replaceId(id);
      if(html.byId(id)){
        def.resolve('load');
        return def;
      }
      return utils.loadStyleLink(id, widgetSetting.settingStyleFile);
    },

    loadWidgetConfig: function(widgetSetting){
      return xhr(widgetSetting.configFile, {
        handleAs: "json"
      });
    },

    removeWidgetStyle: function(widget){
      html.destroy(this.replaceId('widget/style/' + widget.uri));
    },

    removeWidgetSettingStyle: function(widget){
      html.destroy(this.replaceId('widget/style/' + widget.uri + '/setting'));
    },

    replaceId: function (id){
      return id.replace(/\//g, '_').replace(/\./g, '_');
    },

    loadWidgetI18n: function(widgetSetting){
      var def = new Deferred(), i18nFile, widget, locale = this.appConfig.locale;
      i18nFile = widgetSetting.amdFolder + 'nls/strings';
      widget = widgetSetting.amdFolder;
      require(utils.getRequireConfig(), ['dojo/i18n!' + i18nFile], function(){
        var nls = i18n.getLocalization(widget, widgetSetting.i18nFile, locale);
        def.resolve(nls);
      });
      return def;
    },

    loadWidgetSettingI18n: function(widgetSetting){
      var def = new Deferred(), i18nFile, widget, locale = this.appConfig.locale;
      i18nFile = widgetSetting.amdFolder + 'setting/nls/strings';
      widget = widgetSetting.amdFolder;
      require(utils.getRequireConfig(), [i18nFile], function(){
        var nls = i18n.getLocalization(widget + 'setting/', widgetSetting.settingI18nFile, locale);
        def.resolve(nls);
      });
      return def;
    },

    loadWidgetTemplate: function(widgetSetting){
      var def = new Deferred();
      require(utils.getRequireConfig(), ['dojo/text!' + widgetSetting.templateFile], function(template){
        def.resolve(template);
      });
      return def;
    },

    loadWidgetSettingTemplate: function(widgetSetting){
      var def = new Deferred();
      require(utils.getRequireConfig(), ['dojo/text!' + widgetSetting.settingTemplateFile], function(template){
        def.resolve(template);
      });
      return def;
    },

    onDestroyWidget: function(widget){
      if(widget.state !== 'closed'){
        this.closeWidget(widget);
      }
      this._removeWidget(widget);
    },

    onDestroyWidgetSetting: function(settingWidget){
      this.removeWidgetSettingStyle(settingWidget);
    },

    //normal, minimized, maximized
    changeWindowStateTo: function(widget, state){
      if(state === 'normal'){
        this.normalizeWidget(widget);
      }else if(state === 'minimized'){
        this.minimizeWidget(widget);
      }else if(state === 'maximized'){
        this.maximizeWidget(widget);
      }else{
        console.log('error state: ' + state);
      }
    },

    closeWidget: function(widget){
      if(typeof widget === 'string'){
        widget = this.getWidgetById(widget);
        if(!widget){
          return;
        }
      }
      if(widget.state !== 'closed'){
        widget.setState('closed');
        widget.onClose();
      }
    },

    openWidget: function(widget) {
      if(typeof widget === 'string'){
        widget = this.getWidgetById(widget);
        if(!widget){
          return;
        }
      }
      if(widget.state === 'closed'){
        widget.setState('opened');
        widget.onOpen();
      }
    },

    maximizeWidget: function(widget){
      if(typeof widget === 'string'){
        widget = this.getWidgetById(widget);
        if(!widget){
          return;
        }
      }
      if(widget.state === 'closed'){
        this.openWidget(widget);
      }

      widget.setWindowState('maximized');
      widget.onMaximize();
    },

    minimizeWidget: function(widget){
      if(typeof widget === 'string'){
        widget = this.getWidgetById(widget);
        if(!widget){
          return;
        }
      }

      if(widget.state === 'closed'){
        this.openWidget(widget);
      }
      widget.setWindowState('minimized');
      widget.onMinimize();
    },

    normalizeWidget: function(widget){
      if(typeof widget === 'string'){
        widget = this.getWidgetById(widget);
        if(!widget){
          return;
        }
      }

      if(widget.state === 'closed'){
        this.openWidget(widget);
      }
      widget.setWindowState('normal');
      widget.onNormalize();
    },

    destroyWidget: function(widget){
      var m;
      if(typeof widget === 'string'){
        m = this.getWidgetById(widget);
        if(!m){
          //maybe, the widget is loading
          return;
        }else{
          widget = m;
        }
      }
      this._removeWidget(widget);
      widget.destroy();
    },

    _removeWidget: function(widget){
      var m;
      if(typeof widget === 'string'){
        m = this.getWidgetById(widget);
        if(!m){
          //maybe, the widget is loading
          return;
        }else{
          widget = m;
        }
      }
      this.removeWidgetStyle(widget);
      this._remove(widget.id);
    }
  });
  
  clazz.getInstance = function (urlParams) {
    if(instance === null) {
      instance = new clazz(urlParams);
    }
    return instance;
  };
  return clazz;
});