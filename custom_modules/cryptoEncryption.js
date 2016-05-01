// Requiring the built in Crypto module of NodeJS
var crypto = require('crypto');

// Setting the algorithm of the encryption to be AED 256bit Counter
var cryptoAlgorithm = ("aes-256-ctr");

// Setting the password key (which will be used to hash the encryption) to be
// equal to the value stored in the environment variable (available locally and on
// the azure site)
var cryptoPasswordKey = process.env.CRYPTO_PASSWORD_KEY;

// Creating a cryptoEncryption object, which will be the exports object of this module.
// This object contains two methods, one to encrypt data, and the other to decrypt data.
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

// Returning the cryptoEncryption object as the export when this module is required
module.exports = cryptoEncryption;


