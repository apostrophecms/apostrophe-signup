apos.define('apostrophe-signup', {
  construct: function(self, options) {
    self.enable = function(options) {
      $(function() {
        var user = apos.schemas.newInstance(options.schema);
        // apos.ui.globalBusy(true);
        var $signup = $('[data-apos-signup]');
        console.log('populating');
        apos.schemas.populate($signup, options.schema, user, function(err) {
          console.log('in callback');
          // apos.ui.globalBusy(false);
          console.log('not busy anymore');
          if (err) {
            apos.notify('An error occurred populating the signup form.');
            return;
          }
        });

        $('body').on('click', '[data-apos-signup-submit]', function(e) {
          apos.ui.globalBusy(true);

          async.series([
            convert,
            submit 
          ], displayResult);
          return false;

          function convert(callback) {
            return apos.schemas.convert($signup, options.schema, user, callback);
          }
          function submit(callback) {
            return $.jsonCall(options.url, user, function(result) {
              return callback((result.status === 'ok') ? null : result.status); 
            }, callback);
          }
          function displayResult(err) {
            apos.ui.globalBusy(false);
            if (err) {
              $signup.addClass('apos-error');
            } else {
              $signup.removeClass('apos-error');
              $signup.addClass('apos-success');
            }
          }
          return false;
        });
      });
    };
  }
});

