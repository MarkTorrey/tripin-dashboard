## HomeButton ##
### Overview ###
HomeButton provides a simple button to return to the map's default starting extent.

### Attributes ###
* `homeButton`: An object of ArcGIS API for Javascript, see the params of [HomeButton Constructor](https://developers.arcgis.com/en/javascript/jsapi/homebutton-amd.html#homebutton1).
* `extent`: Object, A json object of Extent of ArcGIS JavaScript API; default: null; The extent used to zoom to when clicked. If null will use starting extent. See the parameter "json" of [Extent Constructor](https://developers.arcgis.com/en/javascript/jsapi/extent-amd.html#extent2).

Example:
```
{
  "homeButton": {
    "extent": {
      "xmin": -122.68,
      "ymin": 45.53,
      "xmax": -122.45,
      "ymax": 45.6,
      "spatialReference": {
        "wkid": 4326
      }
    }
  }
}
```
