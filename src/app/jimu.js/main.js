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
define(["./ConfigManager",
 "./LayoutManager",
 'dojo/_base/html',
 'dojo/topic',
 'dojo/Deferred',
 'dojo/promise/all',
 'dojo/io-query',
 'dojo/domReady!',
 './utils',
 'require'],
function(ConfigManager, LayoutManager, html, topic, Deferred, all, ioquery, domReady, utils, require) {
  /* global jimuConfig:true */
  var mo = {};

  String.prototype.startWith = function(str){
    if(this.substr(0, str.length) === str){
      return true;
    }else{
      return false;
    }
  };

  String.prototype.endWith = function(str){
    if(this.substr(this.length - str.length, str.length) === str){
      return true;
    }else{
      return false;
    }
  };

  /*jshint unused: false*/
  
  if(typeof jimuConfig === 'undefined'){
    jimuConfig = {
      loadingId: 'main-loading',
      layoutId: 'jimu-layout-manager',
      mapId: 'map',
      mainPageId: 'main-page'
    };
  }

  jimuConfig.widthBreaks = [600, 1280];

  window.jimu = {version: '0.7'};

  function initApp() {
    var urlParams, configManager, layoutManager;
    console.log('jimu.js init...');
    urlParams = getUrlParams();
    
    html.setStyle(jimuConfig.loadingId, 'display', 'none');
    html.setStyle(jimuConfig.mainPageId, 'display', 'block');

    layoutManager = LayoutManager.getInstance({mapId: jimuConfig.mapId}, jimuConfig.layoutId);
    configManager = ConfigManager.getInstance(urlParams);

    layoutManager.startup();
    configManager.loadConfig();
  }

  function getUrlParams(){
    var s = window.location.search, p;
    if(s === ''){
      return {};
    }

    p = ioquery.queryToObject(s.substr(1));
    return p;
  }

  mo.initApp = initApp;
  return mo;
});