## Edit ##
### Overview ###
The Edit widget provides out-of-the-box editing capabilities using an editable layer in a Feature Service. It combines the out-of-the-box TemplatePicker, AttachmentEditor, AttributeInspector and GeometryService to provide feature and attribute editing. When building editing applications, try to take advantage of the customizable out-of-the-box Edit widget when possible. 

### Attributes ###
* `*editor`: An object of ArcGIS API for Javascript, see the params of [Editor Constructor](https://developers.arcgis.com/en/javascript/jsapi/editor-amd.html#editor1).
  * `*layerInfos`: Object; default: no default; Feature layer information.
    * `*featureLayer`: Object; default: no default; Reference to the feature layer.
      * `*url`: String; default: no default; URL to the ArcGIS Server REST resource that represents a feature service.

Example:
```
{
  "editor": {
    "createOptions": {
      "polylineDrawTools": ["freehandpolyline"],
      "polygonDrawTools": [
        "freehandpolygon",
        "autocomplete"
      ]
    },
    "enableUndoRedo": true,
    "toolbarVisible": true,
    "toolbarOptions": {
      "mergeVisible": true,
      "cutVisible": true,
      "reshapeVisible": true
    },
    "layerInfos": [{
      "featureLayer": {
        "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/0"
      },
      "disableGeometryUpdate": true,
      "fieldInfos": [{
        "fieldName": "rotation",
        "isEditable": false
      }, {
        "fieldName": "description",
        "isEditable": true
      }, {
        "fieldName": "eventdate",
        "label": "Event Date",
        "isEditable": false
      }, {
        "fieldName": "eventtype",
        "label": "Event Type",
        "isEditable": false
      }]
    }, {
      "featureLayer": {
        "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/1"
      },
      "disableGeometryUpdate": true,
      "fieldInfos": [{
        "fieldName": "symbolid",
        "isEditable": false
      }, {
        "fieldName": "description",
        "isEditable": true
      }]
    }]
  }
}
```