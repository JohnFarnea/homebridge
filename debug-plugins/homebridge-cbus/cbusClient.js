var CGate = require("./cgate").CGate;

function CbusClient(log, config) {
    this.log = log;
    this.log("Initialising CBUS Client");
    this.config = config;
    this.groupCache = {};

    if(config.cgate){
        console.log('Initializing the cgate connector');
        this.cgate = new CGate(log, config);
        this.cgate.write("PROJECT USE WIND38\r");
    }
}

CbusClient.prototype.setValue = function(group, value) {
    // convert Siri true/false to On/Off
    if (value === true || value === 1) {
        value = 255;
    }
    if (value == false) {
        value = 0;
    }
    this.log("setting cache value for " + group);
    this.groupCache[group] = value;
    var command = "RAMP " + group + " " + value + " 0\r";
    console.log("Executing CBUS Command : " + command);
    this.cgate.write("RAMP " + group + " " + value + " 0\r");
}

CbusClient.prototype.getValue = function(group) {
    return 100;
    if (this.groupCache[group] != undefined) {
        this.log("returning value from cache for " + group);
        return this.groupCache[group];
    }
    this.log("Cache miss for " + group);
    return true; // Default value
}

CbusClient.prototype.clearCache = function() {
    this.groupCache = {};
}

CbusClient.prototype.stop = function() {
    this.log("Stopping CBUS Client");
}

module.exports = { 
    CbusClient: CbusClient
}
