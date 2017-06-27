// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const net = require('net');
const guiServerIp = "127.0.0.1";
const guiServerPort = "8000";
const debugOutput = true;

var horizontalSlider = document.getElementById("horizontal-slider");
var verticalSlider = document.getElementById("vertical-slider");
var horizontalValue = document.getElementById("value-horizontal");
var verticalValue = document.getElementById("value-vertical");
var gripButton = document.getElementById("grip-button");
var refreshButton = document.getElementById("refresh-button");
var robotSelect = document.getElementById("robot-selector");

// Modal
var modal = document.getElementById('settings-modal');
var btn = document.getElementById("settings-button");
var span = document.getElementsByClassName("close")[0];
 
btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

var gripStatus = false;
var robotRegistry;


function sendMessage(serviceName, value)
{
    var msg = {
        "type" : "movement",
        "name" : String(robotSelect.options[robotSelect.selectedIndex].value),
        "service" : serviceName,
        "value" : String(value),
    }
    client.write(JSON.stringify(msg) + '\r\n');
    log('Sent message: ' + JSON.stringify(msg));
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
    log("Sent message " + getServicesMsg.type + "to Server " + guiServerIp + ":" + guiServerPort);

    // Set callback for response
    client.on('data', (data) => {
        if (JSON.stringify(robotRegistry) === data.toString())
        {
            log("Received same RobotRegistry!");
            return;
        }
        // Save response array of robot names
        robotRegistry = JSON.parse(data.toString());

        log("Received answer: " + JSON.stringify(robotRegistry));

        // Delete list in frontend and populate again
        robotSelect.innerHTML = "";

        for (var robotName in robotRegistry)
        {
            var newOption = document.createElement("option");
            newOption.text = robotName;
            newOption.value = robotName;
            robotSelect.add(newOption);
        }
        refreshGuiElements();
    });

}

function refreshGuiElements()
{
    var currentRobot = String(robotSelect.options[robotSelect.selectedIndex].value);
    var servicesForCurrentRobot = robotRegistry[currentRobot];

    if ('moveVertical' in servicesForCurrentRobot)
    {
        document.getElementById('vertical-wrapper').style.display='flex';
    }

    if ('emergencyStop' in servicesForCurrentRobot)
    {
        document.getElementById('emergency-wrapper').style.display='inline';
    }
    
}

function updateDisplayValuesNewRobot(newRobotId)
{
    // Need response channel from robot to implement
}

const client = net.connect({port: guiServerPort, host: guiServerIp}, function() {
    log('Connected to server ' + guiServerIp + ':' + guiServerPort);
});

function log(message)
{
    if (debugOutput)
    {
        console.log(message);
    }
}

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
    log("Refresh triggered!");
    getServices();
}, false);
