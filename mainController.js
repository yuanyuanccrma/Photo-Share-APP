'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/login-register', {
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'LoginRegisterController'
            }).
            when('/favorites', {
                templateUrl: 'components/user-favorites/user-favoritesTemplate.html',
                controller: 'UserFavoriteController'
            }).
            otherwise({
                redirectTo: '/users'
            });
    }]);

cs142App.controller('MainController', ['$scope', '$rootScope', '$location', '$resource', '$http', 
    function ($scope, $rootScope, $location, $resource, $http) {
        $scope.main = {};
        $scope.main.title = 'Users';
        $scope.login_name = "";
        $scope.password = "";
        $scope.loggedin = false;
        
        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
          if (!$scope.loggedin) {
             // no logged user, redirect to /login-register unless already there
            if (next.templateUrl!== "components/login-register/login-registerTemplate.html") {
                $location.path("/login-register");
            }
          }
       });
        
        $scope.$on('LoggedIn', function () {
            $scope.loggedin = true;
        }); 
        $scope.main.logout = function () {
            $scope.loggedin = false;
            var logout = $resource("/admin/logout");
            var logoutdata = logout.save();
            $location.path("/login-register");
        };
        
        $scope.deleteUser = function() {
            var confirmation = prompt("Warning: this action will delete everything in your account. Typing \"Confirm\" to confirm action.");
            if(confirmation === null) { return; }
            if(confirmation !== "Confirm") { return; }
            var resource = $resource('/deleteUser/' + $scope.main.userId);
            resource.save(function() {
                $scope.loggedIn = false;
                window.location.reload();
            });
        };
        var selectedPhotoFile;   // Holds the last file selected by the user

            // Called on file selection - we simply save a reference to the file in selectedPhotoFile
            $scope.inputFileNameChanged = function (element) {
                selectedPhotoFile = element.files[0];
            };

            // Has the user selected a file?
            $scope.inputFileNameSelected = function () {
                return !!selectedPhotoFile;
            };

            // Upload the photo file selected by the user using a post request to the URL /photos/new
            $scope.uploadPhoto = function () {
                if (!$scope.inputFileNameSelected()) {
                    console.error("uploadPhoto called will no selected file");
                    return;
                }
                console.log('fileSubmitted', selectedPhotoFile);

                // Create a DOM form and add the file to it under the name uploadedphoto
                var domForm = new FormData();
                domForm.append('uploadedphoto', selectedPhotoFile);

                // Using $http to POST the form
                $http.post('/photos/new', domForm, {
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                }).success(function(newPhoto){
                    $rootScope.$broadcast('photoadded');
                    // The photo was successfully uploaded. XXX - Do whatever you want on success.
                }).error(function(err){
                    // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                    console.error('ERROR uploading photo', err);
                });

            };
        
       
    }]);
