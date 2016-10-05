'use strict';
/* jshint node: true */

var crypto = require('crypto');

 module.exports = {
     makePasswordEntry: function (clearTextPassword) {
         var passwordEntry={};
         passwordEntry.salt = crypto.randomBytes(8).toString('hex');
         var hash = crypto.createHash('sha1');
         hash.update(clearTextPassword);
         hash.update(passwordEntry.salt);
         passwordEntry.hash = hash.digest('hex');
         return passwordEntry;
     },
     doesPasswordMatch: function (hash, salt, clearTextPassword) {
        var cyptNew = crypto.createHash('sha1');
        cyptNew.update(clearTextPassword + salt);
        var newHash = cyptNew.digest('hex');
        return newHash === hash;
     }
 };