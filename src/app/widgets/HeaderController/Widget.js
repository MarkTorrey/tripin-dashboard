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
  'dojo/Deferred',
  'dojo/query',
  'dojo/NodeList-dom',
  'dojo/NodeList-manipulate',
  'dojo/on',
  'jimu/BaseWidget',
  './PoolControllerMixin',
  'jimu/tokenUtils',
  'jimu/utils',
  'jimu/LayoutManager',
  './PopupTileNodes'
],
function(declare, lang, array, html, topic, aspect, Deferred, query, nld, nlm, on,
  BaseWidget, PoolControllerMixin, tokenUtils, utils, LayoutManager, PopupTileNodes) {
  /* global jimuConfig */
  /* jshint scripturl:true */
  var clazz = declare([BaseWidget, PoolControllerMixin], {

    baseClass: 'jimu-widget-header-controller jimu-main-bgcolor',

    maxIconCount: -1,

    //whether need to create more icon
    createMoreIcon: false,

    //title, links are switchable depends the browser width
    switchableElements: {},

    //the default height of the widget
    height: 40,

    //the opened group/widget's id
    openedId: '',

    constructor: function(){
      this.layoutManager = LayoutManager.getInstance();
    },

    postCreate: function(){
      this.inherited(arguments);

      //set config here because that we don't support multipl controller widget for now
      this.config.widgets = 'all';
      this.config.groups = 'all';

      this._processGroupSetting();

      this.switchableElements.title = this.titleNode;
      this.switchableElements.links = this.linksNode;
      this.switchableElements.subtitle = this.subtitleNode;

      if(this.position && this.position.height){
        this.height = this.position.height;
      }

      html.setStyle(this.logoNode, {
        width: '30px',
        height: '30px'
      });

      if(!this.appConfig.portalUrl){
        html.setStyle(this.signInSectionNode, 'display', 'none');
      }else{
        html.setStyle(this.signInSectionNode, 'display', '');
      }

      html.setAttr(this.logoNode, 'src', this.appConfig.logo? this.appConfig.logo: this.folderUrl + 'images/app-logo.png');
      this.switchableElements.title.innerHTML = this.appConfig.title? this.appConfig.title: '';
      this.switchableElements.subtitle.innerHTML = this.appConfig.subtitle? this.appConfig.subtitle: '';

      this._createDynamicLinks(this.appConfig.links);
      if(this.appConfig.about){
        html.setStyle(this.aboutNode, 'display', '');
        this.aboutNode.visible = true;
      }else{
        html.setStyle(this.aboutNode, 'display', 'none');
        this.aboutNode.visible = false;
      }
    },

    startup: function(){
      this.inherited(arguments);
      this.resize();
    },

    onSignIn: function(credential){
      this.inherited(arguments);

      html.setStyle(this.signinLinkNode, 'display', 'none');
      html.setStyle(this.userNameLinkNode, 'display', '');
      html.setStyle(this.signoutLinkNode, 'display', '');

      this.userNameLinkNode.innerHTML = credential.userId;
      html.setAttr(this.userNameLinkNode, 'href', this.appConfig.portalUrl + 'home/user.html');

      //popup
      if(this.popupLinkNode){
        html.setStyle(this.popupSigninNode, 'display', 'none');
        html.setStyle(this.popupUserNameNode, 'display', '');
        html.setStyle(this.popupSignoutNode, 'display', '');

        query('a', this.popupUserNameNode).html(credential.userId)
        .attr('href', this.appConfig.portalUrl + 'home/user.html');

        utils.setVerticalCenter(this.popupLinkNode);
      }

      this.resize();
    },

    onSignOut: function(){
      this.inherited(arguments);
      
      html.setStyle(this.signinLinkNode, 'display', '');
      html.setStyle(this.userNameLinkNode, 'display', 'none');
      html.setStyle(this.signoutLinkNode, 'display', 'none');

      this.userNameLinkNode.innerHTML = '';

      //popup
      if(this.popupLinkNode){
        html.setStyle(this.popupSigninNode, 'display', '');
        html.setStyle(this.popupUserNameNode, 'display', 'none');
        html.setStyle(this.popupSignoutNode, 'display', 'none');

        query('a', this.popupUserNameNode).html('');

        utils.setVerticalCenter(this.popupLinkNode);
      }

      this.resize();
    },

    resize: function(){
      var box = html.getContentBox(this.domNode);

      if(box.w <= jimuConfig.widthBreaks[0]){
        //full screen
        this._showSwitchableElements([]);
      }else if(box.w <= jimuConfig.widthBreaks[1]){
        this._showSwitchableElements(['title', 'links']);
      }else{
        this._showSwitchableElements(['title', 'links', 'subtitle']);
      }

      setTimeout(lang.hitch(this, function(){
        this._createIconNodes();
      }), 50);

      if(this.morePane){
        html.setStyle(this.morePane.domNode, utils.getPositionStyle(this._getMorePanelSize()));
        this.morePane.resize();
      }
      if(this.popupLinkNode){
        html.setStyle(jimuConfig.layoutId, {
          left: html.getContentBox(this.popupLinkNode).w + 'px'
        });
      }
      utils.setVerticalCenter(this.domNode);
    },

    onAppConfigChanged: function(appConfig, reason, changedData){
      switch(reason){
      case 'attributeChange':
        this._onAttributeChange(appConfig, changedData);
        break;
      case 'widgetChange':
        if(this.widgetIsControlled(appConfig, changedData.id)){
          //if widget is controlled by this controller, the resize
          //will re-create all widget icons
          this.appConfig = appConfig;
          this._processGroupSetting();
        }else{
          return;
        }
        break;
      case 'widgetPoolChange':
        this.appConfig = appConfig;
        this._processGroupSetting();
        break;
      default:
        return;
      }
      this.resize();
    },

    _onAttributeChange: function(appConfig, changedData){
      if(changedData.title && changedData.title !== this.appConfig.title){
        this.titleNode.innerHTML = changedData.title;
      }
      if(changedData.subtitle && changedData.subtitle !== this.appConfig.subtitle){
        this.subtitleNode.innerHTML = changedData.subtitle;
      }
      if(changedData.logo){
        html.setAttr(this.logoNode, 'src', changedData.logo);
      }
      if(changedData.links){
        this._createDynamicLinks(changedData.links);
      }
    },

    _processGroupSetting: function(){
      function getOpenType(gLabel){
        for(var i = 0; i < this.config.groupSetting.length; i++){
          if(this.config.groupSetting[i].label === gLabel){
            return this.config.groupSetting[i].type;
          }
        }
        //this is the default open type
        return 'openAll';
      }
      array.forEach(this.appConfig.widgetPool.groups, function(g){
        g.openType = getOpenType.call(this, g.label);
      }, this);
    },

    _createDynamicLinks: function(links){
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

    _showSwitchableElements: function(showElement){
      var es = this.switchableElements;

      for(var p in es){
        if(es.hasOwnProperty(p)){
          if(showElement.indexOf(p) > -1){
            html.setStyle(es[p], 'display', '');
            es[p].visible = true;
          }else{
            html.setStyle(es[p], 'display', 'none');
            es[p].visible = false;
          }
        }
      }
      //links is hidden
      if(this.logoClickHandle){
        this.logoClickHandle.remove();
      }

      if(showElement.indexOf('links') < 0){
        this.logoClickHandle = on(this.logoNode, 'click', lang.hitch(this, this._onLogoClick));
        html.setStyle(this.logoNode, {
          cursor: 'pointer'
        });
      }else{
        if(this.popupLinksVisible){
          this._hidePopupLink();
        }
        html.setStyle(this.logoNode, {
          cursor: 'default'
        });
      }
    },

    _switchSignin: function(){
      if(tokenUtils.userHaveSignIn()){
        this.onSignIn(tokenUtils.getCredential());
      }else{
        this.onSignOut();
      }
    },

    _onLogoClick: function(){
      if(!this.popupLinkNode){
        this.popupLinkNode = this._createPopupLinkNode();
        this._switchSignin();
      }
      
      if(this.popupLinksVisible){
        this.popupLinksVisible = false;
        this._hidePopupLink();
      }else{
        this.popupLinksVisible = true;
        this._showPopupLink();
      }
    },

    _hidePopupLink: function(){
      html.setStyle(this.popupLinkNode, 'display', 'none');
      html.setStyle(jimuConfig.layoutId, {
        left: 0
      });
    },

    _showPopupLink: function(){
      html.setStyle(this.popupLinkNode, 'display', '');
      html.setStyle(jimuConfig.layoutId, {
        left: html.getContentBox(this.popupLinkNode).w + 'px'
      });
    },

    _createPopupLinkNode: function(){
      var node, titleNode, box;
      box = html.getContentBox(jimuConfig.mainPageId);

      node = html.create('div', {
        'class': 'popup-links',
        style: {
          position: 'absolute',
          zIndex: 100,
          left: 0,
          top: 0,
          bottom: 0,
          right: '50px'
        }
      }, jimuConfig.mainPageId);

      titleNode = html.create('div', {
        'class': 'popup-title',
        style: {
          height: this.height + 'px',
          width: '100%'
        }
      }, node);

      html.create('img', {
        'class': 'logo jimu-vcenter',
        src: this.appConfig.logo? this.appConfig.logo: this.folderUrl + 'images/app-logo.png',
        style: {
          width: '30px',
          height: '30px'
        }
      }, titleNode);

      html.create('div', {
        'class': 'title jimu-vcenter',
        innerHTML: this.appConfig.title
      }, titleNode);

      array.forEach(this.appConfig.links, function(link){
        this._createLinkNode(node, link, false);
      }, this);

      this.popupSigninNode = this._createLinkNode(node, {label: 'SignIn', url: 'javascript:void(0)'}, true);
      this.popupUserNameNode = this._createLinkNode(node, {label: '', url: 'javascript:void(0)'}, true);
      this.popupSignoutNode = this._createLinkNode(node, {label: 'SignOut', url: 'javascript:void(0)'}, true);

      on(this.popupSigninNode, 'click', (this._onSigninClick).bind(this));
      on(this.popupSignoutNode, 'click', (this._onSignoutClick).bind(this));
      utils.setVerticalCenter(node);
      //empty
      this._createLinkNode(node, {label: '', url: 'javascript:void(0)'}, false);
      return node;
    },

    _createLinkNode: function(containerNode, link, isSign){
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

    _onAboutClick: function(){
      var widgetConfig = {
        id: this.appConfig.about + '_1',
        uri: this.appConfig.about,
        label: 'About'
      };
      this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget){
        html.place(widget.domNode, jimuConfig.mainPageId);
        widget.startup();
      }));
    },

    _onUserNameClick: function(){

    },

    _getHeaderSectionWidth: function(){
    //calc width here because that using html.getMarginBox(this.headerNode) is not right sometimes
      var width;
      var logow = html.getMarginBox(this.logoNode).w;
      var titlesw = html.getMarginBox(this.titlesNode).w;
      var linksw = html.getMarginBox(this.linksNode).w;
      //add some margein to avoid mess layout
      width = logow + titlesw + linksw + 5;
      // console.log('w:', logow, titlesw, linksw);
      return width;
    },

    _createIconNodes: function(){
      html.empty(this.containerNode);
      this._closeDropMenu();

      var box = html.getContentBox(this.domNode), i, iconConfig, allIconConfigs = this.getAllConfigs();
      var headSectionWidth = this._getHeaderSectionWidth();
      var emptyWidth = 1/10 * box.w;
      //by default, the icon is square
      this.iconWidth = box.h;

      //set header section width here because that the header section can't display right sometime when using auto width
      html.setStyle(this.headerNode, {
        width: headSectionWidth + 'px'
      });

      //the container width
      var containerWidth = box.w - headSectionWidth - emptyWidth;
      if(containerWidth < this.iconWidth){
        // the icon section is not enough to put one icon, so change the empty width to
        // get more icon section width
        emptyWidth = emptyWidth - this.iconWidth + containerWidth;
        containerWidth = this.iconWidth;
      }

      html.setStyle(this.containerNode, {
        width: containerWidth + 'px',
        marginLeft: (emptyWidth - 2) + 'px'//leave some space to avoid mess layout in some browser
      });

      this.maxIconCount = Math.floor(containerWidth / this.iconWidth);
      if(this.maxIconCount >= allIconConfigs.length){
        this.headerIconCount = allIconConfigs.length;
        this.createMoreIcon = false;
      }else{
        this.headerIconCount = this.maxIconCount - 1;
        this.createMoreIcon = true;
      }
      if(this.createMoreIcon){
        this._createIconNode({label: 'more'});
      }
      for(i = this.headerIconCount - 1; i >= 0; i--){
        iconConfig = allIconConfigs[i];
        this._createIconNode(iconConfig);
      }
      utils.setVerticalCenter(this.domNode);
    },

    _createIconNode: function(iconConfig){
      var node, iconUrl;
      if(iconConfig.label === 'more'){
        iconUrl = this.folderUrl + 'images/more_icon.png';
      }else{
        iconUrl = iconConfig.icon;
      }

      node = html.create('div', {
        'class': 'icon-node',
        title: iconConfig.label,
        settingId: iconConfig.id,
        style: {
          width: this.height + 'px',
          height: this.height + 'px'
        }
      }, this.containerNode);

      html.create('img', {
        'class': 'jimu-vcenter',
        src: iconUrl
      }, node);

      if(iconConfig.label === 'more'){
        on(node, 'click', lang.hitch(this, this._showMorePane, iconConfig));
      }else{
        on(node, 'click', lang.hitch(this, function(){
          this._onIconClick(node);
        }));
      }
      node.config = iconConfig;
      if(iconConfig.defaultState){
        this.openedId = iconConfig.id;
        this._switchNodeToOpen(this.openedId);
      }
      if(node.config.widgets && node.config.widgets.length > 1 && node.config.openType === 'dropDown'){
        this._createDropTriangle(node);
      }

      //set current open node
      if(this.openedId === iconConfig.id){
        html.addClass(node, 'jimu-state-selected');
        if(node.config.widgets && node.config.widgets.length > 1 && node.config.openType === 'dropDown'){
          this._openDropMenu(node);
        }
      }
      return node;
    },

    _createDropTriangle: function(node){
      var box = html.getMarginBox(node);
      var triangleLeft = box.l + box.w / 2 - 4;
      html.create('div', {
        'class': 'drop-triangle',
        style: {
          left: triangleLeft + 'px'
        }
      }, node);
    },

    _onIconClick: function(node){
      if(!node.config.widgets || node.config.widgets.length === 1 || node.config.openType === 'openAll'){
        //widget or group with 'openAll' open type
        if(this.openedId && this.openedId === node.config.id){
          return;
        }else{
          if(this.openedId){
            this._switchNodeToClose(this.openedId).then(lang.hitch(this, function(){
              this._switchNodeToOpen(node.config.id);
            }));
          }else{
            this._switchNodeToOpen(node.config.id);
          }
        }
      }else{
        if(this.openedId && this.openedId === node.config.id){
          this.openedId = '';
          this._closeDropMenu();
        }else{
          this.openedId = node.config.id;
          this._openDropMenu(node);
        }
      }
    },

    _closeDropMenu: function(){
      if(this.dropMenuNode){
        html.destroy(this.dropMenuNode);
        this.dropMenuNode = null;
      }
    },

    _openDropMenu: function(pnode){
      this.dropMenuNode = html.create('div', {
        'class': 'jimu-drop-menu',
        title: pnode.config.label,
        style: {
          position: 'absolute'
        }
      });

      html.place(this.dropMenuNode, this.containerNode);

      this._setDropMenuPosition(pnode);

      array.forEach(pnode.config.widgets, function(widgetConfig) {
        this._createDropMenuItem(widgetConfig);
      }, this);
      
      if(this.morePane){
        this.morePane.hide();
      }
    },

    _createDropMenuItem: function (sconfig) {
      var node = html.create('div', {
        'class': 'menu-item',
        title: sconfig.label,
        style: {
          height: this.height + 'px'
        }
      }, this.dropMenuNode);

      html.create('img', {
        src: sconfig.icon
      }, node);

      html.create('div', {
        'class': 'label',
        innerHTML: sconfig.label
      }, node);

      this.own(on(node, 'click', lang.hitch(this, function() {
        this._closeDropMenu();
        this._showIconContent(node);
      })));
      node.config = sconfig;
      return node;
    },

    _setDropMenuPosition: function(pnode) {
      var position = {}, box = html.getMarginBox(pnode), thisBox = html.getMarginBox(this.domNode);
      position.right = thisBox.w - box.l - box.w;
      position.top = this.height + 1;
      html.setStyle(this.dropMenuNode, utils.getPositionStyle(position));
    },

    _switchNodeToOpen: function(id){
      var node = this._getIconNodeById(id);
      query('.icon-node', this.domNode).removeClass('jimu-state-selected');
      html.addClass(node, 'jimu-state-selected');
      this._showIconContent(node);
    },

    _switchNodeToClose: function(id){
      query('.icon-node', this.domNode).removeClass('jimu-state-selected');

      return this.panelManager.closePanel(id + '_panel');
    },

    _getIconNodeById: function(id){
      var node = query('.icon-node[settingId="' + id + '"]', this.domNode);
      if(node.length === 0){
        return;
      }
      return node[0];
    },

    _onPanelClose: function(id){
      query('.icon-node[settingId="' + id + '"]', this.domNode).removeClass('jimu-state-selected');
      this.openedId = '';
    },

    _showIconContent: function(node){
      var iconConfig = node.config;

      if(iconConfig.widgets){
        this.layoutManager.loadPoolGroup(iconConfig).then(lang.hitch(this, function(panel){
          this.openedId = iconConfig.id;
          this.own(aspect.after(panel, 'onClose', lang.hitch(this, function(){
            this._onPanelClose(iconConfig.id);
          })));
        }));
      }else{
        this.layoutManager.loadPoolWidget(iconConfig).then(lang.hitch(this, function(panel){
          this.openedId = iconConfig.id;
          this.own(aspect.after(panel, 'onClose', lang.hitch(this, function(){
            this._onPanelClose(iconConfig.id);
          })));
        }));
      }
    },

    _showMorePane: function(){
      var i, iconConfig, moreItems = [], allIconConfigs = this.getAllConfigs();

      for(i = this.headerIconCount; i < allIconConfigs.length; i++){
        iconConfig = allIconConfigs[i];
        moreItems.push(iconConfig);
      }
      if(this.morePane){
        this.morePane.destroy();
      }
      this.morePane = new PopupTileNodes({
        openedId: this.openedId,
        items: moreItems
      });
      this._createCoverNode();
      html.place(this.morePane.domNode, jimuConfig.mapId);
      html.setStyle(this.morePane.domNode, utils.getPositionStyle(this._getMorePanelSize()));
      this.morePane.startup();

      aspect.after(this.morePane, 'onNodeClicked', lang.hitch(this, function(node){
        this._moveConfigToHeader(node.config);
        this._createIconNodes();
        this._onIconClick(this._getIconNodeById(node.config.id));
      }), true);
      aspect.after(this.morePane, 'hide', lang.hitch(this, function(){
        html.destroy(this.moreIconPaneCoverNode);
      }), true);
    },

    _moveConfigToHeader: function(config){
      var allIconConfigs = this.getAllConfigs();

      var tempIndex = config.index;
      config.index = allIconConfigs[this.headerIconCount - 1].index;
      allIconConfigs[this.headerIconCount - 1].index = tempIndex;
    },

    _createCoverNode: function(){
      this.moreIconPaneCoverNode = html.create('div', {
        'class': 'jimu-more-icon-cover'
      }, jimuConfig.mapId);
    },

    _getMorePanelSize: function(){
      var mapBox, minLen, position;
      mapBox = html.getContentBox(jimuConfig.mapId);
      minLen = Math.min(mapBox.w, mapBox.h);
      if(minLen < 600){
        if(mapBox.w < mapBox.h){
          position = {
            left: 20,
            right: 20,
            top: (mapBox.h - (mapBox.w - 40))/2,
            height: mapBox.w - 40,
            width: '',
            bottom: ''
          };
        }else{
          position = {
            top: 20,
            bottom: 20,
            left: (mapBox.w - (mapBox.h - 40))/2,
            width: mapBox.h - 40,
            height: '',
            right: ''
          };
        }
      }else{
        position = {
          top: (mapBox.h - 560)/2,
          left: (mapBox.w - 560)/2,
          width: 560,
          height: 560,
          right: '',
          bottom: ''
        };
      }
      return position;
    }
  });
  clazz.inPanel = false;
  return clazz;
});