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
, AWS = require('aws-sdk')
, AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const poolData = {
   UserPoolId: process.env.COGNITO_USER_POOL,
   ClientId: process.env.COGNITO_USER_CLIENT
};
const pool_region = process.env.COGNITO_REGION;
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

/*Get Information for the authenticated user*/
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
  /* User Recover Password */
  module.exports.recover_password = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    Database.connectToDatabase()
    .then(() => {
      let body = JSON.parse(event.body);
      User.findOne({
        _id: body.email
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
          const token = jwt.sign(
            {
              email: body.email,
            },
            process.env.JWT_ACCOUNT_ACTIVATION,
            {
              expiresIn: 60 * 60 * 24, //expires in a day
            });
          let mailOptions = {
            from: "'Asatera' <" + process.env.EMAIL_FROM + ">",
            to: body.email,
            subject: "Account Change Password",
            html: `
            <h1>Please Click link to activate your account</h1>
            <p><a href="${process.env.CLIENT_URL}/recover/${token}">CHANGE PASSWORD</a></p>
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
                    body: JSON.stringify({msg:'Email has been sent'})
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
  /* User Sign in */
module.exports.register = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    Database.connectToDatabase()
    .then(() => {
        const randomKey = uuidv4();
        let body = JSON.parse(event.body);
          let newUser = new User({
            name: body.name,
            email: body.email,
            password: body.password,
            apiKey: randomKey.replace(/-/g, "")
          });
          newUser.save(function (err, _user) {
            if (err) {
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

/* User Login */
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
}


/* Create User (Admin) */
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

/* Change authenticated user's password */
module.exports.change_password = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      tokenMiddleware.validateToken({
        event: event
      },(err,data)=>{
        if(err){
          callback(null, {
            statusCode: 403,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
          });
        }else{
          let body = JSON.parse(event.body);
          let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
          User.findOne({
            email: body.email
          })
          .exec((err, _userFromModel)=>{
            if(err){
              callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
              });
            }else{
              if (body.password && _userFromModel.password !== body.password) {
                  _userFromModel.history.push({ field: 'password', value: _userFromModel.password })
              }
              User.findOneAndUpdate({
                email: body.email
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
                    cognitoidentityserviceprovider.adminSetUserPassword({
                      "Password": body.password,
                      "Permanent": true,
                      "Username": _userFromModel.email,
                      "UserPoolId": process.env.COGNITO_USER_POOL
                    }, function (err, data) {
                      if (err){
                        callback(null, {
                          statusCode: err.statusCode || 500,
                          headers: { 'Content-Type': 'text/plain' },
                          body: err.message
                        });
                      }
                      else{
                        callback(null, {
                          statusCode: 200,
                          body: JSON.stringify({msg:'Updated'})
                        })
                      }
                    });
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

/* Update information for authenticated user */
module.exports.update = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    Database.connectToDatabase()
      .then(() => {
        tokenMiddleware.validateToken({
          event: event
        },(err,data)=>{
          if(err){
            callback(null, {
              statusCode: 403,
              headers: { 'Content-Type': 'text/plain' },
              body: err.message
            });
          }else{
            let body = JSON.parse(event.body);
            let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
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
                      cognitoidentityserviceprovider.adminUpdateUserAttributes({
                        "UserAttributes": [ 
                            { 
                              "Name": "email",
                              "Value": body.email
                            }
                        ],
                        "Username": _userFromModel.email,
                        "UserPoolId": process.env.COGNITO_USER_POOL
                      }, function (err, data) {
                        if (err){
                          callback(null, {
                            statusCode: err.statusCode || 500,
                            headers: { 'Content-Type': 'text/plain' },
                            body: err.message
                          });
                        }
                        else{
                          callback(null, {
                            statusCode: 200,
                            body: JSON.stringify({msg:'Updated'})
                          })
                        }
                      });
                    }
                });              
              }
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

/* Self-remove for authenticated user */
module.exports.remove = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    Database.connectToDatabase()
      .then(() => {
        tokenMiddleware.validateToken({
          event: event
        },(err,data)=>{
          if(err){
            callback(null, {
              statusCode: 403,
              headers: { 'Content-Type': 'text/plain' },
              body: err.message
            });
          }else{
            User.findOne({
              cognito_id: data.username
            }).exec((err,_userFromModel)=>{
              if(err){
                callback(null, {
                  statusCode: err.statusCode || 500,
                  headers: { 'Content-Type': 'text/plain' },
                  body: err.message
                });
              }else{
                let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
                cognitoidentityserviceprovider.adminDeleteUser({
                  "Username": _userFromModel.email,
                  "UserPoolId": process.env.COGNITO_USER_POOL
                }, function (err, data) {
                  if (err){
                    callback(null, {
                      statusCode: err.statusCode || 500,
                      headers: { 'Content-Type': 'text/plain' },
                      body: err.message
                    });
                  }else{                
                    User.remove({cognito_id:data.username},(err)=>{
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
                  }
                });
              }
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

/* Regenerate API Key */
module.exports.get_api_key = (event, context, callback) => {
    const randomKey = uuidv4();
    const apiKey = randomKey.replace(/-/g, "");
    Database.connectToDatabase()
    .then(() => {
        tokenMiddleware.validateToken({
          event: event
        },(err,data)=>{
          if(err){
            callback(null, {
              statusCode: err.statusCode || 500,
              headers: { 'Content-Type': 'text/plain' },
              body: err.message
            });
          }else{
            User.findOneAndUpdate(
                {
                  cognito_id: data.username
                },
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
        });
      }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
    })
}

/* Get usage list from authenticated user */
module.exports.get_usage = (event, context, callback) => {
  Database.connectToDatabase()
      .then(() => {
        tokenMiddleware.validateToken({
          event: event
        },(err, _user)=>{        
          if(err){
            callback(null, err);
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