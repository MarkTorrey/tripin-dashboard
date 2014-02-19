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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/topic',
  'dojo/aspect',
  'dojo/query',
  'dojo/NodeList-dom',
  'dojo/NodeList-manipulate',
  'dojo/on',
  'require',
  'jimu/BaseWidget',
  'jimu/tokenUtils',
  'jimu/utils'
],
function(declare, lang, array, html, topic, aspect, query, nld, nlm, on, require,
  BaseWidget, tokenUtils, utils) {
  /* global jimuConfig */
  /*jshint scripturl:true*/
  var clazz = declare([BaseWidget], {

    baseClass: 'jimu-widget-header jimu-main-bgcolor',
    name: 'Header',

    switchableElements: {},

    constructor: function(){
      this.height = this.getHeaderHeight() + 'px';
    },

    postCreate: function(){
      this.inherited(arguments);
      var logoH = this.getLogoHeight() + 'px';

      this.switchableElements.logo = query('.logo', this.domNode);
      this.switchableElements.title = query('.title', this.domNode);
      this.switchableElements.links = query('.links', this.domNode);
      this.switchableElements.subtitle = query('.subtitle', this.domNode);

      this.switchableElements.logo.style({
        width: logoH,
        height: logoH
      });

      if(!this.appConfig.portalUrl){
        html.setStyle(this.signInSectionNode, 'display', 'none');
      }else{
        html.setStyle(this.signInSectionNode, 'display', '');
      }
    },

    startup: function(){
      this.inherited(arguments);

      this.switchableElements.logo.attr('src', this.appConfig.logo? this.appConfig.logo: this.folderUrl + 'images/app-logo.png');
      this.switchableElements.title.innerHTML(this.appConfig.title? this.appConfig.title: 'ArcGIS Web Application');
      this.switchableElements.subtitle.innerHTML(this.appConfig.subtitle? this.appConfig.subtitle: 'A configurable web application');

      this.createDynamicLinks(this.appConfig.links);

      if(this.appConfig.about){
        html.setStyle(this.aboutNode, 'display', '');
      }else{
        html.setStyle(this.aboutNode, 'display', 'none');
      }
    },

    createDynamicLinks: function(links){
      html.empty(this.dynamicLinksNode);
      array.forEach(links, function(link){
        html.create('a', {
          href: link.url,
          target: '_blank',
          innerHTML: link.label,
          'class': "link jimu-vcenter-text"
        }, this.dynamicLinksNode);
      }, this);
    },

    onSignIn: function(credential){
      this.inherited(arguments);

      html.setStyle(this.signinLinkNode, 'display', 'none');
      html.setStyle(this.userNameLinkNode, 'display', 'inline');
      html.setStyle(this.signoutLinkNode, 'display', 'inline');

      this.userNameLinkNode.innerHTML = credential.userId;
      html.setAttr(this.userNameLinkNode, 'href', this.appConfig.portalUrl + 'home/user.html');

      //popup
      if(this.popupLinkNode){
        html.setStyle(this.popupSigninNode, 'display', 'none');
        html.setStyle(this.popupUserNameNode, 'display', 'block');
        html.setStyle(this.popupSignoutNode, 'display', 'block');

        query('a', this.popupUserNameNode).html(credential.userId)
        .attr('href', this.appConfig.portalUrl + 'home/user.html');
      }

      this.resize();
    },

    onSignOut: function(){
      this.inherited(arguments);
      
      html.setStyle(this.signinLinkNode, 'display', 'inline');
      html.setStyle(this.userNameLinkNode, 'display', 'none');
      html.setStyle(this.signoutLinkNode, 'display', 'none');

      this.userNameLinkNode.innerHTML = '';

      //popup
      if(this.popupLinkNode){
        html.setStyle(this.popupSigninNode, 'display', 'block');
        html.setStyle(this.popupUserNameNode, 'display', 'none');
        html.setStyle(this.popupSignoutNode, 'display', 'none');

        query('a', this.popupUserNameNode).html('');
      }

      this.resize();
    },

    switchElements: function(showElement){
      var es = this.switchableElements;

      for(var p in es){
        if(es.hasOwnProperty(p)){
          if(p === 'logo'){
            es[p].style('display', 'block');
          }else if(showElement.indexOf(p) > -1){
            es[p].style('display', 'block');
          }else{
            es[p].style('display', 'none');
          }
        }
      }
      //links is hidden
      if(this.logoClickHandle){
        this.logoClickHandle.remove();
      }

      if(showElement.indexOf('links') < 0){
        this.linksVisible = false;
        this.logoClickHandle = on(es.logo[0], 'click', lang.hitch(this, this.switchPopupLinks));
      }else{
        if(this.linksVisible){
          this.switchPopupLinks();
        }
      }
    },

    switchSignin: function(){
      if(tokenUtils.userHaveSignIn()){
        this.onSignIn(tokenUtils.getCredential());
      }else{
        this.onSignOut();
      }
    },

    switchPopupLinks: function(){
      if(!this.popupLinkNode){
        this.popupLinkNode = this.createPopupLinkNode();
        this.switchSignin();
      }
      
      if(this.linksVisible){
        this.linksVisible = false;
        html.setStyle(this.popupLinkNode, 'display', 'none');
        html.setStyle(jimuConfig.layoutId, {
          left: 0
        });
      }else{
        this.linksVisible = true;
        html.setStyle(this.popupLinkNode, 'display', 'block');
        html.setStyle(jimuConfig.layoutId, {
          left: html.getContentBox(this.popupLinkNode).w + 'px'
        });
      }
    },

    createPopupLinkNode: function(){
      var node, titleNode, box;
      box = html.getContentBox(jimuConfig.configPreviewId);

      node = html.create('div', {
        'class': 'popup-links',
        style: {
          position: 'absolute',
          zIndex: 100,
          left: 0,
          top: 0,
          bottom: 0,
          width: (box.w - 50) + 'px'
        }
      }, jimuConfig.configPreviewId);

      titleNode = html.create('div', {
        'class': 'popup-title',
        style: {
          height: this.getHeaderHeight() + 'px',
          width: '100%'
        }
      }, node);

      html.create('img', {
        'class': 'logo jimu-vcenter',
        src: this.config.logo? this.config.logo: this.folderUrl + 'images/app-logo.png',
        style: {
          width: this.getLogoHeight() + 'px',
          height: this.getLogoHeight() + 'px'
        }
      }, titleNode);

      html.create('div', {
        'class': 'title jimu-vcenter',
        innerHTML: this.appConfig.title
      }, titleNode);

      utils.setVerticalCenter(titleNode);

      array.forEach(this.appConfig.links, function(link){
        this.createLinkNode(node, link, false);
      }, this);

      this.popupSigninNode = this.createLinkNode(node, {label: 'SignIn', url: 'javascript:void(0)'}, true);
      this.popupUserNameNode = this.createLinkNode(node, {label: '', url: 'javascript:void(0)'}, true);
      this.popupSignoutNode = this.createLinkNode(node, {label: 'SignOut', url: 'javascript:void(0)'}, true);

      on(this.popupSigninNode, 'click', (this._onSigninClick).bind(this));
      on(this.popupSignoutNode, 'click', (this._onSignoutClick).bind(this));
      utils.setVerticalCenter(node);
      //empty
      this.createLinkNode(node, {label: '', url: 'javascript:void(0)'}, false);
      return node;
    },

    createLinkNode: function(containerNode, link, isSign){
      var node, lineNode, linkSectionNode, className;

      node = html.place('<div class="link"></div>', containerNode);

      lineNode = html.place('<div class="line"></div>', node);
      if(isSign){
        className = 'link-section signin';
      }else{
        className = 'link-section';
      }
      linkSectionNode = html.place('<div class="' + className + '"></div>', node);
      html.create('a', {
        href: link.url,
        target: '_blank',
        innerHTML: link.label,
        'class': "jimu-vcenter-text"
      }, linkSectionNode);

      return node;
    },

    _onSigninClick: function(){
      tokenUtils.signIn(this.appConfig.portalUrl, this.appConfig.appId);
    },

    _onSignoutClick: function(){
      tokenUtils.signOut();
    },

    _onUserNameClick: function(){

    },

    _onAboutClick: function(){
      var widgetConfig = {
        id: this.appConfig.about + '_1',
        uri: this.appConfig.about,
        label: 'About'
      };
      this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget){
        html.place(widget.domNode, jimuConfig.layoutId);
        widget.startup();
      }));
    },

    resize: function(){
      var box = html.getContentBox(this.domNode);

      if(box.w <= jimuConfig.widthBreaks[0]){
        //full screen
        this.switchElements([]);
      }else if(box.w <= jimuConfig.widthBreaks[1]){
        this.switchElements(['title', 'links']);
      }else{
        this.switchElements(['title', 'links', 'subtitle']);
      }
    },


    getHeaderHeight: function(){
      return 44;
    },

    getHeaderEmptyWidth: function(){
      return 1/8 * html.getMarginBox(this.domNode).w;
    },

    getLogoHeight: function(){
      return 34;
    }

  });
  clazz.hasConfig = false;
  clazz.inPanel = false;
  return clazz;
});