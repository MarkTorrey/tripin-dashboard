define([
  'dojo/_base/declare',

  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  // "dijit/_WidgetsInTemplateMixin",

  'dojo/text!./EventEditor.html'

], function(
  declare,
  _WidgetBase, _TemplatedMixin,
  template
) {
  return declare([_WidgetBase, _TemplatedMixin], {

    //please note that this property is be set by the framework when widget is loaded.
    templateString: template,

    baseClass: 'tripin-event-editor',

    name: 'EventEditor',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      console.log('startup');
    }
  });
});