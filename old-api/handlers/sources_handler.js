"use strict";

  //const Database = require("../db"),
  //Source = require("../models/source.model"),
  //ApiMiddleware = require("../middlewares/api_key_middleware"),
  //CreditsMiddleware = require("../middlewares/credits_middldeware");

import * as Database from '../db.js' 
import { Source } from '../models/source.model.js'
import * as ApiMiddleware from '../middlewares/api_key_middleware.js'
import * as CreditsMiddleware from '../middlewares/credits_middldeware.js'

export function list (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      let queryParams = {};
      let params = event.queryStringParameters
        ? event.queryStringParameters
        : {};
    //   ApiMiddleware.validate(params, (err) => {
    //     if (err) {
    //       callback(null, {
    //         statusCode: err.statusCode || 500,
    //         headers: { "Content-Type": "text/plain" },
    //         body: err.message,
    //       });
    //     } else {
          //CreditsMiddleware.checkCreditsLeft(params, (err, data) => {
            // if (err) {
            //   callback(null, {
            //     statusCode: err.statusCode || 500,
            //     headers: { "Content-Type": "text/plain" },
            //     body: err.message,
            //   });
            // } else {
              /* Setting search by text */
              if (params.q) {
              }
              if (params.language) {
                queryParams["language"] = params.language;
              }
              if (params.country) {
                queryParams["country"] = params.country;
              }
              if (params.city) {
                queryParams["city"] = params.city;
              }
              if (params.state) {
                queryParams["state"] = params.state;
              }
              if (params._id) {
                queryParams["_id"] = params._id;
              }

              getSources(
                {
                  queryParams: queryParams,
                  limit: params.limit ? parseInt(params.limit, 10) : 100,
                },
                function (err, sources) {
                  if (err) {
                    callback(null, {
                      statusCode: err.statusCode || 500,
                      headers: { "Content-Type": "text/plain" },
                      body: err.message,
                    });
                  } else {
                    // CreditsMiddleware.updateCreditsLeft(data, (err) => {
                    //   if (err) {
                    //     callback(null, {
                    //       statusCode: err.statusCode || 500,
                    //       headers: { "Content-Type": "text/plain" },
                    //       body: err.message,
                    //     });
                    //   } else {
                        callback(null, {
                          statusCode: 200,
                          body: JSON.stringify(sources),
                        });
                      //}
                    //});
                  }
                    });
            //}
          //});
        //}
      //});
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};

function getSources(req, cb) {
  //console.log(paramsParams);
  Source.find(req.queryParams, null, { limit: req.limit }).exec(
    (err, _sources) => {
      if (err) {
        return cb(err);
      } else {
        Source.count(req.queryParams).exec((err, _count) => {
          if (err) {
            return cb(err);
          } else {
            return cb(null, {
              total: _count,
              sources: _sources,
            });
          }
        });
      }
    }
  );
}

export function show (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  Database.connectToDatabase().then(() => {
    let params = event.queryStringParameters ? event.queryStringParameters : {};
    // ApiMiddleware.validate(params, (err) => {
    //   if (err) {
    //     callback(null, {
    //       statusCode: err.statusCode || 500,
    //       headers: { "Content-Type": "text/plain" },
    //       body: err.message,
    //     });
    //   } else {
    //     CreditsMiddleware.checkCreditsLeft(params, (err, data) => {
    //       if (err) {
    //         callback(null, {
    //           statusCode: err.statusCode || 500,
    //           headers: { "Content-Type": "text/plain" },
    //           body: err.message,
    //         });
    //       } else {
            Source.findById(event.pathParameters.id).exec((err, source) => {
              if (err) {
                callback(null, {
                  statusCode: err.statusCode || 500,
                  headers: { "Content-Type": "text/plain" },
                  body: err.message,
                });
              } else {
                // CreditsMiddleware.updateCreditsLeft(data, (err) => {
                //   if (err) {
                //     callback(null, {
                //       statusCode: err.statusCode || 500,
                //       headers: { "Content-Type": "text/plain" },
                //       body: err.message,
                //     });
                //   } else {
                    callback(null, {
                      statusCode: 200,
                      body: JSON.stringify(source),
                    });
                  //}
                //});
              }
            });
         // }
       // });
      //}
    //});
  });
};

export function create (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      const newSource = new Source(querystring.decode(event.body));
      newSource.save((err, _source) => {
        if (err) {
          callback(null, {
            statusCode: err.statusCode || 500,
            headers: { "Content-Type": "text/plain" },
            body: err.message,
          });
        } else {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(_source),
          });
        }
      });
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};

export function update (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      Source.findByIdAndUpdate(
        event.pathParameters.id,
        {
          $set: querystring.decode(event.body),
        },
        {
          new: true,
        }
      ).exec((err, _source) => {
        if (err) {
          callback(null, {
            statusCode: err.statusCode || 500,
            headers: { "Content-Type": "text/plain" },
            body: err.message,
          });
        } else {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(_source),
          });
        }
      });
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};

export function remove (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  Database.connectToDatabase()
    .then(() => {
      Source.remove({ _id: event.pathParameters.id }, (err) => {
        if (err) {
          callback(null, {
            statusCode: err.statusCode || 500,
            headers: { "Content-Type": "text/plain" },
            body: err.message,
          });
        } else {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify({ msg: "Removed" }),
          });
        }
      });
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};
