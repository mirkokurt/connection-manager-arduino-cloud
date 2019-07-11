const arduinCloudRestApi = require('./arduino-cloud-api');
require("babel-polyfill");
const arduinCloudMessageApi = require('arduino-iot-js').default;
const Fetch = require('node-fetch').default;
const fetch = Fetch.default;
const Headers = Fetch.Headers;
global["fetch"] = fetch;
global["Headers"] = Headers;
const WebSocket = require('ws');	
global["WebSocket"] = WebSocket;

var initilized = false;
var ArduinoRestClient = new arduinCloudRestApi.ArduinoCloudClient();

const mqttHost = process.env.IOT_MQTTHOST_URL || 'wss.iot.oniudra.cc';
const authApiUrl = process.env.IOT_AUTH_API_URL || 'https://auth-dev.arduino.cc';

ArduinoCloudOptions = {
  host: mqttHost,
  port: 8443,
  ssl: true,             
  apiUrl: authApiUrl,
  useCloudProtocolV2: true
};

const init = async function(accessToken, refreshToken) {
	ArduinoCloudOptions.token = accessToken;
	try {
	  ArduinoRestClient.updateToken(accessToken);
	  global["ArduinoRestClient"] = ArduinoRestClient;
	  if(initilized) {
		await arduinCloudMessageApi.disconnect();
	  }
	  await arduinCloudMessageApi.connect(ArduinoCloudOptions);
	  global["ArduinoMessageClient"] = arduinCloudMessageApi;
	  initialized = true;

	  return;
	} catch (err) {
	  throw(err);
	}
};

exports.apiRest = ArduinoRestClient;
exports.apiMessage = arduinCloudMessageApi;
exports.init = init;
