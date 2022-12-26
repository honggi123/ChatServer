// 서버 시간 가져오기
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const redis = require('redis');

const notification = require('../helpers/notification');

module.exports = (app, io, db, redis_db) => {

io.on('connection', (socket) => {
    console.log('connect');

    var pub = redis.createClient(6379,process.env.REDIS_HOST);
    pub.connect();
    var sub = pub.duplicate();
    sub.connect();
    
    // 연결 끊김
    socket.on('disconnect', () => {
       socket.leave();
       console.log('user disconnected');
     });
    
    // 채팅방 입장 후 관리자/ 유저 참여 확인
    socket.on('join_user', (data) => {
     sendChatHistory(socket,"honggi123")
     
     if(data.isAdmin){
      sendConsultContent(socket,data.consultuser)
     }

     sub.subscribe(data.consultuser,(message,channel)=>{
      var msg =JSON.parse(message);
      console.log("Message.action '" + msg.action +" message.data " + msg.data +"' on channel '" + channel + "' arrived!")

      if(msg.action == "join_chat_room"){
        socket.emit('connect_consult','');
      }else{
        socket.emit(msg.action,msg.data);
      }
      
     });

     sub.on("message", (channel, message) =>{
      console.log("Message '" + message + "' on channel '" + channel + "' arrived!")
    });
   

     // 채팅 종료가 되지 않은채로 다시 입장했다면 
     redis_db.hget("chattingusers", data.consultuser, function (err, result) {
        console.log(result);
        if(result !== null){
        
          socket.emit("rejoin_chat_room","")
        }
        if(err){
              console.log(err);
          }       
      });

     if(data.isAdmin== "true"){
         console.log('join_admin');   
       }else{
         console.log('join_user');   
       }
     });
   
     // 관리자가 채팅 연결 요청
     socket.on('join_chat_room', (data) => {
       console.log('join_chat_room',data);


       var reply = JSON.stringify({
        action: 'connect_consult',
        data : 'success'
     });

     pub.publish(data.consultuser,reply);
     });

   
     // 회원 상담 예약 신청
      socket.on('add_waiting', (data) => {
       console.log('add_waiting',data);
       try {
         redis_db.hset('waitingusers',data.consultuser,data.content)

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
   
       } catch (err) {
           console.error(err);
       }
     });
   
    // 상담사 상담 신청
    socket.on('start_consult', (data)=>{
       console.log('start_consult',data);
      
        var reply = JSON.stringify({
          action: 'join_chat_room',
          data : ''
       });

       pub.publish(data.consultuser,reply);

       redis_db.hdel("waitingusers",data.consultuser)
       redis_db.hset('chattingusers',data.consultuser,"userdata")

   });
   
    // 회원 상담 신청 취소
      socket.on('cancel_consult', (data) => {
       console.log('cancel_consult',data);
       try {
        redis_db.hdel("waitingusers",data.consultuser)
      } catch (err) {
           console.error(err);
       }
     });
   
   
  
    //  상담종료
     socket.on('end_consult', (data)=>{
        console.log('end_consult',data.consultuser);
        redis_db.hdel("chattingusers",data.consultuser)
   
        var reply = JSON.stringify({
          action: 'end_consult',
          data : ''
       });

       pub.publish(data.consultuser,reply);

    });
   
   
     // 메시지 
     socket.on('send_message', (data) => {

        console.log('send_message',data);
   
        data.createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        redis_db.rpush(data.consultuser, `${data.sender}/${data.text}/${data.createdAt}`);
   
     // db 메시지 저장
         db.query('INSERT INTO message(consultuserid,text,sender,createdAt) VALUES (?,?,?,?)',[data.consultuser,data.text,data.sender,data.createdAt], function (err, rows, fields) {
           if (!err) {
               console.log(rows);
               console.log(fields);
           } else {
               console.log('query error : ' + err);
           }
       }); 

       var reply = JSON.stringify({
        action: 'receive_message',
        data : data
     }); 

     pub.publish(data.consultuser,reply);
   
   
     });
   
   });
   
   function sendConsultContent(socket,consultuser) {
    redis_db.hget("waitingusers",consultuser , function (err, content) {
      console.log(content);
      if(content !== null){
        socket.emit("receive_consult_content",content)
      }
      if(err){
            console.log(err);
        }       
    });
  }
   
   // 채팅 내역 가져오기
   function sendChatHistory(socket,usernikcname) {
    var history= [];
     
    redis_db.lrange(usernikcname, "0", "-1", (err, data) => {
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
   
};





