
define(['sb_light/globals'], function(sb) {
	var dom = {};

	dom.empty = function(dom) {
		var fc = dom ? dom.firstChild : null;
		while(fc) {
			dom.removeChild(fc);
			fc = dom.firstChild;
		}
	}


	return dom;

});
