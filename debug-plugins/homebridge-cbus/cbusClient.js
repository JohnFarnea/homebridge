

function CbusClient(log, config) {
    this.log = log;
    this.log("Initialising CBUS Client");
    this.config = config;
    this.groupCache = {};

}

CbusClient.prototype.setValue = function(group, value) {
    this.log("setting cache value for " + group);
    this.groupCache[group] = value;
}

CbusClient.prototype.getValue = function(group) {
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
