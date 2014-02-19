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
    'jimu/BaseWidgetSetting',
    "dojo/_base/lang",
    'dojo/on',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/ImageChooser',
    'dijit/form/CheckBox',
    'dijit/form/Button',
    'dijit/form/ValidationTextBox',
    'dijit/form/TextBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    on,
    Table,
    ImageChooser) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-basemapgallery-setting',
      imageChooser: null,

      startup: function() {
        this.inherited(arguments);
        if (!this.config.basemapGallery) {
          this.config.basemapGallery = {};
        }

        var fields = [{
          name: 'url',
          title: 'Url',
          type: 'text',
          editable: true,
          unique: true
        }, {
          name: 'title',
          title: this.nls.title,
          type: 'text',
          editable: true
        }, {
          name: 'thumbnailUrl',
          title: this.nls.thumbnail,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          actions: ['up', 'down', 'delete']
        }];
        var args = {
          fields: fields,
          selectable: true
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableBasemaps);
        this.displayFieldsTable.startup();

        this.imageChooser = new ImageChooser({
          displayImg: this.showImageChooser
        });
        this.own(on(this.imageChooser, 'imageChange', lang.hitch(this, this.imageChange)));
        this.setConfig(this.config);
      },

      addImage: function() {
        this.imageChooser.show();
      },

      imageChange: function(data) {
        this.thumbnail.set('value', data);
      },

      setConfig: function(config) {
        this.displayFieldsTable.clear();
        this.showArcGISBasemaps.set('checked', config.basemapGallery.showArcGISBasemaps);
        if (config.basemapGallery.basemaps) {
          var json = [],
            url = "",
            common = "";
          var len = config.basemapGallery.basemaps.length;
          var configuration = config.basemapGallery.basemaps;
          for (var i = 0; i < len; i++) {
            url = "";
            common = "";
            for (var j = 0; j < configuration[i].layers.length; j++) {
              url = url + common + configuration[i].layers[j].url;
              common = ",";
            }
            json.push({
              url: url,
              title: configuration[i].title,
              thumbnailUrl: configuration[i].thumbnailUrl
            });
          }
          this.displayFieldsTable.addRows(json);
        }
      },

      add: function() {
        var json = {};
        json.url = this.url.value;
        json.title = this.title.value;
        json.thumbnailUrl = this.thumbnail.value;
        if (!json.url || !json.title) {
          alert("Check the input values!");
          return;
        }
        this.displayFieldsTable.addRow(json);
      },

      getConfig: function() {
        this.config.basemapGallery.showArcGISBasemaps = this.showArcGISBasemaps.checked;
        var data = lang.clone(this.displayFieldsTable.getData());
        var json = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          var layers = [];
          var index = data[i].url.indexOf(',');
          while (index > -1) {
            layers.push({
              url: data[i].url.substring(0, index)
            });
            data[i].url = data[i].url.substring(index + 1);
            index = data[i].url.indexOf(',');
            if (index === -1) {
              layers.push({
                url: data[i].url
              });
            }
          }
          if (layers.length === 0) {
            layers.push({
              url: data[i].url
            });
          }
          data[i].layers = layers;
          delete data[i].url;
          json.push(data[i]);
        }
        this.config.basemapGallery.basemaps = json;
        return this.config;
      }

    });
  });