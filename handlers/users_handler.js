'use strict';
const connectToDatabase = require('../db')
, User = require('../models/user.model')
, Usage = require('../models/usage.model')
, jwt = require("jsonwebtoken")
, uuidv4 = require("uuid/v4")
, subWeeks = require("date-fns/subWeeks")
, querystring = require('querystring');

module.exports.me = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    connectToDatabase()
      .then(() => {

      });
  };

module.exports.register = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    connectToDatabase()
    .then(() => {
        const randomKey = uuidv4();
          var newUser = new Users({
            name: name,
            email: email,
            password: password,
            apiKey: randomKey.replace(/-/g, ""),
          });
          newUser.save(function (err, user) {
            if (err) {
              //throw(err);
              if (err.errmsg.includes("duplicate")) {
                callback(null, {
                    statusCode: err.statusCode || 405,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
              } else {
                callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
              }
            } else {
              //Generate Token
              const token = jwt.sign(
                {
                  email,
                },
                process.env.JWT_ACCOUNT_ACTIVATION,
                {
                  expiresIn: 60 * 60 * 24, //expires in a day
                }
              );
    
              let mailOptions = {
                from: "'Asatera' <" + process.env.EMAIL_FROM + ">",
                to: email,
                subject: "Account Activation Link",
                html: `
                <h1>Please Click link to activate your account</h1>
                <p><a href="${process.env.CLIENT_URL}/api/auth/activate/${token}">ACTIVATE</a></p>
                <hr/>
                <p>This email contain sensitive info</p>
                <p>${process.env.CLIENT_URL}</p>
              `,
              };
    
              emailService.sendEmail({ mailOptions: mailOptions }, function (
                err,
                msg
              ) {
                if (err) {
                    callback(null, {
                        statusCode: err.statusCode || 500,
                        headers: { 'Content-Type': 'text/plain' },
                        body: err.message
                    });
                } else {
                    callback(null, {
                        statusCode: 200,
                        body: JSON.stringify({token})
                    });
                }
              });
            }
          });
    }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
    })
}

module.exports.login = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
        let body = querystring.decode(event.body);
        const randomKey = uuidv4();
        User.findOne({
            email: body.email
        })
        .exec(function (err, user) {
          if (err) {
            callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
            });
          } else {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(user)
            });
          }
        });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

module.exports.activate = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    connectToDatabase()
    .then(() => {
        jwt.verify(event.pathParameters.token, process.env.JWT_ACCOUNT_ACTIVATION, function (
            err,
            decode
          ) {
            if (err) {
                callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
            } else {
              Users.findOneAndUpdate(
                {
                  email: decode.email,
                },
                {
                  $set: {
                    status: true,
                  },
                }
              ).exec((err, _user) => {
                if (err) {
                    callback(null, {
                        statusCode: err.statusCode || 500,
                        headers: { 'Content-Type': 'text/plain' },
                        body: err.message
                    });
                } else if (!_user) {
                    callback(null, {
                        statusCode: err.statusCode || 500,
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({msg:'Error'})
                    });
                } else {
                    callback(null, {
                        statusCode: 200,
                        body: JSON.stringify(_user)
                    });
                }
              });
            }
          });
    }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
    })
}

module.exports.create = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
        let body = querystring.decode(event.body);
        const randomKey = uuidv4();
        var newUser = new Users({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: body.password,
          apiKey: randomKey.replace(/-/g, ""),
        });
        newUser.save(function (err, user) {
          if (err) {
            callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
            });
          } else {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(user)
            });
          }
        });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

module.exports.update = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
          let body = querystring.decode(event.body);
        if (
            body.password && (body.password == "" || body.password.length == 0)
          ) {
            delete body.password;
        }
        Users.findById(event.pathParameters.id)
        .exec((err, _userFromModel)=>{
            if(err){
                callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
            }else{
                if (_userFromModel.name !== body.name) {
                    _userFromModel.history.push({ field: 'name', value: _userFromModel.name })
                    _userFromModel.name = body.name;
                }
                if (_userFromModel.email !== body.email) {
                    _userFromModel.history.push({ field: 'email', value: _userFromModel.email })
                    _userFromModel.email = body.email;
                }
                if (body.password && _userFromModel.password !== body.password) {
                    _userFromModel.history.push({ field: 'password', value: _userFromModel.password })
                    _userFromModel.password = body.password;
                }
        
                _userFromModel.save((err,_user)=>{
                    if(err){
                        callback(null, {
                            statusCode: err.statusCode || 500,
                            headers: { 'Content-Type': 'text/plain' },
                            body: err.message
                        });
                    }else{
                        callback(null, {
                            statusCode: 200,
                            body: JSON.stringify(_user)
                        });
                    }
                });
            }
        })
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

module.exports.remove = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
            Users.remove({_id:event.pathParameters.id},(err)=>{
              if(err){
                  callback(null, {
                      statusCode: err.statusCode || 500,
                      headers: { 'Content-Type': 'text/plain' },
                      body: err.message
                  });
              }else{
                  callback(null, {
                      statusCode: 200,
                      body: JSON.stringify({msg:'Removed'})
                  })
              }
            });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

module.exports.get_api_key = (event, context, callback) => {
    const randomKey = uuidv4();
    const apiKey = randomKey.replace(/-/g, "");
    Users.findByIdAndUpdate(
        event.pathParameters.id,
        {
            $set: {
                apiKey
            },
        },
        (err) => {
            if (err) {
                callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
            } else {
                callback(null, {
                    statusCode: 200,
                    body: JSON.stringify({ apiKey })
                })
            }
        }
    );
}

module.exports.get_usage = (event, context, callback) => {
    Usage.aggregate([{
        $match: {
            user: event.pathParameters.id,
            date: { $gte: subWeeks(new Date(), 1) }
        }
        }, {
        $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            req: { $sum: 1 }
        }
        }, {
        "$sort": { "_id": 1 },
        }, 
        { "$limit": 7 }
    ])
    .exec((err, _usages)=>{
        if(err){
            callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
            });
        }else{
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(_usages);
            })
        }
    });
  }