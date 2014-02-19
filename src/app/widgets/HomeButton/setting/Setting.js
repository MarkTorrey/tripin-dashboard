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
    'dojo/_base/lang',
    'dojo/on',
    'esri/SpatialReference',
    "esri/geometry/Extent",
    'jimu/BaseWidgetSetting',
    'jimu/dijit/ExtentChooser',
    "dijit/form/RadioButton"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    lang,
    on,
    SpatialReference,
    Extent,
    BaseWidgetSetting,
    ExtentChooser) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-homebutton-setting',
      extentChooser: null,
      initExtent: null,

      startup: function() {
        this.inherited(arguments);
        if (!this.config.homeButton) {
          this.config.homeButton = {};
        }
        this.extentChooser = new ExtentChooser({
          itemId: this.appConfig.map.itemId
        }, this.extentChooserNode);

        this.own(on(this.homebuttonSetting1, "click", lang.hitch(this, this.clickCheckBox, 1)));
        this.own(on(this.homebuttonSetting2, "click", lang.hitch(this, this.clickCheckBox, 2)));
        this.own(on(this.extentChooser, 'extentChange', lang.hitch(this, this.onExtentChanged)));
        this.setConfig(this.config);
      },

      clickCheckBox: function(index) {
        if (index === 1) {
          this.homebuttonSettingExtent.innerHTML = "";
          if(this.extentChooser.map&&this.initExtent){
            this.extentChooser.map.setExtent(this.initExtent);
          }
        } else {
          if(this.extentChooser.map&&this.extentChooser.map.extent){
            this.onExtentChanged(this.extentChooser.map.extent);
          }
        }
      },

      onExtentChanged: function(extent) {
        if(!this.initExtent){
          this.initExtent = extent;
        }
        if (this.homebuttonSetting2.checked) {
          var label = "<br>wkid: " + extent.spatialReference.wkid;
          label = label + "<br>xmin: " + extent.xmin;
          label = label + "<br>ymin: " + extent.ymin;
          label = label + "<br>xmax: " + extent.xmax;
          label = label + "<br>ymax: " + extent.ymax;
          this.homebuttonSettingExtent.innerHTML = label;
        }else{
          if(this.initExtent){
            this.extentChooser.map.setExtent(this.initExtent);
          }
        }
      },

      setConfig: function(config){
        this.homebuttonSettingExtent.innerHTML = "";
        if (config.homeButton.extent) {
          this.homebuttonSetting2.set('checked', true);
          this.onExtentChanged(config.homeButton.extent);
          this.extentChooser.map.setExtent(new Extent(config.homeButton.extent));
        } else {
          this.homebuttonSetting1.set('checked', true);
          if(this.initExtent){
            this.extentChooser.map.setExtent(this.initExtent);
          }
        }
      },

      getConfig: function() {
        if (this.homebuttonSetting1.checked) {
          this.config.homeButton.extent = null;
        } else {
          this.config.homeButton.extent = this.extentChooser.map.extent.toJson();
        }
        return this.config;
      }

    });
  });