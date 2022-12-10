const { Double } = require('bson');
const mongoose = require('mongoose')

var articlesSchema = new mongoose.Schema({
    author: String,
    content: String,
    description: String,
    publishedAt: Date,
    source_id: String,
    GPE: String,
    ORG: String,
    PERSON: String,
    sentiment: String,
    sentiment_score: Double,
    sentiment_time: Double,
    Tokens: Array,
    Topic: String,
    Topic_Contribution: Double,
    summarization: String,
    title: String,
    url: String,
    urlToImage: String
}, { collection: 'Articles' });

const index = { title: 'text', content: 'text' };
articlesSchema.index(index);

module.exports = mongoose.model('Articles', articlesSchema);