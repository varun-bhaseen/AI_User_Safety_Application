'use strict';
import * as charCnn from "./charCnn.js";
import * as yolo from "./yolo.js";

var queryInfo = {
  active: true,
  currentWindow: true
};

function showMainResults(result) {
  document.getElementById('predictionResult').innerHTML = "Final prediction: <center><h3>" + result +"</h3></center>";

  //the color of the result text
  if (result == "Legitimate"){
    document.getElementById('predictionResult').style.color = "green";
  }
  else if (result == "Phishing") {
    document.getElementById('predictionResult').style.color = "red";

  }
  else if (result == "Suspicious"){
    document.getElementById('predictionResult').style.color = "orange";
  }

  document.getElementById("loading").style.display = "none";
}


// promise for active tab URL, tbd implement reject func
function getCurrURL(queryInfo) {
  return new Promise(function(resolve, reject) {
    chrome.tabs.query(queryInfo, function(tabs) {
      const tab = tabs[0];
      const url = tab.url;
      resolve(url);
    });
  });
}

// promise for screenshot, returns Data URI
function getScreenshotDataURI() {
  return new Promise(function(resolve, reject) {
    chrome.tabs.captureVisibleTab(null, {format: "png"},
      function(dataURI) {
        resolve(dataURI);
      });
  });
}

// ref for code: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
// number 71 inside
//tbd implement reject func
function getPhishTankResults(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://checkurl.phishtank.com/checkurl/', true);
    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() { // Call a function when the state changes.
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) // could be ==201 also
      {
          // Request finished. Do processing here.
          //resolve(isPhishing);
          resolve(xhr.responseText);
      }
    }
    xhr.send("url=" + url + "&format=json&app_key=6013496da13ac3ebc23cddf8d245bd73cc2d25a8549e4f5dd6437d7ba3457bad");
  });
}

getCurrURL(queryInfo).then(function(result) {
  const activeURL = result;
  console.log('activeURL = ' + activeURL);

  // phishTank results
  getPhishTankResults(activeURL).then(function(result) {
    let isPhishingPhishTank = false;
    let inPhishTankDatabase = false;
    const phishTankResults = result
    const jsonObj = JSON.parse(phishTankResults);
    if (jsonObj.meta.status == "success" && jsonObj.results.in_database == true)
    {
      console.log('url in database = ' + jsonObj.results.in_database);
      inPhishTankDatabase = true;
      isPhishingPhishTank = jsonObj.results.valid;
    }
    console.log('isPhishingPhishTank = ' + isPhishingPhishTank);
    if (isPhishingPhishTank === true) {
      showMainResults("Phishing");
    }
    else {
      const trancatedURL = activeURL.replace("http://", "").replace("https://", "");
      console.log("trancatedURL = " + trancatedURL);
      //char CNN prediction
      charCnn.runCharCnn(trancatedURL).then(function(result) {
        const charCNNResult = result;
        console.log("charCNNResult = " + charCNNResult);

        // YOLO prediction
        getScreenshotDataURI().then(function(result) {
          const dataURI = result;
          //console.log('dataURI = ' + dataURI);
          yolo.runYolo(dataURI).then(function(result) {
            console.log('result = ' + result);
            const yoloResultArray = result.replace("[", "").replace("]", "").split(",");
            const confScore = parseFloat(yoloResultArray[0].replace("'",""));
            const logoDetected = yoloResultArray[1];

            var yoloContent = document.getElementById('yoloResult');
            yoloContent.innerHTML = "A screenshot sent to the Yolo model. <br />";
            yoloContent.innerHTML += "<b>Yolo model processed: </b><br />";


            if (confScore > .7){
              yoloContent.innerHTML += "YOLO score: " + (confScore*100).toFixed(2) + "% <br />";
              yoloContent.innerHTML += "Logo: "  + logoDetected + "";
            }
            else{
              yoloContent.innerHTML += "No trained logo was found!";
            }

            console.log('confScore = ' + confScore);

            if (charCNNResult === "Phishing" && confScore > 0.7) {
              showMainResults("Phishing");
            }
            else if (inPhishTankDatabase === true && charCNNResult === "Phishing") {
              showMainResults("Suspicious");
            }
            else {
              showMainResults("Legitimate");
            }
          })
        })
        .catch(function() {
          console.log('error from getScreenshotDataURI');
        });

      });
    }
  })
  .catch(function() {
    console.log('error from getPhishTankResults');
  });

})
.catch(function() {
  console.log('error from getCurrURL');
});
