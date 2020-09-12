var app = angular.module("app", []);
app.constant('BaseServiceUrl', 'https://cricket-exchange-7.firebaseio.com/');
app.constant('BaseFKServiceUrl', 'https://cors-anywhere.herokuapp.com/https://affiliate-api.flipkart.net/affiliate/');
app.factory('httpRequestInterceptor', function () {
    return {
        request: function (config) {
            config.headers['Fk-Affiliate-Id'] = 'rupaparap';
            config.headers['Fk-Affiliate-Token'] = '4d48ae061424414dbf6a48c6994ffa71';
            return config;
        }
    };
});
app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
});

app.factory('LeadSVC', function ($http, BaseServiceUrl) {
    return {
        GetCricketScoreData: function () {
            return $http({
                method: 'GET',
                url: BaseServiceUrl + 'liveMatches.json'
            }).then(function successCallback(response) {
                return response.data;
            });
        },
        GetCricketScorecardsData: function (id) {
            return $http({
                method: 'GET',
                url: BaseServiceUrl + `scorecards/${id}.json`
            }).then(function successCallback(response) {
                return response.data;
            });
        },
        GetCricketMatchData: function (id, pindex) {
            return $http({
                method: 'GET',
                url: BaseServiceUrl + `sV1/${id}/${pindex}.json`
            }).then(function successCallback(response) {
                return response.data;
            });
        },
    }
});

app.factory('FlipkartSVC', function ($http, BaseFKServiceUrl) {
    return {
        DealsoftheDay: function () {
            return $http({
                method: 'GET',
                url: BaseFKServiceUrl + 'offers/v1/dotd/json'
            }).then(function successCallback(response) {
                return response.data;
            });
        }
    }
});

app.controller('UsersCtrl', ['$scope', 'LeadSVC', 'FlipkartSVC', function ($scope, LeadSVC, FlipkartSVC) {
    $scope.IsOnline = navigator.onLine;
    $scope.GetCricketScoreData = function (id) {
        LeadSVC.GetCricketScoreData().then(function (data) {
            delete data.T;
            var martchList = [];
            var live = [],
                upcoming = [],
                result = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    data[key].id = key;
                    switch (data[key].status) {
                        case 0:
                            upcoming.push(data[key]);
                            break;
                        case 1:
                            live.push(data[key]);
                            break;
                        default:
                            result.push(data[key]);
                    }
                }
            }
            martchList = live.concat(result, upcoming);
            var index = 0;
            angular.forEach(martchList, function (item, key) {
                var data = item.date.split(',');
                item.date = new Date(data[0] + " " + new Date().getFullYear() + data[1]);
                item.index = index;
                index++;
            });
            $scope.changeMatch(martchList[id]);
            $scope.LiveData = martchList;
        });
    };
    $scope.GetCricketScoreData(0);
    var myVar;
    $scope.changeMatch = function (item) {
        $scope.selectedMatche = item;
        $scope.GetCricketScorecardsData(item.id);
        $scope.GetCricketMatchData(item.id);
        clearTimeout(myVar);
        if ($scope.selectedMatche.status == 1) {
            myVar = setTimeout(() => {
                //console.log(item.index);
                $scope.GetCricketScoreData(item.index);
            }, 10 * 1000);
        }
    }
    $scope.GetCricketScorecardsData = function (id) {
        LeadSVC.GetCricketScorecardsData(id).then(function (data) {
            $scope.ScoreCards = data;
        });
    }

    $scope.GetCricketMatchData = function (id) {
        LeadSVC.GetCricketMatchData(id, 'p2').then(function (data) {
            $scope.P2Data = data;
        });
        LeadSVC.GetCricketMatchData(id, 'p1').then(function (data) {
            $scope.P1Data = data;
        });
    }

    $scope.ChangeMatchNextPrev = function (index) {
        $scope.changeMatch($scope.LiveData[index]);
    }
    $scope.CalculateOver = function (bcount) {
        if (bcount) {
            if (bcount % 6 == 0)
                return bcount / 6;
            else
                return parseInt(bcount / 6) + "." + (bcount % 6)
        } else {
            return "0.0";
        }
    }


    if (Math.floor(Math.random() * 10)>= 2) {
        FlipkartSVC.DealsoftheDay().then(function (data) {
            var rendomCount = Math.floor(Math.random() * data.dotdList.length)
            $scope.FKDOD = data.dotdList[rendomCount];
        });
    }



    $scope.GetBatsmenName = function (name, isGetName) {
        var nameArray = name.replace(/(\r\n|\n|\r)/gm, " ").match(/^(\S+? \S+?) ([\s\S]+?)$/).slice(1, 3);
        if (isGetName == true)
            return nameArray[0];
        else
            return nameArray[1];
    }

    $("#txtGoogleSearch").autocomplete({
        select: function (event, ui) {
            $(this).closest('form').submit();
        },
        source: function (request, response) {
            const proxyurl = "https://cors-anywhere.herokuapp.com/";
            const url = `https://suggestqueries.google.com/complete/search?q=${request.term}&client=firefox`;
            fetch(proxyurl + url)
                .then(response => response.text())
                .then(function (contents) {
                    if (contents) {
                        var result = JSON.parse(contents);
                        var list = result[1];
                        var suggestions = [];
                        $.each(list, function (key, val) {
                            suggestions.push({
                                "value": val
                            });
                        });
                        suggestions.length = 7; // prune suggestions list to only 5 items
                        response(suggestions);
                    }
                }).catch(() => console.log("Can’t access " + url + " response. Blocked by browser?"));
        },
    });
}]);

// app.directive("digitalClock", function ($timeout, dateFilter) {
//     return {
//         restrict: 'E',
//         link: function (scope, iElement) {
//             (function updateClock() {
//                 iElement.text(dateFilter(new Date(), 'hh:mm a'));
//                 $timeout(updateClock, 1000);
//             })();
//         }
//     };
// });