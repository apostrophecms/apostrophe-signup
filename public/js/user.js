apos.define('apostrophe-signup', {
  construct: function(self, options) {
    self.enable = function(options) {
      $(function() {
        var user = apos.schemas.newInstance(options.schema);
        var $signup = $('[data-apos-signup]');
        apos.ui.globalBusy(true);
        apos.schemas.populate($signup, options.schema, user, function(err) {
          apos.ui.globalBusy(false);
          if (err) {
            // apos.notify requires a user, use alert
            alert('An error occurred populating the signup form.');
            return;
          }
        });

        $('body').on('click', '[data-apos-signup-submit]', function(e) {
          apos.ui.globalBusy(true);
          var $email = apos.schemas.findFieldset($signup, 'email');
          var $username = apos.schemas.findFieldset($signup, 'username');
          async.series([
            convert,
            submit 
          ], displayResult);
          return false;

          function convert(callback) {
            return apos.schemas.convert($signup, options.schema, user, callback);
          }
          function submit(callback) {
            // If no schema error by this point, clear error class on these
            // two fields in case we put it there for an earlier conflict.
            // We can put it back after submit if necessary
            $email.removeClass('apos-error');
            $username.removeClass('apos-error');
            return $.jsonCall(options.url, user, function(result) {
              return callback((result.status === 'ok') ? null : result.status); 
            }, callback);
          }
          function displayResult(err) {
            apos.ui.globalBusy(false);
            if (err) {
              if (Array.isArray(err)) {
                // convert already displayed it
              } else {
                // treat it as an error on email and username,
                // the most likely suspects
                $email.addClass('apos-error');
                $username.addClass('apos-error');
                // for bc find this existing class and just show it,
                // bypassing the problem that legacy CSS won't
                // find it in a parent with apos-error anymore
                // (doing that made all the other field errors
                // show up, which is wrong)
                $signup.find('.apos-signup-error').show();
              }
            } else {
              $signup.addClass('apos-success');
              $signup.find('.apos-signup-error').hide();
            }
          }
          return false;
        });
      });
    };
  }
});

