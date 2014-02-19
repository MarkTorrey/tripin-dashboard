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
    'dojo/cookie',
    'dojo/json',
    'dojo/topic',
    'esri/IdentityManager',
    './OAuthHelper'
  ],
  function(lang, cookie, json, topic, IdentityManager, OAuthHelper) {
    var mo = {}, isAGOL = false, portalUrl;

    var cookiePath = '/';

    //signin from other app
    topic.subscribe('userSignIn', lang.hitch(this, function(credential) {
      if(!IdentityManager.findCredential(portalUrl, credential.username || credential.userId)){
        IdentityManager.registerToken(credential);
      }
    }));
    mo.setPortalUrl = function(_portalUrl){
      if(_portalUrl){
        portalUrl = _portalUrl;
      }
    };

    mo.signIn = function(_portalUrl, appId) {
      mo.setPortalUrl(_portalUrl);

      var credential = getCredentialFromCookie();

      if (credential) {
        topic.publish('userSignIn', credential);
      } else {
        if (portalUrl.toLowerCase().indexOf('.arcgis.com') !== -1) {
          isAGOL = true;
          oAuth2Signin(appId);
        } else {
          isAGOL = false;
          // initIDMSignin();
          IdentityManager.getCredential(portalUrl + 'sharing/').then(function(credential) {
            //always write cookie when user IdentityManager
            signInSuccess(credential, true);
          });
        }
      }
    };

    mo.signOut = function() {
      cookie(getCookieKey(), null, {
        expires: -1,
        path: cookiePath
      });
      topic.publish('userSignOut');
    };

    mo.userHaveSignIn = function(_portalUrl){
      if(_portalUrl !== undefined){
        mo.setPortalUrl(_portalUrl);
      }
      return mo.getCredential(portalUrl) ? true: false;
    };

    mo.getCredential = function(_portalUrl){
      if(_portalUrl !== undefined){
        mo.setPortalUrl(_portalUrl);
      }

      var credential = IdentityManager.findCredential(portalUrl);
      if(credential){
        return credential;
      }else{
        return getCredentialFromCookie();
      }
    };

    function oAuth2Signin(appId) {
      OAuthHelper.init({
        appId: appId,
        portal: portalUrl, //http://www.arcgis.com
        expiration: (7 * 24 * 60), // 1 weeks, in minutes
        popup: true
      });

      OAuthHelper.signIn().then(function(credential) {
        //the cookie has bee writen by OAuthHelper
        signInSuccess(credential, credential.persist);
      });
    }

    function getCredentialFromCookie() {
      var ckie = cookie(getCookieKey(portalUrl)),
        credential;

      if (ckie) {
        var authResponse = json.parse(ckie);
        IdentityManager.registerToken(authResponse);
        credential = IdentityManager.findCredential(portalUrl, authResponse.username || authResponse.userId);
        return credential;
      }else{
        return null;
      }
    }

    function getCookieKey(){
      return 'esri_auth_' + portalUrl;
    }

    function signInSuccess(credential, persist) {
      if (persist) {
        cookie(getCookieKey(), json.stringify(credential), {
          expires: new Date(credential.expires),
          path: cookiePath
        });
      }
      topic.publish('userSignIn', credential);
    }


    return mo;
  });