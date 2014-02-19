## MyLocation ##
### Overview ###
MyLocation provides a simple button to locate and zoom to the users current location.

### Attributes ###
* `locateButton`: An object of ArcGIS API for Javascript, see the params of [LocateButton Constructor](https://developers.arcgis.com/en/javascript/jsapi/locatebutton-amd.html#locatebutton1).

Example:
```
{
  "locateButton": {
    "geolocationOptions": {
      "timeout": 10000
    },
    "highlightLocation": true
  }
}
```