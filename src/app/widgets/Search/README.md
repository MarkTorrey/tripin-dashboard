## Search ##
### Overview ###
The Search widget enables end users to search for features in a specific layer. The widget provides two options to perform a search: spatially (using a graphical search tool) or by attribute (text search).

### Attributes ###
* `*layers`: Object[]; default: no default; The layers used to search.
    * `name`: string; default: no default; The layer name displayed in the widget.
    * `url`: string; default: no default; The layer url.
    * `expression`: string; default: no default; Predefined query for the widget used in theSelect by attribute search. For example eventtype = '[value]'.'[value]' is a literal value that needs to be specified in the expressionn.
    * `textsearchlabel`: string; default: no default; The search label displayed in the Select by attribute panel.
    * `textsearchhint`: string; default: no default; Text search hint.
    * `titlefield`: string; default: displayFieldName attribute of the layer; Main field to display for query results.If not specified, uses displayFieldName attribute of the layer.
    * `linkfield`: string; default : no default; Refers to a field that contains URL values. If the URL link has an extension of .jpg, .png or .gif, the image is displayed; otherwise, a clickable link is displayed. When the link is clicked, a new tab opens to display content referenced by the link.
    * `fields`:Object; default: no default; The fields info for query and display.
        * `all`:bool; default: false; If true,all fields will be displayed.
        * `field`:Object[]; default: no default; The fields will be displayed.
        	* `name`: string; default: no default; Field name.
        	* `alias`: string; default: no default; Field alias.

Example:
```
"layers": [{
  "name": "USA Earthquake Faults (Line)",
  "url": "http://maps1.arcgisonline.com/ArcGIS/rest/services/USGS_Earthquake_Faults/MapServer/1",
  "expression": "NAME like '[value]'",
  "textsearchlabel": "Search by Name  [ Example: Diamond Springs fault ]",
  "textsearchhint": "Name",
  "titlefield": "Name",
  "linkfield": "",
  "fields": {
    "all": false,
    "field": [{
      "name": "NAME",
      "alias": "Name"
    }, {
      "name": "AGE",
      "alias": "Age"
    }]
  }
}, {
  "name": "Global Natural Hazards",
  "url": "http://maps.ngdc.noaa.gov/arcgis/rest/services/web_mercator/hazards/MapServer/1",
  "expression": "CAUSE like '[value]'",
  "textsearchlabel": "Search Hazards by CAUSE... [ Example: Earthquake% ]",
  "textsearchhint": "Natural Hazards Cause",
  "titlefield": "CAUSE",
  "linkfield": "",
  "fields": {
    "all": false,
    "field": [{
      "name": "CAUSE",
      "alias":"Cause"
    }]
  }
}]
```

* `zoomscale`: number; default: 10000; For features with no known extent, a zoom scale can be set. Otherwise, it will zoom into the extent of the feature.

Example:
```
"zoomscale": 10000
```

* `symbols`: Object; default: no default; The symbol used to represent the features.

Example:
```
"symbols": {
  "simplemarkersymbol": {
    "type": "esriSMS",
    "style": "esriSMSSquare",
    "color": [76, 115, 0, 255],
    "size": 8,
    "outline": {
      "color": [152, 230, 0, 255],
      "width": 1
    }
  },
  "picturemarkersymbol": null,
  "simplelinesymbol": null,
  "simplefillsymbol": null
}
```