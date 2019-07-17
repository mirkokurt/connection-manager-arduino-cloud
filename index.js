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
const TokenProvider = require("./refresh");
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
	useCloudProtocolV2: true,
	onDisconnect: function () {
		//TODO understand when the callback is called and implement the reconnection strategy
	}
};

const load = function () {
	console.log("exec load module");
	return new Promise(async (resolve, reject) => {
		try {
			const data = await fs.readFile(homeDir +'/.node-red/oauth.json', 'utf8');
			const pData = JSON.parse(data);
			
			var tokenProvider = new TokenProvider(pData.tokenURL, {
				refresh_token: pData.refreshToken, 
				client_id:     pData.clientID, 
				client_secret: pData.clientSecret
			});
	
			response = await tokenProvider.getToken();
			pData.refreshToken = response.refresh_token;

			const initToken = {
				accessToken: response.access_token,
				refreshToken: pData.refreshToken,
				tokenURL: pData.tokenURL,
				clientID: pData.clientID,
				clientSecret: pData.clientSecret,
				expiresIn: response.expires_in
			}
			resolve(initToken);
		} catch (err) {
			if (err.code !== 'ENOENT') {
				console.log("Loading oauth file: " + err);
				reject(err);
			}
			resolve();
		}
	});
};

const init = async function(accessToken, refreshToken, tokenURL, clientID, clientSecret, expiresIn) {
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

	  if(initialized) {
			await arduinCloudMessageApi.updateToken(accessToken);
	  } else {
			await arduinCloudMessageApi.connect(ArduinoCloudOptions);
		}

		setTimeout(async () => {
			try {
				const newToken = await this.load();
				await this.init(newToken.accessToken, newToken.refreshToken, newToken.tokenURL, newToken.clientID, newToken.clientSecret, newToken.expiresIn);
				console.log("New Token" + JSON.stringify(newToken));
			} catch ( err ) {
				console.log("Renewing token error:" + err);
			}
		}, (expiresIn - 60) * 1000);

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
exports.load = load;
exports.initialized = initialized;
