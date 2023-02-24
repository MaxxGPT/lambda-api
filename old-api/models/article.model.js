//const { Double } = require('bson');
//const BSON = require('bson');
//const mongoose = require('mongoose')
import mongoose from "mongoose";

var articlesSchema = new mongoose.Schema({
    author: String,
    content: String,
    description: String,
    publishedAt: Date,
    source_id: String,
    GPE: Array,
    ORG: Array,
    PERSON: Array,
    sentiment: String,
    sentiment_score: Number,
    sentiment_time: Number,
    Tokens: Array,
    Topic: String,
    Topic_Contribution: Number,
    summarization: String,
    title: String,
    url: String,
    urlToImage: String
}, { collection: 'Articles' });

const index = { title: 'text', content: 'text' };
articlesSchema.index(index);

//module.exports = mongoose.model('Articles', articlesSchema);
export const Article = mongoose.model("Articles", articlesSchema);