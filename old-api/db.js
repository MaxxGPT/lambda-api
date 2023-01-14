//const mongoose = require('mongoose')
//import mongoose, { connection } from "mongoose";
import mongoose from "mongoose";
//import mongoose = require ("mongoose")
//import { connection } from "mongoose";
import dotenv from "dotenv";
mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);
//import AWS from "aws-sdk";
//AWS.config.update({ region: "us-east-1" });

dotenv.config()



let atlas_connection_uri = process.env.MONGODB_ATLAS_CLUSTER_URI;
let cachedMongoConn = null;

export const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    //mongoose.Promise = global.Promise;
    mongoose.connection
    //console.log(mongoose.connect).on()
      .on("error", (error) => {
        console.log("Error: connection to DB failed");
        reject(error);
      })
      .on("close", () => {
        console.log("Error: Connection to DB lost");
        process.exit(1);
      })
      // Connected to DB
      .once("open", () => {
        // Display connection information
        const infos = mongoose.connections;

        infos.map((info) =>
          console.log(`Connected to ${info.host}:${info.port}/${info.name}`)
        );
        // Return successful promise
        resolve(cachedMongoConn);
      });
    if (!cachedMongoConn) {
      console.log(atlas_connection_uri)
      cachedMongoConn = mongoose.connect(atlas_connection_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 60000,
        bufferCommands: false, 
      });
    } else {
      console.log("MongoDB: using cached database instance");
      resolve(cachedMongoConn);
    }
  });
};
