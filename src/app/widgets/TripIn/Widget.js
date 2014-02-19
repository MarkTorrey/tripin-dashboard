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
  'esri/symbols/SimpleMarkerSymbol'
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
  SimpleMarkerSymbol) {
  
  var TripInEventCountRenderer = declare(Renderer, {
    // TODO: create a time-based cache for the activities, to provide a count by business ID
    // NOTE: I think I'm mixing up the layers, but they should be interchangeable (JB)
    getSymbol: function (graphic) {
      console.group('TripInEventCountRenderer::getSymbol');
      console.log(graphic);
      console.groupEnd('TripInEventCountRenderer::getSymbol');
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
      this.activitiesFeatureLayer = new FeatureLayer(this.config.activitiesFeatureService, {
        // TODO: does this need options? I don't think it does, initially
      });
      this.activitiesFeatureLayer.setRenderer(new TripInEventCountRenderer({}));
      this.map.addLayer(this.activitiesFeatureLayer);
      
      this.eventEditor = new EventEditor({
        featureLayer: this.activitiesFeatureLayer
      });
    },
    startup: function() {
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