
module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerPlatform("homebridge-test2", "Test2", Test2Platform); //update signature for homebridge 0.2.0
}

function Test2Platform(log, config, api) {
    log("Test2 Platform Init");
    var platform = this;
    this.log = log;
    this.config = config;

    if (api) {
        // Save the API object as plugin needs to register new accessory via this object.
        this.api = api;

        // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
        // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
        // Or start discover new accessories
        this.api.on('didFinishLaunching', function () {
            platform.log("DidFinishLaunching");
          //  platform.getAccessories();
        }.bind(this));
    }
}

Test2Platform.prototype = {
		accessories: function(callback) {
			this.log("Fetching Test2 devices.");
			var that = this;

			//create array of accessories
			var myAccessories = [];

			// if done, return the array to callback function
			this.log("returning "+myAccessories.length+" accessories");
			callback(myAccessories);
		}
};
