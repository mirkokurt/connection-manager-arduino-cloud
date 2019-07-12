'use strict';

const request = require('request');

class StorageClient {
	constructor(token) {
	  this.token = token;
	}
	updateToken(token) {
	  this.token = token;
	}
	readFlow() {
	  const url = 'node-red/Flows';
	  return this.genericRequest(url, 'get', '');
	}
	writeFlow(body) {
		const url = 'node-red/Flows';
		return this.genericRequest(url, 'post', body);
	}
	genericRequest(url, method, body) {
		const p = new Promise((resolve, reject) => {
		  const headers = {
			Authorization: `Bearer ${this.token}`,
			'Content-Type': 'application/json'
		  };
		  request(
			{
			  url: url,
			  method: method,
			  body: body,
			  headers: headers
			},
			(err, response, body) => {
			  if (!err && response.statusCode === 200) {
				if (body) resolve(JSON.parse(body));
				else resolve();
			  } else reject(err);
			}
		  );
		});
		return p;
	}
}
exports.StorageClient = StorageClient;