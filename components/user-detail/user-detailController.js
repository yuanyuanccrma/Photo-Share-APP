'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource', '$rootScope', '$location', '$http',
  function ($scope, $routeParams, $resource, $rootScope, $location, $http) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
      var userId = $routeParams.userId;
//      $scope.main.user = userId;
      var users = $resource('/user/:id', {id: '@id'});
      users.get({id: userId}, function(data) {
          $scope.userDetail = data;
          $scope.isUserLoggedIn = function() {
              if ($scope.userDetail){
                  return $scope.userDetail.isLoggedInUser;}
          };
      });   

  }]);
