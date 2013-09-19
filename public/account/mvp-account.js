;(function(){
  function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}
  function empty(val) { return null == val || 0 == ''+val }

  var account_module = angular.module('account',['cookiesModule'])


  var msgmap = {
    'unknown': 'Unable to perform your request at this time - please try again later.',
    'user-updated': 'Your user details have been updated.',
    'user-exists-email': 'A user with that email already exists.',
    'user-exists-nick': 'A user with that username already exists.',
    'password-updated': 'Your password has been updated.',
    'org-updated': 'Your organisations details have been updated.',
  }



  account_module.service('auth', function($http,$window) {
    return {
      instance: function(win,fail){
        $http({method:'GET', url: '/auth/instance', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      logout: function(win,fail){
        $http({method:'POST', url: '/auth/logout', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            return $window.location.href='/'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      change_password: function(creds,win,fail){
        $http({method:'POST', url: '/auth/change_password', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      update_user: function(fields,win,fail){
        $http({method:'POST', url: '/auth/update_user', data:fields, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      update_org: function(fields,win,fail){
        $http({method:'POST', url: '/account/update', data:fields, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },
    }
  })


  account_module.service('pubsub', function() {
    var cache = {};
    return {
      publish: function(topic, args) { 
	cache[topic] && $.each(cache[topic], function() {
	  this.apply(null, args || []);
	});
      },
      
      subscribe: function(topic, callback) {
	if(!cache[topic]) {
	  cache[topic] = [];
	}
	cache[topic].push(callback);
	return [topic, callback]; 
      },
      
      unsubscribe: function(handle) {
	var t = handle[0];
	cache[t] && d.each(cache[t], function(idx){
	  if(this == handle[1]){
	    cache[t].splice(idx, 1);
	  }
	});
      }
    }
  });


  account_module.controller('Main', function($scope, auth, pubsub) {
    var path = window.location.pathname

    auth.instance(function(out){
      $scope.user = out.user
      $scope.account = out.account
      pubsub.publish('user',[out.user])
      pubsub.publish('account',[out.account])
    })

    pubsub.subscribe('user',function(user){
      $scope.user = user
    })
  })


  account_module.controller('NavBar', function($scope, auth, pubsub) {
    
    $scope.btn_account = function() {
      pubsub.publish('view',['Account'])
    }

    $scope.btn_signout = function() {
      auth.logout()
    }
    
  })


  account_module.controller('Account', function($scope, pubsub, auth) {
    pubsub.subscribe('view',function(view){
      if( 'Account' != view ) return;
    })

    pubsub.subscribe('user',function(user){
      $scope.field_name  = user.name
      $scope.field_email = user.email
    })

    pubsub.subscribe('account',function(account){
      $scope.field_org_name  = account.name
      $scope.field_org_web   = account.web
    })


    function read_user() {
      return {
        name:  $scope.field_name,
        email: $scope.field_email
      }
    }

    function read_pass() {
      return {
        password:  $scope.field_password,
        repeat:    $scope.field_repeat
      }
    }

    function read_org() {
      return {
        name: $scope.field_org_name,
        web:  $scope.field_org_web
      }
    }


    $scope.update_user = function() {
      var data = read_user()
      auth.update_user( 
        data, 
        function( out ){
          $scope.account_msg = msgmap['user-updated']
          pubsub.publish('user',[out.user])
        },
        function( out ){
          $scope.details_msg = msgmap[out.why] || msgmap.unknown          
        }
      )
    }


    $scope.change_pass = function() {
      var data = read_pass()
      console.log(data)
      auth.change_password( 
        data, 
        function( out ){
          $scope.password_msg = msgmap['password-updated']
        },
        function( out ){
          $scope.password_msg = msgmap[out.why] || msgmap.unknown          
        }
      )
    }


    $scope.update_org = function() {
      var data = read_org()
      auth.update_org( 
        data, 
        function( out ){
          $scope.org_msg = msgmap['org-updated']
          pubsub.publish('account',[out.account])
        },
        function( out ){
          $scope.org_msg = msgmap[out.why] || msgmap.unknown          
        }
      )
    }
  })


  account_module.controller('TabView', function($scope, pubsub) {
    var views = ['Dashboard','Projects','Settings','Account']

    $scope.views = _.filter(views,function(n){return n!='Account'})

    $scope['show_view_'+views[0]] = true
    $scope.curtab = views[0]

    pubsub.subscribe('view',function(name){
      _.each(views,function(v){
        $scope['show_view_'+v] = (name==v)
      })
      $scope.curtab = name
    })

    $scope.tabview = function( name ){
      pubsub.publish('view',[name])
    }
  })



/*
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
*/


})();


