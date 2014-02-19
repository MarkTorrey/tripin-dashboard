define([
  'dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/dijit/List',
  'jimu/utils',
  './EventEditor',
  'esri/layers/FeatureLayer',
  'esri/renderers/Renderer',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'dojo/request/xhr'
], function(declare,
  _WidgetsInTemplateMixin,
  BaseWidget,
  TabContainer,
  List,
  utils,
  EventEditor,
  FeatureLayer,
  Renderer,
  PictureMarkerSymbol,
  SimpleMarkerSymbol,
  xhr) {  
  
  var ActivityAttendeesRenderer = declare(Renderer, {
    // TODO: create a time-based cache for the activities, to provide a count by business ID
    // NOTE: I think I'm mixing up the layers, but they should be interchangeable (JB)
    getSymbol: function (graphic) {
      console.group('ActivityAttendeesRenderer::getSymbol');
      var data = null;
      xhr.get(this.config.trackingTableService + this.config.trackingTableQuery, {
        sync: true,
        handleAs: 'json',
        load: function(d) {
          data = d;
        },
        error: function(error) {
          console.error(error);
        }
      });
      
      if (data !== null) {
        // TODO: create the picture marker symbol
      } else {
        return new SimpleMarkerSymbol();
      }
      
      console.groupEnd('ActivityAttendeesRenderer::getSymbol');
      return new SimpleMarkerSymbol();
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
      this.activitiesFeatureLayer.setRenderer(new ActivityAttendeesRenderer({}));
      this.map.addLayer(this.activitiesFeatureLayer);

      this.eventEditor = new EventEditor({
        title:        'Add Event',
        featureLayer: this.eventsFeatureLayer,
        map:          this.map
      });
    },
    startup: function() {
      window.MAP = this.map;
      this.inherited(arguments);
      console.log('TripIn::startup()');
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