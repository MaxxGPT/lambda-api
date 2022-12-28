exports.handler = async function (event, context, callback) {
  console.log(JSON.stringify(event, null, 2));
  // Here you can add your custom logic to define what you want to do or not do
  // like create the API KEY and store into your mongodb
  callback(null, event)
  // context.done(null, event);
};