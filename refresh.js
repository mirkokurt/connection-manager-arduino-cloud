'use strict';

var request = require('request');
var EventEmitter = require('events').EventEmitter;

/**
 * Create a new instance of TokenProvider
 *
 * @param {String} url url to get the access token
 * @param {Object} options
 * @return {TokenProvider}
 *
 * options are:
 *  refresh_token
 *  client_id
 *  client_secret
 *
*/
class TokenProvider {
  constructor(url, options)  {
    if(!url){
      throw new Error('missing url parameter');
    }
  
    ['refresh_token', 'client_id', 'client_secret'].forEach(function (k) {
      if(!(k in options)){
        throw new Error('missing ' + k + ' parameter');
      }
    });
  
    this.url = url;
    this.options = options;
  }

  /**
 * Return a valid access token, refresh token, scopes and expiration data.
 *
 *
 * @param  {Function} done
 */
  getToken() {
    const p = new Promise((resolve, reject) => {
      const headers = {
        'Authorization': 'Basic ' + new Buffer(this.options.client_id + ':' + this.options.client_secret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      request.post({
        url: this.url,
        form: {
          refresh_token: this.options.refresh_token,
          grant_type:    'refresh_token'
        }, 
        headers: headers,
      }, function (err, response, body) {
        if(err) return reject(err);
        if (response.statusCode !== 200) {
          var error;
          if (~response.headers['content-type'].indexOf('application/json')) {
            var errorBody = JSON.parse(body);
            error = new Error(errorBody.error);
          } else {
            error = new Error('error refreshing token');
            error.response_body = body;
          }
          return reject(error);
        }

        return resolve(JSON.parse(body));

      });
  });
  return p;
};
  
}

module.exports = TokenProvider;