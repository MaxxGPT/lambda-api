exports.handler = async function (event, context, callback) {
  console.log(JSON.stringify(event, null, 2));
  const template = () => `
    <h3>Click link to activate your account</h3>
    <p>{## ACTIVATE ##}</p>
    
    <p><strong style="font-weight: bold"><a href="https://join.slack.com/t/cannabisnewapi/shared_invite/zt-1u3hfd1dw-DGZhJbwTXH03Xqy309QoOg">Join our Slack Channel to receive your API key</a></strong></p>
    
    <p><a href="docs.cannabisnewsapi.ai">Developer Docs</a></p>
    
  `
  switch (event.triggerSource) {
    case 'CustomMessage_SignUp':
      // Here you can store the user into your database
      
      // This is the response to send through email, no need to modify it
      event.response = {
        emailSubject: "Cannabis News API Activation Link",
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