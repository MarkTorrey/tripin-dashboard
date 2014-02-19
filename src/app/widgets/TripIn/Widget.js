define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/Color',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/dijit/List',
  'jimu/utils',
  './EventEditor',
  './EventList',
  'esri/layers/FeatureLayer',
  'esri/renderers/Renderer',
  'esri/renderers/SimpleRenderer',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'dojo/request/xhr'
], function(declare,
  lang,
  array,
  Color,
  _WidgetsInTemplateMixin,
  BaseWidget,
  TabContainer,
  List,
  utils,
  EventEditor,
  EventList,
  FeatureLayer,
  Renderer,
  SimpleRenderer,
  PictureMarkerSymbol,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  xhr) {

  var ActivityAttendeesRenderer = declare(Renderer, {
    config: null,
    constructor: function(args) {
      lang.mixin(this, args);
    },
    getSymbol: function (graphic) {
      var data = null;
      xhr(this.config.trackingTableService + this.config.trackingTableQuery, {
        sync: true,
        handleAs: 'json'
      }).then(function(d) {
        data = d;
      },
      function(error) {
        console.group('ActivityAttendeesRenderer::getSymbol');
        console.error(error);
        console.groupEnd('ActivityAttendeesRenderer::getSymbol');
      });
      var symbol = null;
      if (data !== null) {
        array.forEach(data.features, function(feature) {
          if (feature.attributes.ACTIVITY_ID === graphic.attributes.OBJECTID) {
            var actCount = feature.attributes.ACTIVITY_COUNT;
            symbol = new PictureMarkerSymbol({
              url:  'images/symbols/' + Math.min(actCount, 11) + '.png',
              type: 'esriPMS',
              width: 22,
              xoffset: 11,
              height: 31,
              yoffset: 15
            });
          }
        });
      }
      
      if (symbol === null) {
        symbol = new SimpleMarkerSymbol();
      }
      return symbol;
  }
});

  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: 'TripIn',
    baseClass: 'tripin-workflow-parent',
    eventEditor: null,
    postCreate: function() {
      this.inherited(arguments);

      // create the feature layer for the events service
      this.eventsFeatureLayer =  new FeatureLayer(this.config.eventsFeatureService, {
        outFields: ['*']
      });
      this.eventsFeatureLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol(
        "circle",
        12,
        new SimpleLineSymbol("solid", new Color([0, 0, 0]), 1),
        new Color([196, 33, 41])
      )));
      this.map.addLayer(this.eventsFeatureLayer);

      // create the feature layer for the activities service
      this.activitiesFeatureLayer = new FeatureLayer(this.config.activitiesFeatureService, {
        outFields: ['*']
      });
      this.activitiesFeatureLayer.setRenderer(new ActivityAttendeesRenderer({
        config: this.config
      }));
      this.map.addLayer(this.activitiesFeatureLayer);

      // widgets
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