
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

