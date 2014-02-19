define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/Deferred',

  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_Container'
], function(
  declare, array, Deferred,
  _WidgetBase, _TemplatedMixin, _Container
) {

  var EventListItem = new declare([_WidgetBase, _TemplatedMixin], {

    templateString: '<div><div data-dojo-attach-point="titleNode"></div><div data-dojo-attach-point="detailsNode"></div></div>',

    baseClass: 'tripin-event-list-item',

    _setEventGraphicAttr: function(newEventGraphic) {
      this.eventGraphic = newEventGraphic;
      this.titleNode.innerHTML = this.eventGraphic.attributes.NAME;
      // TODO: what else goes in the title
    }

  });

  return declare([_WidgetBase, _TemplatedMixin, _Container], {

    templateString: '<div><div data-dojo-attach-point="titleNode"></div><div data-dojo-attach-point="containerNode"></div></div>',

    baseClass: 'tripin-event-list',

    name: 'EventList',

    title: 'Events',

    _setTitleAttr: { node: "titleNode", type: "innerHTML" },

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
        this.addChild(new EventListItem({
          eventGraphic: graphic
        }));
      }, this);
    },

    clearEvents: function() {
      array.forEach(this.getChildren(), function(child) {
        this.removeChild(child);
      }, this);
    }
  });
});