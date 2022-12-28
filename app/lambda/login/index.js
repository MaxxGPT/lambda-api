exports.handler = async function (event, context, callback) {
  console.log(JSON.stringify(event, null, 2));
  // TODO implement
  callback(null, event)
};