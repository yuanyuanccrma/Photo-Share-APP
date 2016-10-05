'use strict';

cs142App.controller('UserFavoriteController', ['$scope', '$resource','$location','$rootScope',
    function ($scope, $resource, $location, $rootScope) {
        $scope.favdelete = function (photo) {
            var deletePhoto = $resource('/deleteFavorite/'+photo._id);
            var response = deletePhoto.save({}, function () {
                var users = $resource('/user/:id', {id: '@id'});
                var favor = users.get({id: $scope.main.userId}, function (data) {
                    $scope.favorlist = favor.favorite_photos;
                });
            },function(err){
                console.error(err);
            });
        };

        var users = $resource('/user/:id', {id: '@id'});
        var favor = users.get({id: $scope.main.userId}, function() {
            $scope.favorlist = favor.favorite_photos;
            console.log('favoe',$scope.main.userId,'list:: ',$scope.favorlist);
            }, function errorHandling(err) {
              console.error(err);                           
          });
}]);