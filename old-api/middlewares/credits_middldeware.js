//const User = require("../models/user.model");
import { User } from '../models/user.model.js'

export function checkCreditsLeft (req, callback) {
  new Promise(function (resolve, reject) {
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
            message: "Api Key invalid",
          });
        } else if (_user && _user.credits_left && _user.credits_left > 0) {
          callback(null, { user_id: _user?.id });
        } else {
          callback({
            statusCode: 402,
            message: "No Credits Left",
          });
        }
      }
    );
  });
};
export function updateCreditsLeft (req, callback) {
  new Promise(function (resolve, reject) {
    User.findByIdAndUpdate(req?.user_id, { $inc: { credits_left: -1 } }).exec(
      (err, _user) => {
        if (err) {
          calback(err);
        } else {
          callback();
        }
      }
    );
  });
};
