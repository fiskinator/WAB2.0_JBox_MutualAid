define({
  //Default configuration settings for the applciation. This is where you"ll define things like a bing maps key,
  //default web map, default app color theme and more. These values can be overwritten by template configuration settings
  //and url parameters.
  "appid": "",
  //"webmap": "4b762458c7994fc08b4994a2dc76e9fc",
  //"webmap": "1f21fceb2f30460b9d1ba43c324c19e5", // Sarnia Population Density
  "webmap": "d16d53126f1243a3a7a7f1d0dff39662", //Severe Weather Web Map
  "group":"cdbc676652d44883a642edfcb0c10e27",
  "oauthappid": null,
  //prompt for portal login to access secure webmaps from group
  "portalLogin": true,
  //Enter the url to the proxy if needed by the applcation. See the "Using the proxy page" help topic for details
  //developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
  "proxyurl": "",
  //Example of a template specific property. If your template had several color schemes
  //you could define the default here and setup configuration settings to allow users to choose a different
  //color theme.
  "title": "",
  "summary": "",
  "defaultPanel": "thira",
  "enableDialogModal": false,
  "dialogModalContent": "",
  "dialogModalTitle": "",
  "enableSummaryInfo": true,
  "enableMyThiraPanel": true, //Jon added for 4th button 
  "enableLegendPanel": true,
  "enableAboutPanel": true,
  "enableLayersPanel": true,
  "enableHomeButton": true,
  "enableLocateButton": true,
  "enableBasemapToggle": true,
  "enableShareDialog": true,
  "enableBookmarks": true,
  "enableOverviewMap": true,
  "openOverviewMap": false,
  "enableModifiedDate": true,
  "enableViewsCount": true,
  "enableMoreInfo": true,
  "enablePrintButton": false,
  "defaultBasemap": "topo",
  "nextBasemap": "hybrid",
  //Go to http://www.arcgis.com/sharing/rest/content/items/df8bcc10430f48878b01c96e907a1fc3/data?f=pjson and input below the appropriate operational layer that you want to configure as swipe layer
  "swipeLayer": [{
    "fields": [],
    "id": ""
  }],
  "locationSearch": true,
  //When searchExtent is true the locator will prioritize results within the current map extent.
  "searchExtent": false,
  "searchLayers":[{
      "id": "",
      "fields": []
  }],
  "swipeType": "vertical",
  "swipeInvertPlacement": false,
  "hideNotesLayerPopups": true,
  //THIRA//
  "enableThira": true,
  "thiraVisible": true,
  "thiraWebmapId": "7543b28e89a74fe9a3e6109265703453", //michigan test
  "thiraLayerItemId": "c7ed050236c24b0a8a1f24b9918e2278", //update for thira layer item id
  //"thiraWebmapId": "94c77babc77a4b54b99b3bc67eade232", //blank webmap

  "capabilitiesLayerName": "Capabilities",
  "capabilitiesColorBoundary": [255,50,90],
  "capabilitiesWidth": "3",

  ////////////////////////
  "enableInstagram": false,
  "instagramVisible": false,
  "instagramTime": "",
  "enableFlickr": false,
  "flickrVisible": false,
  "flickrSearch": "",
  "flickrTime": "",
  "enableTwitter": false,
  "twitterVisible": false,
  "twitterSearch": "",
  "enableWebcams": false,
  "webcamsVisible": false,
  "enableYouTube": false,
  "youtubeVisible": false,
  "youtubeSearch": "",
  "youtubeTime": "all_time", // today, this_week, this_month, all_time
  "bitlyLogin": "arcgis",
  "bitlyKey": "R_b8a169f3a8b978b9697f64613bf1db6d",
  "twitterUrl": location.protocol + "//utility.arcgis.com/tproxy/proxy/1.1/search/tweets.json",
  "twitterSigninUrl": location.protocol + "//utility.arcgis.com/tproxy/signin",
  "flickr_key": "404ebea7d5bc27aa5251d1207620e99b",
  "webcams_key": "65939add1ebe8bc9cc4180763f5df2ca",
  "instagram_key": "288c36a1a42c49de9a2480a05d054619",
  "youtube_key": "AIzaSyBvrlsx50mxX_W-Ra2cJ8PB0jKt0jACZfg",
  /*
    "bannedUsersService": location.protocol + "//services.arcgis.com/QJfoC7c7Z2icolha/ArcGIS/rest/services/fai/FeatureServer/2",
    "bannedWordsService": location.protocol + "//tmservices1.esri.com/ArcGIS/rest/services/SharedTools/Filter/MapServer/1",
    "flagMailServer": location.protocol + "//tmappsevents.esri.com/Website/pim_fai/fai.php",
    */
  //Enter the url to your organizations bing maps key if you want to use bing basemaps
  "bingmapskey": "",
  //Defaults to arcgis.com. Set this value to your portal or organization host name.
  "sharinghost": location.protocol + "//" + "www.arcgis.com",
  //When true the template will query arcgis.com for default settings for helper services, units etc. If you 
  "units": null,
  "helperServices": {
    "geometry": {
      "url": null
    },
    "printTask": {
      "url": null
    },
    "elevationSync": {
      "url": null
    },
    "geocode": [{
      "url": null
           }]




  }




});
