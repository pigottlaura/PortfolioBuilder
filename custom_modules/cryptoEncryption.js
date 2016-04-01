var crypto = require('crypto');
var cryptoAlgorithm = ("aes-256-ctr");
var cryptoPasswordKey = process.env.CRYPTO_PASSWORD_KEY;

var cryptoEncryption = {
  encrypt: function(text) {
    // Function sourced from an example use of Crypto
    // https://github.com/chris-rock/node-crypto-examples/blob/master/crypto-ctr.js
    var cipher = crypto.createCipher(cryptoAlgorithm, cryptoPasswordKey)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
  },
  decrypt: function(text) {
    // Function sourced from an example use of Crypto
    // https://github.com/chris-rock/node-crypto-examples/blob/master/crypto-ctr.js
    var decipher = crypto.createDecipher(cryptoAlgorithm, cryptoPasswordKey)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
  }
};

module.exports = cryptoEncryption;


