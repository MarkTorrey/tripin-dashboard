define([
  'dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/dijit/List',
  'jimu/utils',
  './EventEditor'
], function(declare,
  _WidgetsInTemplateMixin,
  BaseWidget, 
  TabContainer, 
  List, 
  utils,
  EventEditor) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: 'TripIn',
    baseClass: 'tripin-workflow-parent',
    eventEditor: null,
    postCreate: function() {
      this.inherited(arguments);
      this.eventEditor = new EventEditor();
    },
    startup: function() {
      this.inherited(arguments);
      console.log('TripIn::startup()');
    },
    onOpen: function() {
      this.inherited(arguments);
      console.log('TripIn::onOpen()');
      this.eventEditor.placeAt(this.containerNode);
    },
    onClose: function() {
      console.log('TripIn::onClose()');
    }
  });
});