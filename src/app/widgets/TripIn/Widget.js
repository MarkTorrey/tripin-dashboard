define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/dijit/List',
  'jimu/utils',
  './EventEditor',
  './EventList',
  'esri/layers/FeatureLayer',
  'esri/renderers/Renderer',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'dojo/request/xhr'
], function(declare,
  lang,
  _WidgetsInTemplateMixin,
  BaseWidget,
  TabContainer,
  List,
  utils,
  EventEditor,
  EventList,
  FeatureLayer,
  Renderer,
  PictureMarkerSymbol,
  SimpleMarkerSymbol,
  xhr) {

  var ActivityAttendeesRenderer = declare(Renderer, {
    config: null,
    constructor: function(args) {
      lang.mixin(this, args);
    },
    // TODO: create a time-based cache for the activities, to provide a count by business ID
    // NOTE: I think I'm mixing up the layers, but they should be interchangeable (JB)
    getSymbol: function (graphic) {
      console.group('ActivityAttendeesRenderer::getSymbol');
      console.log(graphic);
      try {
      var data = null;
      xhr(this.config.trackingTableService + this.config.trackingTableQuery, {
        sync: true,
        handleAs: 'json',
        load: function(d) {
          data = d;
        },
        error: function(error) {
          console.error(error);
        }
      });
      console.log(data);
      if (data !== null) {
        // TODO: create the picture marker symbol
        return new SimpleMarkerSymbol();
      } else {
        return new SimpleMarkerSymbol();
      }
    } catch (e) {
      console.error(e);
    } finally {
      console.groupEnd('ActivityAttendeesRenderer::getSymbol');
    }
  }
});

  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: 'TripIn',
    baseClass: 'tripin-workflow-parent',
    eventEditor: null,
    postCreate: function() {
      this.inherited(arguments);
      // create the feature layer for the activities service
      this.eventsFeatureLayer =  new FeatureLayer(this.config.eventsFeatureService, {
        // TODO: does this need options? I don't think it does, initially
      });
      //this.eventsFeatureLayer.setRenderer(new ActivityAttendeesRenderer({}));
      this.map.addLayer(this.eventsFeatureLayer);

      this.activitiesFeatureLayer = new FeatureLayer(this.config.activitiesFeatureService, {
        // TODO: does this need options? I don't think it does, initially
      });
      this.activitiesFeatureLayer.setRenderer(new ActivityAttendeesRenderer({
        config: this.config
      }));
      this.map.addLayer(this.activitiesFeatureLayer);

      this.eventList = new EventList({
        title:        'My Events',
        featureLayer: this.eventsFeatureLayer,
      });

      this.eventEditor = new EventEditor({
        title:        'Add Event',
        featureLayer: this.eventsFeatureLayer,
      });

    },
    startup: function() {
      window.MAP = this.map;
      this.inherited(arguments);
      console.log('TripIn::startup()');
      this.eventList.placeAt(this.containerNode);
      this.eventEditor.placeAt(this.containerNode);
    },
    onOpen: function() {
      this.inherited(arguments);
      console.log('TripIn::onOpen()');
    },
    onClose: function() {
      console.log('TripIn::onClose()');
    }
  });
});