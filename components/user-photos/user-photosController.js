'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$resource', '$rootScope',
  function ($scope, $routeParams, $resource, $rootScope) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
      var userId = $routeParams.userId;

      $scope.newcomment = {};
      var photos = $resource('/photosOfUser/:id', {id: '@id'});
      $scope.userphoto = photos.query({id: userId}); 
      
      $scope.like = function(photoId) {
          var resource = $resource('/likeVotes/' + photoId);
          resource.save({}, function() {
          var photos = $resource('/photosOfUser/:id', {id: '@id'});
          $scope.userphoto = photos.query({id: userId});     
          });
      };

      $scope.likeNum = function (count) {
          if (count !== 1) { return "Likes"; }
          else {
            return "Like"; }
        };

      var users = $resource('/user/:id', {id: '@id'});
      var favor = users.get({id: $scope.main.userId}, function(data) {
        $scope.favorlist = favor.favorite_photos;
        console.log('favoe',$scope.main.userId,'list:: ',$scope.favorlist);
        $scope.likedFunc =function(photoid) {
          var pho = $scope.favorlist.filter(function(obj) {
            return obj._id === photoid;
          });
          if (pho[0]) {return true;
          } else {
            return false;}
          };
        });

      $scope.favorite = function(photo) {
          var add = $resource("/favorites/"+photo._id);
          var addfav = add.save({photo: photo}, function () {
                console.log('add fav call back');
                var users = $resource('/user/:id', {id: '@id'});
                var favor = users.get({id: $scope.main.userId}, function(data){
                    $scope.favorlist = favor.favorite_photos;
                });
          }, function errorHandling(err) {
              console.error(err);
          });
      };
      
      $scope.addcomment = function(photoId) {
          var res = $resource("/commentsOfPhoto/" + photoId);
          res.save({comment: $scope.newcomment[photoId]}, function () {
              var photos = $resource('/photosOfUser/:id', {id: '@id'});
              $scope.userphoto = photos.query({id: userId}); 
          }, function errorHandling(err) {
              console.error('err::');
          });
      };  
      
      $scope.deletecomment= function(photoId, comment) {
          var res = $resource("/deleteComment/" + photoId);
          res.save({comment: comment}, function () {
              var photos = $resource('/photosOfUser/:id', {id: '@id'});
              $scope.userphoto = photos.query({id: userId}); 
          }, function errorHandling(err) {
              console.error('err');
          }); 
      };
      
      $scope.deletephoto = function(photoId) {
          var res = $resource('/deletePhoto/' + photoId);
          res.save({}, function() {
              var photos = $resource('/photosOfUser/:id', {id: '@id'});
              $scope.userphoto = photos.query({id: userId}); 
          }, function errorHandling(err) {
              console.error('err');
          });
      };
      
      $scope.$on('photoadded', function() {
          var photos = $resource('/photosOfUser/:id', {id: '@id'});
          $scope.userphoto = photos.query({id: userId});
      });
  }]);
