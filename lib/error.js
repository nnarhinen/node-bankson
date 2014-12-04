'use strict';

function BanksonError(msg) {
  this.name = 'BanksonError';
  this.message = msg;
  this.stack = (new Error()).stack;
}

BanksonError.prototype = new Error();

module.exports = BanksonError;
