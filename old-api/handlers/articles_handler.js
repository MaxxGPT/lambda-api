"use strict";
//const Database = require("../db"),
  //Article = require("../models/article.model"),
  //Source = require("../models/source.model"),
  //Usage = require("../models/usage.model"),
  //ApiMiddleware = require("../middlewares/api_key_middleware"),
  //CreditsMiddleware = require("../middlewares/credits_middldeware");

import * as Database from '../db.js' 
import { Article } from '../models/article.model.js'
import { Source } from '../models/source.model.js'
import { Usage } from '../models/usage.model.js'
import * as ApiMiddleware from '../middlewares/api_key_middleware.js'
import * as CreditsMiddleware from '../middlewares/credits_middldeware.js'







export function show (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  let params = event.queryStringParameters ? event.queryStringParameters : {};
  Database.connectToDatabase()
    .then(() => {
    //   ApiMiddleware.validate(params, (err) => {
    //     if (err) {
    //       callback(null, {
    //         statusCode: err.statusCode || 500,
    //         headers: { "Content-Type": "text/plain" },
    //         body: err.message,
    //       });
    //     } else {
    //       CreditsMiddleware.checkCreditsLeft(params, (err, data) => {
    //         if (err) {
    //           callback(null, {
    //             statusCode: err.statusCode || 500,
    //             headers: { "Content-Type": "text/plain" },
    //             body: err.message,
    //           });
    //         } else {
              Article.findById(event.pathParameters.id).exec((err, article) => {
                if (err) {
                  callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { "Content-Type": "text/plain" },
                    body: err.message,
                  });
                } else {
                //   CreditsMiddleware.updateCreditsLeft(data, (err) => {
                //     if (err) {
                //       callback(null, {
                //         statusCode: err.statusCode || 500,
                //         headers: { "Content-Type": "text/plain" },
                //         body: err.message,
                //       });
                //     } else {
                      callback(null, {
                        statusCode: 200,
                        body: JSON.stringify(article),
                      });
                    //}
                  //});
                }
              });
            //}
          //});
        //}
      ///});
    })
    .catch((err) => {
      callback(null, {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      });
    });
};

