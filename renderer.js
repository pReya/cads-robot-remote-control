// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const net = require('net');
const guiServerIp = "127.0.0.1";
const guiServerPort = "9999";

var horizontalSlider = document.getElementById("horizontal-slider");
var verticalSlider = document.getElementById("vertical-slider");
var horizontalValue = document.getElementById("value-horizontal");
var verticalValue = document.getElementById("value-vertical");

function sendMessage(serviceName, value)
{
    var msg = {
        "type" : serviceName,
        "value" : String(value),
    }
    client.write(JSON.stringify(msg) + '\r\n');
    console.log('Sent message: ' + JSON.stringify(msg));
}

const client = net.connect({port: guiServerPort, host: guiServerIp}, function() {
          console.log('Connected to server ' + guiServerIp + ':' + guiServerPort);
});

horizontalSlider.addEventListener("change", function() {
    horizontalValue.innerHTML = horizontalSlider.value;
    sendMessage("horizontal", horizontalSlider.value);
}, false); 

verticalSlider.addEventListener("change", function() {
    verticalValue.innerHTML = verticalSlider.value;
    sendMessage("vertical", verticalSlider.value);
}, false);
