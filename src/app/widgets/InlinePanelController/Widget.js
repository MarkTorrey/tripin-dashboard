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
  'dojo/topic',
  'dojo/aspect',
  'dojo/query',
  'dojo/dom-construct',
  'dojo/dom-geometry',
  'dojo/on',
  'dojo/mouse',
  'dojo/_base/fx',
  'dojo/fx',
  'dojo/NodeList-manipulate',
  'dojo/NodeList-fx',
  'dijit/layout/_LayoutWidget',
  'jimu/BaseWidget',
  './PoolControllerMixin',
  'jimu/PanelManager',
  'jimu/WidgetManager',
  'jimu/utils'
],
function(declare, lang, array, topic, aspect, query, domConstruct, domGeometry, on, mouse, baseFx, fx,
  nlm, nlfx, _LayoutWidget, BaseWidget, PoolControllerMixin, PanelManager, WidgetManager, utils) {

  var clazz = declare([BaseWidget, PoolControllerMixin], {

    baseClass: 'jimu-widget-tab-controller jimu-main-bgcolor',
    name: 'TabController',

    maxWidth: 350,
    minWidth: 55,
    animTime: 200,

    moreTab: false,
    moreTabOpened: false,
    currentOtherGroup: null,
    lastSelectedIndex: -1,

    constructor: function() {
      this.tabs = [];
      this.panelManager = PanelManager.getInstance();
    },

    startup: function(){
      this.inherited(arguments);
      this.createTabs();
    },

    onMinimize: function(){
      this._resizeToMin();
    },

    onMaximize: function(){
      this._resizeToMax();
      if(this.getSelectedIndex() === -1){
        this.selectTab(0);
      }
    },

    /**This function will be called by layout manager automatically**/
    resize: function(/*jshint unused:false*/ dim){
      array.forEach(this.tabs, function(tab){
        if(!tab.selected){
          return;
        }
        if(tab.panel){
          tab.panel.resize();
        }
      }, this);
    },

    createTabs: function() {
      var allIconConfigs = this.getAllConfigs(), iconConfigs = [];
      if(allIconConfigs.length <= 5){
        iconConfigs = allIconConfigs;
        this.moreTab = false;
      }else{
        iconConfigs = allIconConfigs.splice(0, 4);
        this.moreTab = true;
      }
      array.forEach(iconConfigs, function(iconConfig) {
        this.createTab(iconConfig);
      }, this);
      if(this.moreTab){
        this.createTab({
          label: 'more',
          flag: 'more',
          icon: this.folderUrl + 'images/more_tab_icon.png',
          groups: allIconConfigs
        });
      }
    },

    createTab: function(g) {
      var contentNode = this._createContentNode(g);
      var tab = {
        title: this._createTitleNode(g),
        content: contentNode,
        contentPane: query('.content-pane', contentNode)[0],
        config: g,
        selected: false,
        flag: g.flag,
        widgets: [],
        moreGroupWidgets: []
      };
      this.tabs.push(tab);
      return tab;
    },

    onSelect: function(evt) {
      var node = evt.currentTarget,
        index = parseInt(query(node).attr('i')[0], 10);
      this.selectTab(index);
    },

    selectTab: function(index) {
      var color;

      if(this.tabs[index].selected && this.tabs[index].flag !== 'more'){
        return;
      }
      if(this.tabs[this.getSelectedIndex()] === undefined || this.tabs[this.getSelectedIndex()].flag !== 'more'){
        this.lastSelectedIndex = this.getSelectedIndex();
      }

      query('.tab-indicator', this.domNode).style({width:'0'});
      this._showIndicator(index);

      color = this._getIndicatorNodeByIndex(index).style('backgroundColor');
      query('.content-title-bg', this.tabs[index].content).style({background: color});

      //switch widget and tab state
      array.forEach(this.tabs, function(tab, i) {
        if (index === i) {
          tab.selected = true;
          array.forEach(tab.widgets, function(w) {
            w.setState('maximized');
          });
        } else {
          if(tab.selected){
            tab.selected = false;
            array.forEach(tab.widgets, function(w) {
              w.setState('hidden');
            });
          }
        }
      });

      if(this.tabs[index].flag === 'more'){
        this.showMoreTabContent(this.tabs[index]);
      }else{
        query('.content-node', this.domNode).style({
          display: 'none'
        });
        query(this.tabs[index].content).style({
          display: 'block'
        });

        if (query('.jimu-wc-tpc', this.tabs[index].content).length === 0) {
          this.showTabContent(this.tabs[index]);
        }
      }
      this.resize();
    },

    _getTitleNodeByIndex: function(index){
      var titleNode, contextNode;
      if(this.windowState === 'maximized'){
        contextNode = this.maxStateNode;
      }else{
        contextNode = this.minStateNode;
      }
      titleNode = query('.title-node:nth-child(' + (index + 1) + ')', contextNode);
      return titleNode;
    },

    onMouseEnter: function(evt){
      var node = evt.currentTarget,
      index = parseInt(query(node).attr('i')[0], 10);
      // console.log('onMouseEnter:' + index);
      if(this.windowState === 'maximized' && this.tabs[index].selected && this.tabs[index].flag !== 'more'){
        return;
      }
      this._showIndicator(index);
    },

    onMouseLeave: function(evt){
      var node = evt.currentTarget,
        index = parseInt(query(node).attr('i')[0], 10);
      if(this.windowState === 'maximized' && this.tabs[index].selected &&
        ((this.moreTabOpened && this.tabs[index].flag === 'more') ||
        !this.moreTabOpened && this.tabs[index].flag !== 'more')){
        return;
      }
      // console.log('onMouseLeave:' + index);
      this._hideIndicator(index);
    },

    _getIndicatorNodeByIndex: function(index){
      return query('.tab-indicator', this._getTitleNodeByIndex(index)[0]);
    },

    _showIndicator: function(index){
      var w = domGeometry.getContentBox(this._getTitleNodeByIndex(index)[0]).w;
      this._getIndicatorNodeByIndex(index).animateProperty({
        properties: {width: w},
        duration: this.animTime,
        auto: true
      });
    },

    _hideIndicator: function(index){
      this._getIndicatorNodeByIndex(index).animateProperty({
        properties: {width: 0},
        duration: this.animTime,
        auto: true
      });
    },

    getSelectedIndex: function(){
      var i = 0;
      for(i = 0; i < this.tabs.length; i++){
        if(this.tabs[i].selected){
          return i;
        }
      }
      return -1;
    },

    //can't show more tab
    showTabContent: function(tab) {
      var g = tab.config;
      this.showGroupContent(g, tab);
    },

    showGroupContent: function(g, tab){
      var groupPane;
      tab.widgets = [];
      if(g.widgets && g.widgets.length > 1){
        query('.content-title', tab.content).text(g.label);
      }

      // g.panel.position = {left: 0, right: 0, top: 0, bottom: 0};
      this.panelManager.showPanel(g).then(lang.hitch(this, function(panel){
        var tabPane = panel;
        query(panel.domNode).style(utils.getPositionStyle({left: 0, right: 0, top: 0, bottom: 0}));
        if(tab.flag === 'more'){
          groupPane = query('.more-group-pane[label="' + g.label + '"]', tab.contentPane);
          groupPane.append(tabPane.domNode);
        }else{
          query(tab.contentPane).append(tabPane.domNode);
        }

        tab.panel = panel;
      }));
    },

    showMoreTabContent: function(tab) {
      var groups = tab.config.groups, anim;
      query(this.otherGroupNode).empty();
      this._createOtherGroupPaneTitle();
      array.forEach(groups, function(group){
        this._createMoreGroupNode(group);
      }, this);
      anim = fx.combine([
        query(this.maxStateNode).animateProperty({
          properties: {left: this.minWidth - this.maxWidth, right: this.maxWidth - this.minWidth},
          duration: this.animTime
        }),
        query(this.otherGroupNode).animateProperty({
          properties: {left: this.minWidth, right: 0},
          duration: this.animTime
        })
      ]);
      anim.play();
      this.moreTabOpened = true;
    },

    _createOtherGroupPaneTitle: function(){
      var node = domConstruct.create('div', {
        'class': 'other-group-pane-title'
      }, this.otherGroupNode), closeNode;
      domConstruct.create('div', {
        'class': 'bg'
      }, node);
      domConstruct.create('div', {
        'class': 'text',
        innerHTML: 'Other Panels'
      }, node);
      closeNode = domConstruct.create('div', {
        'class': 'close'
      }, node);
      on(closeNode, 'click', lang.hitch(this, function(){
        this._hideOtherGroupPane();
        if(this.lastSelectedIndex !== -1){
          this.selectTab(this.lastSelectedIndex);
        }
      }));
      return node;
    },

    _createMoreGroupNode: function(group){
      var node = domConstruct.create('div', {
        'class': 'other-group'
      }, this.otherGroupNode), arrowNode;
      domConstruct.create('img', {
        src: group.icon,
        'class': 'other-group-icon'
      }, node);
      domConstruct.create('div', {
        'class': 'other-group-title',
        innerHTML: group.label
      }, node);
      arrowNode = domConstruct.create('img', {
        'class': 'other-group-choose',
        style: {opacity: 0},
        src: this.folderUrl + 'images/arrow_choose.png'
      }, node);
      on(node, 'click', lang.hitch(this, this._onOtherGroupClick, group));
      on(node, 'mousedown', lang.hitch(this, function(){
        query(node).addClass('jimu-state-active');
      }));
      on(node, 'mouseup', lang.hitch(this, function(){
        query(node).removeClass('jimu-state-active');
      }));
      on(node, mouse.enter, lang.hitch(this, function(){
        query(arrowNode).style({opacity: 1});
      }));
      on(node, mouse.leave, lang.hitch(this, function(){
        query(arrowNode).style({opacity: 0});
      }));
      return node;
    },

    _hideOtherGroupPane: function(){
      fx.combine([
        query(this.maxStateNode).animateProperty({
          properties: {left: 0, right: 0}
        }),
        query(this.otherGroupNode).animateProperty({
          properties: {left: this.maxWidth, right: 0 - this.maxWidth}
        })
      ]).play();
      this.moreTabOpened = false;
      if(this.tabs[this.getSelectedIndex()].flag === 'more'){
        this._hideIndicator(this.getSelectedIndex());
      }
    },

    _onOtherGroupClick: function(group){
      if(this.currentOtherGroup === null || this.currentOtherGroup.label !== group.label){
        var anim = fx.combine([
          query(this.maxStateNode).animateProperty({
            properties: {left: 0 - this.maxWidth, right: this.maxWidth},
            duration: this.animTime
          }),
          query(this.otherGroupNode).animateProperty({
            properties: {left: 0, right: 0},
            duration: this.animTime
          })
        ]);
        aspect.after(anim, 'onEnd', lang.hitch(this, this._addGroupToMoreTab, group));
        anim.play();
      }else{
        this._addGroupToMoreTab(group);
      }

      this.currentOtherGroup = group;
    },

    _addGroupToMoreTab: function(group){
      var tab = this.tabs[4];
      query('.content-node', this.domNode).style({
        display: 'none'
      });
      query(tab.content).style({
        display: 'block'
      });

      if(this._getGroupFromMoreTab(tab, group) === null){
        tab.widgets = [];
        var groupPane = domConstruct.create('div', {
          'class': 'more-group-pane',
          label: group.label
        }, tab.contentPane);
        query(tab.contentPane).append(groupPane);

        tab.moreGroupWidgets.push({glabel: group.label, widgets: []});
        this.showGroupContent(group, tab);
      }else{
        tab.widgets = this._getGroupFromMoreTab(tab, group).widgets;
      }

      query('.more-group-pane', tab.contentPane).style({display: 'none'});
      query('.more-group-pane[label="' + group.label + '"]', tab.contentPane).style({display: 'block'});

      this._hideOtherGroupPane();
      this.resize();
    },

    _getGroupFromMoreTab: function(tab, group){
      for(var i = 0; i < tab.moreGroupWidgets.length; i++){
        if(tab.moreGroupWidgets[i].glabel === group.label){
          return tab.moreGroupWidgets[i];
        }
      }
      return null;
    },

    _createTitleNode: function(config) {
      /*jshint unused:false*/
      var title = config.label,
      iconUrl = config.icon,
      node = domConstruct.create('div', {
        title: title,
        'class': 'title-node',
        i: this.tabs.length
      }, this.titleListNode),

      indicator = domConstruct.create('div', {
        'class': 'tab-indicator'
      }, node),

      imgNode = domConstruct.create('img', {
        src: iconUrl
      }, node),

      minNode = domConstruct.create('div', {
        title: title,
        'class': 'title-node',
        i: this.tabs.length
      }, this.minStateNode),

      minIndicatorNode = domConstruct.create('div', {
        'class': 'tab-indicator'
      }, minNode),

      minImgNode = domConstruct.create('img', {
        src: iconUrl
      }, minNode);

      on(node, 'click', lang.hitch(this, this.onSelect));
      on(node, mouse.enter, lang.hitch(this, this.onMouseEnter));
      on(node, mouse.leave, lang.hitch(this, this.onMouseLeave));

      on(minNode, 'click', lang.hitch(this, this._onMinIconClick, minNode));
      on(minNode, mouse.enter, lang.hitch(this, this.onMouseEnter));
      on(minNode, mouse.leave, lang.hitch(this, this.onMouseLeave));
      return node;
    },

    _onMinIconClick: function(minNode){
      var index = query(minNode).attr('i')[0];
      WidgetManager.getInstance().maximizeWidget(this.id);
      this.selectTab(parseInt(index, 10));
    },

    _createContentNode: function(config) {
      var node = domConstruct.create('div', {
          'class': 'content-node'
        }, this.contentListNode);
      domConstruct.create('div', {
        'class': 'content-title-bg'
      }, node);
      domConstruct.create('div', {
        'class': 'content-title',
        innerHTML: (config.widgets && config.widgets.length > 1)? config.label: ''
      }, node);
      domConstruct.create('div', {
        'class': 'content-pane'
      }, node);

      on(node, 'click', lang.hitch(this, function(){
        if(this.moreTabOpened){
          this._hideOtherGroupPane();
          if(this.lastSelectedIndex !== -1){
            this.selectTab(this.lastSelectedIndex);
          }
        }
      }));
      return node;
    },

    _doResize: function() {
      if (this.windowState === 'maximized') {
        WidgetManager.getInstance().minimizeWidget(this.id);
      } else {
        WidgetManager.getInstance().maximizeWidget(this.id);
      }
    },

    _resizeToMin: function(){
      topic.publish('relayout');
      query(this.domNode).style('width', this.minWidth + 'px');
      query(this.minStateNode).style('display', 'block');
      query(this.maxStateNode).style('display', 'none');
      query('div', this.doResizeNode).removeClass('left-arrow').addClass('right-arrow');

      topic.publish('changeMapPosition', {
        left: this.minWidth
      });

      array.forEach(this.tabs, function(tab){
        if(tab.panel){
          tab.panel.onMinimize();
        }
      }, this);
    },
    _resizeToMax: function(){
      topic.publish('relayout');
      query(this.domNode).style('width', this.maxWidth + 'px');
      query(this.minStateNode).style('display', 'none');
      query(this.maxStateNode).style('display', 'block');
      query('div', this.doResizeNode).removeClass('right-arrow').addClass('left-arrow');
      this.resize();

      topic.publish('changeMapPosition', {
        left: this.maxWidth
      });

      array.forEach(this.tabs, function(tab){
        if(tab.panel){
          tab.panel.onMaximize();
        }
      }, this);
    }
  });
  clazz.hasLocale = false;
  clazz.inPanel = false;
  return clazz;
});