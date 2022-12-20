const axios = require('axios');

const sendmessage = async (token,title,content) => {
  try {
      const message = {
        to: token,
        sound: 'default',
        title: title,
        body: content,
        data: { someData: 'goes here' },
      };

      await axios('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(message),
      });

//    return res.status(200).json({ msg: 'success' });
  } catch (err) {
    console.log(err);
  //  return res.status(400).json({ msg: 'fail' });
  }
};


module.exports = {sendmessage};