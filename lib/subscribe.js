"use strict";

var _     = require('underscore')


module.exports = function() {

  var seneca = this
  var plugin = 'subscribe'


  var options = seneca.export('options')[plugin];

  var useract = seneca.pin({role:'user',cmd:'*'})


  seneca.add({role:plugin, cmd:'packages'}, function(args, done) {
    done(null, {packages:options.packages});
  })

  seneca.add({role:plugin, cmd:'completed'}, function(args, done) {
    seneca.act({role:'transaction', cmd:'find', q:{'refno':args.refno}}, function(err, out) {
      if (err || !out || !out.ok) {
        return done(err);
      }
      var tx = out.transaction;

      var req = args.req$;
      var user = req.user.user;
      var res = args.res$;

      if (tx.status === 'completed') {
        user.plan = tx.plan;
        user.save$(function(err, user) {
          if (err) return done(err);

          res.redirect('/#/subscribe/completed');
          res.end();
          //done();
        });
      }
      else {
        res.redirect('/#/subscribe/cancelled');
        res.end();
        //done();
      }
    })
  })

  seneca.add({role:plugin, cmd:'cancelled'}, function(args, done) {

    var res = args.res$;
    res.redirect('/#/subscribe/cancelled');
    res.end();

    //done();
  })


  // web interface
  seneca.act({role:'web', use:{
    prefix:'/subscribe',
    pin:{role:plugin,cmd:'*'},
    map:{
      packages: {GET:true},
      completed: {GET:true, redirect:'/#/subscribe/completed'},
      cancelled: {GET:true, redirect:'/#/subscribe/cancelled'}
    }
  }})


  seneca.add({init:plugin}, function( args, done ){

    done()
  })


  return {
    name: plugin
  }
}