angular.
	module('highscorepage', ['ngRoute', 'angular-jwt']).
	config(config).
	factory('AuthInterceptor',AuthInterceptor).
	factory('AuthFactory',AuthFactory).
	run(run).
	controller('EndGameController',EndGameController);

// I don't know what these do but best to leave it there
function AuthFactory() {
	return{
		auth: auth
	}
	var auth = {
		isLoggedIn: false
	};
}

function AuthInterceptor($location, $q, $window, AuthFactory) {
	return {
		request: request,
		response: response,
		responseError: responseError
	};

	function request(config) {
		config.headers = config.headers || {};
		if ($window.sessionStorage.token) {
			config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
		}
		return config;
	}

	function response(response) {
		if (response.status === 200 && $window.sessionStorage.token && !AuthFactory.isLoggedIn) {
			AuthFactory.isLoggedIn = true;
		}
		if (response.status === 401) {
			AuthFactory.isLoggedIn = false;
		}
		return response || $q.when(response);
	}

	function responseError(rejection) {
		if (rejection.status === 401 || rejection.status === 403) {
			delete $window.sessionStorage.token;
			AuthFactory.isLoggedIn = false;
			$location.path('/');
		}
		return $q.reject(rejection);
	}
}

function run($rootScope, $location, $window, AuthFactory) {
	$rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
		if (nextRoute.access !== undefined && nextRoute.access.restricted && !$window.sessionStorage.token && !AuthFactory.isLoggedIn) {
			event.preventDefault();
			$location.path('/');
		}
	});
}

function config($httpProvider, $routeProvider, $locationProvider) {
	$httpProvider.interceptors.push('AuthInterceptor');

	$routeProvider
		.when('/highscore.html', {
			templateUrl: './endgame.html',
			controller: EndGameController,
			controllerAs: 'vm',
			access: { restricted: false	}
		})
		.when('/postScore', {
			templateUrl: 'angular-app/hotel-list/hotels.html',
			//controller: HotelsController,
			//controllerAs: 'vm',
			access: { restricted: false	}
		})
		.otherwise({
			redirectTo: '/'
		});

	$locationProvider.html5Mode(true);
}

function EndGameController($route,$window,$http,jwtHelper){
	var vm = this;
	vm.score = $window.localStorage.score;
	vm.time = $window.localStorage.time;
	vm.justPlayed = false;
	if (vm.score && vm.time) vm.justPlayed = true;
	if ($window.sessionStorage.error) {
		vm.error = $window.sessionStorage.error;
		$window.sessionStorage.clear();
	}

	$http.get('/z/getHighScore').then(function(res){
		vm.alltime = res.data.alltime;
		for (let i of vm.alltime){
			if (moment().valueOf() - i.time < 172800000)
				i.time = moment(parseInt(i.time)).fromNow();
			else i.time = moment(parseInt(i.time)).format('MMM D');
		}
		vm.weekly = res.data.weekly;
		for (let i of vm.weekly){
			if (moment().valueOf() - i.time < 172800000)
				i.time = moment(parseInt(i.time)).fromNow();
			else i.time = moment(parseInt(i.time)).format('MMM D');
		}
		$window.sessionStorage.token = res.data.token;
	}).catch(function(error){
		$window.sessionStorage.error = "There were some errors while trying to retrieve highscore from the server. Please try again or contact me if it gets too ugly. Here are some details: " + error;
	});

	vm.addScore = function(){
		var token = jwtHelper.decodeToken($window.sessionStorage.token);
		var postData = {
			game: token.game,
			name: vm.nameField,
			score: vm.score,
			time: vm.time
		};
		if (vm.nameInputForm.$valid){
			$http.post('/z/postHighScore',postData).then(function(res){
				if (res.status === 200){
					$window.localStorage.clear();
					$route.reload();
				} else {
					$window.sessionStorage.error = "There were some errors when posting your score. Please try again or contact me if it gets too ugly."
					$route.reload();
				}
			}).catch(function(error){
				console.log(error);
				$window.sessionStorage.error = "There were some errors when posting your score. Please try again or contact me if it gets too ugly. Here are the details: " + error;
				$route.reload();
			});
		}
	}
}