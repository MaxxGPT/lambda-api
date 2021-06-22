const jwt = require("jsonwebtoken");

module.exports.validateToken = (req, callback) => {
    new Promise(function(resolve, reject) {
        let token = req.event.headers['Authorization'];
        console.log("Token", token);
        if (token && token.startsWith("Bearer ")) {
          // Remove Bearer from string
          token = token.slice(7, token.length);
          jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (err, decode) {
              if(err){
                callback({
                  statusCode: err.statusCode || 403,
                  headers: { 'Content-Type': 'text/plain' },
                  body: 'Wrong session'
                });
              }else{
                callback( null, decode );
              }
            });
        } else {
            callback({
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain' },
            body: 'No session'
          });
        }
    });
 };