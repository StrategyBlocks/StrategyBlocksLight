(function (root, sb_light) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define(sb_light);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.sb_light = sb_light();
        if(typeof root.sb === "undefined") {
        	root.sb = root.sb_light;
        }
    }
}(this, function () {
    //almond, and your modules will be inlined here