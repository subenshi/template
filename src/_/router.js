const _ = require('./');
const router = require('../router');
const raQueryProcessor = require('./raQueryProcessor');

module.exports = (routerId, nm, originalMessage) => {
  const { url, method, query, params, body, headers, user } = originalMessage.payload;
  let req = { url, method, query, params, body, headers, user }
  req = raQueryProcessor(req);
  req.nm = nm;

  const res = {
    status: (code) => {
      res.code = code;
      return res;
    },
    send: (data) => {
      _.reply(nm, data, {
        statusCode: res.code
      })
    },
    reply: (reply) => {
      const { data, XTotalCount } = reply;
      _.reply(nm, data, {
        statusCode: res.code,
        headers: {
          'X-Total-Count': XTotalCount
        }
      })
    }
  }

  if (router[routerId]) return router[routerId](req, res)

  _.replyError(nm, {
    code: 'router.404',
    message: `Router ${routerId} not found`
  })    
}