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
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/dijit/SimpleTable',
    'dijit/form/Button',
    'dijit/form/ValidationTextBox'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    Table) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-coordinate-setting',

      startup: function() {
        this.inherited(arguments);

        var fields = [{
          name: 'wkid',
          title: this.nls.wkid,
          type: 'text',
          class: "wkid",
          unique: true,
          editable: true
        }, {
          name: 'label',
          title: this.nls.label,
          type: 'text',
          unique: true,
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          class: "wkid",
          actions: ['up', 'down', 'delete']
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableCoordinate);
        this.displayFieldsTable.startup();
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.displayFieldsTable.clear();
        if (!config.outputunit) {
          config.outputunit = "geo";
        }
        this.selectOutputunit.set('value', config.outputunit);
        if (config.spatialReferences) {
          var json = [];
          var len = config.spatialReferences.length;
          for (var i = 0; i < len; i++) {
            json.push({
              wkid: config.spatialReferences[i].wkid,
              label: config.spatialReferences[i].label
            });
          }
          this.displayFieldsTable.addRows(json);
        }
      },

      add: function() {
        var json = {};
        json.wkid = this.wkid.value;
        json.label = this.label.value;
        if (!json.wkid || !json.label) {
          alert(this.nls.warning);
          return;
        }
        var status = this.displayFieldsTable.addRow(json);
        if (!status.success) {
          alert(status.errorMessage);
        }
      },

      getConfig: function() {
        this.config.outputunit = this.selectOutputunit.value;

        var data = this.displayFieldsTable.getData();
        var json = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          json.push(data[i]);
        }
        this.config.spatialReferences = json;
        return this.config;
      }


    });
  });