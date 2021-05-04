function getImageFromDataURI(dataURI) {
  const img = new Image;
  img.src = dataURI;
  img.width = 416;
  img.height = 416;
  return img;
}

export async function runYolo(dataURI) {
  return new Promise(function(resolve, reject) {
    const image = getImageFromDataURI(dataURI);
    const encodedImage = image.src.replace("data:image/png;base64,", "");
    // !!!! remove then; just for now to see a screenshot
    //var im = document.getElementById('screnshot');
    //im.src = image.src;

    // send post request for YOLO prediction
    let xhr = new XMLHttpRequest();
    //xhr.open("POST", 'http://127.0.0.1:5000/predict', true);
    xhr.open("POST", 'http://ec2-34-234-59-231.compute-1.amazonaws.com/predict', true);
    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) // could be also ==201
        {
            // Request finished. Do processing here.
            //console.log('rest api response = ' + xhr.responseText);
            resolve(xhr.responseText);
        }
    }
    xhr.send(encodedImage);
    console.log("encoded image for YOLO= " + encodedImage);
  });
};