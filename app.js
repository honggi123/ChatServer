
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const cors = require('cors');
app.use(cors());

app.set('view engine', 'ejs');
app.set('views', './views');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// db connect
const database = require('./database')();
const redis_client = database.redis_init();
database.redis_open(redis_client);

// mariadb connect
const conn = database.db_init();
database.db_open(conn);

var WaitingUsers= new Map([]); // 예약자 명단 key : 유저 id, value : 유저 socket_id

// 서버 시간 가져오기
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

app.get('/', (req, res) => {
  res.render('chat');
});

// Listen for HTTP connections.
http.listen(8080, () => {
  console.log('Connect at 8080');
});


io.on('connection', (socket) => {
 console.log('connect');
  
 // 연결 끊김
 socket.on('disconnect', () => {
    socket.leave();
    console.log('user disconnected');
  });
 
 // 채팅방 입장 후 관리자/ 유저 참여 확인
 socket.on('join_user', (data) => {
  sendChatHistory(socket,data.consultuser)
  if(data.isAdmin== "true"){
      console.log('join_admin');   
    }else{
      console.log('join_user');   
    }
  });

  // 관리자가 채팅 연결 요청
  socket.on('join_chat_room', (data) => {
    console.log('join_chat_room',data);
    socket.join(data.consultuser);
    io.to(data.consultuser).emit('connect_consult', 'success');
  });

  // 회원 상담 예약 신청
   socket.on('add_waiting', (data) => {
    console.log('add_waiting',data);
    try {
	WaitingUsers.set(data.consultuser,socket.id);

      socket.emit('receive_message', {
	sender:data.consultuser,
	text: data.content,
	createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
	});

      socket.emit('receive_message', {
        sender:"fitoc",
        text: "안녕하세요. 이번 연휴 잘 지내셨나요? 잠시만 기다려주시면 연락드리겠습니다.",
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        });

     //callback( { success : true } );
    } catch (err) {
        console.error(err);
    }
  });

 // 상담사 상담 신청
 socket.on('start_consult', (data)=>{
    console.log('start_consult',data);
    socket.join(data.consultuser);
  // 클라이언트 소켓 아이디를 통해서 그 소켓을 같은 방에 참여시킨다.
    io.to(WaitingUsers.get(data.consultuser)).emit("join_chat_room","");
    WaitingUsers.delete(data.consultuser) 
});

 // 회원 상담 신청 취소
   socket.on('cancel_consult', (data) => {
    console.log('cancel_consult',data);
    try {
        WaitingUsers.delete(data.consultuser)
    } catch (err) {
        console.error(err);
    }
  });



 //  상담종료
  socket.on('end_consult', (data)=>{
     console.log('end_consult',data.consultuser);

     io.to(data.consultuser).emit('end_consult', '');
 });


  // 메시지
  socket.on('send_message', (data) => {
     console.log('send_message',data);

     data.createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
      redis_client.rpush(data.consultuser, `${data.sender}/${data.text}/${data.createdAt}`);

  // db 메시지 저장
      conn.query('INSERT INTO message(consultuserid,text,sender,createdAt) VALUES (?,?,?,?)',[data.consultuser,data.text,data.sender,data.createdAt], function (err, rows, fields) {
        if (!err) {
            console.log(rows);
            console.log(fields);
        } else {
            console.log('query error : ' + err);
        }
    }); 

      io.to(data.consultuser).emit('receive_message', data);

  });
});


// 채팅 내역 가져오기
function sendChatHistory(socket,usernikcname) {
 var history= [];
  
 redis_client.lrange(usernikcname, "0", "-1", (err, data) => {
        data.map(x => {
            const usernameMessage = x.split("/");
            const redisSender = usernameMessage[0];
            const redisMessage = usernameMessage[1];
            const redisCreatedAt = usernameMessage[2];
          const obj = {
                sender: redisSender,
                text: redisMessage,
                createdAt : redisCreatedAt
         }           
        history.push(obj);
          
        });

  socket.emit("receive_initial_message",JSON.stringify(history));
    });
}

// 메시지 보내기 삭제예정
function sendMessage(socket,usernikcname) {
    redis_client.lrange(usernikcname, "0", "-1", (err, data) => {
        data.map(x => {
            const usernameMessage = x.split("/");
            const redisSender = usernameMessage[0];
            const redisMessage = usernameMessage[1];
            const redisCreatedAt = usernameMessage[2];
           
            socket.emit("onMessage", {
                sender: redisSender,
                text: redisMessage,
                createdAt : redisCreatedAt
            });
        });
    });
}



