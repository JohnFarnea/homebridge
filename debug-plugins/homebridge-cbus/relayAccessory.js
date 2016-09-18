
function RelayAccessory(log, relayConfig, Service, Characteristic) {
    this.log = log;

    // config info
    this.name = relayConfig["name"];
    this.type = relayConfig["type"];

    //  this.services = this.getServices();

}

RelayAccessory.prototype.setPowerState = function (powerOn, callback) {
    if (powerOn) {
        this.log("[" + this.name + "] Setting power state to on");
        // call this.relay function to turn on relay
    } else {
        this.log("[" + this.name + "] Setting power state to off");
        // call this.relay funciton to turn off relay
    }
    callback(null);
}

RelayAccessory.prototype.identify = function (callback) {
    this.log("[" + this.name + "] Identify requested!");
    callback(null); // success
}

RelayAccessory.prototype.getServices = function () {
    this.log("Running getServices in RelayAccessory");

    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, this.log.prefix)
        .setCharacteristic(Characteristic.Model, this.type)
        .setCharacteristic(Characteristic.SerialNumber, "JDF123");

    this.lightbulbService = new Service.Lightbulb(this.name);

    this.lightbulbService
        .getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this));

    return [this.informationService, this.lightbulbService];
}