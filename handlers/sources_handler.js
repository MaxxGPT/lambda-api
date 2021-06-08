'use strict';
const connectToDatabase = require('../db')
, Article = require('../models/article.model')
, Source = require('../models/source.model')
, Usage = require('../models/usage.model')
, querystring = require('querystring');

module.exports.list = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
          let queryParams = {};
          let params = event.queryStringParameters ? event.queryStringParameters : {};
          /* Setting search by text */
          if(params.q){
          }
          if(params.language){
              queryParams["language"] = params.language ;
          }
          if(params.country){
              queryParams["country"] = params.country ;
          }
          if(params.city){
              queryParams["city"] = params.city ;
          }
          if(params.state){
              queryParams["state"] = params.state ;
          }
      
          getSources({
            queryParams: queryParams,
            limit: params.limit ? parseInt( params.limit , 10) : 100
          }, function(err,sources){
            if(err){
              callback(null, {
                  statusCode: err.statusCode || 500,
                  headers: { 'Content-Type': 'text/plain' },
                  body: err.message
              });
            }else{
              callback(null, {
                  statusCode: 200,
                  body: JSON.stringify(sources)
              })
            }
          });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

function getSources(req, cb){
    //console.log(paramsParams);
    Source.find(req.queryParams, null, {limit: req.limit})
    .exec((err, _sources)=>{
      if(err){
        return cb(err);
      }else{
        Source.count(req.queryParams)
        .exec((err, _count)=>{
          if(err){
            return cb(err);
          }else{
            return cb(null,{
              total: _count,
              sources: _sources
            });
          }
        });
      }
    });
}

module.exports.show = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    connectToDatabase()
      .then(() => {
        Source.findById(event.pathParameters.id)
        .exec((err, source)=>{
            if(err){
                callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                });
            }else{
                callback(null, {
                    statusCode: 200,
                    body: JSON.stringify(source)
                })
            }
        });
      });
  };

module.exports.create = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
          const newSource = new Source(querystring.decode(event.body));
          newSource.save((err, _source)=>{
              if(err){
                  callback(null, {
                      statusCode: err.statusCode || 500,
                      headers: { 'Content-Type': 'text/plain' },
                      body: err.message
                  });
              }else{
                  callback(null, {
                      statusCode: 200,
                      body: JSON.stringify(_source)
                  })
              }
          });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

module.exports.update = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
          Source.findByIdAndUpdate(event.pathParameters.id,
            {
                $set: querystring.decode(event.body)
            },
            {
                new:true
            }
            )
              .exec((err, _source)=>{
              if(err){
                  callback(null, {
                      statusCode: err.statusCode || 500,
                      headers: { 'Content-Type': 'text/plain' },
                      body: err.message
                  });
              }else{
                  callback(null, {
                      statusCode: 200,
                      body: JSON.stringify(_source)
                  })
              }
          });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}

module.exports.remove = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    connectToDatabase()
      .then(() => {
          Source.remove({_id:event.pathParameters.id},(err)=>{
              if(err){
                  callback(null, {
                      statusCode: err.statusCode || 500,
                      headers: { 'Content-Type': 'text/plain' },
                      body: err.message
                  });
              }else{
                  callback(null, {
                      statusCode: 200,
                      body: JSON.stringify({msg:'Removed'})
                  })
              }
            });
      })
      .catch((err)=>{
        callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        });
      })
}