var config = {
  cgate: {
    host: '192.168.4.45',
    contolport: 20023,
    eventport: 20024,
    statusport: 20025,
    cbusname: 'WIND38',
    network: 254,
    application: 56
  },
  webserver: {
    port: 8080,
    host: 'localhost'
  },
  location: {
    latitude: '43.4667',
    longitude: '-112.0333',
    timezone: 'America/Denver'
  }
};

module.exports = config;
