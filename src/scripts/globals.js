define(function (require) {
	var globals = {
		version: (new Date()).getTime()	
	};
	
    var singleton = function () {
        return globals;
    };
    return singleton();
});