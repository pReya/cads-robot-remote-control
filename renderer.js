// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const net = require('net');
const guiServerIp = "127.0.0.1";
const guiServerPort = "8000";

var horizontalSlider = document.getElementById("horizontal-slider");
var verticalSlider = document.getElementById("vertical-slider");
var horizontalValue = document.getElementById("value-horizontal");
var verticalValue = document.getElementById("value-vertical");
var gripButton = document.getElementById("grip-button");
var refreshButton = document.getElementById("refreshButton");

var gripStatus = false;
var robotNames;

function sendMessage(serviceName, value)
{
    var robotSelect = document.getElementById("robotSelector");
    var msg = {
        "type" : "movement",
        "name" : String(robotSelect.options[robotSelect.selectedIndex].value),
        "service" : serviceName,
        "value" : String(value),
    }
    client.write(JSON.stringify(msg) + '\r\n');
    console.log('Sent message: ' + JSON.stringify(msg));
}

function toggleGripStatus()
{
    gripStatus = !gripStatus;
    var gripStatusInt = gripStatus ? 1 : 0;
    sendMessage("grab", gripStatusInt);
}

function getServices()
{
    // Prepare Message
    var getServicesMsg = {
        "type" : "getservices"
    }

    // Send message
    client.write(JSON.stringify(getServicesMsg) + '\r\n');
    console.log("Sent message " + getServicesMsg.type + "to Server " + guiServerIp + ":" + guiServerPort);

    // Set callback for response
    client.on('data', (data) => {
        console.log("Received answer: " + data.toString());

        // Save response array of robot names
        robotServices = JSON.parse(data.toString());

        // Refresh list in frontend
        var robotSelect = document.getElementById("robotSelector");
        robotSelect.innerHTML = "";

        for (robotName in robotServices)
        {
            var newOption = document.createElement("option");
            newOption.text = robotName;
            newOption.value = robotName;
            robotSelect.add(newOption);
        }

    });


}

function updateDisplayValuesNewRobot(newRobotId)
{
    // Need response channel from robot to implement
}

const client = net.connect({port: guiServerPort, host: guiServerIp}, function() {
          console.log('Connected to server ' + guiServerIp + ':' + guiServerPort);
});

// Start of program
getServices();


horizontalSlider.addEventListener("input", function() {
    horizontalValue.innerHTML = horizontalSlider.value;
    sendMessage("moveHorizontal", horizontalSlider.value);
}, false); 

verticalSlider.addEventListener("input", function() {
    verticalValue.innerHTML = verticalSlider.value;
    sendMessage("moveVertical", verticalSlider.value);
}, false);

gripButton.addEventListener("click", toggleGripStatus);

refreshButton.addEventListener("click", function() {
    getServices();
}, false);
