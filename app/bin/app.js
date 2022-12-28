#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { AppStack } = require('../lib/app-stack');
const config = require('../configuration/app.json');
const stackName = config.appName + '-' + config.envName + '-stack';
const app = new cdk.App();
new AppStack(app, stackName, {
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  stackName,
  env: {
    account: config.awsAccount,
    region: config.awsRegion
  }
});
