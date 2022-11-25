const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator")
  jwt = require("jsonwebtoken");

const historySchema = new mongoose.Schema({
  field: String,
  value: String,
  updated_by: {
    type: "Date",
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate(value){
        if(!validator.isEmail(value)){
          throw new Error ("Please enter correct email");
        }
      }
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    /*firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },*/
    cognito_id: {
      type: "String",
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
      default: "dev",
    },
    token: {
      type: String,
      default: "free",
    },
    apiKey: String,
    status: { type: "Boolean", default: false },
    history: [historySchema],
    credits_left: { type: Number, default: 100 },
    payment_status: { type: "Boolean" },
    cycle_frequency: { type: String, enum: ["daily", "monthly"] },

  },
  { collection: "Users" }
);

userSchema.methods.generateHash = function (cb) {
  this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10), cb);
  return cb();
};

userSchema.methods.generateToken = function () {
  this.token = jwt.sign(
    {
      email: this.email,
      _id: this._id,
    },
    process.env.JWT_ACCOUNT_ACTIVATION
  );
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
