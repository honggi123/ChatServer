
const redis = require('redis');
require("dotenv").config();
var db;

connectDatabase = () => {
  if (!db) {
    db = redis.createClient({
        legacyMode:true,
        socket: {
        port: 6379,
        host: process.env.REDIS_HOST,
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
