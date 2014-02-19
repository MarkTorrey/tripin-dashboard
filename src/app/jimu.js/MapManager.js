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
  'dojo/topic',
  'dojo/on',
  'dojo/aspect',
  'esri/arcgis/utils',
  'esri/dijit/InfoWindow',
  "esri/dijit/PopupMobile",
  'esri/InfoTemplate',
  'esri/request',
  'esri/geometry/Extent',
  'require',
  './utils'
], function(declare, lang, array, html, topic, on, aspect, agolUtils, InfoWindow, PopupMobile, InfoTemplate, esriRequest, Extent, require, utils) {
  var instance = null,
    clazz = declare(null, {
      appConfig: null,
      mapDivId: '',
      map: null,
      previousInfoWindow: null,
      mobileInfoWindow: null,
      isMobileInfoWindow: false,

      constructor: function( /*Object*/ appConfig, mapDivId) {
        this.appConfig = appConfig;
        this.mapDivId = mapDivId;
        this.id = mapDivId;
        topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged));
        topic.subscribe("changeMapPosition", lang.hitch(this, this.onChangeMapPosition));

        on(window, 'resize', lang.hitch(this, this.onWindowResize));
      },

      showMap: function() {
        this._showMap(this.appConfig);
      },

      _showMap: function(appConfig) {
        //for now, we can't create both 2d and 3d map
        if (appConfig.map['3D']) {
          if (appConfig.map.itemId) {
            this._show3DWebScene(appConfig);
          } else {
            this._show3DLayersMap(appConfig);
          }
        } else {
          if (appConfig.map.itemId) {
            this._show2DWebMap(appConfig);
          } else {
            this._show2DLayersMap(appConfig);
          }
        }
      },

      onWindowResize: function() {
        if (this.map && this.map.resize) {
          this.map.resize();
          this.resetInfoWindow();
        }
      },

      resetInfoWindow: function(){
        if (!this.previousInfoWindow&&this.map&&this.map.infoWindow) {
          this.previousInfoWindow = this.map.infoWindow;
        }
        if (!this.mobileInfoWindow&&this.map&&this.map.root) {
          this.mobileInfoWindow = new PopupMobile(null, html.create("div", null, null, this.map.root));
        }
        if (jimuConfig && jimuConfig.widthBreaks&&this.previousInfoWindow&&this.mobileInfoWindow) {
          var width = jimuConfig.widthBreaks[0];
          if (document.body.clientWidth < width && !this.isMobileInfoWindow) {
            this.map.infoWindow.hide();
            this.map.setInfoWindow(this.mobileInfoWindow);
            this.isMobileInfoWindow = true;
          } else if(this.map.width >= width && this.isMobileInfoWindow){
            this.map.infoWindow.hide();
            this.map.setInfoWindow(this.previousInfoWindow);
            this.isMobileInfoWindow = false;
          }
        }
      },

      onChangeMapPosition: function(position) {
        var oldPos = lang.clone(this.appConfig.map.position);
        var pos = lang.mixin(oldPos, position);
        html.setStyle(this.mapDivId, utils.getPositionStyle(pos));
        if (this.map && this.map.resize) {
          this.map.resize();
        }
      },

      _visitConfigMapLayers: function(appConfig, cb) {
        array.forEach(appConfig.map.basemaps, function(layerConfig, i) {
          layerConfig.isOperationalLayer = false;
          cb(layerConfig, i);
        }, this);

        array.forEach(appConfig.map.operationallayers, function(layerConfig, i) {
          layerConfig.isOperationalLayer = true;
          cb(layerConfig, i);
        }, this);
      },

      _show3DLayersMap: function(appConfig) {
        require(['esri3d/Map', './utils3d'], lang.hitch(this, function(Map, utils3d) {
          var initCamera, map;
          if (appConfig.map.mapOptions && appConfig.map.mapOptions.camera) {
            initCamera = utils3d.getCameraFromArray(appConfig.map.mapOptions.camera);
          }
          map = new Map(this.mapDivId, {
            camera: initCamera
          });
          this._visitConfigMapLayers(appConfig, lang.hitch(this, function(layerConfig) {
            this.createLayer(map, '3D', layerConfig);
          }));
          map.usePlugin = Map.usePlugin;
          this._publishMapEvent(map);
        }));
      },

      _show3DWebScene: function(appConfig) {
        this._getWebsceneData(appConfig.map.itemId).then(lang.hitch(this, function(data) {
          require(['esri3d/Map'], lang.hitch(this, function(Map) {
            var map = new Map(this.mapDivId, appConfig.map.mapOptions);

            array.forEach(data.itemData.operationalLayers, function(layerConfig) {
              this.createLayer(map, '3D', layerConfig);
            }, this);

            array.forEach(data.itemData.baseMap.baseMapLayers, function(layerConfig) {
              layerConfig.type = "tile";
              this.createLayer(map, '3D', layerConfig);
            }, this);

            array.forEach(data.itemData.baseMap.elevationLayers, function(layerConfig) {
              layerConfig.type = "elevation";
              this.createLayer(map, '3D', layerConfig);
            }, this);

            map.toc = data.itemData.toc;
            map.bookmarks = data.itemData.bookmarks;
            map.tours = data.itemData.tours;
          }));
        }));
      },

      _publishMapEvent: function(map) {
        //add this property for debug purpose
        window._viewerMap = map;
        if (this.map) {
          this.map = map;
          console.log('map changed.');
          topic.publish('mapChanged', this.map);
        } else {
          this.map = map;
          console.log('map loaded.');
          topic.publish('mapLoaded', this.map);
        }
        this.resetInfoWindow();
      },

      _getWebsceneData: function(itemId) {
        return esriRequest({
          url: 'http://184.169.133.166/sharing/rest/content/items/' + itemId + '/data',
          handleAs: "json"
        });
      },

      _show2DWebMap: function(appConfig) {
        if (this.appConfig.portalUrl) {
          agolUtils.arcgisUrl = this.appConfig.portalUrl + "sharing/content/items/";
        }
        var mapDeferred = agolUtils.createMap(appConfig.map.itemId,
          this.mapDivId, {
            mapOptions: this._processMapOptions(appConfig.map.mapOptions),
            bingMapsKey: this.appConfig.bingMapsKey,
            ignorePopups: this.appConfig.ignoreWebmapPopups
          });

        mapDeferred.then(lang.hitch(this, function(response) {
          var map = response.map;
          map.itemId = this.appConfig.map.itemId;
          map.itemInfo = response.itemInfo;
          this._publishMapEvent(map);
        }));
      },

      _show2DLayersMap: function(appConfig) {
        require(['esri/map'], lang.hitch(this, function(Map) {
          var map = new Map(this.mapDivId, this._processMapOptions(appConfig.map.mapOptions));
          this._visitConfigMapLayers(appConfig, lang.hitch(this, function(layerConfig) {
            this.createLayer(map, '2D', layerConfig);
          }));
          this._publishMapEvent(map);
        }));
      },

      _processMapOptions: function(mapOptions) {
        if (!mapOptions) {
          return;
        }
        var ret = lang.clone(mapOptions);
        if (ret.extent) {
          ret.extent = new Extent(ret.extent);
        }
        if (ret.infoWindow) {
          ret.infoWindow = new InfoWindow(ret.infoWindow, html.create('div', {}, this.mapDivId));
        }
        return ret;
      },

      createLayer: function(map, maptype, layerConfig) {
        var layMap = {
          '2D_tiled': 'esri/layers/ArcGISTiledMapServiceLayer',
          '2D_dynamic': 'esri/layers/ArcGISDynamicMapServiceLayer',
          '2D_image': 'esri/layers/ArcGISImageServiceLayer',
          '2D_feature': 'esri/layers/FeatureLayer',
          '3D_tiled': 'esri3d/layers/ArcGISTiledMapServiceLayer',
          '3D_dynamic': 'esri3d/layers/ArcGISDynamicMapServiceLayer',
          '3D_image': 'esri3d/layers/ArcGISImageServiceLayer',
          '3D_feature': 'esri3d/layers/FeatureLayer',
          '3D_elevation': 'esri3d/layers/ArcGISElevationServiceLayer',
          '3D_3dmodle': 'esri3d/layers/SceneLayer'
        };

        require([layMap[maptype + '_' + layerConfig.type]], lang.hitch(this, function(layerClass) {
          var layer, infoTemplate, options = {}, keyProperties = ['label', 'url', 'type', 'icon', 'infoTemplate', 'isOperationalLayer'];
          for (var p in layerConfig) {
            if (keyProperties.indexOf(p) < 0) {
              options[p] = layerConfig[p];
            }
          }
          if (layerConfig.infoTemplate) {
            infoTemplate = new InfoTemplate(layerConfig.infoTemplate.title, layerConfig.infoTemplate.content);
            options.infoTemplate = infoTemplate;

            layer = new layerClass(layerConfig.url, options);

            if (layerConfig.infoTemplate.width && layerConfig.infoTemplate.height) {
              aspect.after(layer, 'onClick', lang.hitch(this, function() {
                map.infoWindow.resize(layerConfig.infoTemplate.width, layerConfig.infoTemplate.height);
              }), true);
            }
          } else {
            layer = new layerClass(layerConfig.url, options);
          }

          layer.isOperationalLayer = layerConfig.isOperationalLayer;
          layer.label = layerConfig.label;
          layer.icon = layerConfig.icon;
          map.addLayer(layer);
        }));
      },

      onAppConfigChanged: function(appConfig, reason, mapConfig, otherOptions) {
        if (reason !== 'mapChange') {
          this.appConfig = appConfig;
          return;
        }
        if (otherOptions && otherOptions.reCreateMap === false) {
          this.appConfig = appConfig;
          return;
        }
        if (this.map) {
          this.map.destroy();
        }
        this._showMap(appConfig);
        this.appConfig = appConfig;
      }

    });

  clazz.getInstance = function(appConfig, mapDivId) {
    if (instance === null) {
      instance = new clazz(appConfig, mapDivId);
    }
    return instance;
  };

  return clazz;
});