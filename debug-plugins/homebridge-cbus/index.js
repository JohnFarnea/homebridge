var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-cbus", "CbusPlatform", CbusPlatform, true);
}

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function CbusPlatform(log, config, api) {
    log("CBUS Platform Init");
    var platform = this;
    this.log = log;
    this.config = config;
    this.configuredAccessories = [];

    if (api) {
        // Save the API object as plugin needs to register new accessory via this object.
        this.api = api;

        // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
        // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
        // Or start discover new accessories
        this.api.on('didFinishLaunching', function () {
            platform.log("DidFinishLaunching");
            platform.registerNewAccessories();
        }.bind(this));
    }
}

// Function invoked when homebridge tries to restore cached accessory
// Developer can configure accessory at here (like setup event handler)
// Update current value
CbusPlatform.prototype.configureAccessory = function (accessory) {
    this.log(accessory.displayName, "Configure Accessory");
    var platform = this;

    platform.setupAccessory(accessory);
    platform.configuredAccessories.push(accessory);

    // set the accessory to reachable if plugin can currently process the accessory
    // otherwise set to false and update the reachability later by invoking 
    // accessory.updateReachability()
    accessory.reachable = true;

}

CbusPlatform.prototype.setupAccessory = function(accessory) {

    var platform = this;

    accessory.on('identify', function (paired, callback) {
        platform.log(accessory.displayName, "Identify!!!");
        callback();
    });

    // Plugin can save context on accessory
    // To help restore accessory in configureAccessory()
    // newAccessory.context.something = "Something"

    // check if we have the service already? configuring existing accessory?
    var service = accessory.getService(Service.Lightbulb);

    if (!service) {
        service = accessory.addService(Service.Lightbulb);        
    }

    service.getCharacteristic(Characteristic.On)
        .on('set', function (value, callback) {
            platform.log(accessory.displayName, "Light -> " + value);
            callback();
        })
        .on('get', function (callback) {
            platform.log(accessory.displayName, "Get the value from CBUS");
            callback(0);
        });
}

CbusPlatform.prototype.registerNewAccessories = function() {
    var platform = this;
    this.log("running resgisterNewAccessories()");

    var newNames = ["Test1", "Test2", "Test3", "Test4", "Test5", "Test6"]; // TODO Get these from config
    var accessoryList = [];
    
    for (var i=0; i< newNames.length; i++) {
        var accessoryName = newNames[i];
        uuid = UUIDGen.generate(accessoryName);
        var newAccessory = new Accessory(accessoryName, uuid);
        if (!this.isconfigured(newAccessory)) {
            platform.setupAccessory(newAccessory);
            accessoryList.push(newAccessory);
        }
    }

    this.log("Registering " + accessoryList.length + " new accessories!");
    this.api.registerPlatformAccessories("homebridge-cbus", "CbusPlatform", accessoryList);

}

CbusPlatform.prototype.isconfigured = function(accessory) {
    for (var i=0; i<this.configuredAccessories.length;i++) {
        var ca = this.configuredAccessories[i];
        if (ca.UUID == accessory.UUID)
            return true;
    }
    return false;
}


CbusPlatform.prototype.createAccessory = function(accessoryName) {
    this.log("runnin createAccessory()");
    var platform = this;
    var uuid;

    uuid = UUIDGen.generate(accessoryName);

    var accessory = new Accessory(accessoryName, uuid);

    accessory.on('identify', function (paired, callback) {
        platform.log(accessory.displayName, "Identify!!!");
        callback();
    });

    // Plugin can save context on accessory
    // To help restore accessory in configureAccessory()
    // newAccessory.context.something = "Something"

    accessory.addService(Service.Lightbulb, "Test Light")
        .getCharacteristic(Characteristic.On)
        .on('set', function (value, callback) {
            platform.log(accessory.displayName, "Light -> " + value);
            callback();
        })
        .on('get', function (callback) {
            platform.log(accessory.displayName, "Get the value from CBUS");
            callback(0);
        });

    return accessory;
}

// Sample function to show how developer can add accessory dynamically from outside event
CbusPlatform.prototype.addAccessory = function (accessoryName) {
    this.log("running addAccessory()");
    var newAccessory = this.createAccessory(accessoryName);
    this.api.registerPlatformAccessories("homebridge-cbus", "CbusPlatform", [newAccessory]);
}

CbusPlatform.prototype.updateAccessoriesReachability = function () {
    this.log("Running updateAccessoriesReachability()");
//    for (var index in this.accessories) {
//        var accessory = this.accessories[index];
//        accessory.updateReachability(false);
//    }
}

// Sample function to show how developer can remove accessory dynamically from outside event
CbusPlatform.prototype.removeAccessory = function () {
    this.log("Remove Accessory");
    this.api.unregisterPlatformAccessories("homebridge-cbus", "CbusPlatform", []);

}
