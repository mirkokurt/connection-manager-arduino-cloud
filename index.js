const arduinCloudRestApi = require('./arduino-cloud-api');
const storagetApi = require('./storage-api');
require("babel-polyfill");
const arduinCloudMessageApi = require('arduino-iot-js').default;
const Fetch = require('node-fetch').default;
const fetch = Fetch.default;
const Headers = Fetch.Headers;
global["fetch"] = fetch;
global["Headers"] = Headers;
const WebSocket = require('ws');	
global["WebSocket"] = WebSocket;
const fs = require('fs').promises;
const refreshToken = require("./refresh");
const os = require('os');

var initialized = false;
var ArduinoRestClient = new arduinCloudRestApi.ArduinoCloudClient();
var storageApiClient = new storagetApi.StorageClient();
const homeDir = os.homedir();

const mqttHost = process.env.IOT_MQTTHOST_URL || 'wss.iot.oniudra.cc';
const authApiUrl = process.env.IOT_AUTH_API_URL || 'https://auth-dev.arduino.cc';

const ArduinoCloudOptions = {
  host: mqttHost,
  port: 8443,
  ssl: true,             
  apiUrl: authApiUrl,
  useCloudProtocolV2: true
};

(async () => {
	console.log("exec load module");
	try {
    const data = await fs.readFile(homeDir +'/.node-red/oauth.json', 'utf8');
		const pData = JSON.parse(data);
		
		var tokenProvider = new refreshToken(pData.tokenURL, {
			refresh_token: pData.refreshToken, 
			client_id:     pData.clientID, 
			client_secret: pData.clientSecret
  	});

		const newToken = tokenProvider.getToken();
		pData.refreshToken = newToken.refresh_token;
		await fs.writeFile(homeDir +'/.node-red/oauth.json', JSON.stringify(pData), 'utf8');
		ArduinoRestClient.updateToken(newToken.access_token);
		ArduinoCloudOptions.token = newToken.access_token;
		await arduinCloudMessageApi.connect(ArduinoCloudOptions);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.log("Loading oauth file: " + err);
    }
  }
})();

const init = async function(accessToken, refreshToken, tokenURL, clientID, clientSecret) {
	ArduinoCloudOptions.token = accessToken;
	try {
		const accessData = {
			refreshToken: refreshToken,
			tokenURL: tokenURL,
			clientID: clientID,
			clientSecret: clientSecret
		}
		await fs.writeFile(homeDir +'/.node-red/oauth.json', JSON.stringify(accessData), 'utf8');

	  ArduinoRestClient.updateToken(accessToken);	
		storageApiClient.updateToken(accessToken);

	  if(initialized) {
			await arduinCloudMessageApi.updateToken(accessToken);
	  } else {
			await arduinCloudMessageApi.connect(ArduinoCloudOptions);
		}

	  initialized = true;

	  return;
	} catch (err) {
	  throw(err);
	}
};

exports.apiRest = ArduinoRestClient;
exports.apiMessage = arduinCloudMessageApi;
exports.apiStorage = storageApiClient;
exports.init = init;
