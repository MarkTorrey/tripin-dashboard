define([
  'dojo/_base/declare',
  'dojo/_base/lang',

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
  declare, lang,
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
      this.own(this.submitButton.on('Click', lang.hitch(this, function(e) {
        if (this.formNode.isValid()) {
          console.log(e);
        }
      })));
    },

    startup: function() {
      this.inherited(arguments);
      console.log('EventEditor::startup');
      this.startDateNode.placeHolder = '1/30/2014';// new Date().toString();
    }
  });
});