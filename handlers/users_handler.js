'use strict';
const Database = require('../db')
, User = require('../models/user.model')
, Usage = require('../models/usage.model')
, jwt = require("jsonwebtoken")
, { v4: uuidv4 } = require('uuid')
, emailService = require('../services/mail.service')
, tokenMiddleware = require('../middlewares/token_middleware')
, subWeeks = require("date-fns/subWeeks")
, querystring = require('querystring');

module.exports.me = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    tokenMiddleware.validateToken({
      event: event
    },(err,_user)=>{
      if(err){
        callback(null, error);
      }else{
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(_user)
        });
      }
    })
  };

module.exports.register = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    Database.connectToDatabase()
    .then(() => {
        const randomKey = uuidv4();
        let body = JSON.parse(event.body);
          var newUser = new User({
            /*lastName: body.lastName,
            firstName: body.firstName,*/
            name: body.name,
            email: body.email,
            password: body.password,
            apiKey: randomKey.replace(/-/g, ""),
          });
          newUser.save(function (err, user) {
            if (err) {
              //throw(err);
              if (err.msg && err.msg.includes("duplicate")) {
                callback(null, {
                    statusCode: err.statusCode || 405,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
              } else {
                callback(null, {
                    statusCode: err.statusCode || 400,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
              }
            } else {
              //Generate Token
              const token = jwt.sign(
                {
                  email: user.email,
                },
                process.env.JWT_ACCOUNT_ACTIVATION,
                {
                  expiresIn: 60 * 60 * 24, //expires in a day
                }
              );
    
              let mailOptions = {
                from: "'Asatera' <" + process.env.EMAIL_FROM + ">",
                to: body.email,
                subject: "Account Activation Link",
                html: `
                <h1>Please Click link to activate your account</h1>
                <p><a href="http://localhost:4000/dev/users/activate/${token}">ACTIVATE</a></p>
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
                        statusCode: err.statusCode || 400,
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
    Database.connectToDatabase()
      .then(() => {
        let body = JSON.parse(event.body);
        const randomKey = uuidv4();
        User.findOne({
            email: body.email
        })
        .exec(function (err, _user) {
          if (err) {
            callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({error: err.message})
            });
          } else if(!_user || !_user.validPassword(body.password, _user.password)){
            callback(null, {
              statusCode: 500,
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({error: 'Wrong credentials'})
            });
          } else{
            _user.generateToken();
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(_user)
            });
          }
        });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: {error: err.message}
        });
      })
}

module.exports.activate = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    Database.connectToDatabase()
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
              User.findOneAndUpdate(
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
                        statusCode: 302,
                        headers:{
                          Location: process.env.CLIENT_URL+"/login",
                        }
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
    Database.connectToDatabase()
      .then(() => {
        let body = querystring.decode(event.body);
        const randomKey = uuidv4();
        var newUser = new User({
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
    Database.connectToDatabase()
      .then(() => {
          let body = querystring.decode(event.body);
        if (
            body.password && (body.password == "" || body.password.length == 0)
          ) {
            delete body.password;
        }
        User.findById(event.pathParameters.id)
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
    Database.connectToDatabase()
      .then(() => {
            User.remove({_id:event.pathParameters.id},(err)=>{
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
    Database.connectToDatabase()
      .then(() => {
        User.findByIdAndUpdate(
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
      }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
    })
}

module.exports.get_usage = (event, context, callback) => {
  Database.connectToDatabase()
      .then(() => {
        tokenMiddleware.validateToken({
          event: event
        },(err, _user)=>{        
          if(err){
            callback(null, error);
          }else{
            Usage.aggregate([{
                $match: {
                    user: _user.id,
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
                        body: JSON.stringify(_usages)
                    })
                }
            });
          }
        })
      }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
    })
  }