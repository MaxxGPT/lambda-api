const mongoose = require('mongoose')

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

module.exports = mongoose.model('Usage', usageSchema);