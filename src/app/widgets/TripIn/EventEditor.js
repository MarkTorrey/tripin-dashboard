define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Deferred',

  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  "dijit/_WidgetsInTemplateMixin",

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
  template
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    templateString: template,

    baseClass: 'tripin-event-editor',

    name: 'EventEditor',

    title: 'Event Editor',

    _setTitleAttr: { node: "titleNode", type: "innerHTML" },

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
    },

    _initEventHandlers: function() {
      this.own(this.submitButton.on('Click', lang.hitch(this, function(/*e*/) {
        this.addEvent().then(function(addedEvents) {
          console.log(addedEvents);
        }, function(err) {
          alert(err);
        });
      })));
      // TODO: cancel button
    },

    // add event to feature service
    addEvent: function() {
      var eventFeature;
      var def = new Deferred();
      if (this.formNode.isValid()) {
        eventFeature = this.getEventFeature();
        def.resolve([eventFeature]);
        def = this.featureLayer.applyEdits([eventFeature]);
      } else {
        def.reject('Invalid form.');
      }
      return def;
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
    getEventFeature: function() {
      // TODO: check if form is valid
      var point = this.featureLayer.getMap().extent.getCenter();
      var eventFeature = {
        // TODO: get geom
        geometry: point,
        attributes: {
          BUSINESSID_1: this.businessId,
          NAME: this.nameNode.value,
          DESCRIPTION: this.descriptionNode.value,
          START_DATE: this.startDateNode.value,
          END_DATE: this.endDateNode.value
        }
      };
      return eventFeature;
    },

    startup: function() {
      this.inherited(arguments);
      console.log('EventEditor::startup');
      this.startDateNode.placeHolder = '1/30/2014';// new Date().toString();
    }
  });
});