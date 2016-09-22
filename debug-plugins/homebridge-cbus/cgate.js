var net = require('net');
var carrier = require('carrier');

var control = {};
var events = {};
var statuses = {};

function CGate(log, config, setCacheCallback) {
  // TELNET SESSION TO CONTROL
  var CGate = this;
  this.log = log;
  this.config = config;
  this.setCacheCallback = setCacheCallback;
  control = net.createConnection(config.cgate.contolport, config.cgate.host);
  control.on('error', function (error) {
    log('cgate control socket error: ' + error);
  });
  control.on('end', function () {
    log('cgate control socket terminated');
  });
  control.on('close', function () {
    log('cgate control socket closed');
  });
  control.on('timeout', function () {
    log('cgate control socket timed out');
  });
  carrier.carry(control, function (line) {
    CGate.pushRealtime('controlStream', line);
  });

  // TELNET CHANNEL TO STATUS UPDATES
  events = net.createConnection(this.config.cgate.eventport, this.config.cgate.host);
  events.on('error', function (error) {
    log('cgate events socket error: ' + error);
  });
  events.on('end', function () {
    CGate.log('cgate events socket terminated');
  });
  events.on('close', function () {
    CGate.log('cgate events socket closed');
  });
  events.on('timeout', function () {
    CGate.log('cgate events socket timed out');
  });
  carrier.carry(events, function (line) {
    CGate.pushRealtime('eventStream', line);
  });

  // TELNET CHANNEL TO STATUS UPDATES
  statuses = net.createConnection(this.config.cgate.statusport, this.config.cgate.host);
  statuses.on('error', function (error) {
    log('cgate statuses socket error: ' + error);
  });
  statuses.on('end', function () {
    log('cgate statuses socket terminated');
  });
  statuses.on('close', function () {
    log('cgate statuses socket closed');
  });
  statuses.on('timeout', function () {
    log('cgate statuses socket timed out');
  });
  carrier.carry(statuses, function (line) {
    CGate.pushRealtime('statusStream', line);
  });


  // every time that a message arrives, we need to send it out the realtime websocket
  // periodically list the levels of all devices to make sure they are in sync
  setTimeout(this.syncLevels.bind(this), 5000);
  // repeat every 20 mins
  setInterval(this.syncLevels.bind(this), 1200000)

  //return module.exports;
}

CGate.prototype.write = function (msg) {
  if (msg) {
    control.write(msg);
  }
}

/* NOTE: This no longer will work as "application" can be more than 1 number
CGate.prototype.cmdString = function (device, command, level, delay) {
  var message = '';

  if (command == 'on') {
    message = 'ON //' + this.config.cgate.cbusname + '/' + this.config.cgate.network + '/' + this.config.cgate.application + '/' + device + '\n';
  }
  else if (command == 'off') {
    message = 'OFF //' + this.config.cgate.cbusname + '/' + this.config.cgate.network + '/' + this.config.cgate.application + '/' + device + '\n';
  }
  else if (command == 'ramp') {

    if (level <= 100) {
      if (delay) {
        message = 'RAMP //' + this.config.cgate.cbusname + '/' + this.config.cgate.network + '/' + this.config.cgate.application + '/' + device + ' ' + level + '% ' + delay + '\n';
      } else {
        message = 'RAMP //' + this.config.cgate.cbusname + '/' + this.config.cgate.network + '/' + this.config.cgate.application + '/' + device + ' ' + level + '%\n';
      }
    }
  }
  return message;
}
*/

CGate.prototype.humanLevelValue = function (level) {
  // convert levels from 0-255 to 0-100
  var temp = Math.round((level / 255) * 100)

  if (temp > 100) {
    temp = 100;
  }
  else if (temp < 0) {
    temp = 0;
  }

  return temp;
}

CGate.prototype.syncLevels = function () {
  this.log('cgate syncing levels');
  var appArray = this.config.cgate.application.toString().split(',');
  for (var i=0;i<appArray.length;i++) {
    var app = appArray[i];
    this.log("Syncing application " + app);
    var msg = message = 'GET //' + this.config.cgate.cbusname + '/' + this.config.cgate.network + '/' + app + '/* level\n';
    control.write(msg);
  }
}

////////////////////////
// MESSAGE PROCESSING
////////////////////////
CGate.prototype.parseMessage = function (data, type) {
  this.log(data);

  var packet = { raw: data };
  packet.type = 'unknown';
  packet.source = 'cbus';

  var array = data.match(/\b[\S]+\b/g);

  // is this a lighting packet?
  if (array[0] == 'lighting') {
    packet.type = 'lighting';

    packet.action = array[1];

    // last element of arr2 is the group
    packet.address = array[2];
    temp = array[2].replace(this.config.cgate.cbusname,"PROJECT"); // ensure project name does not contain numbers
    temp = temp.match(/\d+/g);
    packet.group = temp[2];
    packet.application = temp[1];

    var parseunit = array[3];
    var parseoid = array[4];

    if (packet.action == 'ramp') {
      packet.level = this.humanLevelValue(array[3]);
      packet.time = array[4];
      parseunit = array[5];
      parseoid = array[6];
    } else if (packet.action == 'on') {
      packet.level = 100;
    } else if (packet.action == 'off') {
      packet.level = 0;
    }

    temp = parseunit.split('=');
    packet.sourceunit = temp[1];

    temp = parseoid.split('=');
    packet.oid = temp[1];
  }

  // are we getting group level report?
  if (array[0].substring(0, 3) == '300') {
    var temp = array[array.length - 1].split('=');
    if (temp[0] == 'level') {
      packet.type = 'info';
      packet.level = this.humanLevelValue(temp[1]);
      var ind = (array.length == 3 ? 1 : 0);
      packet.address = array[ind];
      this.log("ARRAY:" + array);
      this.log("AD1:" + packet.address);
      if (packet.address.substring(0,3) == "300") {
        packet.address = packet.address.substring(4);
        this.log("AD2:" + packet.address);
      }
      var temp2 = array[ind].replace(this.config.cbusname,"PROJECT").match(/\d+/g);
      packet.group = temp2[temp2.length - 1];
      packet.application = temp2[temp2.length - 2];
    }
  }

  // add back the // if its been removed by the aplit
  if (packet.address && packet.address.substring(0,2) !== "//") {
    packet.address = "//" + packet.address;
  }

  this.log(packet);
  if (packet.address && packet.level !== undefined) {
    this.setCacheCallback(packet.address, packet.level);
  }

  // are there custom things we want to do when this event occurs? ONLY do this for the status stream
  if (type == 'statusStream' || packet.type == 'info') {
    //COMMON.processMessage(packet);
  }


  return packet;
}

CGate.prototype.pushRealtime = function (type, message) {
  this.log(type + ' : ' + message);
  // every message, before being sent out needs to be parsed to create a nice object that can be consumed
  var parsedMessage = this.parseMessage(message, type);
  //IO.emit(type, parsedMessage);
  this.log(parsedMessage);
}


module.exports = {
  CGate : CGate
}