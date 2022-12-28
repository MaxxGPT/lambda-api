const mongoose = require('mongoose')

var sourceSchema = new mongoose.Schema({
	_id: String,
    name: String, 
    description: String, 
    url: String, 
    language: String,
    country: String,
    city: String,
    state: String
}, { collection: 'Source'});

module.exports = mongoose.model('Source', sourceSchema);