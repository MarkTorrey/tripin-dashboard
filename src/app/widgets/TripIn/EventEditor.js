define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Deferred',

  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  "dijit/_WidgetsInTemplateMixin",

  'esri/graphic',

  'dojo/text!./EventEditor.html',

  // used in template
  'dijit/form/Form',
  'dijit/form/ValidationTextBox',
  'dijit/form/DateTextBox',
  'dijit/form/TimeTextBox',
  'dijit/form/Textarea',
  'dijit/form/Button'
], function(
  declare, lang, Deferred,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  Graphic,
  template
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    templateString: template,

    baseClass: 'tripin-event-editor',

    name: 'EventEditor',

    title: 'Event Editor',

    _setTitleAttr: { node: "titleNode", type: "innerHTML" },

    _setFeatureLayerAttr: function(newFeatureLayer) {
      this.featureLayer = newFeatureLayer;
      if (this.featureLayer.loaded) {
        this._onFeatureLayerLoad();
      } else {
        this.submitButton.set('disabled', true);
      }
    },

    postCreate: function() {
      this.inherited(arguments);
      this._initForm();
      this._initEventHandlers();
    },

    _initForm: function() {
      var now = new Date();
      this.startDateNode.set('value', now);
      // now = now.setHours(now.getHours() + 1);
      this.endDateNode.set('value', now);
      this.submitButton.set('disabled', true);
    },

    _initEventHandlers: function() {
      var _this = this;
      this.own(this.submitButton.on('Click', function(/*e*/) {
        _this.addEvent().then(function(addedEvents) {
          console.log(addedEvents);
        }, function(err) {
          alert(err);
        });
      }));
      this.own(this.mapButton.on('Click', function(/*e*/) {
        _this.getMapPoint();
      }));
      this.own(this.featureLayer.on('load', function(/*layer*/) {
        _this._onFeatureLayerLoad();
      }));
      // TODO: cancel button
    },

    _onFeatureLayerLoad: function() {
      this.map = this.featureLayer.getMap();
      this.submitButton.set('disabled', false);
    },

    startup: function() {
      this.inherited(arguments);
      console.log('EventEditor::startup');
    },

    // add event to feature service
    addEvent: function() {
      var eventGaphic;
      try {
        eventGaphic = this.getEventGraphic();
        return this.featureLayer.applyEdits([eventGaphic]);
      } catch (e) {
        return new Deferred().reject(e);
      }
    },

    // listen for next map click and set ref to point
    getMapPoint: function() {
      var _this = this;
      var mapClickHandler = this.map.on('click', function(e) {
        _this.mapPoint = e.mapPoint;
        mapClickHandler.remove();
      });
    },

    // parse event feature from form
    // BUSINESSID: (type: esriFieldTypeString, alias: Business ID, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
    // BUSINESSID_1: (type: esriFieldTypeSmallInteger, alias: Business ID (Int), SQL Type: sqlTypeOther, nullable: true, editable: true)
    // NAME: (type: esriFieldTypeString, alias: Name, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
    // DESCRIPTION: (type: esriFieldTypeString, alias: Description, SQL Type: sqlTypeOther, length: 150, nullable: true, editable: true)
    // TIME: (type: esriFieldTypeDate, alias: Time, SQL Type: sqlTypeOther, length: 8, nullable: true, editable: true)
    // TEXT: (type: esriFieldTypeString, alias: TEXT, SQL Type: sqlTypeOther, length: 50, nullable: true, editable: true)
    // DATE: (type: esriFieldTypeDate, alias: DATE, SQL Type: sqlTypeOther, length: 8, nullable: true, editable: true)
    // SHORT: (type: esriFieldTypeSmallInteger, alias: SHORT, SQL Type: sqlTypeOther, nullable: true, editable: true)
    // LONG: (type: esriFieldTypeInteger, alias: LONG, SQL Type: sqlTypeOther, nullable: true, editable: true)
    // START_DATE (type: esriFieldTypeDate, alias: Start Date, SQL Type: sqlTypeOther, length: 8, nullable: true, editable: true)
    // END_DATE (type: esriFieldTypeDate, alias: End Date, SQL Type: sqlTypeOther, length: 8, nullable: true, editable: true)
    // EVENTID (ty
    getEventGraphic: function() {
      if (!this.mapPoint) {
        throw 'Please select a location';
      }
      if (!this.formNode.isValid()) {
        throw 'Please fill out form';
      }
      var attributes = {
        BUSINESSID_1: this.businessId,
        NAME: this.nameNode.value,
        TEXT: this.placeNode.value,
        DESCRIPTION: this.descriptionNode.value,
        START_DATE: this.startDateNode.value,
        END_DATE: this.endDateNode.value
      };
      return new Graphic(this.mapPoint, null, attributes, null);
    }
  });
});