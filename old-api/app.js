"use strict";

var MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const encrypted = process.env["MONGODB_ATLAS_CLUSTER_URI"];
let atlas_connection_uri;
let cachedDb = null;

export function handler (event, context, callback) {
  if (!atlas_connection_uri) {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are atlas_connection_uri once per container
    const kms = new AWS.KMS();
    try {
      const req = {
        CiphertextBlob: Buffer.from(encrypted, "base64"),
        EncryptionContext: { LambdaFunctionName: functionName },
      };
      kms
        .decrypt(req)
        .promise()
        .then((data) => {
          atlas_connection_uri = data.Plaintext.toString("ascii");
          processEvent(event, context, callback);
        });
    } catch (err) {
      console.log("Decrypt error:", err);
      throw err;
    }
  } else {
    console.log("in else");
    processEvent(event, context, callback);
  }
};

function processEvent(event, context, callback) {
  console.log(
    "Calling MongoDB Atlas from AWS Lambda with event: " + JSON.stringify(event)
  );
  var jsonContents = JSON.parse(JSON.stringify(event));
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const client = new MongoClient(atlas_connection_uri);
    // Connect to the MongoDB cluster
    if (cachedDb == null) {
      console.log("=> connecting to database");
      MongoClient.connect(atlas_connection_uri, function (err, client) {
        cachedDb = client.db("NewsAPI");
        callback(null, "SUCCESS");
        //return createDoc(cachedDb, jsonContents, callback);
      });
    } else {
      callback(null, "SUCCESS");
      //return createDoc(cachedDb, jsonContents, callback);
    }
  } catch (err) {
    console.error("an error occurred", err);
  }
}

/*
function createDoc (db, json, callback) {
  db.collection('Articles').insertOne( json, function(err, result) {
      if(err!=null) {
          console.error("an error occurred in createDoc", err);
          callback(null, JSON.stringify(err));
      }
      else {
        console.log("Kudos! You just created an entry into the Articles collection with id: " + result.insertedId);
        callback(null, "SUCCESS");
      }
      //we don't need to close the connection thanks to context.callbackWaitsForEmptyEventLoop = false (above)
      //this will let our function re-use the connection on the next called (if it can re-use the same Lambda container)
      //db.close();
  });
};*/
