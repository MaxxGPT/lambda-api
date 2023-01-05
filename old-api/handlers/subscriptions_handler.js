"use strict";
const Database = require("../db"),
  Subscriptions = require("../models/subscription.model"),
  Users = require("../models/user.model"),
  subscriptionService = require("../services/subscription.service");

export function list (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      Subscriptions.find({})
        .exec()
        .then((_subs) => {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(_subs),
          });
        })
        .catch((err) => {
          callback(null, {
            statusCode: err.statusCode || 500,
            headers: { "Content-Type": "text/plain" },
            body: err.message,
          });
        });
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};

export function updateRequestsPerCycle (event, context, callback)  {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      Users.find({})
        .exec()
        .then(async (_users) => {
          for (let _user of _users) {
            new Promise((resolve) => {
              let credits_left;
              //get the plan and update credits left
              const tempUpdate = (plan) => {
                subscriptionService.getSubscriptions(
                  { plan: plan },
                  function (err, data) {
                    if (err) {
                      callback(null, {
                        statusCode: err.statusCode || 400,
                        headers: { "Content-Type": "text/plain" },
                        body: err.message,
                      });
                    } else {
                      credits_left = data.plan.requests_per_cycle;
                    }
                  }
                );
              };
              if (_user.payment_status && _user.subscription !== "dev") {
                // if date is 1 update both daily and monthly
                if (new Date().getDate() === 1) {
                  tempUpdate(_user.subscription);
                } else if (_user.cycle_frequency === "daily") {
                  tempUpdate(_user.subscription);
                }
              } else if (
                !_user.payment_status &&
                _user.subscription === "dev"
              ) {
                tempUpdate(_user.subscription);
              } else {
                credits_left = 0;
              }
              //update credits
              Users.findByIdAndUpdate(_user.id, {
                $set: { credits_left },
              }).exec((err, user) => {
                if (err) {
                  console.log(err);
                }
                resolve();
              });
            });
          }
          callback(null, "updated");
          //   });
        })
        .catch((err) => {
          callback(null, {
            statusCode: err.statusCode || 500,
            headers: { "Content-Type": "text/plain" },
            body: err.message,
          });
        });
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};
