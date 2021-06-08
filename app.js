'use strict'

var MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');

let atlas_connection_uri;
let cachedDb = null;

exports.handler = (event, context, callback) => {
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
    
    if (atlas_connection_uri != null) {
        processEvent(event, context, callback);
    } 
    else {
        const kms = new AWS.KMS();
                kms.decrypt({ CiphertextBlob: Buffer.from(uri, 'base64') }, (err, data) => {
                    if (err) {
                        console.log('Decrypt error:', err);
                        return callback(err);
                    }
                    atlas_connection_uri = data.Plaintext.toString('ascii');
            processEvent(event, context, callback);
        });
    } 
};

function processEvent(event, context, callback) {
    console.log('Calling MongoDB Atlas from AWS Lambda with event: ' + JSON.stringify(event));
    var jsonContents = JSON.parse(JSON.stringify(event));

    context.callbackWaitsForEmptyEventLoop = false;

    try {
        if (cachedDb == null) {
            console.log('=> connecting to database');
            MongoClient.connect(atlas_connection_uri, function (err, client) {
                cachedDb = client.db('travel');
                return createDoc(cachedDb, jsonContents, callback);
            });
        }
        else {
            createDoc(cachedDb, jsonContents, callback);
        }
    }
    catch (err) {
        console.error('an error occurred', err);
    }
};
    