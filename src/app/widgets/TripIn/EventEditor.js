define([
  'dojo/_base/declare',

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
  declare,
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
    },

    startup: function() {
      this.inherited(arguments);
      console.log('EventEditor::startup');
      this.startDateNode.placeHolder = '1/30/2014';// new Date().toString();
    }
  });
});