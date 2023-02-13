// 서버 시간 가져오기
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const redis = require('redis');
const notification = require('../helpers/notification');

module.exports = (app, io, db, redis_db) => {

  const client = redis.createClient(6379,process.env.REDIS_HOST);
  const pub = client.duplicate();
  const sub = client.duplicate();

  (async () => {
    await pub.connect();
    await sub.connect();
  
    await sub.subscribe('chat', (message) => {
      console.log('subscribe.message : ', message);

      var msg =JSON.parse(message);
        // 회원에게 방 연결 메시지 
        if(msg.action == "join_chat_room"){
          console.log("join_chat_room",msg);
          io.to(msg.roomid).emit("connect_consult", "");
      // 채팅 메시지, 상담 종료 등 메시지 
        }else{
          io.to(msg.roomid).emit(msg.action, msg.data);
        }
    });
    console.log("채널 구독")
  })();
        
  
io.on('connection', (socket) => {
    console.log('connect');
    // 연결 끊김
    socket.on('disconnect', () => {
       socket.leave();
       console.log('user disconnected');
     });
    
    // 채팅방 입장 후 관리자/ 유저 참여 확인
    socket.on('join_user', (data) => {
      console.log('join_user',data);   

     sendChatHistory(socket,data.consultuser)  // 채팅 내역 전송
    
     if(data.isAdmin){
       // 관리자
      console.log('join_admin',data);   
      sendConsultContent(socket,data.consultuser)
     }else{
      // 회원 
      console.log('join_user'.data);   
     }

      // 채팅 종료가 되지 않은채로 다시 입장
        redis_db.hget("chattingusers", data.consultuser, function (err, result) {
          console.log(result);
          if(result !== null){
            socket.join(data.consultuser);     
            socket.emit("rejoin_chat_room","")
          }
          if(err){
                console.log(err);
            }       
      });
     });
  
   
     // 회원 상담 예약 신청
      socket.on('add_waiting', (data) => {
       console.log('add_waiting',data);
       try {
       
        socket.join(data.consultuser);     

         socket.emit('receive_message', {
         sender:data.consultuser,
         text: data.content,
         createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
       });
   
         socket.emit('receive_message', {
           sender:"fitoc",
           text: "안녕하세요. 잠시만 기다려주시면 연락드리겠습니다.",
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
          method:'message',
          roomid:data.consultuser,
          action: 'join_chat_room',
          data : ''
       });

       socket.join(data.consultuser);     

     
       (async () => {
        await pub.publish("chat",reply);
      })();

       redis_db.hdel("waitingusers",data.consultuser)
       redis_db.hset('chattingusers',data.consultuser,"userdata")

       if(data.token != null){
        notification.sendmessage(data.token,"FITDOC","상담이 시작되었어요.")
       }

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
          method:'message',
          roomid:data.consultuser,
          action: 'end_consult',
          data : ''
       });
  
       (async () => { 
        await pub.publish("chat",reply);
      })();
    });
   
     // 메시지 
     socket.on('send_message', (data) => {
        console.log('send_message',data);
        data.createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        // rdb 채팅 메시지 저장
         db.query('INSERT INTO message(consultuserid,text,sender,createdAt) VALUES (?,?,?,?)',[data.consultuser,data.text,data.sender,data.createdAt], function (err, rows, fields) {
           if (!err) {
               console.log(rows);
               console.log(fields);
           } else {
               console.log('query error : ' + err);
           }
       }); 

       var reply = JSON.stringify({
        method:'message',
        action: 'receive_message',
        roomid:data.consultuser,
        data : data
     }); 

     (async () => {
      await pub.publish("chat",reply);
    })();
     if(data.token != null){
      notification.sendmessage(data.token,data.sender,data.text)
     }
   
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
   function sendChatHistory(socket,consultuserid) {
    console.log("sendChatHistory")
      let history= [];
      db.query('SELECT * FROM message where consultuserid=?',[consultuserid], function(error, messages){

        console.log(messages)
          messages.map(x => {
            console.log(x)

               const obj = {
                   sender: x.sender,
                   text: x.text,
                   createdAt : x.createdAt
            }      
            history.push(obj);
     
           });

     socket.emit("receive_initial_message",JSON.stringify(history));
       });
   }
   
};






