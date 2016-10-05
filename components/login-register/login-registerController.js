'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$resource', '$location', '$rootScope',
    function ($scope, $resource, $location, $rootScope) {
        $scope.main.title = 'Users';
        $scope.login = function() {
            var regiRes = $resource("/admin/login"); 
            regiRes.save({login_name: $scope.login_name, password: $scope.password}, function (user) {
            $location.path("/users/" + user._id);
            $scope.loggedUser = user._id;
            $scope.main.first_name = user.first_name;
            $scope.loggedin = true;
            $scope.main.userId = user._id;
            $rootScope.$broadcast('LoggedIn');
        }, function errorHandling(err) { 
            $scope.loginFailed=true;
            });
        };
        
        $scope.register = function() {
        if (!$scope.new_login_name || $scope.new_login_name === "") {
            $scope.register_message = "Please specify login name and try again.";
            return;
        }
        if (!$scope.new_password || !$scope.repassword) {
            $scope.register_message = "Please enter non-empty passwords twice!";
            return;
        }
        if ($scope.new_password !== $scope.repassword) {
            $scope.register_message = "The two passwords you entered do not match.";
            return;
        }
        if (!$scope.new_first_name || $scope.new_first_name === "") {
            $scope.register_message = "Please specify first name and try again";
            return;
        }
        if (!$scope.new_last_name || $scope.new_last_name === "") {
            $scope.register_message = "Please specify last name and try again";
            return;
        }
        var res = $resource("/user");
        res.save({login_name: $scope.new_login_name, password: $scope.new_password,
        first_name: $scope.new_first_name, last_name: $scope.new_last_name, location: $scope.new_location,
        description: $scope.new_description, occupation: $scope.new_occupation}, function() {
        
        }, function errorHandling(err) {
//            $scope.register_message = err.data;
        });
    };
        
        /*$scope.main.callBack = function (model) {
            $scope.$apply(function () {
                var listinfo = JSON.parse(model);
                $scope.users = listinfo;
            });
        };
        $scope.FetchModel("/user/list", $scope.main.callBack);*/
}]);