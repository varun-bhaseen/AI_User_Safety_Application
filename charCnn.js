const vocabularySize = 69;
const maxLen = 300;
const PAD_INDEX = 0;  // Index of padding char.
const OOV_INDEX = 0;  // Index of OOV char. !!! research here and make he same as in model
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789,;.!?:'\"/\\|_@#$%^&*~`+-=<>()[]{}";
const phish_classes = ['Legitimate', 'Phishing'];

function padSequences(
    sequences, maxLen, padding = 'pre', truncating = 'pre', value = PAD_INDEX) {
  return sequences.map(seq => {
    // truncate
    if (seq.length > maxLen) {
      if (truncating === 'pre') {
        seq.splice(0, seq.length - maxLen);
      } else {
        seq.splice(maxLen, seq.length - maxLen);
      }
    }

    // padding
    if (seq.length < maxLen) {
      const pad = [];
      for (let i = 0; i < maxLen - seq.length; ++i) {
        pad.push(value);
      }
      if (padding === 'pre') {
        seq = pad.concat(seq);
      } else {
        seq = seq.concat(pad);
      }
    }
    return seq;
  });
}

export async function runCharCnn(url) {
  const MODEL_URL = 'CharCNN/model.json';
  const start = Date.now();
  const model = await tf.loadLayersModel(MODEL_URL);
  //console.log(model.summary());
  console.log("load Char cnn model time = " + (start - Date.now()));
  const charIndices = {};
  const indicesChar = {};
  for (let i = 0; i < alphabet.length; ++i) {
    const char = alphabet[i];
    charIndices[char] = i + 1;
  }

  document.getElementById('fullUrl').textContent  = "Taken URL sent to Char CNN: " + url;
  const inputText = url.trim().toLowerCase().split('');

  // Convert the chars to a sequence of chars indices.
  const sequence = inputText.map(char => {
    let charIndex = charIndices[char];
    if (typeof charIndex === 'undefined') {
      return OOV_INDEX;
    }
    return charIndex;
  });

  // Perform truncation and padding.
  const paddedSequence = padSequences([sequence], maxLen);
  //console.log(paddedSequence);
  const tensor = tf.tensor2d(paddedSequence, [1, maxLen], 'int32');
  const startPed = Date.now();
  console.log("start char cnn prediction time" + startPed);
  const probs = model.predict(tensor);
  console.log("end char cnn prediction time" + (startPed - Date.now()));
  console.log("probs from the model =" + probs);

  const probsTensorData = probs.dataSync();

  var charCnnElement = document.getElementById('charCnnResult');

  charCnnElement.innerHTML = "<b>Char CNN Processed: </b><br />";
  charCnnElement.innerHTML += "Scores:<br />";
  charCnnElement.innerHTML += "Legitimate: " + (probsTensorData[0]*100).toFixed(2) + "%<br />";
  charCnnElement.innerHTML += "Phishing: " + (probsTensorData[1]*100).toFixed(2) + "%";

  const predictions = phish_classes[probs.argMax(-1).dataSync()[0]];
  console.log("CHAR CNN predictions =" + predictions);
  return predictions;

  //alert("phish:1, valid:0. Predictions = " + predictions);

  //ref: https://github.com/tensorflow/tfjs-examples/tree/f2e56dcadba35115c78d4fb2481366785804021b/iris-fitDataset
  // for metrics example (conf matrix, TP, FP)
}
