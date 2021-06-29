const User = require('../models/user.model');

module.exports.validate = (req, callback) => {
    new Promise(function(resolve, reject) {
      User.findOne(
          {
            apiKey: req.api_key,
          },
          (err, _user) => {
            if (err) {
              calback(err);
            } else if (!_user) {
              callback({
                  statusCode: 403,
                  message: 'Api Key invalid',
              });
            } else {
              callback();
            }
          }
        );
    });
 };