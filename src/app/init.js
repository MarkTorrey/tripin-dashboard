var dojoConfig, path = getPath();
/*global apiUrl, weinreUrl, loadResource, loadResources */

if(apiUrl.substr(apiUrl.length - 1, apiUrl.length) !== '/'){
  apiUrl = apiUrl + '/';
}

var loadingInfo = document.querySelector('#main-loading .loading-info');

if(window.debug){
  loadResource('js', weinreUrl, null, loadingInfo);
}

loadResources([
  //{type: 'css', url: apiUrl + 'js/dojo/dojo/resources/dojo.css'},
  //{type: 'css', url: apiUrl + 'js/dojo/dijit/themes/claro/claro.css'},
  //{type: 'css', url: apiUrl + 'js/esri/css/esri.css'},
  { type: 'css', url: 'themes/TripInTheme/styles/flat/dojo/flat.css' },
  { type: 'css', url: 'themes/TripInTheme/styles/flat/esri/css/esri.css' },
  {type: 'js', url: apiUrl},
  {type: 'css', url: path + 'jimu.js/css/jimu.css'}
], function(){
  require(['jimu'], function(jimuMain){
    jimuMain.initApp();
  });
}, loadingInfo);


if(!path){
  console.error('error path.');
}else{
  /*jshint unused:false*/
  dojoConfig = {
    parseOnLoad: false,
    async: true,
    tlmSiblingOfDojo: false,

    has: {
      'extend-esri': 1
    },
    packages : [{
      name : "widgets",
      location : path + "widgets"
    }, {
      name : "jimu",
      location : path + "jimu.js"
    }, {
      name : "themes",
      location : path + "themes"
    }]
  };

  jimuConfig = {
    loadingId: 'main-loading',
    mainPageId: 'main-page',
    layoutId: 'jimu-layout-manager',
    mapId: 'map'
  };
}

function getPath() {
  var fullPath, path;

  fullPath = window.location.pathname;
  if(fullPath === '/' || fullPath.substr(fullPath.length - 1) === '/'){
    path = fullPath;
  }else if(fullPath.split('/').pop() === 'index.html'){
    var sections = fullPath.split('/');
    sections.pop();
    path = sections.join('/') + '/';
  }else{
    return false;
  }
  return path;
}

