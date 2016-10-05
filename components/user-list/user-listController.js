'use strict';

cs142App.controller('UserListController', ['$scope','$resource',
    function ($scope, $resource) {
           $scope.main.title = 'Users';
        var version = $resource('/userinfo');
        $scope.users = version.query();
       
}]);