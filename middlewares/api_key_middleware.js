const User = require('../models/user.model');

module.exports.validate = (req, callback) => {
    console.log("Entro al API")
    new Promise(function(resolve, reject) {
      User.findOne(
          {
            apiKey: req.api_key,
          },
          (err, _user) => {
            if (err) {
              console.log("Entro al API Error 2")
              calback(err);
            } else if (!_user) {
              console.log("Entro al API Error 3")
              callback({
                  statusCode: 403,
                  message: 'Api Key invalid',
              });
            } else {
              console.log("Entro al API ëxito")
              callback();
            }
          }
        );
    });
 };