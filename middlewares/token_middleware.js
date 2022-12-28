// const jwt = require("jsonwebtoken"),
//   request = require("request"),
//   jwkToPem = require("jwk-to-pem"),
//   AmazonCognitoIdentity = require("amazon-cognito-identity-js");
import * as AmazonCognitoIdentity from "amazon-cognito-identity-js";
import * as jwkToPem from "jwk-to-pem";
import * as request from "request";
import * as jwt from "jsonwebtoken";

const poolData = {
  UserPoolId: "us-east-1_I3DKecNsh",
  ClientId: "3bkhbfcs6u467f4q9ln4mcob40",
};
const pool_region = process.env.COGNITO_REGION;
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

module.exports.validateToken = (req, callback) => {
  new Promise(function (resolve, reject) {
    let token = req.event.headers["Authorization"];
    if (token && token.startsWith("Bearer ")) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
      request(
        {
          url: `https://cognito-idp.${pool_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`,
          json: true,
        },
        function (error, response, body) {
          if (!error && response.statusCode === 200) {
            pems = {};
            let keys = body["keys"];
            for (let i = 0; i < keys.length; i++) {
              let key_id = keys[i].kid;
              let modulus = keys[i].n;
              let exponent = keys[i].e;
              let key_type = keys[i].kty;
              let jwk = { kty: key_type, n: modulus, e: exponent };
              let pem = jwkToPem(jwk);
              pems[key_id] = pem;
            }
            let decodedJwt = jwt.decode(token, { complete: true });
            if (!decodedJwt) {
              callback({
                statusCode: 403,
                headers: { "Content-Type": "text/plain" },
                body: "Invalid token",
              });
            }
            let kid = decodedJwt.header.kid;
            let pem = pems[kid];
            if (!pem) {
              callback({
                statusCode: 403,
                headers: { "Content-Type": "text/plain" },
                body: "Invalid token",
              });
            }
            jwt.verify(token, pem, function (err, payload) {
              if (err) {
                callback({
                  statusCode: 403,
                  headers: { "Content-Type": "text/plain" },
                  body: "Invalid token",
                });
              } else {
                callback(null, payload);
              }
            });
          } else {
            callback({
              statusCode: 403,
              headers: { "Content-Type": "text/plain" },
              body: '"Error! Unable to download JWKs"',
            });
          }
        }
      );
    } else {
      callback({
        statusCode: 403,
        headers: { "Content-Type": "text/plain" },
        body: "No session",
      });
    }
  });
};
