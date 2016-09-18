var program = require('commander');
var hap = require("hap-nodejs");
var version = require('./version');
var Server = require('./server').Server;
var Plugin = require('./plugin').Plugin;
var User = require('./user').User;
var log = require("./logger")._system;

'use strict';


var insecureAccess = false;

User.setStoragePath('.development-user');
Plugin.addPluginPath('debug-plugins');


// Initialize HAP-NodeJS with a custom persist directory
hap.init(User.persistPath());

var server = new Server(insecureAccess);

var signals = { 'SIGINT': 2, 'SIGTERM': 15 };
Object.keys(signals).forEach(function (signal) {
    process.on(signal, function () {
        log.info("Got %s, shutting down Homebridge...", signal);

        // Save cached accessories to persist storage.
        server._updateCachedAccessories();

        process.exit(128 + signals[signal]);
    });
});

server.run();
