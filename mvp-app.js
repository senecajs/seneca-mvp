/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _       = require('underscore')
var express = require('express')

var seneca = require('seneca')()


seneca.use('options','options.mine.js')



var options = seneca.export('options')
var web     = seneca.export('web')

var app = express()

app.use( express.cookieParser() )
app.use( express.query() )
app.use( express.bodyParser() )
app.use( express.methodOverride() )
app.use( express.json() )

app.use( web )


app.use( express.static(__dirname+options.main.public) )  

app.listen( options.main.port )

seneca.log.info('listen',options.main.port)

