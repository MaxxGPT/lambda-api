'use strict'

var MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const encrypted = process.env['MONGODB_ATLAS_CLUSTER_URI'];
let atlas_connection_uri;
let cachedDb = null;

exports.handler = (event, context, callback) => {
    if (!atlas_connection_uri) {
        // Decrypt code should run once and variables stored outside of the
        // function handler so that these are atlas_connection_uri once per container
        const kms = new AWS.KMS();
        try {
            const req = {
                CiphertextBlob: Buffer.from(encrypted, 'base64'),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            const data = await kms.decrypt(req).promise();
            atlas_connection_uri = data.Plaintext.toString('ascii');
        } catch (err) {
            console.log('Decrypt error:', err);
            throw err;
        }
    }
    
    processEvent(event, context, callback);
    
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
    