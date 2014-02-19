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
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/aspect',
    'dojo/Deferred',
    'dojo/cookie',
    'dojo/json',
    'dojo/topic',
    'dojo/request/xhr',
    'esri/arcgis/Portal',
    'esri/request'
  ],
  function(lang, declare, aspect, Deferred, cookie, json, topic, xhr, esriPortal, esriRequest) {
    var mo = {}, portals = [];

    //extend the portal to add some functions
    var MyPortal = declare([esriPortal.Portal], {

      getItemById: function(itemId){
        var def = new Deferred(), qp;
        qp = {
          q: 'id:' + itemId
        };

        this.queryItems(qp).then(function(result){
          if(result.total === 0){
            def.resolve({});
          }else{
            def.resolve(result.results[0]);
          }
        }, function(err){
          def.reject(err);
        });
        return def;
      },

      getItemDataById: function(itemId) {
        return  esriRequest({
          url:  this.portalUrl + "/content/items/" + itemId + "/data",
          content:{f:"json"}
        });
      },

      addTextItem: function(userId, meta, data){
        return esriRequest({
          url: this.portalUrl + 'content/users/' + userId + '/addItem',
          content: {
            title: meta.title,
            tags: meta.tags,
            description: meta.description,
            text: typeof data === 'string'?data: JSON.stringify(data),
            type: meta.type,
            f: 'json'
          }
        }, {
          usePost: true
        });
      },

      updateItem: function(userId, itemId, meta, data){
        return esriRequest({
          url: this.portalUrl + 'content/users/' + userId + '/items/' + itemId + '/update',
          content: {
            title: meta.title,
            description: meta.description,
            text: typeof data === 'string'?data: JSON.stringify(data),
            f: 'json'
          }
        }, {
          usePost: true
        });
      }
    });

    mo.getPortal = function(portalUrl) {
      var portal = getPortal(portalUrl);
      if(portal){
        return portal;
      }
      portal = new MyPortal(portalUrl);
      portals.push(portal);
      return portal;
    };

    function getPortal(portalUrl){
      for(var i = 0; i < portals.length; i++){
        if(portals[i].url === portalUrl){
          return portals[i];
        }
      }
    }

    return mo;
  });
