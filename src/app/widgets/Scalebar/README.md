## Scalebar ##
### Overview ###
The scalebar widget displays a scalebar on the map or in a specified HTML node. The widget respects various coordinate systems and displays units in english or metric values. When working with Web Mercator or geographic coordinate systems the scalebar takes into account projection distortion and dynamically adjusts the scalebar. The Scalebar sample, which uses a map using the Web Mercator projection, shows this behavior. Open the sample and note that as you pan the map south towards the equator the scalebar gets shorter and as you pan north it gets longer. 

### Attributes ###
* `scalebar`: An object of ArcGIS API for Javascript, see the params of [Scalebar Constructor](https://developers.arcgis.com/en/javascript/jsapi/scalebar-amd.html#scalebar1).

Example:
```
{
  "scalebar": {
    "scalebarStyle": "line",
    "scalebarUnit": "dual"
  }
}
```