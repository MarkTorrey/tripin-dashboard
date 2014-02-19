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
    'jimu/dijit/SimpleTable',
    'dojo/_base/lang',
    'dojo/on',
    // "dojo/dom-construct",
    "dojo/dom-style",
    // "dojo/dom-attr",
    "dojo/query",
    // "dijit/TooltipDialog",
    // "dijit/popup",
    'dijit/form/CheckBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Table,
    lang,
    on,
    // domConstruct,
    domStyle,
    // domAttr,
    query,
    // TooltipDialog,
    // popup,
    CheckBox) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-edit-setting',
      selectLayer: null,
      tooltipDialog: null,
      featurelayers: [],
      indexLayer : -1,

      // destroy: function() {
      //   this.inherited(arguments);
      //   this.indexLayer = -1;
      // },

      startup: function() {
        this.inherited(arguments);
        this.featurelayers.length = 0;
        if (!this.config.editor) {
          this.config.editor = {};
        }
        // this.tooltipDialog = new TooltipDialog({
        //   style: "width: 500px;",
        //   content: "",
        //   onMouseLeave: function() {
        //     popup.close(this.tooltipDialog);
        //   }
        // });

        this.enableUndoRedo.set('checked', this.config.editor.enableUndoRedo);
        this.toolbarVisible.set('checked', this.config.editor.toolbarVisible);
        this.mergeVisible.set('checked', this.config.editor.toolbarOptions.mergeVisible);
        this.cutVisible.set('checked', this.config.editor.toolbarOptions.cutVisible);
        this.reshapeVisible.set('checked', this.config.editor.toolbarOptions.reshapeVisible);

        var fields = [{
          name: 'edit',
          title: this.nls.edit,
          type: 'checkbox',
          class: 'editable'
        }, {
          name: 'label',
          title: this.nls.label,
          type: 'text'
        }, {
          name: 'disableGeometryUpdate',
          title: this.nls.update,
          type: 'checkbox',
          class: 'update'
        }, {
          name: 'actions',
          title: this.nls.fields,
          type: 'actions',
          class: 'editable',
          actions: ['edit']
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this.displayLayersTable = new Table(args);
        this.displayLayersTable.placeAt(this.tableLayerInfos);
        this.displayLayersTable.startup();

        var fields2 = [{
          name: 'isEditable',
          title: this.nls.edit,
          type: 'checkbox',
          class: 'editable'
        }, {
          name: 'fieldName',
          title: this.nls.editpageName,
          type: 'text'
        }, {
          name: 'label',
          title: this.nls.editpageAlias,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          actions: ['up','down'],
          class: 'editable'
        }];
        var args2 = {
          fields: fields2,
          selectable: false
        };
        this.displayFieldsTable = new Table(args2);
        this.displayFieldsTable.placeAt(this.tableFieldInfos);
        this.displayFieldsTable.startup();

        this.own(on(this.displayLayersTable, 'Edit', lang.hitch(this, this.showLayerFields)));
        this.setConfig(this.config);
      },

      // createFiledsList: function(tr) {
      //   var count = 0,
      //     layer;
      //   var div = domConstruct.create("div");
      //   var data = this.displayLayersTable.getRowData(tr);
      //   if (!data) {
      //     return div;
      //   }
      //   var table = domConstruct.create("table");
      //   domStyle.set(table, "width", "100%");
      //   domStyle.set(table, "background-color", "gainsboro");
      //   table.insertRow(0);
      //   var h1 = table.rows[0].insertCell(0);
      //   var h2 = table.rows[0].insertCell(0);
      //   var h3 = table.rows[0].insertCell(0);
      //   var h4 = table.rows[0].insertCell(0);
      //   h1.innerHTML = "<b>" + this.nls.editpageEditable + "</b>";
      //   h2.innerHTML = "<b>" + this.nls.editpageAlias + "</b>";
      //   h3.innerHTML = "<b>" + this.nls.editpageName + "</b>";
      //   h4.innerHTML = "<b>" + this.nls.editpageVisible + "</b>";

      //   var len = this.featurelayers.length;
      //   for (var i = 0; i < len; i++) {
      //     if (data.label.toLowerCase() === this.featurelayers[i].label.toLowerCase()) {
      //       layer = this.featurelayers[i].layer;
      //       count = this.featurelayers[i].fields.length;
      //       for (var m = 0; m < count; m++) {
      //         var row = table.insertRow(-1);
      //         var c1 = row.insertCell(0);
      //         var c2 = row.insertCell(0);
      //         var c3 = row.insertCell(0);
      //         var c4 = row.insertCell(0);

      //         c3.innerHTML = this.featurelayers[i].fields[m].name;
      //         c2.innerHTML = this.featurelayers[i].fields[m].alias;

      //         var f1 = new CheckBox({
      //           value: this.featurelayers[i].fields[m].name,
      //           checked: this.featurelayers[i].fields[m].visible
      //         });
      //         this.own(on(f1, 'change', lang.hitch(this, this.onChangeCheckbox, i, m, "visible")));
      //         domConstruct.place(f1.domNode, c4);
      //         var f2 = new CheckBox({
      //           value: this.featurelayers[i].fields[m].name,
      //           checked: this.featurelayers[i].fields[m].editable
      //         });
      //         this.own(on(f2, 'change', lang.hitch(this, this.onChangeCheckbox, i, m, "editable")));
      //         domConstruct.place(f2.domNode, c1);
      //       }
      //       domConstruct.place(table, div);
      //       break;
      //     }
      //   }
      //   return div;
      // },

      // onChangeCheckbox: function(i, m, visible_Or_editable, status) {
      //   if (visible_Or_editable === "visible") {
      //     this.featurelayers[i].fields[m].visible = status;
      //   } else {
      //     this.featurelayers[i].fields[m].editable = status;
      //   }

      // },

      backToFristPage: function(){
        domStyle.set(this.secondPageDiv, "display", "none");
        domStyle.set(this.fistPageDiv, "display", "");
        this.resetFeaturelayers(this.indexLayer);
        this.indexLayer = -1;
      },

      showLayerFields: function(tr) {
        var tds = query(".action-item-parent", tr);
        if (tds && tds.length) {
          var data = this.displayLayersTable.getRowData(tr);
          if (data.edit) {
            this.displayFieldsTable.clear();
            domStyle.set(this.fistPageDiv, "display", "none");
            domStyle.set(this.secondPageDiv, "display", "");

            var len = this.featurelayers.length;
            for (var i = 0; i < len; i++) {
              if (data.label.toLowerCase() === this.featurelayers[i].label.toLowerCase()) {
                this.indexLayer = i;
                layer = this.featurelayers[i].layer;
                var count = this.featurelayers[i].fields.length;
                for (var m = 0; m < count; m++) {
                  var field = this.featurelayers[i].fields[m];
                  this.displayFieldsTable.addRow({
                    fieldName: field.fieldName,
                    isEditable: field.isEditable,
                    label: field.label
                  });
                }
                break;
              }
            }
          }
        }
      },

      onToolbarSelected: function() {
        if (!this.toolbarVisible.checked) {
          this.mergeVisible.set('checked', false);
          this.cutVisible.set('checked', false);
          this.reshapeVisible.set('checked', false);
        } else {
          this.mergeVisible.set('checked', true);
          this.cutVisible.set('checked', true);
          this.reshapeVisible.set('checked', true);
        }
      },

      setConfig: function(config) {
        this.displayLayersTable.clear();
        this.featurelayers.length = 0;
        if (config.editor.layerInfos) {
          this.initSelectLayer();
        }
      },

      initSelectLayer: function() {
        var count = 0, label = "";
        var len = this.map.graphicsLayerIds.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layer.type === "Feature Layer" && layer.url && layer.isEditable()) {
            var fields = [];
            var allFields = this.getAllFieldsInfo(layer);
            if(!allFields){
              count = layer.fields.length;
              for (var m = 0; m < count; m++) {
                if(!layer.fields[m].alias){
                  layer.fields[m].alias = layer.fields[m].name;
                }
                fields.push({
                  fieldName: layer.fields[m].name,
                  label: layer.fields[m].alias,
                  isEditable: true
                });
              }
            }else{
              fields = allFields;
            }
            

            label = this.getOperationalLayerTitle(layer);
            var edit = this.isLayerInConfig(layer);
            this.featurelayers.push({
              label: label,
              layer: layer,
              fields: fields,
              edit: edit
            });
            this.displayLayersTable.addRow({
              label: label,
              edit: edit,
              disableGeometryUpdate: this.getGeometryUpdate(layer)
            });
          }
        }
      },

      isLayerInConfig: function(layer) {
        if (this.config.editor.layerInfos) {
          var info = this.config.editor.layerInfos;
          var len = info.length;
          for (var i = 0; i < len; i++) {
            if (info[i].featureLayer && info[i].featureLayer.url) {
              if (info[i].featureLayer.url.toLowerCase() === layer.url.toLowerCase()) {
                return true;
              }
            }
          }
        }
        return false;
      },

      getGeometryUpdate: function(layer) {
        if (this.config.editor.layerInfos) {
          var info = this.config.editor.layerInfos;
          var len = info.length;
          for (var i = 0; i < len; i++) {
            if (info[i].featureLayer && info[i].featureLayer.url) {
              if (info[i].featureLayer.url.toLowerCase() === layer.url.toLowerCase()) {
                return info[i].disableGeometryUpdate;
              }
            }
          }
        }
        return false;
      },

      getAllFieldsInfo: function(layer) {
        if (this.config.editor.layerInfos) {
          var info = this.config.editor.layerInfos;
          var len = info.length;
          for (var i = 0; i < len; i++) {
            if (info[i].featureLayer && info[i].featureLayer.url) {
              if (info[i].featureLayer.url.toLowerCase() === layer.url.toLowerCase()) {
                return info[i].fieldInfos;
              }
            }
          }
        }
        return null;
      },

      getOperationalLayerTitle: function(layer) {
        var title = "";
        if (this.appConfig.map && this.appConfig.map.operationallayers) {
          var len = this.appConfig.map.operationallayers.length;
          for (var i = 0; i < len; i++) {
            if (this.appConfig.map.operationallayers[i].url.toLowerCase() === layer.url.toLowerCase()) {
              title = this.appConfig.map.operationallayers[i].label;
              break;
            }
          }
        }
        if (!title) {
          title = layer.name;
        }
        if (!title) {
          title = layer.url;
        }
        return title;
      },

      resetFeaturelayers: function(index){
        var fieldInfos = [];
        var data = this.displayFieldsTable.getData();
        if(this.indexLayer > -1 && this.indexLayer === index){
          var len = data.length;
          for (var i = 0; i < len; i++) {
            var field = {};
            field.fieldName = data[i].fieldName;
            field.label = data[i].label;
            field.isEditable = data[i].isEditable;
            fieldInfos.push(field);
          }
          this.featurelayers[this.indexLayer].fields = fieldInfos;
        }else if(index > -1){
          fieldInfos = this.featurelayers[index].fields;
        }
        return fieldInfos;
      },

      getConfig: function() {
        this.config.editor.enableUndoRedo = this.enableUndoRedo.checked;
        this.config.editor.toolbarVisible = this.toolbarVisible.checked;
        this.config.editor.toolbarOptions.mergeVisible = this.mergeVisible.checked;
        this.config.editor.toolbarOptions.cutVisible = this.cutVisible.checked;
        this.config.editor.toolbarOptions.reshapeVisible = this.reshapeVisible.checked;

        var data = this.displayLayersTable.getData();
        var len = this.featurelayers.length;
        this.config.editor.layerInfos = [];
        for (var i = 0; i < len; i++) {
          if (data[i].edit) {
            var json = {};
            json.featureLayer = {};
            json.featureLayer.url = this.featurelayers[i].layer.url;
            json.disableGeometryUpdate = data[i].disableGeometryUpdate;
            json.fieldInfos = [];
            json.fieldInfos = this.resetFeaturelayers(i);
            if (!json.fieldInfos || !json.fieldInfos.length) {
              delete json.fieldInfos;
            }
            this.config.editor.layerInfos.push(json);
          }
        }
        return this.config;
      }

    });
  });