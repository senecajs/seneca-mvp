;(function(){
  function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}


  var login_module = angular.module('login',['cookiesModule'])


  var msgmap = {
    'unknown': 'Unable to perform your request at this time - please try again later.',
    'missing-fields': 'Please enter missing fields.',
    'user-not-found': 'That email address is not recognized.',
    'invalid-password': 'That password is incorrect',
    'email-exists': 'That email address is already in use. Please login, or ask for a password reset.'
  }


  login_module.service('auth', function($http,$window) {
    return {
      login: function(creds,win,fail){
        $http({method:'POST', url: '/auth/login', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            //return $window.location.href='/account'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },
      register: function(details,win,fail){
        $http({method:'POST', url: '/auth/register', data:details, cache:false}).
          success(function(data, status) {
            if( data.ok ) {
              if( win ) return win(data);
              return $window.location.href='/account'
            }
            else if( fail ) {
              return fail(data);
            }
          })
      },
      instance: function(win,fail){
        $http({method:'GET', url: '/auth/instance', cache:false}).
          success(function(data, status) {
            if( data.ok ) {
              if( win ) return win(data);
            }
            else if( fail ) {
              return fail(data);
            }
          })
      },
      reset: function(creds,win,fail){
        $http({method:'POST', url: '/auth/reset', data:creds, cache:false}).
          success(function(data, status) {
            if( data.ok ) {
              if( win ) return win(data);
            }
            else if( fail ) {
              return fail(data);
            }
          })
      },
    }
  })



  login_module.controller('Login', function($scope, $http, auth) {

    function empty(val) { return null == val || 0 == ''+val }

    function read() {
      return {
        name:     !empty($scope.input_name),
        email:    !empty($scope.input_email),
        password: !empty($scope.input_password)
      }
    }
    

    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full
      })

      $scope.seek_signup = !state.name || !state.email || !state.password
      $scope.seek_signin = !state.email || !state.password
      $scope.seek_send   = !state.email
    }



    function perform_signup() {
      auth.register({
        name:$scope.input_name,
        email:$scope.input_email,
        password:$scope.input_password
      }, null, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        if( 'email-exists' == out.why ) $scope.seek_email = true;
        $scope.showmsg = true
      })
    }


    function perform_signin() {
      auth.login({
        email:$scope.input_email,
        password:$scope.input_password
      }, null, function( out ){
        //$scope.msg = 'That email address is not recognized.'
        $scope.msg = msgmap[out.why] || msgmap.unknown
        $scope.showmsg = true
        if( 'user-not-found' == out.why ) $scope.seek_email = true;
        if( 'invalid-password' == out.why ) $scope.seek_password = true;
      })
    }


    function perform_send() {
      auth.reset({
        email:$scope.input_email,

      }, function(){
        console.log('RESET')

      }, function( out ){
        //$scope.msg = 'That email address is not valid.'
        $scope.msg = out.why
        $scope.showmsg = true
      })
    }


    var visible = {
      name:true,
      email:true,
      password:true,
      forgot:true,
      signup:true,
      signin:true,
      cancel:false,
    }


    function show(fademap) {
      _.each( fademap, function(active,name){
        $scope['hide_'+name]=!active

        if( active && !visible[name] ) {
          visible[name]           = true
          $scope['fadeout_'+name] = false
          $scope['fadein_'+name]  = true
        }

        if( !active && visible[name] ) {
          visible[name]           = false
          $scope['fadein_'+name]  = false
          $scope['fadeout_'+name] = true
        }
      })
      
      if( fademap.cancel ) {
        $scope.float_cancel = $scope.fadein_signup ? 'right' : 'left'
      }
    }


    $scope.signup = function(){
      if( 'signup' != $scope.mode ) {
        show({name:true,password:true,signup:true,signin:false,cancel:true,send:false})
      }
      $scope.showmsg = false

      var state = read()
      markinput(state)

      if( state.name && state.email && state.password ) {
        perform_signup()
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.signup_hit = true
      $scope.mode = 'signup'
    }


    $scope.signin = function() {
      if( 'signin' != $scope.mode ) {
        show({name:false,password:true,signup:false,signin:true,cancel:true,send:false})
      }
      $scope.showmsg = false

      var state = read()

      if( $scope.signin_hit ) {
        markinput(state,{name:1})
      }

      if( state.email && state.password ) {
        perform_signin()
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.signin_hit = true
      $scope.mode = 'signin'
    }


    $scope.send = function() {
      if( 'send' != $scope.mode ) {
        show({name:false,password:false,signup:false,signin:false,cancel:true,send:true})
      }
      $scope.send_hit = true
      $scope.showmsg = false

      var state = read()
      if( state.email ) {
        perform_send()
      }
      else {
        markinput(state)
      }

      $scope.mode = 'send'
    }


    $scope.cancel = function() {
      $scope.mode = 'none'
      show({name:true,password:true,signup:true,signin:true,cancel:false,send:false})
      $scope.seek_name = false
      $scope.seek_email = false
      $scope.seek_password = false
      $scope.showmsg = false
      $scope.hide_forgot = false
    }


    $scope.forgot = function() {
      $scope.hide_forgot = true
      show({name:false,password:false,signup:false,signin:false,cancel:true,send:true})
      $scope.msg = 'Enter an email address so that we can send you a reset link.'
      $scope.showmsg = true
    }


    $scope.change = function( field ) {
      if( $scope.signup_hit || $scope.signin_hit ) return markinput(read());
    }


    $scope.mode = 'none'

    $scope.showmsg = false
    $scope.hide_cancel = true
    $scope.hide_send = true
    $scope.hide_forgot = false

    $scope.signup_hit = false
    $scope.signin_hit = false

    $scope.input_name = ''
    $scope.input_email = ''
    $scope.input_password = ''

    $scope.seek_name = false
    $scope.seek_email = false
    $scope.seek_password = false

  })

  $('#name').focus()

})();


