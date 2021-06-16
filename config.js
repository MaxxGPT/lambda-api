module.exports.fetchMongoUrl = () => {

    // create / fetch dynamic data here (e.g. call an API)
    console.log("Variable MONGO", process.env.MONGODB_ATLAS_CLUSTER_URI);
    return process.env.MONGODB_ATLAS_CLUSTER_URI;
 
 }