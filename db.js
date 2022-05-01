const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

let atlas_connection_uri = process.env.MONGODB_ATLAS_CLUSTER_URI;
let cachedMongoConn = null;

module.exports.connectToDatabase = () => {
    return new Promise((resolve, reject) => {
      mongoose.Promise = global.Promise;
      mongoose.connection
        // Reject if an error occurred when trying to connect to MongoDB
        .on('error', error => {
          console.log('Error: connection to DB failed');
          reject(error);
        })
        // Exit Process if there is no longer a Database Connection
        .on('close', () => {
          console.log('Error: Connection to DB lost');
          process.exit(1);
        })
        // Connected to DB
        .once('open', () => {
          // Display connection information
          const infos = mongoose.connections;
  
          infos.map(info => console.log(`Connected to ${info.host}:${info.port}/${info.name}`));
          // Return successful promise
          resolve(cachedMongoConn);
        });
  
      // See https://www.mongodb.com/blog/post/serverless-development-with-nodejs-aws-lambda-mongodb-atlas
      // See https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
      // https://mongoosejs.com/docs/lambda.html
      if (!cachedMongoConn) {
        // Because `cachedMongoConn` is in the global scope, Lambda may retain it between
        // function calls thanks to `callbackWaitsForEmptyEventLoop`.
        // This means our Lambda function doesn't have to go through the
        // potentially expensive process of connecting to MongoDB every time.
        cachedMongoConn = mongoose.connect(atlas_connection_uri, {
          useNewUrlParser: true,
          // useCreateIndex: true,
          useUnifiedTopology: true,
          // useFindAndModify: false,
          connectTimeoutMS: 60000,
          // Buffering means mongoose will queue up operations if it gets
          // disconnected from MongoDB and send them when it reconnects.
          // With serverless, better to fail fast if not connected.
          bufferCommands: false, // Disable mongoose buffering
          // bufferMaxEntries: 0, // and MongoDB driver buffering
        });
      } else {
        console.log('MongoDB: using cached database instance');
        resolve(cachedMongoConn);
      }
    });
  }