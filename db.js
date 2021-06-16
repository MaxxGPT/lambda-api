const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
let atlas_connection_uri = process.env.MONGODB_ATLAS_CLUSTER_URI;
let isConnected;

module.exports = connectToDatabase = () => {
    if (!isConnected) {
        // Decrypt code should run once and variables stored outside of the
        // function handler so that these are atlas_connection_uri once per container
        const kms = new AWS.KMS();
        try { 
            console.log('USING new database connection', atlas_connection_uri);
            return mongoose.connect(atlas_connection_uri, { useNewUrlParser: true, useUnifiedTopology: true })
                .then(db => { 
                    isConnected = db.connections[0].readyState;
                });
        } catch (err) {
            console.log('Decrypt error:', err);
            throw err;
        }
    }
    else {
        console.log('=> using existing database connection');
        return Promise.resolve(isConnected);
    }  
};