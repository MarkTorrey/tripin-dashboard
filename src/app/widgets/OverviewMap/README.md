## OverviewMap ##
### Overview ###
The OverviewMap widget displays the current extent of the map within the context of a larger area. The OverviewMap updates whenever the map extent changes. The extent of the main map is represented in the overview map area as a rectangle. The extent rectangle can be dragged to modify the extent of the main map.

### Attributes ###
* `scalebar`: An object of ArcGIS API for Javascript, see the params of [OverviewMap Constructor](https://developers.arcgis.com/en/javascript/jsapi/overviewmap-amd.html#overviewmap1).
* `minWidth`: Number; default: 200; The minimal width of OverviewMap.
* `minHeight`: Number; default: 150; The minimal height of OverviewMap.
* `maxWidth`: Number; default: 400; The maximum width of OverviewMap.
* `maxHeight`: Number; default: 300; The maximum height of OverviewMap.

Example:
```
{
  "overviewMap":{
    "visible": false
  },
  "minWidth": 200,
  "minHeight": 150,
  "maxWidth": 400,
  "maxHeight": 300
}
```