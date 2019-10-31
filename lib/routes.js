var async = require('async');
var _ = require('lodash');
var Promise = require('bluebird');


module.exports = function(self, options) {
  self.addRoutes = function() {
    self.apos.app.get(self.options.signupUrl, function(req, res) {
      if (req.user) {
        // User is already logged in, redirect to home page
        return res.redirect(self.options.afterSignupUrl);
      }
      req.scene = 'user';
      req.browserCall('apos.modules["apostrophe-signup"].enable(?)', {
        url: self.options.signupUrl,
        schema: self.getSchema()
      });
      return self.sendPage(req, 'signup', { schema: self.getSchema() });
    });

    self.apos.app.post(self.options.signupUrl, function(req, res) {
      var site = (req.headers['host'] || '').replace(/:\d+$/, '');
      var user = self.apos.users.newInstance();
      var schema = self.getSchema();
      var confirm = self.apos.utils.generateId();
      return async.series([ convert, beforeInsert, insert, afterInsert, email ], respond);
      function convert(callback) {
        return self.apos.schemas.convert(req, schema, 'form', req.body, user, callback);
      }
      function beforeInsert(callback) {
        user.disabled = true;
        user.signup = true;
        user.signupConfirm = confirm;
        user.signupAt = new Date();
        user.title = user.firstName + ' ' + user.lastName;
        if (self.group) {
          user.groupIds = [ self.group._id ];
        }
        if (!user.username) {
          // In effect the user can only log in with their email address
          user.username = self.apos.utils.generateId();
        }
        return self.beforeInsert(req, user, callback);
      }
      function insert(callback) {
        return self.apos.users.insert(req, user, { permissions: false }, callback);
      }
      function afterInsert(callback) {
        return self.afterInsert(req, user, callback);
      }
      function email(callback) {
        var parsed = require('url').parse(req.absoluteUrl);
        parsed.pathname = self.options.signupConfirmUrl;
        parsed.query = { confirm: confirm, email: user.email };
        delete parsed.search;
        url = require('url').format(parsed);
        return self.email(req, 'signupEmail', { user: user, url: url, site: site }, {
          to: user.email,
          subject: res.__('Your new account on ' + site)
        }, callback);
      }
      function respond(err) {
        if (err) {
          self.apos.utils.error(err);
          if ((typeof err) !== 'string') {
            err = 'error';
          }
          return res.send({ status: err, messages: req.errorMessages });
        } else {
          return res.send({ status: 'ok' });
        }
      }    
    });

    self.apos.app.get(self.options.signupConfirmUrl, function(req, res) {
      var confirm = self.apos.launder.string(req.query.confirm);
      var email = self.apos.launder.string(req.query.email);
      var user;
      if (!confirm.length) {
        return res.redirect(self.options.signupUrl + '?error=missing');
      }
      return self.apos.users.find(req, {
        email: email,
        signupAt: { $gte: new Date(Date.now() - self.getSignupConfirmLifetimeInMilliseconds()) }
      }).permission(false).toObject().then(function(_user) {
        if (!_user) {
          throw 'notfound';
        }
        user = _user;
        return self.apos.users.verifySecret(user, 'signupConfirm', confirm);
      }).then(function() {
        return self.apos.docs.db.update({
          _id: user._id
        }, {
          $set: {
            disabled: false,
            signupAt: null
          }
        });
      }).then(function() {
        return Promise.promisify(req.login, { context: req })(user);
      }).then(function() {
        return self.apos.users.forgetSecret(user, 'signupConfirm');
      }).then(function() {
        req.session.signup = true;
        return Promise.promisify(self.afterConfirm)(req, user);
      }).then(function() {
        return self.redirectAfterSignup(req, user);
      }).catch(function(err) {
        self.apos.utils.error(err);
        return res.redirect(self.options.signupUrl + '?message=' + req.__('That signup confirmation code was not found. It may have expired. Try signing up again.'));
      });
    });
  }
}
