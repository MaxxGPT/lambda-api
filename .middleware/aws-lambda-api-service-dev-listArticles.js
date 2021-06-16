'use strict';
    
const middlewares_api_key_middleware = require('../middlewares/api_key_middleware');
const handlers_articles_handler = require('../handlers/articles_handler');

module.exports.handler = async (event, context) => {
  let end = false;
  context.end = () => end = true;

  const wrappedHandler = handler => prev => {
    if (end) return prev;
    context.prev = prev;
    return handler(event, context);
  };

  return Promise.resolve()
    .then(wrappedHandler(middlewares_api_key_middleware.ApiMiddleware.bind(middlewares_api_key_middleware)))
    .then(wrappedHandler(handlers_articles_handler.list.bind(handlers_articles_handler)));
};