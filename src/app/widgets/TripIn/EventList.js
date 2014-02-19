define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/Deferred',
  'dojo/string',
  'dojo/on',
  'dojo/dom-class',

  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_Container'
], function(
  declare, array, Deferred, string, on, domClass,
  _WidgetBase, _TemplatedMixin, _Container
) {

  var EventListItem = new declare([_WidgetBase, _TemplatedMixin], {

    templateString: '<div><div data-dojo-attach-point="titleNode" class="${baseClass}-title"></div><div data-dojo-attach-point="detailsNode" class="${baseClass}-details"></div></div>',

    baseClass: 'tripin-event-list-item',

    isSelected: false,

    // set ref to the event feature and update UI
    _setEventGraphicAttr: function(newEventGraphic) {
      this.eventGraphic = newEventGraphic;
      this.refresh();
    },

    _setIsSelectedAttr: function(isSelected) {
      this.isSelected = isSelected;
      domClass.toggle(this.domNode, 'tripin-selected', isSelected);
      console.log(this.eventGraphic);
    },

    postCreate: function() {
      this.inherited(arguments);
      this._initEventHandlers();
    },

    // init event handlers
    _initEventHandlers: function() {
      var _this = this;
      this.own(on(this.titleNode, 'click', function(/*layer*/) {
        _this.set('isSelected', !this.isSelected);
      }));
    },

    // refresh UI based on event graphic
    refresh: function() {
      var titleTemplate = '<span class="tripin-event-name">${NAME}</span><span class="tripin-event-dates">${dateRange}</span>';
      var attr = this.eventGraphic.attributes;
      attr.startDate = new Date(attr.START_DATE);
      attr.endDate = new Date(attr.END_DATE);
      attr.dateRange = attr.startDate.toLocaleDateString();
      if (attr.endDate.getDate() !== attr.startDate.getDate()) {
        attr.dateRange = attr.dateRange + ' - ' + attr.endDate.toLocaleDateString();
      }
      this.titleNode.innerHTML = string.substitute(titleTemplate, attr);
    }
  });

  return declare([_WidgetBase, _TemplatedMixin, _Container], {

    templateString: '<div><div data-dojo-attach-point="titleNode"></div><div data-dojo-attach-point="containerNode"></div></div>',

    baseClass: 'tripin-event-list',

    name: 'EventList',

    title: 'Events',

    _setTitleAttr: { node: "titleNode", type: "innerHTML" },

    _setBusinessIdAttr: function(newBusinessId) {
      this.businessId = newBusinessId;
    },

    _setFeatureLayerAttr: function(newFeatureLayer) {
      this.featureLayer = newFeatureLayer;
      if (this.featureLayer.loaded) {
        this._onFeatureLayerLoad();
      } else {
        this.clearEvents();
      }
    },

    postCreate: function() {
      this.inherited(arguments);
      this._initEventHandlers();
    },

    _initEventHandlers: function() {
      var _this = this;
      this.own(this.featureLayer.on('load', function(/*layer*/) {
        _this._onFeatureLayerLoad();
      }));
      this.own(this.featureLayer.on('update-end', function(/*layer*/) {
        _this.refresh();
      }));
    },

    _onFeatureLayerLoad: function() {
      this.map = this.featureLayer.getMap();
    },

    // show list of events
    refresh: function() {
      this.clearEvents();
      array.forEach(this.featureLayer.graphics, function(graphic) {
        if (graphic.attributes.BUSINESSID_1 === this.businessId) {
          this.addChild(new EventListItem({
            eventGraphic: graphic
          }));
        }
      }, this);
    },

    clearEvents: function() {
      array.forEach(this.getChildren(), function(child) {
        this.removeChild(child);
      }, this);
    }
  });
});