# hapi-couchdb-auth-bearer-plugin

Hapi CouchDB Auth Bearer Plugin

## Installation

```bash
npm i -S git+ssh://git@github.com:eHealthAfrica/hapi-couchdb-auth-bearer-plugin.git
```

## Usage

### Options

- **sessions** _bool_ - enable `_session` proxy (default: false)

### Hapi Server methods

- **getBearerToken(request, callback)** - extract Bearer token from request
- **mapProxyPath(request, callback)** - map the bearer token to a couch AuthSession Cookie for given request 
- **addCorsAndBearerToken(err, res, request, reply)** - map couch AuthSession cookie to bearer token and provide cords support

### Example

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

