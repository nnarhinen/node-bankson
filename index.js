'use strict';
var oauth2 = require('simple-oauth2'),
    moment = require('moment'),
    axios = require('axios'),
    Promise = require('bluebird'),
    BanksonError = require('./lib/error');

function BanksonClient(clientId, clientSecret, redirectUri, endPoint) {
  this.endPoint = endPoint || "https://bankson.fi";
  this.clientId = clientId;
  this.clientSecret = clientSecret;
  this.redirectUri = redirectUri;
  this.oauth2 = oauth2({
    clientID: clientId,
    clientSecret: clientSecret,
    site: endPoint,
    tokenPath: '/oauth/token'
  });
}

BanksonClient.prototype.authorizationUrl = function() {
  return this.oauth2.authCode.authorizeURL({
    redirect_uri: this.redirectUri
  });
};

BanksonClient.prototype.setTokens = function(accessToken, refreshToken, expiresAt) {
  this.tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken,
    expiresAt: moment(expiresAt)
  };
};

BanksonClient.prototype.refreshTokens = function() {
  var self = this,
      tokenData = {
    access_token: this.tokens.accessToken,
    refresh_token: this.tokens.refreshToken,
    expires_in: (this.tokens.expiresAt.toDate().getTime() - new Date().getTime()) / 1000
  };
  var token = Promise.promisifyAll(this.oauth2.accessToken.create(tokenData));
  if (!token.expired()) return Promise.resolve(this);
  return token.refreshAsync().then(function(token) {
    self.setTokens(
      token.token.access_token,
      token.token.refresh_token,
      token.token.expires_at
    );
  });
};

BanksonClient.prototype.post = function(path, data) {
  return axios.post(this.endPoint + path, data, {
    headers: {
      Authorization: 'Bearer ' + this.tokens.accessToken
    }
  });
};

BanksonClient.prototype.createPayment = function(data) {
  return this.post('/api/payments', data).then(function(resp) {
    return resp.data;
  }).catch(function(resp) {
    var err = new BanksonError('Bankson request failed');
    err.response = resp;
    throw err;
  });
};

module.exports.Client = BanksonClient;
module.exports.BanksonError = BanksonError;
