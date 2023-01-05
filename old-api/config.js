export function fetchMongoUrl () {
    // create / fetch dynamic data here (e.g. call an API)
    return process.env.MONGODB_ATLAS_CLUSTER_URI;
 
 }