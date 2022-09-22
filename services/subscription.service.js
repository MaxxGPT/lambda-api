// get_subscriptions return all plans use it for other functions
const plans = {
  dev: { requests_per_cycle: 100, cycle_frequency: "daily" },
  business: { requests_per_cycle: 1000, cycle_frequency: "daily" },
  enterprise: { requests_per_cycle: 5000, cycle_frequency: "daily" },
};
exports.getSubscriptions = (req, cb) => {
  return cb(null, { plan: plans[req.plan] });
};
