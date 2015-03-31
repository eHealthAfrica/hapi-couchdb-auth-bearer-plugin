var Wreck = require('wreck');
var Boom = require('boom');

exports.register = function(server, options, next) {
  'use strict';

  // This has basically just been lifted from:
  // https://github.com/hoodiehq/hoodie-server/blob/master/lib/server/plugins/api/index.js#L8
  // All credit to Hoodie Team.
  var url = require('url');
  var urlParts = url.parse(options.couchUrl);
  options.couchdb = {
    baseUrl: urlParts.protocol + '//' + urlParts.hostname + (urlParts.port ?
                                                      ':' + urlParts.port : ''),
    url: urlParts.href,
    host: urlParts.host,
    port: urlParts.port
  };

  function getBearerToken() {
    var request = arguments[0];
    var options;
    var next;

    if (typeof arguments[1] === 'function') {
      next = arguments[1];
    } else {
      options = arguments[1];
      next = arguments[2];
    }

    // console.log(request.headers.authorization);
    var token;
    if (request.headers.authorization) {
      token = request.headers.authorization.substring('Bearer '.length);
    }
    next(null, token);
  }

  function mapProxyPath (request, callback) {
    //use the bearer token as the cookie AuthSession for couchdb:
    getBearerToken(request, function(err, token) {
      if (token) {
        request.headers.cookie =  'AuthSession=' +
                                  request.headers
                                    .authorization.substring('Bearer '.length);
      } else {
        delete request.cookie;
      }

      request.host = options.couchdb.host;
      callback(null, options.couchdb.baseUrl + '/_session', request.headers);
    });
  }

  function extractToken(cookieHeader) {
    var result = (/AuthSession=(.*); Version(.*)/).exec(cookieHeader[0]);
    if (Array.isArray(result)) {
      return result[1];
    }
  }

  function addCorsAndBearerToken(err, res, request, reply) {

    if (err) {
      reply(err).code(500);
      return;
    }

    Wreck.read(res, {
      json: true
    }, function(err, data) {
      var resp;
      var allowedHeaders = [
        'authorization',
        'content-length',
        'content-type',
        'if-match',
        'if-none-match',
        'origin',
        'x-requested-with'
      ];

      function addAllowedHeaders(arr) {
        for (var i = 0; i < arr.length; i++) {
          if (allowedHeaders.indexOf(arr[i].trim().toLowerCase()) === -1) {
            allowedHeaders.push(arr[i].trim().toLowerCase());
          }
        }
      }

      if (err) {
        reply(err).code(500);
        return;
      }

      if (Array.isArray(res.headers['set-cookie'])) {
        data.bearerToken = extractToken(res.headers['set-cookie']);
        delete res.headers['set-cookie'];
      }

      addAllowedHeaders(Object.keys(request.headers));

      if (request.method === 'options') {
        res.statusCode = 200;
        if (request.headers['Allow-Control-Request-Headers']) {
          addAllowedHeaders(
            request.headers['Allow-Control-Request-Headers'].split(',')
          );
        }
      }

      resp = reply(data).code(res.statusCode).hold();
      resp.headers = res.headers;
      resp.headers['content-length'] = data.length;
      resp.headers['access-control-allow-origin'] = request
                                                      .headers.origin || '*';
      resp.headers['access-control-allow-headers'] = allowedHeaders.join(', ');
      resp.headers['access-control-expose-headers'] = 'content-type, ' +
                                                      'content-length, ' +
                                                      'etag';

      resp.headers['access-control-allow-methods'] = 'GET, PUT, POST, DELETE';
      resp.headers['access-control-allow-credentials'] = 'true';
      resp.send();
    });
  }


  if (options.sessions) {
    server.route({
      method: 'POST',
      path: '/_session/{p*}',
      config: {
        cors: {
          methods: ['POST'],
          additionalHeaders: ['Accept'],
          origin: options.allowedOriginWhitelist
        }
      },
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapProxyPath,
          onResponse: addCorsAndBearerToken
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/_session',
      config: {
        cors: {
          methods: ['GET'],
          additionalHeaders: ['Accept'],
          origin: options.allowedOriginWhitelist
        }
      },
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapProxyPath,
          onResponse: addCorsAndBearerToken
        }
      }
    });

    server.route({
      method: 'DELETE',
      path: '/_session',
      config: {
        cors: {
          methods: ['DELETE'],
          additionalHeaders: ['Accept'],
          origin: options.allowedOriginWhitelist
        }
      },
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapProxyPath,
          onResponse: addCorsAndBearerToken
        }
      }
    });
  }



  server.method('mapProxyPath', mapProxyPath);
  server.method('addCorsAndBearerToken', addCorsAndBearerToken);
  server.method('getBearerToken', getBearerToken);

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
