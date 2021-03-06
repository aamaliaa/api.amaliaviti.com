
var dash = angular.module('dash', []);

dash.controller('mainController', function mainController($scope, $http) {

	$scope.sleeps = {};
	$scope.range = '1w';

	var formatSleepData = function(data) {
		var formattedData = {};

		var date0 = new Date(data[0].date);
		var dateN = new Date(data[data.length - 1].date);

		formattedData.range = moment(date0).format('L') + ' to ' + moment(dateN).format('L');
		formattedData.days = Math.floor((dateN - date0) / 86400000) + 1;
		formattedData.data = [];

		data.forEach(function(d) {
			var newD = d;
			newD.min_asleep = d.totals.min_asleep;
			newD.min_in_bed = d.totals.min_in_bed;
			formattedData.data.push(newD);
		});

		return formattedData;
	}

	$scope.getSleepData = function(range) {
		if(range === 'all') {
			range = '';
		}
		$http.get('/api/sleep/'+range)
			.success(function(data) {
				$scope.sleeps = formatSleepData(data.sleep);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}

	$scope.getSleepData($scope.range);

	$scope.$watch('range', function(){
		$scope.getSleepData($scope.range);
	});

});

dash.directive('barChart', function() {

	return {
		restrict: 'E',
		scope: {
			data: '=data',
			param: '@param'
		},
		link: function(scope, element, attrs) {

			var margin = { top: 20, right: 40, bottom: 20, left: 40 },
				width = 1170 - margin.left - margin.right,
				height = 500 - margin.top - margin.bottom;

			var svg = d3.select(element[0]).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);

			scope.$watch('data', function(newData, oldData) {

				if(!newData) {
					return;
				}

				svg.selectAll('*').remove();

				var data = newData;

				var x = d3.time.scale()
					.range([0, width]);

				var y = d3.scale.linear()
					.range([height, 0])
					.domain([0, d3.max(data, function(d) { return d[scope.param]; })]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient('bottom');

				var parseDate = d3.time.format.iso.parse;

				data.forEach(function(d) {
					d.date = parseDate(d.date);
				})

				data.sort(function(a, b) {
					return a.date - b.date;
				});

				x.domain([data[0].date, data[data.length - 1].date]);

				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				svg.selectAll("rect")
					.data(data)
					.enter()
					.append("rect")
					.attr("x", function(d, i) { return i * (width / data.length); })
					.attr("y", function(d) { return y(d[scope.param]); })
					.attr("width", width / data.length - 1)
					.attr("height", function(d) { return height - y(d[scope.param]); });

				$("svg rect")
					.tipsy({
						gravity: 's',
						html: true,
						title: function() {
							var d = this.__data__;
							if(scope.param === 'min_asleep') {
								var hrs = Math.floor(d[scope.param] / 60);
								var mins = d[scope.param] % 60;
								var min_asleep = (hrs + ' hrs') + (mins ? ' ' + mins + ' mins' : '');
								return min_asleep +'<br>'+moment(d.date).format('dddd')+'<br>'+moment(d.date).format('MM-DD-YYYY');
							} else {
								return d[scope.param] +'<br>'+moment(d.date).format('dddd')+'<br>'+moment(d.date).format('MM-DD-YYYY');
							}
						}
					})

				svg.selectAll("rect")
					.filter(function(d) { return d.date.getDay() === 5 || d.date.getDay() === 6; })
					.classed("weekend", true);

			});
		}
	}
});