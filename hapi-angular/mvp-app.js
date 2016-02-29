/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
"use strict";

var Hapi = require('hapi')
var Bell = require('bell')
var Chairo = require('chairo')
var Cookie = require('hapi-auth-cookie')
var Inert = require('inert')


process.on('uncaughtException', function (err) {
  console.error('uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})

function endIfErr (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
}

var options = require('./options.mine.js')

// Create our server.
var server = new Hapi.Server({ debug: { request: ['error'] } })
server.connection({port: options.main.port})

var plugins = [
  {register: Bell},
  {register: Cookie},
  {register: Chairo, options: {log: 'print'}},
  {register: Inert}
]

// Register our plugins.
server.register(plugins, function (err) {
  endIfErr(err)

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './public',
        redirectToSlash: true,
        index: true
      }
    }
  })

  server.seneca.use('options', options)

  initSeneca(server.seneca, function() {
    // Kick off the server.
    server.start(function (err) {
      endIfErr(err)


      console.log('Listening at: ' + server.info.port)
    })
  })
})


function initSeneca(seneca, done) {
  seneca.use('mem-store', {web: {dump: true}})

  seneca.use('user', {confirm: true})
  //seneca.use('mail')
  seneca.use('auth')

  // should be sure that seneca-auth is fully loaded
  seneca.ready(function (err) {
    if (err) return process.exit(!console.error(err));

    var options = seneca.export('options')
    //console.log(options.main)

    seneca.use('account')
    seneca.use('project')
    //seneca.use('data-editor')

    seneca.use('facebook-auth', options.facebook || {})
    seneca.use('google-auth')
    seneca.use('github-auth')
    seneca.use('twitter-auth')

    //seneca.use('admin', {server: server, local: true});

    seneca.act('role: user, cmd: register', {nick: 'u1', name: 'nu1', email: 'u1@example.com', password: 'u1', active: true}, function (err, out) {
      seneca.act('role: project, cmd: save', {data: {name: 'p1'}, account: out.user.accounts[0]})
    })

    seneca.act('role: user, cmd: register', {nick: 'u2', name: 'nu2', email: 'u2@example.com', password: 'u2', active: true})
    seneca.act('role: user, cmd: register', {nick: 'a1', name: 'na1', email: 'a1@example.com', password: 'a1', active: true, admin: true})

    done()
  })
}

