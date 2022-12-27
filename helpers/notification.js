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

  } catch (err) {
    console.log(err);
  }
};


module.exports = {sendmessage};