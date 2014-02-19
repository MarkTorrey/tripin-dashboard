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
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dijit/_TemplatedMixin',
  'jimu/BaseWidgetPanel'
],
function(declare, lang, html, array, on, _TemplatedMixin, BaseWidgetPanel) {

  return declare([BaseWidgetPanel, _TemplatedMixin], {
    baseClass: 'jimu-widget-panel jimu-title-panel',

    templateString: '<div>' +
      '<div class="title" data-dojo-attach-point="titleNode">' +
      '<div class="title-label jimu-vcenter-text" data-dojo-attach-point="titleLabelNode">${label}</div>' +
      '<div class="close-btn jimu-vcenter" data-dojo-attach-point="closeNode" data-dojo-attach-event="onclick:_onCloseBtnClicked"></div>' +
      '</div>' +
      '<div class="jimu-container" data-dojo-attach-point="containerNode"></div>' +
      '</div>',

    _onCloseBtnClicked: function(){
      this.panelManager.closePanel(this);
    }
  });
});