
'use strict';

chrome.runtime.onInstalled.addListener(() => {
  console.log("from background");
  /* chrome.tabs.captureVisibleTab(null, {format: "png"},
  function(dataURI) {
    //yolo.runYolo(dataURI);
    console.log('data uri from backgr' + dataURI);
    alert(dataURI);
  });  */  
  
}); 



