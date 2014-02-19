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
  'esri/tasks/StatisticDefinition',
  'esri/tasks/query',
  'esri/tasks/QueryTask'
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
  StatisticDefinition,
  Query,
  QueryTask) {

  var TrackingCache = function() {
    this._lastUpdated = null;

    this.getData = function() {
      var statDef = new StatisticDefinition();
      statDef.onStatisticField = "ACTIVITY_ID";
      statDef.outStatisticFieldName = "ACTIVITY_COUNT";
      statDef.statisticType = "count";

      var query = new Query();
      query.groupByFieldsForStatistics = ["ACTIVITY_ID"];
      query.outFields = ["*"];
      query.outStatistics = [statDef];

      var results = null;
      var queryTask = new QueryTask(this.config.trackingTableService);
      queryTask.execute(query, function(r) { results = r; }); // TODO: wait for it
    };
  };
  var _trackingCache = new TrackingCache();

  var ActivityAttendeesRenderer = declare(Renderer, {
    // TODO: create a time-based cache for the activities, to provide a count by business ID
    // NOTE: I think I'm mixing up the layers, but they should be interchangeable (JB)
    getSymbol: function (graphic) {
      console.group('ActivityAttendeesRenderer::getSymbol');
      console.log(graphic);
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
        title: 'Add Event',
        featureLayer: this.eventsFeatureLayer
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