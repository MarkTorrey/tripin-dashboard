## Coordinate ##
### Overview ###
Show the coordinate of the current map.

### Attributes ###
* `*outputunit`: String; default: "geo"; Valid values are: "dms" and "geo".  
"dms": The output format looks like "26° 32′ 11″ N 123° 37′ 12″ W".  
"geo": The output format looks like "Latitude: 26.497302 Longitude: -120.851562".
* `spatialReferences`: Object[]; default: no default; Show popup menu which contains all configured spatial reference info when mouse is hovering over the widget itself.
  * `wkid`: Number; default: no default; SpatialReference's wkid. more details see [Projected Coordinate Systems](https://developers.arcgis.com/en/javascript/jshelp/pcs.html).
  * `label`: String, default: no default; A label for these wkid.

Example:
```
{
  "outputunit": "dms",
  "spatialReferences": [{
    "wkid": 2000,
    "label": "Anguilla_1957_British_West_Indies_Grid"
  },{
    "wkid": 2001,
    "label": "Antigua_1943_British_West_Indies_Grid"
  },{
    "wkid": 2274,
    "label": "NAD_1983_StatePlane_Tennessee_FIPS_4100_Feet"
  }]
}
```   
