import nodemailer from 'nodemailer'
import * as aws from '@aws-sdk/client-ses'
let { defaultProvider } = require("@aws-sdk/credential-provider-node");

const ses = new aws.SES({
  apiVersion: "2010-12-01",
  region: process.env.COGNITO_REGION,
  defaultProvider,
});

// create Nodemailer SES transporter
let transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

//const nodemailer = require("nodemailer");
//const path = require("path");

// let transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_SERVER,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_FROM,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

transporter.sendEmail = (req, cb) => {
  //console.log(route, req.mailOptions);
  let extra_attachments = [];
  if (req.mailOptions.attachments && req.mailOptions.attachments.length > 0) {
    req.mailOptions.attachments.concat(extra_attachments);
  } else {
    req.mailOptions.attachments = extra_attachments;
  }
  // send mail with defined transport object
  transporter.sendMail(req.mailOptions, (error, info) => {
    if (error) {
      return cb(error);
    }
    return cb(null, "Message sent");
  });
};
