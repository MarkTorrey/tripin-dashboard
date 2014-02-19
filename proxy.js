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

var request = require('request');

exports.proxyRequest = function() {
  return function(req, res, next) {
    var url;
    if (req.url.indexOf('?') > -1) {
      url = req.url.substr(2);
    } else {
      return next();
    }
    if (req.method === 'GET') {
      request.get(url).pipe(res);
    } else if (req.method === 'POST') {
      request({
        method: 'POST',
        url: url,
        form: req.body
      }).pipe(res);
    } else {
      res.send('support get and post only.');
    }
  };
};
