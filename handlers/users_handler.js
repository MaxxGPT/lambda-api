'use strict';
const Database = require('../db')
, User = require('../models/user.model')
, Usage = require('../models/usage.model')
, jwt = require("jsonwebtoken")
, { v4: uuidv4 } = require('uuid')
, emailService = require('../services/mail.service')
, tokenMiddleware = require('../middlewares/token_middleware')
, subWeeks = require("date-fns/subWeeks")
, querystring = require('querystring')
, AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const poolData = {
   UserPoolId: process.env.COGNITO_USER_POOL,
   ClientId: process.env.COGNITO_USER_CLIENT
};
const pool_region = process.env.COGNITO_REGION;
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

module.exports.me = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    Database.connectToDatabase()
    .then(() => {
      tokenMiddleware.validateToken({
        event: event
      },(err,data)=>{
        if(err){
          callback(null, err);
        }else{
          User.findOne({
            cognito_id: data.username
          }).exec((err, _user)=>{
            if(err){
              callback(null, {
                statusCode: err.statusCode || 403,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
              });
            }else if(!_user){
              callback(null, {
                statusCode: 403,
                headers: { 'Content-Type': 'text/plain' },
                body: 'Incorrect User'
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
    }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
    })
  };

module.exports.register = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    /*let attributeList = [];
    let body = JSON.parse(event.body);
              attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(
                { 
                  Name: "email", 
                  Value: body.email 
                }));
              const token = jwt.sign(
                {
                  email: body.email,
                },
                process.env.JWT_ACCOUNT_ACTIVATION,
                {
                  expiresIn: 60 * 60 * 24, //expires in a day
                }
              );
              userPool.signUp(body.name, body.password, attributeList, null, function (err, result) {
                if (err){
                  callback(null, {
                    statusCode: err.statusCode || 400,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                  });     
                }else{
                  callback(null, {
                    statusCode: 200,
                    body: JSON.stringify({token})
                });
                }
              });*/
  
    Database.connectToDatabase()
    .then(() => {
        const randomKey = uuidv4();
        let body = JSON.parse(event.body);
          let newUser = new User({
            /*lastName: body.lastName,
            firstName: body.firstName,*/
            name: body.name,
            email: body.email,
            password: body.password,
            apiKey: randomKey.replace(/-/g, "")
          });
          newUser.save(function (err, _user) {
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
              let attributeList = [];
              attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(
                { 
                  Name: "email", 
                  Value: body.email 
                }));
              const token = jwt.sign(
                {
                  email: body.email,
                },
                process.env.JWT_ACCOUNT_ACTIVATION,
                {
                  expiresIn: 60 * 60 * 24, //expires in a day
                }
              );
              userPool.signUp(body.email, body.password, attributeList, null, function (err, result) {
                if (err){
                  callback(null, {
                    statusCode: err.statusCode || 400,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                  });     
                }else{
                  User.findOneAndUpdate({
                    _id: _user._id
                  },{
                    $set:{
                      cognito_id: result.userSub
                    }
                  })
                  .exec((err,_user)=>{
                    if(err){
                      callback(null, {
                        statusCode: err.statusCode || 400,
                        headers: { 'Content-Type': 'text/plain' },
                        body: err.message
                      }); 
                    }else{
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
                }
                
              })
    
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
    let body = JSON.parse(event.body);
    let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: body.email,
      Password: body.password
    });    
        let userData = {
          Username: body.email,
            Pool: userPool
          };
        let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);    
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: function (result) {
             let accesstoken = result.getAccessToken().getJwtToken();
             callback(null, {
                  statusCode: 200,
                  body: JSON.stringify({token: accesstoken})
              });
            },
            onFailure: (function (err) {
              callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({error: err.message})
              });       
            })
          })
          
    /*Database.connectToDatabase()
        .then(() => {
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
      })*/
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
        let newUser = new User({
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
          let body = JSON.parse(event.body);
          User.findById(event.pathParameters.id)
          .exec((err, _userFromModel)=>{
            if(err){
              callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
              });
            }else{
              if ( body.password && (body.password == "" || body.password.length == 0) ) {
                  delete body.password;
              }else if(body.password){
                if (body.password && _userFromModel.password !== body.password) {
                    _userFromModel.history.push({ field: 'password', value: _userFromModel.password })
                }
                User.findOneAndUpdate({
                  _id: event.pathParameters.id
                },{
                  $set:{
                    history: _userFromModel.history
                  }
                })
                .exec((err,_user)=>{
                    if(err){
                        callback(null, {
                            statusCode: err.statusCode || 500,
                            headers: { 'Content-Type': 'text/plain' },
                            body: err.message
                        });
                    }else{
                      let userData = {
                        Username: _userFromModel.email,
                        Pool: userPool
                      };                      
                      let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);   
                      cognitoUser.changePassword( body.old_password, body.password, {
                        onSuccess: function (result) {                                               
                            callback(null, {
                                statusCode: 200,
                                body: JSON.stringify(result)
                            });
                          },
                          onFailure: (function (err) {
                            callback(null, {
                              statusCode: err.statusCode || 500,
                              headers: { 'Content-Type': 'text/plain' },
                              body: JSON.stringify({error: err.message})
                            });       
                          })
                        })
                    }
                  });
              }else{                
                if (_userFromModel.name !== body.name) {
                    _userFromModel.history.push({ field: 'name', value: _userFromModel.name })
                }
                if (_userFromModel.email !== body.email) {
                    _userFromModel.history.push({ field: 'email', value: _userFromModel.email })
                }        
                User.findOneAndUpdate({
                  _id: event.pathParameters.id
                },{
                  $set:{
                    name: body.name,
                    email: body.email,
                    history: _userFromModel.history
                  }
                })
                .exec((err,_user)=>{
                    if(err){
                        callback(null, {
                            statusCode: err.statusCode || 500,
                            headers: { 'Content-Type': 'text/plain' },
                            body: err.message
                        });
                    }else{
                      let userData = {
                        Username: _userFromModel.email,
                        Pool: userPool
                      };
                        let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData); 
                        let attributeEmail = {
                          Name: 'email',
                          Value: body.email,
                        };
                        attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(attributeEmail);
                        let attributeList = [ attributeEmail ];   
                        cognitoUser.updateAttributes(attributeList, (err, result)=>{
                          if(err){
                            callback(null, {
                              statusCode: err.statusCode || 500,
                              headers: { 'Content-Type': 'text/plain' },
                              body: JSON.stringify({error: err.message})
                            });       
                          }else{                                             
                              callback(null, {
                                  statusCode: 200,
                                  body: JSON.stringify(result)
                              });
                          }
                        })
                    }
                });
              }
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