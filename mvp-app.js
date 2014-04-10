/* Copyright (c) 2013-2014 Richard Rodger, MIT License */
"use strict";


var _       = require('underscore')
var express = require('express')

var cookieparser = require('cookie-parser')
var qs           = require('qs')
var bodyparser   = require('body-parser')
var session      = require('express-session')


var seneca = require('seneca')()



process.on('uncaughtException', function(err) {
  console.error('uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})



seneca.use('options','options.mine.js')


seneca.use('mem-store',{web:{dump:true}})

seneca.use('user',{confirm:true})
seneca.use('mail')
seneca.use('auth')
seneca.use('account')
seneca.use('project')
seneca.use('settings')
seneca.use('data-editor')
seneca.use('admin')



seneca.ready(function(err){
  if( err ) return process.exit( !console.error(err) );

  var options = seneca.export('options')

  var u = seneca.pin({role:'user',cmd:'*'})
  var projectpin = seneca.pin({role:'project',cmd:'*'})

  u.register({nick:'u1',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){
    projectpin.save( {account:out.user.accounts[0],name:'p1'} )
    seneca.act('role:settings, cmd:save, kind:user, settings:{a:"aaa"}, ref:"'+out.user.id+'"')
  })
  u.register({nick:'u2',name:'nu2',email:'u2@example.com',password:'u2',active:true})
  u.register({nick:'a1',name:'na1',email:'a1@example.com',password:'a1',active:true,admin:true})


  seneca.act('role:settings, cmd:define_spec, kind:user',{spec:options.settings.spec})

  var web = seneca.export('web')

  var app = express()


  app.use( cookieparser() )
  app.use( bodyparser() )

  app.use( session({secret:'seneca'}) )

  app.use( web )
  

  app.use( function( req, res, next ){
    if( 0 == req.url.indexOf('/reset') ||
        0 == req.url.indexOf('/confirm') ) 
    {
      req.url = '/'
    }

    next()
  })


  app.use( express.static(__dirname+options.main.public) )  

  app.listen( options.main.port )

  seneca.log.info('listen',options.main.port)

  seneca.listen()

})


