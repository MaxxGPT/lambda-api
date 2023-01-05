//const mongoose = require("mongoose");
import mongoose from "mongoose";

var subscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    requests_per_cycle: Number,
    cycle_frequency: { type: String, enum: ["daily", "monthly"] },
    price: Number,
    active: { type: Boolean, default: true },
  },
  { collection: "Subscriptions" }
);

//module.exports = mongoose.model("Subscriptions", subscriptionSchema);
export const Subscription = mongoose.model("Subscriptions", userSchema);
