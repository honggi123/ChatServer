
const redis = require('redis');
require("dotenv").config();

var db;

connectDatabase = () => {
  if (!db) {
    db = redis.createClient({
        legacyMode:true,
        socket: {
        port: 6379,
        host: 'fitdocredis.h3ilzg.ng.0001.apn2.cache.amazonaws.com'
      },
      password: ''
      });

      db.connect(function (err) {
        if (err) {
          console.error('redis connection error :' + err);
        } else {
          console.info('redis is connected successfully.');
        }
      })  
  }
  return db;
};

module.exports = connectDatabase();
