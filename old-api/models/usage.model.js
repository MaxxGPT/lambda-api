// const mongoose = require('mongoose')
import mongoose from "mongoose";
var usageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    date: {
        type: "Date",
        default: Date.now,
    },
    request: String,
}, { collection: 'Usage' });

// module.exports = mongoose.model('Usage', usageSchema);
export const Usage = mongoose.model('Usage', usageSchema);