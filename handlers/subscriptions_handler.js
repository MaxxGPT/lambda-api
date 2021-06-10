'use strict';
const connectToDatabase = require('../db')
, Subscriptions = require('../models/subscription.model');

module.exports.list = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
        Subscriptions
        .find({})
        .exec()
        .then(_subs => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(_subs)
            })
        }).catch((err)=>{
            callback(null, {
                statusCode: err.statusCode || 500,
                headers: { 'Content-Type': 'text/plain' },
                body: err.message
            });
          })
      }).catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
};