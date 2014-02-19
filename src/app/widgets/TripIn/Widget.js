define([
  "dojo/_base/declare",
  "dijit/_WidgetsInTemplateMixin",
  "jimu/BaseWidget",
  "jimu/dijit/TabContainer",
  "jimu/dijit/List",
  "jimu/utils"
], function(declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, utils) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: "TripIn",
    baseClass: "tripin-workflow-parent",
    startup: function() {
      console.log("WorkflowParent::startup()");
    },
    onClose: function() {
      console.log("WorkflowParent::onClose()");
    }
  });
});