# apostrophe-signup

```
npm install apostrophe-signup
```

```javascript
// in app.js
modules: {
  'apostrophe-signup': {
    // How long a signup email remains valid
    hours: 48,     
    // Apostophe group newly signed-up users are added to,
    // with optional permissions
    group: {
      title: 'signup',
      // Let them create apostrophe blog posts (which would need
      // to be a module enabled in your project) and upload files
      // to attach to them
      permissions: [ 'edit-apostrophe-blog', 'edit-attachment' ]
    },
    // defaults
    signupUrl: '/signup',
    signupConfirmUrl: '/signup-confirm',
    afterSignupUrl: '/',
    // Allow the user to enter a subset of the
    // fields in your `apostrophe-users` schema as
    // they are signing up. These are the defaults.

    // They will always be asked for their email address
    // and password. If you leave `username` off this list,
    // the user can only log in with their email address.
    fields: [ 'firstName', 'lastName', 'username' ]
  },

  // The apostrophe-email module must be configured
  'apostrophe-email': {
    // See the nodemailer documentation, many
    // different transports are available, this one
    // matches how PHP does it on Linux servers
    nodemailer: {
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    }
  }
}
```

Lets the public sign up for accounts. The user must receive an email
at a unique address and confirm their account. 

A signup page is then available at `/signup`. 

**The apostrophe-email module must be configured.** See
[sending email from your Apostrophe project.](https://apostrophecms.org/docs/tutorials/howtos/email.html)

## Giving the user special attention after signup

You can set the `afterSignupUrl` option to any URL you wish.

In addition, `req.session.signup` is set to `true` for the duration of
the user's first session. You can detect this in middleware, `pageBeforeSend`,
et cetera.

