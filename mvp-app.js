/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _       = require('underscore')
var express = require('express')

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

/*
seneca.add('role:entity, cmd:load, name:user, base:sys', function(args,done){
  console.log('LOAD USER')
  this.prior(args,done)
})
*/

/*
var userent = seneca.make('sys/user')
seneca.add('role:user, cmd:login', function(args,done){
  var seneca = this

  userent.load$({nick:args.nick}, function(err,user){
    if( err ) return done(err);
    if( user ) return seneca.prior(args,done);

    seneca.act('role:user, cmd:register', {nick:args.nick,active:true}, function(err,out){
      if( err ) return done(err);
      if( !out.ok ) return done(null,out);

      args.user = out.user
      return seneca.prior(args,done);
    })
  })
})

seneca.add('role:user, cmd:verify_password', function(args,done){
  done(null,{ok:true})
})
*/


seneca.ready(function(err){
  if( err ) { 
    console.error(err.message)
    process.exit(1)
  }

  var u = seneca.pin({role:'user',cmd:'*'})
  var projectpin = seneca.pin({role:'project',cmd:'*'})

  u.register({nick:'u1',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){
    projectpin.save( {account:out.user.accounts[0],name:'p1'} )
    seneca.act('role:settings, cmd:save, kind:user, data:{foo:"aaa"}, user:"'+out.user.id+'"')
  })
  u.register({nick:'u2',name:'nu2',email:'u2@example.com',password:'u2',active:true})
  u.register({nick:'a1',name:'na1',email:'a1@example.com',password:'a1',active:true,admin:true})


  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{a:{"type":"text", "nice":"A", "help":"Example of text."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{b:{"type":"email", "nice":"B", "help":"Example of email."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{c:{"type":"tel", "nice":"C", "help":"Example of tel."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{d:{"type":"number", "nice":"D", "help":"Example of number."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{e:{"type":"time", "nice":"E", "help":"Example of time."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{f:{"type":"date", "nice":"F", "help":"Example of date."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{g:{"type":"datetime", "nice":"G", "help":"Example of datetime."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{h:{"type":"color", "nice":"H", "help":"Example of color."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{i:{"type":"url", "nice":"I", "help":"Example of url."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{j:{"type":"checkbox", "nice":"J", "help":"Example of checkbox."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{k:{"type":"range", "nice":"K", "help":"Example of range.", "default" : 50}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{l:{"type":"rating", "nice":"L", "help":"Example of rating.", "stars" : 6 }}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{ll:{"type":"rating", "nice":"LL", "help":"Example of rating."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{m:{"type":"yesno", "nice":"M", "help":"Example of yesno."}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{n:{"type":"onoff", "nice":"N", "help":"Example of onoff slider.", "default" : 0}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{o:{"type":"selectbuttons", "nice":"O", "help":"Example of selectbuttons.", "options" : ["foo", "bar", "baz"]}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{p:{"type":"selectdropdown", "nice":"P", "help":"Example of selectdropdown.", "options" : ["foo", "bar", "baz"]}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{q:{"type":"selectdropdownplus", "nice":"Q", "help":"Example of selectdropdownplus.", "options" : ["foo", "bar", "baz"]}}')
  seneca.act('role:settings, cmd:define_spec, kind:user, spec:{r:{"type":"longtext", "nice":"R", "help":"Example of longtext."}}')


  var options = seneca.export('options')
  var web     = seneca.export('web')

  var app = express()

  app.use( express.cookieParser() )
  app.use( express.query() )
  app.use( express.bodyParser() )
  app.use( express.methodOverride() )
  app.use( express.json() )

  app.use(express.session({secret:'seneca'}))

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