export function list (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  let queryParams = {};
  let sortBy = {};
  let params = event.queryStringParameters ? event.queryStringParameters : {};
  Database.connectToDatabase()
    .then(() => {
    //   ApiMiddleware.validate(params, (err) => {
    //     if (err) {
    //       callback(null, {
    //         statusCode: err.statusCode || 500,
    //         headers: { "Content-Type": "text/plain" },
    //         body: err.message,
    //       });
    //     } else {
    //       CreditsMiddleware.checkCreditsLeft(params, (err, data) => {
    //         if (err) {
    //           callback(null, {
    //             statusCode: err.statusCode || 500,
    //             headers: { "Content-Type": "text/plain" },
    //             body: err.message,
    //           });
    //         } else {
              /* Setting sort field paramater */
              if (params.sortBy) {
                sortBy[params.sortBy] = -1;
                /* If there is no parameter, order by natural */
              } else {
                sortBy["publishedAt"] = -1;
              }
              /* Setting search by text */
              if (params.q) {
                //queryParams["$text"] = { $search: params.q.replace(/,/g, " ") };
              }
              if (params.source_id){
                queryParams["source_id"] = params.source_id;
              }
              if (params.sentiment){
                queryParams["sentiment"] = params.sentiment;
              }
              if (params.Topic){
                queryParams["Topic"] = params.Topic;
              }
              /* Setting both dates from & to */
              if (params.from || params.to) {
                /* Setting date search from */
                if (params.from) {
                  queryParams["publishedAt"] = {
                    $gte: params.from,
                  };
                }
                /* Setting date search to */
                if (params.to) {
                  queryParams["publishedAt"] = {
                    $lte: params.to,
                  };
                }
                /* Setting both params if they exist */
                if (params.to && params.from) {
                  queryParams["publishedAt"] = {
                    $lte: params.to,
                    $gte: params.from,
                  };
                }
                /* If there is no date param, retrieve from last 6 months*/
              } 

              if(params.ORG){
                queryParams["ORG"] = params.ORG;
              }

              if(params.GPE){
                queryParams["GPE"] = params.GPE;
              }

              if(params.PERSON){
                queryParams["PERSON"] = params.PERSON;
              }
            //   else {
            //     let currentDate = new Date();
            //     let sixMonthRange = currentDate.setMonth(
            //       currentDate.getMonth() - 6
            //     );
            //     //console.log(sixMonthRange, new Date(sixMonthRange).toISOString());
            //     queryParams["publishedAt"] = {
            //       $gte: new Date(sixMonthRange).toISOString(),
            //     };
            //   }
              //console.log(params);
              /* Search domains first, then searching by params with source_id */
              if (params.domains) {
                try {
                  const regex = params.domains.replace(/,/g, "|");
                  Source.find({
                    url: { $regex: regex, $options: "i" },
                  })
                    .distinct("_id")
                    .exec((err, sources) => {
                      if (err) {
                        callback(null, {
                          statusCode: err.statusCode || 500,
                          headers: { "Content-Type": "text/plain" },
                          body: err.message,
                        });
                      } else {
                        queryParams["source_id"] = { $in: sources };
                        getArticles(
                          {
                            queryParams: queryParams,
                            limit: params.limit
                              ? parseInt(params.limit, 10)
                              : 100,
                            sortBy: sortBy,
                            originalUrl: req.originalUrl,
                            user: req.user,
                          },
                          function (err, articles) {
                            console.log(articles);
                            if (err) {
                              callback(null, {
                                statusCode: err.statusCode || 500,
                                headers: { "Content-Type": "text/plain" },
                                body: err.message,
                              });
                            } else {
                            //   CreditsMiddleware.updateCreditsLeft(
                            //     data,
                            //     (err) => {
                            //       if (err) {
                            //         callback(null, {
                            //           statusCode: err.statusCode || 500,
                            //           headers: { "Content-Type": "text/plain" },
                            //           body: err.message,
                            //         });
                            //       } else {
                                    callback(null, {
                                      statusCode: 200,
                                      body: JSON.stringify(articles),
                                    });
                                  //}
                                //}
                              //);
                            }
                          }
                        );
                      }
                    });
                } catch (err) {
                  callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { "Content-Type": "text/plain" },
                    body: err.message,
                  });
                }
                /* If there is no domains param, search with other params */
              } else {
                getArticles(
                  {
                    queryParams: queryParams,
                    limit: params.limit ? parseInt(params.limit, 10) : 100,
                    sortBy: sortBy,
                    originalUrl:
                      event && event.headers ? event.headers.host : "",
                    //user: req.user,
                  },
                  function (err, articles) {
                    if (err) {
                      callback(null, {
                        statusCode: err.statusCode || 500,
                        headers: { "Content-Type": "text/plain" },
                        body: err.message,
                      });
                    } else {
                    //   CreditsMiddleware.updateCreditsLeft(data, (err) => {
                    //     if (err) {
                    //       callback(null, {
                    //         statusCode: err.statusCode || 500,
                    //         headers: { "Content-Type": "text/plain" },
                    //         body: err.message,
                    //       });
                    //     } else {
                          callback(null, {
                            statusCode: 200,
                            body: JSON.stringify(articles),
                          });
                        //}
                      //});
                    }
                  }
                );
              }
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

function getArticles(req, cb) {
  Article.find(req.queryParams, null, { limit: req.limit })
    .sort(req.sortBy)
    .exec((err, _articles) => {
      if (err) {
        return cb(err);
      } else {
        Article.count(req.queryParams).exec((err, _count) => {
          if (err) {
            return cb(err);
          } else {
            const _usage = new Usage({
              user: req.user ? req.user._id : null,
              request: req.originalUrl,
            });
            _usage.save((_err, _u) => {
              if (err) {
                return cb(_err);
              } else {
                return cb(null, {
                  total: _count,
                  articles: _articles,
                });
              }
            });
          }
        });
      }
    });
}
