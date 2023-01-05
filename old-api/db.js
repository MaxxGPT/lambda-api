import mongoose from "mongoose";
mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);
import AWS from "aws-sdk";
AWS.config.update({ region: "us-east-1" });

let atlas_connection_uri = process.env.MONGODB_ATLAS_CLUSTER_URI;
let cachedMongoConn = null;

export const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    // mongoose.Promise = global.Promise;
    mongoose.connection
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
