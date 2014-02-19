## Bookmark ##
### Overview ###
The Bookmark widget can be used both 3D and 2D map. For 2D map, it stores a collection of map view extents; for 3D map, it stores a collection of camera. It also enables end users to create and add their own spatial bookmarks. In addition to this, Web Map bookmarks are automatically used if available(WIP).

### Attributes ###
* `bookmarks2D`: Object[]; default: no default; the 2D map bookmarks
  * `name`: String; default: no default; The name of the bookmark
  * `extent`: Number[]; default: no default; the map extent. The extent is an array that the length is 4 or 5. The first forth of the array is xmin, ymin, xmax, ymax, the fifth is the wkid. The fifth is optional, if not set, the default wkid is 4326.
  * `thumbnail`: String; default: "images/thumbnail_default.png". As a recommendation, put all of the image under the *images* folder

* `bookmarks3D`: Object[]; default: no default; the 3D map bookmarks
  * `name`: String; default: no default; The name of the bookmark
  * `camera`: Number[]; default: no default; The camera is an array that the length is 5 or 6. The first fifth of the array is x, y, z, heading, tilt, the sixth is the wkid. The sixth is optional, if not set, the default wkid is 4326.
  * `thumbnail`: String; default: "images/thumbnail_default.png". As a recommendation, put all of the image under the *images* folder
