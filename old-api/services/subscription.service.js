"use strict";
const Database = require("../db"),
  Subscriptions = require("../models/subscription.model");

// const plans = {
//   dev: { requests_per_cycle: 100, cycle_frequency: "daily" },
//   business: { requests_per_cycle: 1000, cycle_frequency: "daily" },
//   enterprise: { requests_per_cycle: 5000, cycle_frequency: "daily" },
// };
exports.getSubscriptions = (req, cb) => {
  Subscriptions.findOne({ name: req.plan }).exec((err, subscription) => {
    if (err) {
      cb(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    } else {
      return cb(null, { plan: subscription });
    }
  });
};
