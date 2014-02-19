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
  'jimu/dijit/SimpleTable',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'esri/request'
],
function(declare, SimpleTable, lang, html, array, esriRequest) {
  return declare([SimpleTable], {
    _def:null,
    _layerInfo:null,

    url:null,
    fields:[{name:'name',title:'Name',type:'text',editable:false}],
    selectable:true,

    postCreate:function(){
      this.inherited(arguments);
      html.addClass(this.domNode,'jimu-layer-field-chooser');
      if(typeof this.url === 'string'){
        this.url = lang.trim(this.url);
      }
      else{
        this.url = null;
      }
      this.refresh(this.url);
    },

    refresh:function(url){
      if(typeof url === 'string'){
        url = lang.trim(url);
      }
      else{
        return;
      }
      this.url = url;
      this._layerInfo = null;
      this.clear();
      this._requestLayerInfo(url);
    },

    onRefreshed:function(response){},

    getLayerInfo:function(){
      return this._layerInfo;
    },

    _requestLayerInfo:function(url){
      if(this._def){
        this._def.cancel();
      }
      this._def = esriRequest({
        url:url,
        content:{f:"json"},
        handleAs:"json",
        callbackParamName:"callback"
      });
      this._def.then(lang.hitch(this,function(response){
        this._layerInfo = response;
        if(response && response.fields){
          var fields = array.filter(response.fields,function(item){
            return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeGeometry';
          });
          if(fields.length > 0){
            this._addFieldItems(fields);
          }
          this.onRefreshed(response);
        }
      }),lang.hitch(this,function(error){
        this._layerInfo = null;
        console.error("request layer info failed",error);
      }));
    },

    _addFieldItems:function(fields){
      for(var i=0;i<fields.length;i++){
        this._createFieldItem(fields[i]);
      }
    },

    _createFieldItem:function(fieldInfo){
      var rowData = {
        name:fieldInfo.name||fieldInfo.alias
      };
      var result = this.addRow(rowData);
      if(result.success){
        result.tr.fieldInfo = fieldInfo;
      }
    }

  });
});