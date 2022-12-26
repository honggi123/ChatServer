
// Chat application dependencies
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();

// DB config
const db = require("./config/database");
const redis_db = require('./config/redis');


// Chat application components

// app.use(cors());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(200, "Welcome to chat server");
});

// Listen for HTTP connections.
http.listen(process.env.SERVER_PORT, () => {
  console.log('Connect at 8080');
});

/** Chatroom routes */
require("./middleware/socket")(app, io, db,redis_db);



