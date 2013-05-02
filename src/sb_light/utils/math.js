define(['sb_light/globals'], function(sb) {
	var math = {};


	//takes lists of [{x:#,y:#}]  points
	math.polygonsOverlap = function(pointsA, pointsB) {
		pointsA.forEach(function(a, ai, pa) {
			pointsB.forEach(function(b,bi, pb) {
				if(math.linesIntersect(a, (pa[(ai+1) % pa.length]), b, (pb[(bi+1) % pb.length]))) {
					return true;
				}
			});
		});
		if(math.polygonContains(pointsA, pointsB[0]) || math.polygonContains(pointB, pointsA[0])) {
			return true;
		}
		return false;
	};

	math.polygonContains = function(polyPoints, point) {
		var start = {x:-100, y:-100};
		var ints = 0;
		polyPoints.forEach(function(p,i, list) {
			if(math.linesIntersect(p, list[(i+1)%list.length], start, point)) {
				ints++;	
			}
		});
		return ints % 2 == 1;

	};


	math.comparePoints = function(pa, pb) {
		return pa.x == pb.x && pa.y == pb.y;
	};

	math.determinant = function(pa, pb) {
		return (pa.x * pb.y) - (pb.x * pa.y);
	};
	math.diffPoints = function(pa,pb) {
		return {x:(pa.x-pb.x), y:(pa.y-pb.y)};
	};


	math.linesIntersect = function(paStart, paEnd, pbStart, pbEnd) {
		var det = math.determinant(math.diffPoints(paEnd, paStart), math.diffPoints(pbStart, pbEnd) );
		var t = math.determinant(math.diffPoints(pbStart, paStart), math.diffPoints(pbStart, paEnd)) / det;
		var u = math.determinant(math.diffPoints(pbEnd, paStart), math.diffPoints(pbStart - paStart)) / det;

		return (t >= 0) && (u >= 0) && (t <= 1) && (u <= 1);
	};

	return;
});

