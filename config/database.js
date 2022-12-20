
const maria = require('mysql'); 
require("dotenv").config();

var db;

connectDatabase = () => {
  if (!db) {
    db = maria.createConnection({
      host : process.env.DB_HOST,
         port:3306,
         user:process.env.DB_USER,
         password:process.env.DB_PASS,
         database:'fitdoc_chat_db',
       })

     db.connect(function (err) {
        if (err) {
          console.error('mysql connection error :' + err);
        } else {
          console.info('mysql is connected successfully.');
        }
      })

  }
  return db;
};

module.exports = connectDatabase();



// module.exports = function () {
//     return {
//       db_init: function () {

//         return maria.createConnection({
          
//    		host : process.env.DB_HOST,
//         	port:3306,
//         	user:process.env.DB_USER,
//         	password:process.env.DB_PASS,
//         	database:'fitdoc_chat_db',
//         })
//       },
      
//       db_open: function (con) {
//         con.connect(function (err) {
//           if (err) {
//             console.error('mysql connection error :' + err);
//           } else {
//             console.info('mysql is connected successfully.');
//           }
//         })
//       },
//       redis_init: function () {
//                 return redis.createClient({
//                        legacyMode:true,
//                        socket: {
//                        port: 6379,
//                        host: 'fitdocredis.h3ilzg.ng.0001.apn2.cache.amazonaws.com'
//          },
//          password: ''
//          });
// 	},

//       redis_open: function (con) {
//         con.connect(function (err) {
//           if (err) {
//             console.error('redis connection error :' + err);
//           } else {
//             console.info('redis is connected successfully.');
//           }
//         })
//       }
//     }
//   };


