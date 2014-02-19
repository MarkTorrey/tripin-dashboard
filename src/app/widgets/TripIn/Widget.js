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
  'esri/InfoTemplate',
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
  InfoTemplate,
  xhr) {

  var activityAttendeeCache = {};
  
  var ActivityAttendeesRenderer = declare(Renderer, {
    config: null,
    constructor: function(args) {
      lang.mixin(this, args);
    },
    getSymbol: function (graphic) {
      var symbol = null;
      var activityAttendeeCount = 0;
      
      if (activityAttendeeCache.hasOwnProperty(graphic.attributes.ACTIVITYID)) {
        activityAttendeeCount = activityAttendeeCache[graphic.attributes.ACTIVITYID];
      } else {
        xhr(this.config.trackingTableService + this.config.trackingTableQuery, {
          sync: true,
          handleAs: 'json'
        }).then(function(data) {
          array.forEach(data.features || [], function(feature) {
            if (feature.attributes.ACTIVITY_ID === graphic.attributes.ACTIVITYID) {
              activityAttendeeCount = activityAttendeeCache[graphic.attributes.ACTIVITYID] =  Math.min(feature.attributes.ACTIVITY_COUNT, 11);
            }
          });
        },
        function(error) {
          console.group('ActivityAttendeesRenderer::getSymbol');
          console.error(error);
          console.groupEnd('ActivityAttendeesRenderer::getSymbol');
        });
      }
      
      if (activityAttendeeCount > 0) {
        symbol = new PictureMarkerSymbol({
          url:     'images/symbols/' + activityAttendeeCount + '.png',
          type:    'esriPMS',
          //xoffset: -8,
          yoffset: 11,
          width:   16,
          height:  23
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
        new SimpleLineSymbol("solid", new Color([196, 33, 41]), 1),
        new Color([241, 196, 15]) // 196, 33, 41 46, 204, 113
      )));
      this.map.addLayer(this.eventsFeatureLayer);

      // create the feature layer for the activities service
      this.activitiesFeatureLayer = new FeatureLayer(this.config.activitiesFeatureService, {
        outFields: ['*'],
        infoTemplate: new InfoTemplate("TripIn Activity", "${NAME}")
      // widgets
      this.eventList = new EventList({
        title:        'My Events',
        featureLayer: this.eventsFeatureLayer,
      });

      this.eventEditor = new EventEditor({
        title:        'Add Event',
        featureLayer: this.eventsFeatureLayer
      });
      this.own(this.newEventButton.on('Click', lang.hitch(this, function(/*e*/) {
        if (!this.eventEditor.isOpen) {
          this.eventEditor.open();
        }
      })));
    },
    startup: function() {
      window.MAP = this.map;
      this.inherited(arguments);
      console.log('TripIn::startup()');
      this.eventList.placeAt(this.containerNode);
      this.eventEditor.placeAt(this.containerNode);
      this.eventEditor.close();
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