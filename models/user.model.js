const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
//const { stringify } = require('uuid');

const historySchema = new mongoose.Schema({
  field: String, value: String, updated_by: {
    type: "Date",
    default: Date.now,
  }
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    salt: String,
    role: {
      type: String,
      default: "Normal",
    },
    resetPasswordLink: {
      data: String,
      default: "",
    },
    isAdmin: {
      type: "Boolean",
      default: false,
    },
    created: {
      type: "Date",
      default: Date.now,
    },
    subscription: {
      type: String,
      default: "free"
    },
    apiKey: String,
    status: { type: "Boolean", default: false },
    history: [historySchema]
  },
  { collection: "Users" }
);

userSchema.methods.generateHash = function (cb) {
  this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10), cb);
  return cb();
};

userSchema.methods.validPassword = function (password, hash) {
  return bcrypt.compareSync(password, hash);
};

userSchema.post("save", function (_doc, next) {
  _doc.password = undefined;
  return next();
});

userSchema.pre("save", function (next) {
  this.generateHash(next);
});

module.exports = mongoose.model("Users", userSchema);
