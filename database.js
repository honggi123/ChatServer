
const maria = require('mysql'); 
const redis = require('redis');

module.exports = function () {
    return {
      db_init: function () {
        return maria.createConnection({
   		host : 'localhost',
        	port:3306,
        	user:'root',
        	password:'fitdoc2022',
        	database:'fitdoc_chat_db',
        })
      },
      
      db_open: function (con) {
        con.connect(function (err) {
          if (err) {
            console.error('mysql connection error :' + err);
          } else {
            console.info('mysql is connected successfully.');
          }
        })
      },
      redis_init: function () {
                return redis.createClient({
                       legacyMode:true,
                       socket: {
                       port: 6379,
                       host: 'fitdocredis.h3ilzg.ng.0001.apn2.cache.amazonaws.com'
         },
         password: ''
         });
	},

      redis_open: function (con) {
        con.connect(function (err) {
          if (err) {
            console.error('redis connection error :' + err);
          } else {
            console.info('redis is connected successfully.');
          }
        })
      }


    }
  };


