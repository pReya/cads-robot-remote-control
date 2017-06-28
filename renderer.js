// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const net = require('net');
const dgram = require('dgram');

var guiServerIp = "127.0.0.1";
var guiServerPort = "8887";
var debugOutput = true;

var horizontalSlider = document.getElementById("horizontal-slider");
var verticalSlider = document.getElementById("vertical-slider");
var horizontalValue = document.getElementById("value-horizontal");
var verticalValue = document.getElementById("value-vertical");
var gripButton = document.getElementById("grip-button");
var refreshButton = document.getElementById("refresh-button");
var emergencyButton = document.getElementById("emergency-button");
var robotSelect = document.getElementById("robot-selector");

// Modal
var modal = document.getElementById('settings-modal');
var btn = document.getElementById("settings-button");
var span = document.getElementsByClassName("close")[0];
var saveSettingsButton = document.getElementById("save-settings");
 
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

saveSettingsButton.addEventListener("click", function() {
    log("Settings were saved!");
    modal.style.display = "none";
    saveSettings();
    refreshGuiElements();
}, false);

var gripStatus = false;
var robotRegistry;

function saveSettings()
{
    guiServerIp = document.getElementById("ip-input").value;
    guiServerPort = document.getElementById("port-input").value;
    debugOutput = document.getElementById("debug-output").checked;
    client = net.connect({port: guiServerPort, host: guiServerIp}, function() {
        log('Connected to server ' + guiServerIp + ':' + guiServerPort);
        getServices();
    });
}

function sendMessage(serviceName, value)
{
    if (serviceName && value)
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
    else
    {
        log("Can not send empty message!");
    }
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
    log("Sent message " + getServicesMsg.type + " to Server " + guiServerIp + ":" + guiServerPort);

    // Set callback for response
    client.on('data', parseRobotRegistryAnswer);

}

function refreshGuiElements()
{

    var currentRobot = String(robotSelect.options[robotSelect.selectedIndex].value);
    var servicesForCurrentRobot = robotRegistry[currentRobot];

    // Create deep copy of object, so we can edit it
    servicesForCurrentRobot = JSON.parse(JSON.stringify(servicesForCurrentRobot));

    document.getElementById('spinner-wrapper').classList.add('hidden');

    // Parse static services with custom design
    if ('moveVertical' in servicesForCurrentRobot)
    {
        delete servicesForCurrentRobot.moveVertical;
        document.getElementById('vertical-wrapper').classList.remove('hidden');
    }
    else
    {
        document.getElementById('vertical-wrapper').classList.add('hidden');
    }

    if ('moveHorizontal' in servicesForCurrentRobot)
    {
        delete servicesForCurrentRobot.moveHorizontal;
        document.getElementById('horizontal-wrapper').classList.remove('hidden');
    }
    else
    {
        document.getElementById('horizontal-wrapper').classList.add('hidden');
    }

    if ('grab' in servicesForCurrentRobot)
    {
        delete servicesForCurrentRobot.grab;
        document.getElementById('grab-wrapper').classList.remove('hidden');
    }
    else
    {
        document.getElementById('grab-wrapper').classList.add('hidden');
    }

    if ('emergencyStop' in servicesForCurrentRobot)
    {
        delete servicesForCurrentRobot.emergencyStop;
        document.getElementById('emergency-wrapper').classList.remove('hidden');
    }
    else
    {
        document.getElementById('emergency-wrapper').classList.add('hidden');
    }

    // Now parse all dynamic, custom services

    // Get parent element and clear all entries
    var parentElement = document.getElementById('customservices-wrapper');
    parentElement.innerHTML = "";

    if (Object.keys(servicesForCurrentRobot).length > 0)
    {
        document.getElementById('custom-headline').classList.remove('hidden');
    }

    // Populate parent element
    for (var serviceName in servicesForCurrentRobot)
    {
        var serviceObject = servicesForCurrentRobot[serviceName];
        
        var htmlContent = "";
        // Service has a range parameter (slider)
        if (serviceObject.parameter == 'range')
        {
            htmlContent = `
                <div class="Grid-cell">
                    <div class="slider horizontal border-box full-width">
                        <label for="${serviceName}-${currentRobot.substring(0,7)}-slider" class="text-label">${serviceObject.description}</label><br />
                        <label for="${serviceName}-${currentRobot.substring(0,7)}-slider">
                            <i class="fa fa-chevron-circle-left" aria-hidden="true"></i>
                        </label>
                            <input type="range" id="${serviceName}-${currentRobot.substring(0,7)}-slider" name="${serviceName}" min="0" max="100" value="50"/>
                        <label for="${serviceName}-${currentRobot.substring(0,7)}-slider">
                            <i class="fa fa-chevron-circle-right" aria-hidden="true"></i>
                        </label>
                    </div>
                </div>
            `;
        }
        // Service has a binary parameter (button)
        else if (serviceObject.parameter == 'binary')
        {
            htmlContent = `
                <div class="Grid-cell">
                    <div class="button-wrapper">
                        <a nohref class="border-box button full-width" id="${serviceName}-${currentRobot.substring(0,7)}-button" name="${serviceName}">${serviceObject.description}</a>
                    </div>
                </div>
            `;
        }
        
        var guiButton = document.createElement("div");
        guiButton.className = "Grid";
        guiButton.id = serviceName + "-wrapper";
        guiButton.innerHTML = htmlContent;
        parentElement.appendChild(guiButton);

        // Add event listener to new element
    

        if (serviceObject.parameter == 'range')
        {
            var newSlider = document.getElementById(serviceName + "-" + currentRobot.substring(0,7) + "-slider");
            newSlider.addEventListener("change", function() {
                log("Custom service " + this.name + " triggered!");
                sendMessage(this.name, this.value);
            }, false);
        }
        else
        {
            var newButton = document.getElementById(serviceName + "-" + currentRobot.substring(0,7) + "-button");
            newButton.addEventListener("click", function() {
                log("Custom service " + this.name + " triggered!");
                sendMessage(this.name, "1");
            }, false);
        }

    }
    
}

function parseRobotRegistryAnswer(data)
{
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
}

function log(message)
{
    if (debugOutput)
    {
        console.log(message);
    }
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

var client = net.connect({port: guiServerPort, host: guiServerIp}, function() {
    log('Connected to server ' + guiServerIp + ':' + guiServerPort);
});

// Set initial value displays
horizontalValue.innerHTML = horizontalSlider.value;
verticalValue.innerHTML = verticalSlider.value;
document.getElementById("ip-input").value = guiServerIp;
document.getElementById("port-input").value = guiServerPort;
document.getElementById("debug-output").checked = debugOutput;

// Delay start of program to see if alle elements are correctly hidden
sleep(2000).then(() => {
    getServices();
})


// Event listeners
horizontalSlider.addEventListener("change", function() {
    horizontalValue.innerHTML = horizontalSlider.value;
    sendMessage("moveHorizontal", horizontalSlider.value);
}, false); 

verticalSlider.addEventListener("change", function() {
    verticalValue.innerHTML = verticalSlider.value;
    sendMessage("moveVertical", verticalSlider.value);
}, false);

robotSelect.addEventListener("change", function() {
    log("Changed active robot!");
    refreshGuiElements();
}, false);

gripButton.addEventListener("click", toggleGripStatus);

emergencyButton.addEventListener("click", function() {
    log("Emergency stop triggered!");
    sendMessage("emergencyStop", "1");
}, false);

refreshButton.addEventListener("click", function() {
    log("Refresh triggered!");
    getServices();
}, false);
