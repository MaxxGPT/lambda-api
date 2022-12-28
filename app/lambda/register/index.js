exports.handler = async function (event, context, callback) {
  console.log(JSON.stringify(event, null, 2));
  const template = () => `
    <h1>Please Click link to activate your account</h1>
    <p>{## ACTIVATE ##}</p>
    <hr/>
  `
  switch (event.triggerSource) {
    case 'CustomMessage_SignUp':
      // Here you can store the user into your database
      
      // This is the response to send through email, no need to modify it
      event.response = {
        emailSubject: "Account Activation Link",
        emailMessage: template()
      };
      break;

    default:
      console.log('default case')
      callback(null, event)
      break;
  }

  callback(null, event)
  // context.done(null, event);
};