const { Stack, Duration } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const config = require('../configuration/app.json');
class AppStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    // Register
    const registerFunctionName = `register-lambda-${config.envName}`
    const registerFunction = new lambda.Function(this, registerFunctionName, {
      functionName: registerFunctionName,
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda/register'),
      handler: 'index.handler',
      timeout: Duration.minutes(2),
      memorySize: 1024,
      environment: {
        'ENV_NAME': config.envName,
      },
      logRetention: 7,
    })
    // Confirm email
    const postConfirmFunctionName = `post-confirm-lambda-${config.envName}`
    const postConfirmFunction = new lambda.Function(this, postConfirmFunctionName, {
      functionName: postConfirmFunctionName,
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda/register'),
      handler: 'post-confirm.handler',
      timeout: Duration.minutes(2),
      memorySize: 1024,
      environment: {
        'ENV_NAME': config.envName,
      },
      logRetention: 7,
    })

    // Login
    // const loginFunctionName = `login-lambda-${config.envName}`
    // const loginFunction = new lambda.Function(this, loginFunctionName, {
    //   functionName: loginFunctionName,
    //   runtime: lambda.Runtime.NODEJS_16_X,
    //   code: lambda.Code.fromAsset('lambda/login'),
    //   handler: 'index.handler',
    //   timeout: Duration.minutes(2),
    //   memorySize: 1024,
    //   environment: {
    //     'ENV_NAME': config.envName,
    //   },
    //   logRetention: 7,
    // })
  }//construct
}

module.exports = { AppStack }
