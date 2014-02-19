define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
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
  array,
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
        handleAs: 'json'
      }).then(function(d) {
        //console.log("then");
        //console.log(arguments);
        data = d;
      },
      function(error) {
        console.error(error);
      });
      console.log(data);
      console.groupEnd('ActivityAttendeesRenderer::getSymbol');
      var symbol = null;
      if (data !== null) {
        // TODO: create the picture marker symbol
        array.forEach(data.features, function(feature) {
          if (feature.attributes.ACTIVITY_ID === graphic.attributes.OBJECTID) {
            var actCount = feature.attributes.ACTIVITY_COUNT;
            console.log("count: " + actCount);
            symbol = new PictureMarkerSymbol({
              url:  'images/symbols/' + Math.min(actCount, 11) + '.png',
              type: 'esriPMS'
            });
          }
        });
      } else {
        symbol = new SimpleMarkerSymbol();
      }
      return symbol;
    } catch (e) {
      console.error(e);
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
      // TODO: create a renderer for the events
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