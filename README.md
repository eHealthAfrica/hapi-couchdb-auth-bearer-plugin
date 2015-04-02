# hapi-couchdb-auth-bearer-plugin

Hapi CouchDB Auth Bearer Plugin

## Installation

```bash
npm i -S git+ssh://git@github.com:eHealthAfrica/hapi-couchdb-auth-bearer-plugin.git
```

## Usage

### Options

- **sessions** _bool_ - enable `_session` proxy exposes GET, POST & DELETE methods on `_session` endpoint (default: false)

### Hapi Server methods

- **getBearerToken(request, callback)** - extract Bearer token from request
- **mapProxyPath(request, callback)** - map the bearer token to a couch AuthSession Cookie for given request
- **addCorsAndBearerToken(err, res, request, reply)** - map couch AuthSession cookie to bearer token and provide cords support

### Examples

#### Session proxy

```javascript
server.register({
  register: require('hapi-couchdb-auth-bearer-plugin'),
  options: {
    couchUrl: COUCHDB_URL,
    sessions: true,
  }
}, function(err) {
  console.log(err);
});
```

#### Get Bearer token + pass to nano
```javascript
...
handler: function(request, reply) {
    server.methods.getBearerToken(request, function(err, token) {
      if (err) {
        return reply(err);
      }

      var nanoConfig = {
        url: COUCHDB_URL
      };
      if (token) {
        nanoConfig.cookie = 'AuthSession ' + token;
      }

      var db = nano(nanoConfig);

      ...

    });
})
```

#### Proxy pass-through

```javascript
handler: {
  proxy: {
    passThrough: true,
    mapUri: hapi.methods.mapProxyPath,
    onResponse: hapi.methods.addCorsAndBearerToken
  }
}
```

## License

Copyright 2015 Matt Richards <matt.richards@ehealthnigeria.org>

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License.

