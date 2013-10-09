;(function(){
  function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}
  function empty(val) { return null == val || 0 == ''+val }

  var home_module = angular.module('home',['cookiesModule'])
    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/', {templateUrl: 'partials/main.html' } ).
          when('/subscribe', {templateUrl: 'partials/subscribe.html', controller: 'Subscribe'}).
          when('/subscribe/completed', {templateUrl: 'partials/subscribe-completed.html', controller: 'Subscribed'}).
          when('/subscribe/cancelled', {templateUrl: 'partials/subscribe-cancelled.html', controller: 'Subscribed'}).
          otherwise({redirectTo: '/'});
}]);

  home_module.controller('Main', function($scope,$location) {
    var path = window.location.pathname

    var page_login   = true
    var page_reset   = 0==path.indexOf('/reset')
    var page_confirm = 0==path.indexOf('/confirm')

    page_login = !page_confirm && !page_reset

    $scope.show_login   = page_login
    $scope.show_reset   = page_reset
    $scope.show_confirm = page_confirm
  })



  var msgmap = {
    'unknown': 'Unable to perform your request at this time - please try again later.',
    'missing-fields': 'Please enter the missing fields.',
    'user-not-found': 'That email address is not recognized.',
    'invalid-password': 'That password is incorrect',
    'email-exists': 'That email address is already in use. Please login, or ask for a password reset.',
    'nick-exists': 'That email address is already in use. Please login, or ask for a password reset.',
    'reset-sent': 'An email with password reset instructions has been sent to you.',
    'activate-reset': 'Please enter your new password.',
    'invalid-reset': 'This is not a valid reset.',
    'reset-done': 'Your password has been reset.',
    'confirmed': 'Your account has been confirmed',
    'invalid-confirm-code': 'That confirmation code is not valid.'
  }



  home_module.service('auth', function($http,$window) {
    return {
      login: function(creds,win,fail){
        $http({method:'POST', url: '/auth/login', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            return $window.location.href='/account'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      register: function(details,win,fail){
        $http({method:'POST', url: '/auth/register', data:details, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            return $window.location.href='/account'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      instance: function(win,fail){
        $http({method:'GET', url: '/auth/instance', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      reset: function(creds,win,fail){
        $http({method:'POST', url: '/auth/create_reset', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      reset_load: function(creds,win,fail){
        $http({method:'POST', url: '/auth/load_reset', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      reset_execute: function(creds,win,fail){
        $http({method:'POST', url: '/auth/execute_reset', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      confirm: function(creds,win,fail){
        $http({method:'POST', url: '/auth/confirm', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

    }
  })


  home_module.service('api', function($http,$window) {
    return {
      // GET if no data
      call: function(path,data,win,fail){
        if( _.isFunction(data) ) {
          win = data
          fail = win
          data = void 0
        }

        var params = {
          method:data?'POST':'GET',
          url: path,
          data:data,
          cache:false}

        $http( params ).
          success(function(out, status) {
            if( win ) return win(out);
          }).
          error(function(out, status) {
            if( fail ) return fail(out);
          })
      }
    }
  })



  home_module.controller('Login', function($scope, $rootScope, auth) {

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
        if( 'nick-exists'  == out.why ) $scope.seek_email = true;
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
        $scope.cancel()
        $scope.msg = msgmap['reset-sent']
        $scope.showmsg = true

      }, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        $scope.showmsg = true
        if( 'user-not-found' == out.why ) $scope.seek_email = true;
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


    $scope.goaccount = function() {
      window.location.href='/account'
    }


    $scope.mode = 'none'
    $scope.user = null

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

    $scope.hasuser = !!$scope.user

    auth.instance(function(out){
      $scope.user = out.user
      $scope.hasuser = !!$scope.user
      $rootScope.$emit('instance',{user:out.user})
    })
  })


  home_module.controller('Reset', function($scope, $http, auth) {
    if( !$scope.show_reset ) return;

    $scope.show_resetpass = true
    $scope.show_gohome    = false


    var path  = window.location.pathname
    var token = path.replace(/^\/reset\//,'')

    auth.reset_load({
      token:token

    }, function( out ){
      $scope.msg = msgmap['activate-reset']
      $scope.nick = out.nick
      $scope.show_reset = true
      
    }, function( out ){
      $scope.msg = msgmap['invalid-reset']
    })

    
    $scope.reset = function(){
      $scope.seek_password = empty($scope.input_password)
      $scope.seek_repeat   = empty($scope.input_repeat)
      $scope.seek_reset    = $scope.seek_password || $scope.seek_repeat

      if( !$scope.seek_password && !$scope.seek_repeat ) {
        auth.reset_execute({
          token:    token,
          password: $scope.input_password,
          repeat:   $scope.input_repeat,

        }, function( out ){
          $scope.msg = msgmap['reset-done']
          $scope.show_gohome = true
          $scope.show_resetpass = false
      
        }, function( out ){
          $scope.msg = msgmap['invalid-reset']
        })
      }
      else {
        $scope.msg = msgmap['missing-fields']
      }
    }

    $scope.gohome = function() {
      window.location.href='/'
    }

    $scope.goaccount = function() {
      window.location.href='/account'
    }
  })


  home_module.controller('Confirm', function($scope, $rootScope, auth) {
    if( !$scope.show_confirm ) return;

    $rootScope.$on('instance', function(event,args){
      $scope.show_goaccount = !!args.user
      $scope.show_gohome    = !args.user
    })

    var path = window.location.pathname
    var code = path.replace(/^\/confirm\//,'')

    auth.confirm({
      code:code

    }, function( out ){
      $scope.msg = msgmap['confirmed']

    }, function( out ){
      $scope.msg = msgmap['invalid-confirm-code']
    })

    $scope.gohome = function() {
      window.location.href='/'
    }

    $scope.goaccount = function() {
      window.location.href='/account'
    }
  })


  home_module.controller('Subscribe', function($scope, $rootScope, auth, api) {

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
      }, function( out ){
        $scope.show_package = true;
        $scope.show_login = false;
        $scope.hasuser = true;
        $scope.user = out.user;
        console.log(out);
      }, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        if( 'email-exists' == out.why ) $scope.seek_email = true;
        if( 'nick-exists'  == out.why ) $scope.seek_email = true;
        $scope.showmsg = true
      })
    }


    $scope.signup = function(){
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


    $scope.change = function( field ) {
      if( $scope.signin_hit ) return markinput(read());
    }


    $scope.goaccount = function() {
      window.location.href='/account'
    }


    $scope.buy = function(package) {

      $('#payform [name=amount]').val(package.price);
      $('#payform [name=code]').val(package.code);
      $('#payform [name=plan]').val(package.code);
      $('#payform [name=description]').val(package.description);
      $('#payform [name=pricetag]').val(package.priceTag);
      $('#payform [name=refno]').val($scope.user.id + '-' + new Date().getTime());

      $('#payform').submit();
    }


    $scope.show_login = false;
    $scope.show_package = false;

    $scope.user = null

    $scope.showmsg = false

    $scope.signup_hit = false

    $scope.input_name = ''
    $scope.input_email = ''
    $scope.input_password = ''

    $scope.seek_name = false
    $scope.seek_email = false
    $scope.seek_password = false

    $scope.hasuser = !!$scope.user

    api.call('/subscribe/packages',function(out){
      $scope.packages = out.packages;

      auth.instance(function(out){
        $scope.user = out.user
        $scope.hasuser = !!$scope.user

        if ($scope.hasuser) {
          $scope.input_name = $scope.user.name;
          $scope.input_email = $scope.user.email;
        }

        $scope.show_login = !$scope.hasuser;
        $scope.show_package = $scope.hasuser;
      })
    })

  });


  home_module.controller('Subscribed', function($scope, $rootScope, auth) {

    $scope.goaccount = function() {
      window.location.href='/account'
    }

    $scope.hasuser = !!$scope.user

    auth.instance(function(out){
      $scope.user = out.user
      $scope.hasuser = !!$scope.user
      $rootScope.$emit('instance',{user:out.user})
    })

  });

})();


