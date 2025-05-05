var CryptoJS = require("crypto-js");

const encryptStringWithRsaPublicKey = (str) => {
    var ciphertext = CryptoJS.AES.encrypt(str, 'U2FsdGVkX1/LwjmPOofMvtCxcYu+CWaSE4FLsBM3wco=');
    
    return ciphertext;
};

const decryptStringWithRsaPrivateKey = (str) => {
    var bytes  = CryptoJS.AES.decrypt(str.toString(), 'U2FsdGVkX1/LwjmPOofMvtCxcYu+CWaSE4FLsBM3wco=');
    return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = {
    encryptStringWithRsaPublicKey,
    decryptStringWithRsaPrivateKey
}