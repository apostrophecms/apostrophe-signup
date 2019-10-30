const _ = require('lodash');

module.exports = {
  fields: [ 'firstName', 'lastName', 'username' ],
  hours: 48,
  signupUrl: '/signup',
  signupConfirmUrl: '/signup-confirm', 
  afterSignupUrl: '/',

  afterConstruct: function(self, callback) {
    self.pushAssets();
    self.pushCreateSingleton();
    self.addConfirmSecret();
    self.addRoutes();
    return self.ensureGroup(callback);
  },

  construct: function(self, options) {
    require('./lib/routes.js')(self, options);
    
    self.pushAssets = function() {
      self.pushAsset('script', 'user', { when: 'user' });
      self.pushAsset('stylesheet', 'user', { when: 'user' });
    };

    self.addConfirmSecret = function() {
      self.apos.users.addSecret('signupConfirm');
    };

    // Ensure the existence of an apostrophe-group for newly
    // created users, as configured via the `group` subproperty
    // of the `create` option.
    
    self.ensureGroup = function(callback) {
      if (!(self.options.group)) {
        return setImmediate(callback);
      }
      return self.apos.users.ensureGroup(self.options.group, function(err, group) {
        self.group = group;
        return callback(err);
      });
    };

    // Invoked just before a newly signed-up user is inserted into
    // the database. The user IS NOT confirmed yet. Override
    // as you see fit

    self.beforeInsert = function(req, user, callback) {
      return callback(null);
    };
    
    // Invoked just after a newly signed-up user is inserted into
    // the database. The user IS NOT confirmed yet. Override
    // as you see fit

    self.afterInsert = function(req, user, callback) {
      return callback(null);
    };
    
    // Invoked just after a newly confirmed user is logged in, and
    // just before they are redirected. Override as you see fit

    self.afterConfirm = function(req, user, callback) {
      return callback(null);
    };

    // Redirects the user to the URL indicated by the
    // `afterSignupUrl` option. Override to customize
    // this behavior further. You must end the response
    // in some way (available in `req.res`)

    self.redirectAfterSignup = function(req, user) {
      return req.res.redirect(self.options.afterSignupUrl);
    };

    self.getSchema = function() {
      var subset = self.apos.schemas.subset(self.apos.users.schema, self.options.fields.concat([ 'email', 'password' ]));
      // Make the password field required, but don't modify
      // the original schema, do a shallow clone
      var passwordAt = _.findIndex(subset, { name: 'password' });
      if (passwordAt !== -1) {
        var password = _.clone(subset[passwordAt]);
        password.required = true;
        subset.splice(passwordAt, 1, password);
      }
      return subset;
    };

    self.getSignupConfirmLifetimeInMilliseconds = function() {
      return 1000 * 60 * 60 * (self.options.hours || 48);
    };

  }

};

