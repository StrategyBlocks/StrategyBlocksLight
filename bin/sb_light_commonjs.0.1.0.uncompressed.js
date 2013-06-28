/**
 * @version 0.1.0
 * 
 */

(function () {
var sb_light;(function () { if (typeof sb_light === 'undefined') {
sb_light = {};
/**
 * almond 0.2.3 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support sb_light.require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

sb_light.requirejs = requirejs;sb_light.require = require;sb_light.define = define;
}
}());
sb_light.define('sb_light/globals',['require'],function (require) {
	var globals = {
		version: (new Date()).getTime()	
	};
	
    var singleton = function () {
        return globals;
    };
    return singleton();
});

 exports.globals = sb_light.require('sb_light/globals');


// moment.js
// version : 2.0.0
// author : Tim Wood
// license : MIT
// momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.0.0",
        round = Math.round, i,
        // internal storage for language config files
        languages = {},

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(\d*)?\.?(\d+)\:(\d+)\:(\d+)\.?(\d{3})?/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing tokens
        parseMultipleFormatChunker = /([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenWord = /[0-9]*[a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF]+\s*?[\u0600-\u06FF]+/i, // any word (or two) characters or numbers including two word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO seperator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        // preliminary iso regex
        // 0000-00-00 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000
        isoRegex = /^\s*\d{4}-\d\d-\d\d((T| )(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.S', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return ~~(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(~~(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(a / 60), 2) + ":" + leftZeroFill(~~a % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(10 * a / 6), 4);
            },
            X    : function () {
                return this.unix();
            }
        };

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a));
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i]);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var data = this._data = {},
            years = duration.years || duration.year || duration.y || 0,
            months = duration.months || duration.month || duration.M || 0,
            weeks = duration.weeks || duration.week || duration.w || 0,
            days = duration.days || duration.day || duration.d || 0,
            hours = duration.hours || duration.hour || duration.h || 0,
            minutes = duration.minutes || duration.minute || duration.m || 0,
            seconds = duration.seconds || duration.second || duration.s || 0,
            milliseconds = duration.milliseconds || duration.millisecond || duration.ms || 0;

        // representation for dateAddRemove
        this._milliseconds = milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = months +
            years * 12;

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;
        seconds += absRound(milliseconds / 1000);

        data.seconds = seconds % 60;
        minutes += absRound(seconds / 60);

        data.minutes = minutes % 60;
        hours += absRound(minutes / 60);

        data.hours = hours % 24;
        days += absRound(hours / 24);

        days += weeks * 7;
        data.days = days % 30;

        months += absRound(days / 30);

        data.months = months % 12;
        years += absRound(months / 12);

        data.years = years;
    }


    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding) {
        var ms = duration._milliseconds,
            d = duration._days,
            M = duration._months,
            currentDate;

        if (ms) {
            mom._d.setTime(+mom + ms * isAdding);
        }
        if (d) {
            mom.date(mom.date() + d * isAdding);
        }
        if (M) {
            currentDate = mom.date();
            mom.date(1)
                .month(mom.month() + M * isAdding)
                .date(Math.min(currentDate, mom.daysInMonth()));
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (~~array1[i] !== ~~array2[i]) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }


    /************************************
        Languages
    ************************************/


    Language.prototype = {
        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy);
        },
        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    };

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        if (!key) {
            return moment.fn._lang;
        }
        if (!languages[key] && hasModule) {
            sb_light.require('./lang/' + key);
        }
        return languages[key];
    }


    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[.*\]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += typeof array[i].call === 'function' ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return m.lang().longDateFormat(input) || input;
        }

        while (i-- && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        }

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token) {
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
            return parseTokenFourDigits;
        case 'YYYYY':
            return parseTokenSixDigits;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'a':
        case 'A':
            return parseTokenWord;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
            return parseTokenOneOrTwoDigits;
        default :
            return new RegExp(token.replace('\\', ''));
        }
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, b,
            datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            datePartArray[1] = (input == null) ? 0 : ~~input - 1;
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[1] = a;
            } else {
                config._isValid = false;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DDDD
        case 'DD' : // fall through to DDDD
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                datePartArray[2] = ~~input;
            }
            break;
        // YEAR
        case 'YY' :
            datePartArray[0] = ~~input + (~~input > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
            datePartArray[0] = ~~input;
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = ((input + '').toLowerCase() === 'pm');
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[3] = ~~input;
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[4] = ~~input;
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[5] = ~~input;
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
            datePartArray[6] = ~~ (('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            a = (input + '').match(parseTimezoneChunker);
            if (a && a[1]) {
                config._tzh = ~~a[1];
            }
            if (a && a[2]) {
                config._tzm = ~~a[2];
            }
            // reverse offsets
            if (a && a[0] === '+') {
                config._tzh = -config._tzh;
                config._tzm = -config._tzm;
            }
            break;
        }

        // if the input is null, the date is not valid
        if (input == null) {
            config._isValid = false;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromArray(config) {
        var i, date, input = [];

        if (config._d) {
            return;
        }

        for (i = 0; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[3] += config._tzh || 0;
        input[4] += config._tzm || 0;

        date = new Date(0);

        if (config._useUTC) {
            date.setUTCFullYear(input[0], input[1], input[2]);
            date.setUTCHours(input[3], input[4], input[5], input[6]);
        } else {
            date.setFullYear(input[0], input[1], input[2]);
            date.setHours(input[3], input[4], input[5], input[6]);
        }

        config._d = date;
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var tokens = config._f.match(formattingTokens),
            string = config._i,
            i, parsedInput;

        config._a = [];

        for (i = 0; i < tokens.length; i++) {
            parsedInput = (getParseRegexForToken(tokens[i]).exec(string) || [])[0];
            if (parsedInput) {
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            }
            // don't parse if its not a known token
            if (formatTokenFunctions[tokens[i]]) {
                addTimeToArrayFromToken(tokens[i], parsedInput, config);
            }
        }
        // handle am pm
        if (config._isPm && config._a[3] < 12) {
            config._a[3] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[3] === 12) {
            config._a[3] = 0;
        }
        // return
        dateFromArray(config);
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            tempMoment,
            bestMoment,

            scoreToBeat = 99,
            i,
            currentScore;

        for (i = config._f.length; i > 0; i--) {
            tempConfig = extend({}, config);
            tempConfig._f = config._f[i - 1];
            makeDateFromStringAndFormat(tempConfig);
            tempMoment = new Moment(tempConfig);

            if (tempMoment.isValid()) {
                bestMoment = tempMoment;
                break;
            }

            currentScore = compareArrays(tempConfig._a, tempMoment.toArray());

            if (currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempMoment;
            }
        }

        extend(config, bestMoment);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i,
            string = config._i;
        if (isoRegex.exec(string)) {
            config._f = 'YYYY-MM-DDT';
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (parseTokenTimezone.exec(string)) {
                config._f += " Z";
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromArray(config);
        } else {
            config._d = input instanceof Date ? new Date(+input) : new Date(input);
        }
    }


    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day();


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        return Math.ceil(moment(mom).add('d', daysToDayOfWeek).dayOfYear() / 7);
    }


    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || input === '') {
            return null;
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = extend({}, input);
            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang) {
        return makeMoment({
            _i : input,
            _f : format,
            _l : lang,
            _isUTC : false
        });
    };

    // creating with utc
    moment.utc = function (input, format, lang) {
        return makeMoment({
            _useUTC : true,
            _isUTC : true,
            _l : lang,
            _i : input,
            _f : format
        });
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var isDuration = moment.isDuration(input),
            isNumber = (typeof input === 'number'),
            duration = (isDuration ? input._data : (isNumber ? {} : input)),
            matched = aspNetTimeSpanJsonRegex.exec(input),
            sign,
            ret;

        if (isNumber) {
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (matched) {
            sign = (matched[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: ~~matched[2] * sign,
                h: ~~matched[3] * sign,
                m: ~~matched[4] * sign,
                s: ~~matched[5] * sign,
                ms: ~~matched[6] * sign
            };
        }

        ret = new Duration(duration);

        if (isDuration && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var i;

        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(key, values);
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };


    /************************************
        Moment Prototype
    ************************************/


    moment.fn = Moment.prototype = {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d;
        },

        unix : function () {
            return Math.floor(+this._d / 1000);
        },

        toString : function () {
            return this.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._d;
        },

        toJSON : function () {
            return moment(this).utc().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            if (this._isValid == null) {
                if (this._a) {
                    this._isValid = !compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray());
                } else {
                    this._isValid = !isNaN(this._d.getTime());
                }
            }
            return !!this._isValid;
        },

        utc : function () {
            this._isUTC = true;
            return this;
        },

        local : function () {
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = this._isUTC ? moment(input).utc() : moment(input).local(),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            if (units) {
                // standardize on singular form
                units = units.replace(/s$/, '');
            }

            if (units === 'year' || units === 'month') {
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                output += ((this - moment(this).startOf('month')) - (that - moment(that).startOf('month'))) / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that) - zoneDiff;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? diff / 864e5 : // 1000 * 60 * 60 * 24
                    units === 'week' ? diff / 6048e5 : // 1000 * 60 * 60 * 24 * 7
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().startOf('day'), 'days', true),
                format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isDST : function () {
            return (this.zone() < moment([this.year()]).zone() ||
                this.zone() < moment([this.year(), 5]).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().weekdaysParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().monthsParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }
                this._d['set' + utc + 'Month'](input);
                return this;
            } else {
                return this._d['get' + utc + 'Month']();
            }
        },

        startOf: function (units) {
            units = units.replace(/(.)s$/, "$1");
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
            case 'y':
                this.month(0);
                /* falls through */
            case 'month':
            case 'M':
                this.date(1);
                /* falls through */
            case 'week':
            case 'w':
            case 'day':
            case 'd':
                this.hours(0);
                /* falls through */
            case 'hour':
            case 'h':
                this.minutes(0);
                /* falls through */
            case 'minute':
            case 'm':
                this.seconds(0);
                /* falls through */
            case 'second':
            case 's': 
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week' || units === 'w') {
                this.day(0);
            }

            return this;
        },

        endOf: function (units) {
            return this.startOf(units).add(units, 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) === +moment(input).startOf(units);
        },

        zone : function () {
            return this._isUTC ? 0 : this._d.getTimezoneOffset();
        },

        daysInMonth : function () {
            return moment.utc([this.year(), this.month() + 1, 0]).date();
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    };

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    /************************************
        Duration Prototype
    ************************************/


    moment.duration.fn = Duration.prototype = {
        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              ~~(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        get : function (units) {
            return this[units.toLowerCase()]();
        },

        as : function (units) {
            var loweredUnits = units.toLowerCase();
            return this["as" + loweredUnits.charAt(0).toUpperCase() + loweredUnits.slice(1)]();
        },

        lang : moment.fn.lang
    };

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });


    /************************************
        Exposing Moment
    ************************************/


    // CommonJS module is defined
    if (hasModule) {
         //
    }
    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        this['moment'] = moment;
    }
    /*global define:false */
    if (typeof sb_light.define === 'function' && sb_light.define.amd) {
        sb_light.define("sb_light/lib/moment", [], function () {
            return moment;
        });
    }
}).call(this);


 exports.moment = sb_light.require('sb_light/lib/moment');


/*globals define, Ti, console*/
/*jslint passfail: false */


sb_light.define('sb_light/utils/ext',['sb_light/globals'], function(sb) {
	//console.log("ext", sb.version);
	var ext = {};

	ext._unique = 0;
	ext.unique = function ext_unique() {
		return (++ext._unique);
	};


	ext.deprecated = function(oldF, newF, message) {
		console.log("Warning: ", oldF, " is deprecated. Please use ", newF, " instead.");
		if(message) {
			console.log("Warning(2): ", message);
		}
	}

	//helps convert arguments into array
	//a is an array or arguments.
	//idx is the starting index of the slice (e.g., number of items to skip)
	ext.slice = function ext_slice(a, idx, end) {
		idx = isNaN(idx) ? 0 : idx;
		if(isNaN(end)) {
			return Array.prototype.slice.call(a, idx);
		} 
		return Array.prototype.slice.call(a, idx, end);
	};
	
	ext.debug = function ext_debug() {
		if(!sb.debug) { return; }
		var str = ([(new Date()).toTimeString()]).concat(ext.slice(arguments)).join(" ");
		if(ext.ti()) {
			Ti.API.debug(str);
		} else if(typeof console !== "undefined") {
			console.log(str);	
		}
	};
	
	//check is Titanium framework exists. probably shouldn't be needed any longer
	//TODO: investigate removal
	ext.ti = function ext_ti() {
		return typeof Ti !== "undefined";	
	};
	
	ext.map = function ext_map(list, fn, scope) {
		var res = [];
		var i, len;
		if (ext.isArray(list)) {
		    for(i = 0, len = list.length; i < len; ++i) {  
	    	  res.push( fn.call(scope || this, list[i], i, list));  
	    	}  
		} else { //Object
			for (var k in list) {
				//func(value,key,list)
				res.push(fn.call(scope || this, list[k],k, list));
			}
		}
		return res;
	};
	
	ext.each = function ext_each(list, fn, scope) {
		if(ext.isArray(list)) {
			list.forEach(fn,scope);	
		} else {
			for(var el in list) {
				//func(value,key,list)
				fn.call(scope || list, list[el], el, list);
			}	
		}
	};

	//simplifies set & return for reduce functions
	ext.set = function ext_set(obj, key, value) {
		obj[key] = value;
		return obj;
	}
	
	ext.length = function ext_length(list) {
		if(ext.isArray(list)) {
			return list.length;
		} else if(list) {
			return Object.keys(list).length;	
		}
		return 0;
	};
	//takes a list of objects and a key property and converts the array to a hash map
	ext.toObject = function ext_toObject(list, key) {
		return list.reduce(function ext_toObject_reduce(prev, el) {
			prev[el[key]] = el;
			return prev;
		}, {});
	}	
	//takes a hash map / array and returns an array of values. 
	ext.values = function ext_values(map, keyName) {
		return ext.map(map, function ext_values_map(el,k) { 
			return keyName ? el[keyName] : el;
		});
	}

	//alias for Object.keys
	ext.keys = function ext_keys(map) {
		return map ? Object.keys(map) : [];
	}	
	
	//this only works with objects that contain only native JS object (e.g., Object-derived)
	//probably won't work very well for system,proprietary, etc.. objects.
	//converts the entire things to a string, so might have performance issues.
	ext.deepClone = function ext_deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	
		/************  TYPES ***************************/
	ext.valid = function ext_valid(obj, type) {
		switch(type || "object") {
			case "object": return obj !== null && typeof obj !== "undefined"; break;

			case "arr":
			case "array": return ext.isArr(obj); break;

			case "func": 
			case "function": return ext.isFunc(obj); break;

			case "str": 	
			case "string": 	return ext.isStr(obj) && obj !== ""; break;


			case "num": 
			case "number": return ext.isNum(obj) && !isNaN(obj); break;

		}
	}


	ext.isArr = function ext_isArr(obj) {
		return Object.prototype.toString.call(obj) == "[object Array]";
	};
	ext.isArray = ext.isArr;
	
	ext.isFunc = function ext_isFunc(obj) {
		return Object.prototype.toString.call(obj) == "[object Function]";
	};
	ext.isFunction = ext.isFunc;
	
	ext.isStr = function ext_isStr(obj) {
		return Object.prototype.toString.call(obj) == "[object String]";
	};
	ext.isString = ext.isStr;
	
	ext.isBool = function ext_isBool(obj) {
		return Object.prototype.toString.call(obj) == "[object Boolean]";
	}
	ext.isBoolean = ext.isBool;
	
	ext.isNum = function ext_isNum(obj) {
		return Object.prototype.toString.call(obj) == "[object Number]";
	}
	ext.isNumber = ext.isNum;
	
	ext.isDate = function ext_isDate(obj) {
		return Object.prototype.toString.call(obj) == "[object Date]";
	}
	
	
	//helper function that gets executed in the context of the callee.
	ext._getClass= {}.toString;
	
	
		/************  STRINGS  ***************************/
	ext.caps = function ext_caps(s) {
		s = ext.isArray(s) ? s : [s];
		return s.reduce( function ext_caps_reduce(prev,el) {
			if(!el) { return prev; }
			return (prev ? (prev + " ") : "") + el.charAt(0).toUpperCase() + el.slice(1);
		}, null);
	};
	ext.capitalize = ext.caps;
	
	ext.replace = function ext_replace(src, obj) {
		var s = src;
		ext.each(obj, function  ext_replace_each(v,k) {
			var r = new RegExp("%"+k.toUpperCase()+"%")
			s = s.replace(r, v);
		});
		return s;
	
	};
	
		/************  DATES ***************************/
	ext.time = (function() { 
			if(!Date.now) {
				return function ext_time_old() { return new Date().getTime(); }
			} else {
				return function ext_time() { return Date.now(); }
			}
	}());	
	
	ext.parseDate = function ext_moment(d) {
		ext.deprecated("ext.parseDate", "ext.moment");
	}
	ext.moment = function ext_moment(d) { return sb.moment(d);	};
	ext.dateNumber = function ext_dateNumber(d) { return ext.moment(d).valueOf();	};
	ext.date = function ext_date(d) { return ext.moment(d).toDate();	};
	ext.daysDiff = function ext_daysDiff(da, db) {return ext.moment(da).diff(ext.moment(db),"days")};
	ext.today = function ext_today() { return new Date(); };
	ext.minDate = function ext_minDate() { return ext.moment(ext.slice(arguments).sort(ext.sortDate)[0]); };
	ext.maxDate = function ext_maxDate() { return ext.moment(ext.slice(arguments).sort(ext.sortDate).last()); };
	ext.serverFormat = "YYYY/MM/DD";
	ext.userFormat = function ext_userFormat() { 
		var u = sb.state && sb.state.value("user");
		return u ? u.date_format : ext.serverFormat;
	};
	ext.serverDate = function ext_serverDate(d) { return sb.moment(d||new Date()).format(ext.serverFormat); };
	ext.userDate = function ext_userDate(d) { return sb.moment(d||new Date()).format( ext.userFormat()); };
	ext.dateFromNow = function ext_dateFromNow(d, format, reverse) { 
		if(reverse) {
			return "(" + sb.moment(d).fromNow() + ")&nbsp;" + sb.moment(d).format(format || ext.userFormat());
		} else {
			return sb.moment(d).format(format || ext.userFormat()) + "&nbsp;(" + sb.moment(d).fromNow() + ")";
		}
	};
		/************  REGEXPS ***************************/
	ext.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	ext.regUrl = new RegExp("^https?:\/\/");
	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using ext.sortProp("date",ext.sortDate); 
	ext.sortFactory = function ext_sortFactory(prop, func, reverse) {
		return function ext_sortFactory_cb(a,b) {	
			var aprop = a ? a[prop] : null;
			var bprop = b ? b[prop] : null;
			return func(aprop, bprop) * (reverse ? -1 : 1);		
		};
	},
	ext.sortTime = function ext_sortTime(a,b) { return ext.sortNumbers(ext.parseDate(a).getTime(), ext.parseDate(b).getTime()); }; 
	ext.sortNumber = function ext_sortNumber(a,b){ return a-b; };
	ext.sortNumbers = ext.sortNumber;
	ext.sortDate = function ext_sortDate(a,b){ return ext.daysDiff(a,b); }; 
	ext.sortDates = ext.sortDate;
	ext.sortString = function ext_sortString(a,b){ return String(a).localeCompare(String(b)); };
	ext.sortStrings = ext.sortString;
	ext.sortBool = function ext_sortBool(a,b) { return ext.sortNumber(a?1:0, b?1:0); }
	ext.sortBoolean = ext.sortBool;
	 
	ext.sortDateValue = function ext_sortDateValue(a,b) { return ext.sortDate(a.date,b.date); };
	ext.sortUsers = function ext_sortUsers(a,b) {  return ext.sortFunc("last_name", ext.sortString); }
	ext.sortFocus = function ext_sortFocus(a,b) {  return ext.sortFunc("title", ext.sortString); }
	ext.sortName = function ext_sortName(a,b) {  return ext.sortFunc("name", ext.sortString);; }
	ext.sortBlocksByProgress = function ext_sortBlocksByProgress(a,b) {
		//closed blocks 
		var ac = a.closed, bc = b.closed;
		if(ac && !bc) { return 1; }
		if(!ac && bc) { return -1; }
		
		var an=a.ownership_state == "new", bn = b.ownership_state=="new"; 
		if(an && !bn) { return 1; }
		if(!an && bn) { return -1; }
		
		if( (an && bn) || (ac && bc)) { 
			return ext.sortString(a.title,b.title); 
		}

		var aep = a.expected_progress, bep = b.expected_progress;
		//return the one which has started over the one which hasn't.
		if(!aep && bep ) { return 1; }  
		if(aep  && !bep ) { return -1; }
		if(!aep && !bep) { return 0; }
		
		//Now, both have started. Return the variance diff
		return ext.sortNumbers( (a.percent_progress/aep), (b.percent_progress/bep) );
	};
	
		
		/************  CSS ***************************/
	ext.px = function ext_px(number) {		return [number,"px"].join("");	};
	ext.pc = function ext_pc(number) {		return [number,"%"].join("");	};
		
		//************  Math ***************************/
	ext.roundTo = function ext_roundTo(number, dec) {
		var val = Math.pow(10,ext.number(dec,0));
		return Math.round(number * val)/val;
	};
	ext.floorTo = function ext_floorTo(number, dec) {
		var val = Math.pow(10,ext.number(dec,0));
		return Math.floor(number * val)/val;
	};
	ext.ceilTo = function ext_ceilTo(number, dec) {
		var val = Math.pow(10,ext.number(dec,0));
		return Math.ceil(number * val)/val;
	};
	
	ext.to_i = function ext_to_i(str, base, def/*=0*/) {
		var i = parseInt(str, base||10);
		return isNaN(i) ? ext.number(def,0) : i; 
	};
	ext.to_f = function ext_to_f(str, def/*=0*/) {
		var f = parseFloat(str);
		return isNaN(f) ? ext.number(def,0) : f; 
	};
	ext.rand = function ext_rand(min, max, dec/*==0*/) {
		return ext.floorTo( (Math.random() * (max - min + 1)), dec) + min;
	};
	ext.to_color = function ext_to_color(num) {
	    return '#' +  ('00000' + (num | 0).toString(16)).substr(-6);
	};
	
	// The argument [n] can be:
	//		literal numbers (e.g., 24)
	//		a function that returns a number n==foo, where foo() returns 24
	//		an array with a function as the first argument, so n=[foo, "bar", "stuff"] and foo("bar", "stuff") returns 24
	ext.number = function ext_number(n,def/*==0*/) {
		n = ext.isFunc(n) ? n() : n;
		n = ext.isArr(n) && ext.isFunc(n[0]) ? n[0].apply(null, n.slice(1)) : n;
		return isNaN(n) ? (def||0) : n;
	};
	ext.max = function ext_max(/*etc....*/) {
		var args =ext.slice(arguments).map(function ext_max_map(el) {return ext.number(el,Number.NEGATIVE_INFINITY);});
		var max = args.reduce(function  ext_max_reduce(prev,el){
			return prev > el ? prev : el;
		},Number.NEGATIVE_INFINITY);

		return max;
	};
	ext.min = function ext_min(/*etc....*/) {
		var args =ext.slice(arguments).map(function ext_min_map(el) {return ext.number(el,Number.POSITIVE_INFINITY);});
		var min = args.reduce(function ext_min_reduce(prev,el){
			return prev < el ? prev : el;
		},Number.POSITIVE_INFINITY);

		return min;
	};

	//return the first argument that is !NaN
	ext.first = function ext_first(/*etc...*/) {
		var args = ext.slice(arguments);
		for(var i = 0; i < args.length; ++i) {
			if(!isNaN(args[i])) {
				return args[i];
			}
		}
		return NaN;
	}

	ext.range = function ext_range(min,max,num) {
		return ext.max(min, ext.min(max,num));
	};

	//given a list of numbers, returns the one closest to "num"
	ext.snapto = function ext_snapto(list, num) {
		var diff = Math.abs(list[0]-num);
		var n = list[0];
		for(var i =1; i < list.length; ++i) {
			if(Math.abs(list[i] - num) < diff) {
				diff = Math.abs(list[i] - num);
				n = list[i];
			}
		}
		return n;
	};

	//takes an array of literals or functions and sums the result
	ext.sum = function ext_sum() {
		var args =ext.slice(arguments).map(function ext_sum_map(el) {return ext.number(el);});
		var sum = args.reduce(function ext_sum_reduce(prev,el){
			return prev + ext.number(el);
		},0);

		return sum;

	};

	//SUBTRACT: takes an array of literals or functions and subtracts them the first element in the list
	ext.diff = function ext_diff() {
		var base = ext.number(arguments[0]);
		var args  = ext.slice(arguments,1).map(function ext_diff_map(el) {return ext.number(el);});
		var diff = args.reduce(function ext_diff_reduce(prev,el){
			return prev - ext.number(el);
		},base);

		return diff;
	};

	//takes an array of literals or functions and multiplies the result
	ext.prod = function ext_prod() {
		var args =ext.slice(arguments).map(function ext_prod_map(el) {return ext.number(el,1);});
		var prod = args.reduce(function ext_prod_reduce(prev,el){
			return prev * ext.number(el);
		},1);

		return prod;

	};
	//compare two numbers and return true if their difference is less/equals to "within".
	//the purpose of this function is to ameliorate problems with DOM co-ords
	ext.compareInt = function ext_compareInt(a,b,within/*==0*/) {
		within = ext.number(within,0);
		return Math.abs(a-b) <= within;
	};
		
	ext.absDiff = function(a,b) {
		return Math.abs(a-b);
	}

		/************  BLOCK COLOR CONSTANTS***************************/
		//status is -1 (red), 0 (yellow), and 1 (green)
	ext.healthColor = function ext_healthColor(data) { return (["#D80000","#EACF00","#0FAD00"])[data.status+1]; };
	ext.healthText = function ext_healthText(data) { return (["Bad","Warning","Good"])[data.status+1]; };
	ext.blockProgressFill = function ext_blockProgressFill(block) {
		switch(block.progress_color) {
			case "green": 	return ["#176717", 		"url(#progressGood)", 		"url(#progressHatchGood)" 		];
			case "yellow":	return ["#77771B", 		"url(#progressWarning)",	"url(#progressHatchWarning)"	];
			case "red": 	return ["#641717", 		"url(#progressBad)",		"url(#progressHatchBad)" 		];
			default: 		return ["#999", 		"url(#progressNone)",		"url(#progressHatchNone)" 		];
		}
	};
			
		
	/************  MASSAGE SERVER DATA INTO BETTER OBJECTS FOR D3/presentation ***************************/
	ext.getResultMessages = function ext_getResultMessages(r) {
		var res = {
			errors:null,
			warnings: null,
			notices:null
		};
		if (r) {
			//errors that mean something in the form was incorrect, hopefully out of our control (e.g., bad input from user)
			if(ext.isArray(r.result)) {
				r.result.forEach(function ext_getResultMessages_forEach(o) {
					if(o && o.errors) {
						res.errors = {
							form: r.result.errors, 
							message:JSON.stringify(r.result)
						};
					}
				});
			} else if(r.result && r.result.errors) {
				res.errors = {form: r.result.errors, message:JSON.stringify(r.result)};
			}
			//errors on the server that the client / user cannot control 
			if(!res.errors && r.flash && r.flash.error) { 
				res.errors = {message: r.flash.error};
			}
			//errors on the server that likely mean a bug somewhere.
			if (!res.errors && r.errors && r.errors.error) {
				res.errors = {message: r.errors.error };
			}
		}
		res.notices = r.flash ? r.flash.notice : "";
		res.warnings = r.flash ? r.flash.warning : "";
		return res;
	};
	
		
		//merge the target and actuals series into one array of objects. 
	ext.massageTA = function ext_massageTA(data) {
		var dates = [ext.today()];

		data.values = data.values && data.values.length ? data.values : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 
		data.target = data.target && data.target.length ? data.target : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 

		var td = [];
		var vd = [];
		var dataMap = {};
		
		data.values.forEach(function ext_massageTA_forEachVal(el) {
			el.date = ext.date(el.date);
			dates[dates.length] = (el.date);
		});
		data.values.sort(ext.sortDateValue);
		if(ext.daysDiff(data.values[0].date, dates[0]) > 0) {
			data.values.push({date:dates[0], value:data.values[0].value, comment:"(today, interpolated)", interpolated:true});
		} else if (ext.daysDiff(data.values.last().date, dates[0]) < 0) {
			data.values.push({date:dates[0], value:data.values.last().value, comment:"(today,interpolated)", interpolated:true});
		}
		
		data.target.forEach(function ext_massageTA_forEachTar(el) {
			el.date = ext.date(el.date);
			dates[dates.length] = (el.date);
			var rs = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_start : data.tolerance.range_end;
			var re = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_end : data.tolerance.range_start;
			
			el.upper = el.value  + (data.tolerance.percentage ? (el.value *rs/100) : rs);
			el.lower = el.value  + (data.tolerance.percentage ? (el.value *re/100) : re);
		});
		data.target.sort(ext.sortDateValue);
		if(ext.daysDiff(data.target[0], dates[0]) > 0) {
			data.target.push({date:dates[0], value:data.target[0], comment:"(today, interpolated)", interpolated:true});
		} else if (ext.daysDiff(data.target.last(), dates[0]) > 0) {
			data.target.push({date:dates[0], value:data.target.last(), comment:"(today,interpolated)", interpolated:true});
		}
		
		data.dates = dates.sort(ext.sortDate);
		
		return data;
	};

	
	ext.massageKpi = function ext_massageKpi(data) {
		data = ext.massageTA(data);

		var vd = data.values;
		var td = data.target;
		
		var minY = Number.POSITIVE_INFINITY;
		var maxY = Number.NEGATIVE_INFINITY;
		
		
		if(vd.length && td.length) {
			//push a target at the front to line up with values
			if(ext.daysDiff(data.dates[0], td[0].date) < 0) {
				td.unshift( { value:td[0].value, upper:td[0].upper, lower:td[0].lower,
								date:data.dates[0], comment:"(First value, interpolated)" } );
			} 
			//push a target at the end to line up with values
			if(ext.daysDiff(data.dates.last(), td.last().date) > 0) {
				td.push({value:td.last().value, upper:td.last().upper, lower:td.last().lower,
							date:data.dates.last(), comment:"(Last value, interpolated)"});
			}
		}

		//fix the tolerance from the lame form
		data.tolerance.percentage = data.tolerance.percentage || false;
		data.tolerance.inverse = data.tolerance.inverse || false;
		var pc = data.tolerance.percentage; 

		
		var minA = vd[0].value;
		var maxA = vd[0].value;
		ext.each(vd, function(el) {
			minA = ext.min( el.value, minA );
			maxA = ext.max( el.value, maxA );
		});
		var minT = td[0].value;
		var maxT = td[0].value;
		ext.each(td, function(el) {
			minT = ext.min( el.value, minT );
			maxT = ext.max( el.value, maxT );
		});
		
		var upper = ext.max(data.tolerance.range_end, data.tolerance.range_start) / (pc ? 100 : 1);
		var lower = ext.min(data.tolerance.range_end, data.tolerance.range_start) / (pc ? 100 : 1);

		var ml;
		var mu;
		if (!pc) {
			ml = minT + lower;
			mu = maxT + upper;
		} else {
			ml = minT + (lower * minT);
			mu  = maxT + (upper * maxT);
		}
		
		ml = ext.min(ml, minT) - ext.absDiff(minT, ml)*0.02;
		mu = ext.max(mu, maxT) + ext.absDiff(maxT, mu)*0.02;
		

		data.minY = ext.min(minA, minT, ml);
		data.maxY = ext.max(maxA, maxT, mu);
		
		
		var offset = (ext.absDiff(data.maxY, data.minY) * 0.05) || 10;
		data.minY -= offset;
		data.maxY += offset;

		
		return data;		
	}
		
		//fix dates and sort history for health charts
	ext.massageHealth = function ext_massageHealth(data) {
		var dates = [];
		var series = ext.map(data.historical_values, function ext_massageHealth_map(v, k) {
			return {date: ext.date(k), value:v};
		});
		
							//sort by the date number
		data.series = series.sort(ext.sortDateValue);
		
		data.dates = ext.values(data.series, "date");
		data.dates.push(Date.parse(data.end_date));
	
		return data;
	
	};
	
	
	//source gets priority over target
	//all source properties are applied to target.
	//  EXCEPT the ones in ignore.
	//	ignore can be an array of names, or an object with keys. All these key names are skipped from being applied,
	//	but they will not be removed from target if they exist there. 
	ext.mixin = function ext_mixin (/*Object*/ target, /*Object*/ source, /*Object or Array*/ ignore ){
		var empty = ignore || {}; //default template for properties to ignore
		target = target || {};
		source = source || {};
		
		var name, s, i;
		for(name in source){
		    s = source[name];
			var skip =  ext.isArray(empty) ? (empty.indexOf(name) >= 0) : (name in empty);
			if(skip) { continue; }
	        target[name] = s;
		}
		return target; // Object
	};
	 
	// Create a new object, combining the properties of the passed objects with the last arguments having
	// priority over the first ones
	ext.combine = function ext_combine( /*Object or array*/ props, /*object or array*/ ignore) {
		props = ext.isArray(props) ? props.concat(ext.slice(arguments,1)) : ext.slice(arguments);
		var res = props.reduce(function ext_combine_reduce(newObj, v) {
			var mixed = ext.mixin(newObj, v, ignore);
			return mixed;
		},{});
		return res;
	};		
	//same as combine but only takes two properties.
	ext.merge = function ext_merge(a, b, ignore) {
		return ext.combine([a,b], ignore);	
	}

	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {  
	  Array.prototype.forEach = function ext_array_forEach(fn, scope) {  
	    for(var i = 0, len = this.length; i < len; ++i) {  
	      fn.call(scope || this, this[i], i, this);  
	    }  
	  }  
	}  
	
	
	if (!Function.prototype.bind) {
	  Function.prototype.bind = function ext_array_bind(oThis) {
	    if (typeof this !== "function") {
	      // closest thing possible to the ECMAScript 5 internal IsCallable function
	      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	    }
	
	    var aArgs = ext.slice(arguments, 1), 
	        fToBind = this, 
	        fNOP = function () {},
	        fBound = function () {
	          return fToBind.apply(this instanceof fNOP
	                                 ? this
	                                 : oThis,
	                               aArgs.concat(ext.slice(arguments)));
	        };
	
	    fNOP.prototype = this.prototype;
	    fBound.prototype = new fNOP();
	
	    return fBound;
	  };
	}
	
	//similar to Func.bind, but executes the function automatically after a delay.
	if(!Function.prototype.bindDelay) {
		Function.prototype.bindDelay = function ext_array_bindDelay(context, timeout /*, ...prefixArgs*/) {
			var args = ext.slice(arguments);
			args.splice(1,1); // remove timeout
			var f = this.bind.apply(this,args);
			return setTimeout(f, timeout);
		};
	}
	
	
	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {  
	  Array.prototype.forEach = function ext_array_forEach(fn, scope) {  
	    for(var i = 0, len = this.length; i < len; ++i) {  
	      fn.call(scope || this, this[i], i, this);  
	    }  
	  }  
	}  
	
	//shallow clone. 
	if ( !Array.prototype.clone ) {  
	  Array.prototype.clone = function ext_array_clone() {  
		return ([]).concat(this);
	  }  
	}  
	

	
	
	
	
	//returns the last element in the array
	// or the index from the end as specified
	// e.g., foo.last(0) is the same as foo.last()
	// and foo.last(1) returns the 2nd last item.
	if ( !Array.prototype.last ) {  
	  Array.prototype.last = function ext_array_last(idx) {
	  	idx = (this.length-1) - (idx || 0);
		return (this.length > idx && idx >= 0) ? this[idx] : null;
	  }  
	}  
	
	
	
	
	//From MOzilla:
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
	// Syntax
	// 	array.reduce(callback[, initialValue])
	// Parameters
	// 	callback
	// 		Function to execute on each value in the array, taking four arguments:
	// 		previousValue
	// 			The value previously returned in the last invocation of the callback, or initialValue, if supplied. (See below.)
	// 		currentValue
	// 			The current element being processed in the array.
	// 		index
	// 			The index of the current element being processed in the array.
	// 		array
	// 			The array reduce was called upon.
	// 	initialValue
	// 		Object to use as the first argument to the first call of the callback.
	if (!Array.prototype.reduce) {
		Array.prototype.reduce = function reduce(accumulator){
			if (this===null || this===undefined) {
				throw new TypeError("Object is null or undefined");
			}
			var i = 0, l = this.length >> 0, curr;
	
			if(typeof accumulator !== "function") {// ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
				throw new TypeError("First argument is not callable");
			}
	
			if(arguments.length < 2) {
				if (l === 0) {
					throw new TypeError("Array length is 0 and no second argument");
				}
				curr = this[0];
				i = 1; // start accumulating at the second element
			} else {
				curr = arguments[1];
			}
			while (i < l) {
				if(i in this) {
					curr = accumulator.call(undefined, curr, this[i], i, this);
				}
				++i;
			}
			return curr;
		};
	}
	
	//from mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
	if (!Array.prototype.filter) {
		Array.prototype.filter = function ext_array_filter(fun /*, thisp */) {
			
			if (this == null) {
				throw new TypeError();
			}
			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function") {
				throw new TypeError();
			}
	
			var res = [];
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in t) {
					var val = t[i]; // in case fun mutates this
					if (fun.call(thisp, val, i, t)) {
						res.push(val);
					}
				}
			}
			return res;
		};
	}
	
	//From MOzilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
	// Syntax
	// 	Object.keys(obj)
	// Parameters
	// 	obj
	// 	The object whose enumerable own properties are to be returned.
	
	if (!Object.keys) {
	  Object.keys = (function ext_object_keys() {
	    var hasOwnProperty = Object.prototype.hasOwnProperty,
	        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
	        dontEnums = [
	          'toString',
	          'toLocaleString',
	          'valueOf',
	          'hasOwnProperty',
	          'isPrototypeOf',
	          'propertyIsEnumerable',
	          'constructor'
	        ],
	        dontEnumsLength = dontEnums.length
	
	    return function (obj) {
	      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object')
	
	      var result = []
	
	      for (var prop in obj) {
	        if (hasOwnProperty.call(obj, prop)) result.push(prop)
	      }
	
	      if (hasDontEnumBug) {
	        for (var i=0; i < dontEnumsLength; i++) {
	          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i])
	        }
	      }
	      return result
	    }
	  })()
	};
	
	
	if (!Array.prototype.find) {  
	    Array.prototype.find = function ext_array_find(key, value) {  
			for(var i = 0; i < this.length; ++i) {
				if(this[i][key] == value) { return {index:i, value:this[i]} ; }
			}
			return {index:NaN, value:null};
		}
	}
	
	
	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
	if (!Array.prototype.indexOf) {  
	    Array.prototype.indexOf = function ext_array_indexOf(searchElement /*, fromIndex */ ) {  
	          
	        if (this == null) {  
	            throw new TypeError();  
	        }  
	        var t = Object(this);  
	        var len = t.length >>> 0;  
	        if (len === 0) {  
	            return -1;  
	        }  
	        var n = 0;  
	        if (arguments.length > 0) {  
	            n = Number(arguments[1]);  
	            if (n != n) { // shortcut for verifying if it's NaN  
	                n = 0;  
	            } else if (n != 0 && n != Infinity && n != -Infinity) {  
	                n = (n > 0 || -1) * Math.floor(Math.abs(n));  
	            }  
	        }  
	        if (n >= len) {  
	            return -1;  
	        }  
	        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
	        for (; k < len; k++) {  
	            if (k in t && t[k] === searchElement) {  
	                return k;  
	            }  
	        }  
	        return -1;  
	    }  
	}  
	
	
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
	// Production steps of ECMA-262, Edition 5, 15.4.4.19  
	// Reference: http://es5.github.com/#x15.4.4.19  
	if (!Array.prototype.map) {  
	  Array.prototype.map = function ext_array_map(callback, thisArg) {  
	  
	    var T, A, k;  
	  
	    if (this == null) {  
	      throw new TypeError(" this is null or not defined");  
	    }  
	  
	    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
	    var O = Object(this);  
	  
	    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
	    // 3. Let len be ToUint32(lenValue).  
	    var len = O.length >>> 0;  
	  
	    // 4. If IsCallable(callback) is false, throw a TypeError exception.  
	    // See: http://es5.github.com/#x9.11  
	    if ({}.toString.call(callback) != "[object Function]") {  
	      throw new TypeError(callback + " is not a function");  
	    }  
	  
	    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
	    if (thisArg) {  
	      T = thisArg;  
	    }  
	  
	    // 6. Let A be a new array created as if by the expression new Array(len) where Array is  
	    // the standard built-in constructor with that name and len is the value of len.  
	    A = new Array(len);  
	  
	    // 7. Let k be 0  
	    k = 0;  
	  
	    // 8. Repeat, while k < len  
	    while(k < len) {  
	  
	      var kValue, mappedValue;  
	  
	      // a. Let Pk be ToString(k).  
	      //   This is implicit for LHS operands of the in operator  
	      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
	      //   This step can be combined with c  
	      // c. If kPresent is true, then  
	      if (k in O) {  
	  
	        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
	        kValue = O[ k ];  
	  
	        // ii. Let mappedValue be the result of calling the Call internal method of callback  
	        // with T as the this value and argument list containing kValue, k, and O.  
	        mappedValue = callback.call(T, kValue, k, O);  
	  
	        // iii. Call the DefineOwnProperty internal method of A with arguments  
	        // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},  
	        // and false.  
	  
	        // In browsers that support Object.defineProperty, use the following:  
	        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });  
	  
	        // For best browser support, use the following:  
	        A[ k ] = mappedValue;  
	      }  
	      // d. Increase k by 1.  
	      k++;  
	    }  
	  
	    // 9. return A  
	    return A;  
	  };        
	}  
	

	if (!Array.prototype.every)	{
		Array.prototype.every = function(fun /*, thisp */)	{
			

			if (this == null) {
				throw new TypeError();
			}

			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function") {
				throw new TypeError();
			}

			var thisp = arguments[1];
			for (var i = 0; i < len; i++)	{
				if (i in t && !fun.call(thisp, t[i], i, t)) {
					return false;
				}
			}
			return true;
		};
	}
	
	if (!Array.prototype.some)	{
		Array.prototype.some = function(fun /*, thisp */)  {
			

			if (this == null){
				throw new TypeError();
			}
				
			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function"){
				throw new TypeError();
			}

			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in t && fun.call(thisp, t[i], i, t)) {
					return true;
				}
			}

			return false;
		};
	}


	//made this up. does a push but always returns "this" array
	if (!Array.prototype.put) {  
		Array.prototype.put = function ext_array_put() {
			var args = ext.slice(arguments);
			while(args.length) {
				this[this.length] = args.shift();
			}
			return this; 
		};
	}
	
	//made this up. does a push but always returns "this" array
	//ensures the push is unique
	if (!Array.prototype.punique) {  
		Array.prototype.punique = function ext_array_punique() {
			var args = ext.slice(arguments);
			while(args.length) {
				var a = args.shift();
				if(this.indexOf(a) < 0) {
					this[this.length] = a;
				}
			}
			return this; 
		};
	}
	
	if (!Array.prototype.cloneExcept) { 
		Array.prototype.cloneExcept = function ext_array_cloneExcept(/*items*/) {
			var items = ext.slice(arguments);
			return this.reduce(function ext_array_cloneExcept_reduce(a,el) {
				return items.indexOf(el) < 0 ? a.put(el) : a;
			}, []);
		}
	}
	
	
	
	//DATE stuff from 
	//http://stackoverflow.com/questions/1643320/get-month-name-from-date-using-javascript
	Date.prototype.getMonthName = function  ext_date_getMonthName(lang) {
	    lang = lang && (lang in Date.locale) ? lang : 'en';
	    return Date.locale[lang].month_names[this.getMonth()];
	};
	
	Date.prototype.getMonthNameShort = function ext_date_getMonthNameShort(lang) {
	    lang = lang && (lang in Date.locale) ? lang : 'en';
	    return Date.locale[lang].month_names_short[this.getMonth()];
	};
	
	Date.locale = {
	    en: {
	       month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	       month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	    }
	};


	return ext;
	
});


 exports.ext = sb_light.require('sb_light/utils/ext');


//Subscription manager
//Created to help with D3 exit().remove(). 
//We need D3 element creation functions to be able to subscribe to SBLight events, but that
//means we need to unsubscribe when the remove() function is called. 
//sblight.svg now has subscribe() / cleanup() functions extended into d3 
//cleanup() will automatically call the subman.unsubscribe to remove the subscriptions.
//As long as the initial su

sb_light.define('sb_light/utils/subman',['sb_light/globals'], function(sb) {
	var subs = {};

	var _subsCache = [];

	subs.subscribe = function(element, who, what, where) {
		var match = _subsCache.find("element", element);
		if(!match.value) {
			_subsCache.push({element:element, subs:[]});
		}
		var elSubs = match.value || _subsCache.last();
		var found = elSubs.subs.some(function(sub) {
			return sub.who == who && sub.what == what;
		});

		if(!found) {
			//sb.ext.debug("Subscribe", element, who, what)
			try {
			elSubs.subs.push({
				who:who,
				what:what,
				key: who.subscribe(what, where)
			})
			} catch(e) {
				sb.ext.debug("Capture error", e);
			}
			//sb.ext.debug("Done Subscribe");

		}
	};

	subs.unsubscribe = function(element) {
		var elSubs = _subsCache.find("element", element).value;
		if(elSubs) {
			elSubs.subs.forEach(function(sub) {
				//sb.ext.debug("Unsubscribe", element, sub.who, sub.what)
				sub.who.unsubscribe(sub.what, sub.key);
			});
		}
	};


	return subs;
});



 exports.subman = sb_light.require('sb_light/utils/subman');



sb_light.define('sb_light/utils/svg',['sb_light/globals'], function(sb) {

	var svg =  {};

	var _d3 = typeof d3 !== "undefined" && d3 || {"__missing" : true};

	svg.ZERO = 1e-6;


	svg.initD3 = function(d3) {		
		var c = _d3.__cached || {};
		_d3 = d3;	
		//add the d3 extensions that were cached. 
		sb.ext.each(c, function(v,k) {
			svg.extendD3(k,v);
		})
	}

	svg.extendD3 = function(name, func) {
		//protection for the compiled files. d3 is not necessarily required for this library to work. 
		if(_d3.__missing) { 
			//save the extensions in case D3 gets set  later. 
			_d3.__cached = _d3.__cached || {};
			_d3.__cached[name] = func;
			return; 
		}
		//prototypes to extend
		_d3.selection.prototype[name] = 
		_d3.transition.prototype[name] = 
		_d3.selection.enter.prototype[name] = 
		//the function
		func;
	}

	svg.extendD3("isD3", function(el) {
		return true;
	})


	//extensions to d3
	//adds x,y,width,height to "rect" type SVG elements
	//skips any property that === null
	svg.extendD3("rect", function(x,y,width,height) {
		var sel = this;
		var args= sb.ext.slice(arguments);
		if(args.length) {
			["x","y","width","height"].forEach(function(dim,i){
				if(args[i] !== null) {
					sel.dim(dim, args[i]);
				}
			});
			return sel;
		}

		return ["x","y","width","height"].reduce(function(prev, el) {
			return sb.ext.set(prev, el, sel.dim(el));
		}, {});
	});

	//takes an object taking the subscribe call(who),
		//a string describing what to subscribe to (what), and
		//a cb function to handle the subscription (where)
	svg.extendD3("subscribe", function(who,what,where) {
		var sel = this;
		sel.each(function(d,i) {
			sb.subman.subscribe(this, who,what, where);
		});
		return sel;
	})

	svg.extendD3("cleanup", function() {
		var sel = this;
		sel.each(function(d,i) {
			sb.subman.unsubscribe(this);
		})
		sel.remove();
		return sel;
	});
 	
	//basically gets/sets any numeric attribute (dimension).
	// on set:
	//		if the element isn't SVG and the value is not a function, add "px" to it
	// on get:
	//		parse a  float from the string.
	svg.extendD3("dim", function(name, value) {
		if(arguments.length > 1) {
			if( svg.isSvg(this.node()) )  {
				this.attr(name, value);
			} else {
				if(name == "x") { name = "left"; }
				if(name == "y") { name = "top"; }
				this.style(name, (sb.ext.isFunc(value) || sb.ext.isString(value)) ? value : sb.ext.px(value));
			}
			this.attr(name, svg.isSvg(this.node() || sb.ext.isFunc(value)) ? value : sb.ext.px(value)) 

			return this;
		} 
		return sb.ext.to_f( svg.isSvg(this.node()) ? this.attr(name) : this.style(name) );
	});

	//get/set the corners on a rect, for instance. (rx/ry)
	svg.extendD3("corners", function(rx,ry) {
		if(arguments.length) {
			this.dim("rx", rx);
			this.dim("ry", ry);
			return this;
		}
		return {rx:this.dim("rx"), ry:this.dim("ry")};
	});
	//set multiple classes on an svg item directly. 
	svg.extendD3("class", function(classA/*...*/) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			this.attr("class", args.join(" "));
			return this;
		}
		return this.attr("class");
	});


	//set the title on elements
	svg.extendD3("title", function(s) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			return this.attr("title", s);
		}
		return this.attr("title");
	});

	//set the rx/ry on elements. When "get" is done, returns only "rx" for the first selection item
	svg.extendD3("radius", function(r) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			return this.attr("rx", r).attr("ry", r);
		}
		return this.attr("rx");
	});

	//set the text anchor
	svg._anchorMap = {
		"left":"start", "start":"start", "l":"start", "s":"start",
		"center":"middle", "middle":"middle", "c":"middle", "m":"middle",
		"right":"end", "end":"end", "r":"end", "e":"end"
	}	

	//d3 uses this property as a "style" rather than an attribute in their SVG helpers.
	//keep this consistent. 
	svg.extendD3("align", function(a) {
		var args = sb.ext.slice(arguments);
		if(args.length) {
			return this.style("text-anchor", svg._anchorMap[a]);
		}
		return this.style("text-anchor");
	});


	//get/sets the size and position of a circle
	svg.extendD3("circle", function(r, cx,cy) {
		if(arguments.length) {
			this.dim("r", r);
			this.dim("cx", cx);
			this.dim("cy", cy);
			return this;
		}
		return {r:this.dim("r"), cx:this.dim("cx"), cy:this.dim("cy")};
	});
	//get/sets the points on a line
	svg.extendD3("line", function(x1,y1,x2,y2) {
		if(arguments.length) {
			this.dim("x1", x1);
			this.dim("x2", x2);
			this.dim("y1", y1);
			this.dim("y2", y2);
			return this;
		}
		return {x1:this.dim("x1"), y1:this.dim("y1"),x2:this.dim("x2"), y2:this.dim("y2")};
	});

	svg.d3 = function(el) {
		// console.log("Checking el", el);
		var isD3 = el && el["isD3"] && el.isD3();

		return isD3 ? el : d3.select(el);
	}

	svg.isSvg = function(el) {
		return el && typeof el.ownerSVGElement != "undefined"; 
	}

	svg.multiline = function(el, text, dx,dy) {
		if(!text) { return ; }
		el = svg.d3(el);
		var width= el.attr("width");
		//var domEl = el.get(0);
		var words = text.split(' ');                        
		var tspan = el.append("tspan");
		tspan.text(words[0]);

		for(var i=1; i<words.length; i++){
			var tst = tspan.text();             // Find number of letters in string
			var len = tst.length;
			tspan.text(tst + " " + words[i]);

			if (tspan.node().getComputedTextLength() > width)	{
				tspan.text(tst);

				tspan = el.append("tspan").attr("x",  sb.ext.number(dx,10))
											.attr("dy", sb.ext.number(dy,18))
											.text(words[i])
				;
			}
		}
		return el;
	};	
	
	//given a series of x points and y points, generate a
	//grid that fits the given dimension
	//returns an SVG path string
	svg.gridPath = function(x,y,w,h, xLinesOrStep, yLinesOrStep) {
		var p = [];
		var t= this;
		var xlines = (typeof xLinesOrStep == "number") ? d3.range(x+xLinesOrStep,x+w,xLinesOrStep) : xLinesOrStep;
		yLinesOrStep = yLinesOrStep || xLinesOrStep;
		var ylines = (typeof yLinesOrStep == "number") ? d3.range(y+yLinesOrStep,y+h,yLinesOrStep) : yLinesOrStep;
		
		xlines.forEach(function(el) {	p.put(t.M(el,y),t.v(h));	});
		ylines.forEach(function(el) {	p.put(t.M(x, el),t.h(w));	});
		return p.join("");
	};
		
		
		//Generate a path definition for a simple popup
		//pointerType supports 12 types (string): (Default is "TM")
		// TL, TM, TR: Top positions (left  middle  right)
		// LT, LM, LB: Left positions (top middle bottom)
		// BL, BM, BR: Bottom positions (left  middle  right)
		// RT, RM, RB: Right positions (top middle bottom)
		
	svg.popupPath = function(x,y, w,h, pointerType) {
		var cr = 10;
		var cr2 = cr*2;
		var pw = 15; //half pointer width
		var pw2 = pw*2;
		var ph = 15; //full pointer height
		var t = this;
		
		pointerType = pointerType || "TM";
		var path = [];
		if(pointerType.charAt(0) == "T") {
			path.put(t.M(x+cr,y));
			switch(pointerType.charAt(1)) {
				case "L": path.put(t.l(pw,-ph),t.l(pw,ph), t.h(w-pw2-cr2));
					break;
				case "M": path.put(t.h( (w-cr2-pw2)/2), t.l(pw,-ph),t.l(pw,ph), t.h((w-cr2-pw2)/2 ));
					break;
				case "R": path.put(t.h(w-pw2-cr2), t.l(pw,-ph),t.l(pw,ph));
					break;
			}
			
			path.put(	t.q(cr,0,cr,cr),		t.v(h-cr2));
			path.put(	t.q(0,cr,-cr, cr),		t.h(cr2-w));
			path.put(	t.q(-cr,0,-cr,-cr),		t.v(cr2-h));
			path.put(	t.q(0,-cr,cr,-cr));
		} else if(pointerType.charAt(0) == "R") {
			
		} else if(pointerType.charAt(0) == "B") {
		} else if(pointerType.charAt(0) == "L") {
		}
		
		return path.join("");
	};
		
	svg.transform = function(o) { 
		var t = [];
		
		if(o.r) { t.put(this.rotate.apply(this,o.r)); }
		if(o.s) { t.put(this.scale.apply(this,o.s)); }
		if(o.t) { t.put(this.translate.apply(this, o.t)); }
		// console.log("transform", t.join(" "));
		return t.join(" "); 
	};
	var sep = ",";
	svg.translate = 	function(x,y) { return (isNaN(y) ? ["translate(",x,")"] : ["translate(",x,", ",y,")"]).join("");  };
	svg.scale =  		function(x,y) { return (isNaN(y) ? ["scale(",x,")"] : ["scale(",x,", ",y,")"]).join(""); };
	svg.rotate =	 	function(x) { return "rotate("+x+")"; };
	svg.viewBox = 		function(x,y,w,h) { return [x,y,w,h].join(" "); };
	svg.l =				function(x,y) { return ["l",x,sep,y].join(""); };
	svg.L = 			function(x,y) { return ["L",x,sep,y].join(""); };
	svg.m =				function(x,y) { return ["m",x,sep,y].join(""); };
	svg.M =				function(x,y) { return ["M",x,sep,y].join(""); };
	svg.h = 			function(d) { return ["h",d].join(""); };
	svg.H =				function(d) { return ["H",d].join(""); };
	svg.v =				function(d) { return ["v",d].join(""); };
	svg.V = 			function(d) { return ["V",d].join(""); };
	svg.q = 			function(cx,cy,x,y) { var s= sep; return ["q",cx,s,cy,s,x,s,y].join(""); };
	svg.Q =				function(cx,cy,x,y) { var s= sep; return ["Q",cx,s,cy,s,x,s,y].join(""); };
		
	svg.path = function() {
		return sb.ext.slice(arguments).join("");
	}	

		//utils for d3
		
		//takes "x.foo y.bar.stuff" and appends the nodes, returning the last node created (y) so we get
		//  src > x[class=foo] > y[class=bar stuff]
		// "src" needs to be a d3 object
		// "selector" needs to be a string
		// "func" takes the element to be returned and applies custom creation logic to it. 
	svg.append =  function(src, selector, func) {
		// console.log("svg append pre d3");
		src = svg.d3(src);
		var res = src.select(selector);

		// console.log("svg append");

		if(res.empty()) {
			res = src;
			var nodes = selector.split(" ");
			// console.log("svg append", nodes.length, nodes.forEach);
			nodes.forEach(function(el) {
				// console.log("here!");
				//protect from extra spaces (or invalid elements)
				if(el && el.length > 0 ) {
					if( res.select(el).empty()) {
						var parts = el.split(".");
						res =res.append(parts.shift()).attr("class", parts.join(" "));
					} else {
						res = res.select(el);
					}
				}
			});
			//only execute when this is being created
			if(func) {
				func(res);
			}
		}
		return res;
	};
		
		//takes "x.foo y.bar.stuff" and removes only y.var.stuff
	svg.remove = function(src, selector) {
		src = svg.d3(el);
		var el = src.select(selector);
		if(!el.empty()) {
			el.remove();
		}
	};
		


		//selection comes last so you can bind the function with args first, then use it in the d3 selection "call"
		//e.g., svg.selectAll("rect").call(sb.svg.dims.bind(null, 0,0,100,100));
	svg.dims = function(x,y,w,h, selection) {
		selection.attr("x", x).attr("y", y).attr("width", w).attr("height", h);
		return selection;
	};

	svg.dim = function(sel, dim, value) {
		if(arguments.length == 3) {
			return sel.attr(dim, value);
		}
		return sb.ext.to_f(sel.attr(dim));
	};


	//quick style
	svg.style = function(selection/*, arguments*/) {
		for(var i = 1; i < arguments.length; i+=2) {
			var prop = arguments[i];
			prop = styleMap[prop] || prop;
			selection.style(prop, arguments[i+1]);
		}
		return selection;
	};

	var styleMap = {
		t: "font",
		f:"fill",
		fo:"fill-opacity",
		s: "stroke",
		so:"stroke-opacity",
		sw:"stroke-width",
		slc: "stroke-linecap",
		slj: "stroke-linejoin",
		sda:"stroke-dasharray",
		ta:"text-anchor"
	};

	return svg;
	
});

 exports.svg = sb_light.require('sb_light/utils/svg');


sb_light.define('sb_light/utils/queue',['sb_light/globals'], function(sb) {

	var queue = {};
	var low_list = [];
	var high_list = [];
	var interval = 0;

	var start = function() {
		queue.next();
		start = function() {}; //remove the function
	}

	queue.interval = function(value) {
		if(arguments.length) {
			interval = value;
		}
		return interval;
	}



	//add a function with an optional unique name. 
	//if the queue already contains an item with the same name, it's ignored. 
	//delay will make sure the function isn't executed before the time has passed, but could take much longer...
	queue.add = function queue_add(func, name, delay) {
		delay = sb.ext.number(delay, 0)
		name = name || "queued_" + sb.ext.unique();
		var val = low_list.find("name", name).value;
		if(!val) {
			//sb.ext.debug("QUEUE: Adding: ", name);
			low_list.push({name:name, func:func, time:sb.ext.time(), delay:delay});
			start();
		}
	};
	queue.high = function queue_high(func,name, delay) {
		delay = sb.ext.number(delay,0);
		name = name || "queued_" + sb.ext.unique();
		var val = high_list.find("name", name).value;
		if(!val) {
			//sb.ext.debug("QUEUE: Adding HIGH: ", name);
			high_list.push({name:name, func:func,  time:sb.ext.time(), delay:delay});
			start();
		}
	};

	queue.next = function queue_next() {
		if(!_next(high_list)) { 
			_next(low_list);
		}
		queue.next.bindDelay(queue, interval);
	};

	var _next = function queue_next_internal(list) {
		var t = sb.ext.time();
		var len = list.length;
		var i = 0;
		var called = false;
		var wait = [];
		while(i < len && !called) {
			var n = list.shift();
			if(t - n.time > n.delay) {
				n.func();
				called = true;
			} else {
				wait.push(n);
			}
			i = i + 1;
		}
		//waiting items are inserted at the front
		list.unshift.apply(list, wait);
		return called;
	};

	queue.report = function queue_report() {
		var hi = high_list.map(function(el) {return el.name;}).join(" ");
		var lo = low_list.map(function(el) {return el.name;}).join(" ");

		//console.log("Current Queue:", (high_list.length ? (" High: " + hi) : "" ),   (low_list.length ? (" Normal: " + lo) : "" ) );
	};

	return queue;

});

 exports.queue = sb_light.require('sb_light/utils/queue');



sb_light.define('sb_light/utils/events',['sb_light/globals'], function(sb) {

	var events = {};

	events.stop = function(e) {
		if(e && e.stopImmediatePropagation) {
			e.stopImmediatePropagation();
		}
		if(e && e.preventDefault) {
			e.preventDefault();
		}
	}

	return events;
	
});			

 exports.events = sb_light.require('sb_light/utils/events');


/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
sb_light.define('sb_light/utils/Class',[],function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    return Class;
  };
	return (Class);
});



 exports.Class = sb_light.require('sb_light/utils/Class');




sb_light.define('widgets/widget',['sb_light/utils/Class'], function( Class ) {

	var Widget = Class.extend({
		//called by "new Widget()"
		_sb:null,
		_dom:null,
		_def:null,
		_domFuncs:null,
		_sizeFuncs:null,
		_sizeDefs:null,
		_parent: null,
		_name:null,
		_events:null,
		_binds:null,
		_props:null,


		//do not override
		init:function(sb, parent, def) {
			this._sb = sb;
			this._props = this._buildPropsList();

			//storage place for bound functions. Storing bound functions here allows us to unsubscribe
			//from DOM event handlers, since the "bind" method returns a different function each time. 
			this._binds = {};

			this._sizeFuncs = {};
			this._sizeDefs = {};
			this._parent = parent;
			this._def = def;

			this._domFuncs = this._propertyOverrides();

			try {
				this.create();
				this.postCreate();
			}catch(e) {
				console.log( "Failed to create widget " + def.id + " " + JSON.stringify(e.message? (e.message + "\n" + e.source) : e)); 
				throw new Error("Failed to create widget " + def.id + " " + JSON.stringify(e.message? (e.message + "\n" + e.source) : e)); 
			}
			


			//this._provideEvents(); // not necessary if it doesn't provide anything... just for example
		},

		bind: function(name) {
			if(!this._binds[name]) {
				if(!this[name]) {
					throw new Error("SB_Light Widget (" + name + ") is not a function of : " + this.id());
				}
				this._binds[name] = this[name].bind(this);
			}
			return this._binds[name];
		},

		_buildPropsList: function() {
			var a = [];
			for(var i in this) { a.push(i); }
			return a.join(",");
		},

		//hasOwnProperty doesn't follow the prototype chain properly. This fixes it.
		has: function(name) {
			var re = new RegExp("(^|,)_?"+name+"(,|$)");
			return this._props.match(re);
		},

		create:function() {
			this._dom = this.createDom(this._def);
			this.parentDom().appendChild(this._dom);
		},

		postCreate:function() {
			//this._sb.ext.debug("Widget", this.id(), "postCreate / apply properties");
			this.applyProperties();
		},

		dom:function() {	return this._dom;	},
		id:function() {		return this._def.id || this._dom.id;},
		name:function() {	return this._name || this._def.widget;		},

		parentId:function() {
			return this._parent ? (this._sb.ext.isFunc(this._parent.id) ? this._parent.id() : this._parent.id ) : null;
		},
		parentDom:function() {
			return this._parent ? (this._sb.ext.isFunc(this._parent.dom) ? this._parent.dom() : this._parent ) : null;
		},

		cid:function(name) {
			return [this.id(), name].join("_");
		},

		_dims: {"b":"bottom", "l":"left", "r":"right", "t":"top", "h":"height","w":"width", "f":"fringe"},
		_dimReg: /left|right|top|bottom|height|width|fringe/,

		cidDim:function(name, dim, amt) {
			var _dim = String(this._dims[dim] || dim || "");
			var _base = ["@",this.cid(name)];
			var _dim = _dim.match(this._dimReg) ? _dim : null;
			var _amt = arguments.length == 2 && !_dim ? dim : (amt||0);
			if(_dim) {
				_base.put("#", _dim);
			}
			_base.put("#", _amt);
			return _base.join("");
		},

		_noop: function() {},
		_propertyOverrides: function() {
			return {
				"default": this.bind("property"),
				"subscribe": this.bind("subscribe"),
				"css": this.bind("cssText"),
				"style": this.bind("cssText"),
				"widget": this._noop,
				"widget-name": this.bind("dataProperty"),
				"class":this.bind("className"),
				"children":this._noop,
				"text": this.bind("text"),
				"left": this._noop,
				"right": this._noop,
				"top": this._noop,
				"bottom": this._noop,
				"x": this._noop,
				"y": this._noop,
				"height": this._noop,
				"width": this._noop,
				"fringe": this._noop
			};
		},

		appendChild: function(c) {
			if(this._dom && c) {
				this._dom.appendChild(c);
			}
		},
		createDom:function(opts) {
			if(!opts.widget) { throw new Error("The \'widget\' option must be specified, and be the name of a valid HTML element."); }
			return document.createElement(opts.widget);
		},

		applyProperties: function() {
			// this._sb.ext.debug("Apply Properties to ", this.id());

			this._def["class"]  = (this._def["class"] || "") + " sb_light_widget";
			this._def["widget-name"]  = this.name();


			for(var k in this._def) {
				var f = this._domFuncs[k] || this._domFuncs["default"];
				f(k, this._def[k]);
			}
			//this._domFuncs("className",  "sb_light_widget");
			//this._domFuncs("widget-name", this.name());
		},

		//widget property, not dom property
		prop:function(name,value) {
			//convert the name to "_name" if necessary
			var innerName;

			innerName = this.has("_"+name) ? ("_"+name) : name;
			if(!this.has(innerName)) {
				throw new Error("SB_Light Widget (" + name + ") is not a property of : " + this._name);
			}
			if(arguments.length > 1) {
				this[innerName] = value;
				return this;
			}
			return this[innerName];
		},

		source: function(name, value) {
			if(arguments.length > 1) {
				this._def[name] = value;
				return this;
			}
			return typeof this._def[name] === "undefined" ? null : this._def[name];
		},

		//optional "class" string based on who calls it. does nothing,gets ignored. 
		//name is the class name to apply
		//remove is a boolean, which removes the class if true. 
		className: function(/*class(?), name, remove*/) {
			var args = this._sb.ext.slice(arguments, arguments[0]=="class" ? 1 : 0);
			if(args.length) {
				var dom = this.dom();
				args[0].split(" ").forEach(function(el){
					if(el === "") { return; }
					var cn = dom.className.replace(el, " ");
					dom.className = cn + (args[1] ? "": (" " + el));
				});
				return this;
			}
			return this.dom().className;
		},
		property: function(name, value /*==null*/) {
			if(arguments.length > 1) {
				this._dom.setAttribute(name, value);
				return this;
			}
			return this._dom.getAttribute(name);
		},

		subscribe:function() {
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
			var obj = args[0];
			for(var eventName in obj) {
				var def = obj[eventName];
				if(!this._events[eventName]) {
					throw new Error("SB_Light Widget (" + this._name + ") does not provide the event: " + eventName);
				}
				this._events[eventName] = this._events[eventName] || {};
				this._events[eventName][def.id] = def.func;
			}
		},
		unsubscribe: function(eventName, funcId) {
			if(this._events && this._events[eventName]) {
				delete this._events[eventName][funcId];
			}
		},
		trigger:function(eventName, context ) {
			var args=  this._sb.ext.slice(arguments, 2);
			if(this._events && this._events[eventName]) {
				for(var en in this._events[eventName]) {
					this._sb.queue.add(this._events[eventName][en]);
				}
			}
		},

		dataProperty: function(name, value /*==null*/) {
			this.property.call(this, "data-"+name, value);
		},

		cssText: function() {
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length) {
				this._dom.style.cssText = args[0];
				return this;
			}
			return this._dom.style.cssText;
		},

		text: function() {
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length) {
				this._dom.textContent = args[0];
				return this;
			}
			return this._dom.textContent;
		},

		sizeDefs:function(name, value) {
			if(arguments.length > 1) {
				this._sizeDefs[name] = value;
				return this;
			}

			return this._sizeDefs[name];
		},

		sizeFuncs:function(name, value) {
			if(arguments.length > 1) {
				this._sizeFuncs[name] = value;
				return this;
			}
			return this._sizeFuncs[name];
		},

		applyLayout: function() {
			var d = this.dom();
			var dim = this.bind("dim");
			var px = this._sb.ext.px;
			var sz = this.bind("sizeFuncs");

			["left","top","width","height"].forEach(function(s) {
				dim(s, sz(s)() );
			});

			//this._sb.ext.debug("sb_light Widget: applyLayout: ", this.id(), this.style());
			this._sb.queue.add(this.bind("handleResize"), "handleResize_"+this.id());
		},

		handleResize: function(e) {
			//this._sb.ext.debug("Widget: ", this.id(), "handleResize")
		},


		_provideEvents: function(/*..args*/) {
			var args = this._sb.ext.slice(arguments);
			this._events = this._events || {};
			for(var i = 0; i < arguments.length; ++i) {
				this._events[args] = {};
			}
		},

		dim: function(name, value) {
			if(arguments.length > 1) {
				if(this._sb.ext.isStr(value)) {
					this.dom().style[name] = value;
				} else {
					this.dom().style[name] = this._sb.ext.px(value);
				}
				return this;
			}
			return this._sb.ext.to_i(this.dom().style[name]);
		},

		rect: function() {
			return {
				x:this.dim("left"),
				y:this.dim("top"),
				width: this.dim("width"),
				height:this.dim("height")
			};
		}

	});

	return Widget;

});

 exports.widget = sb_light.require('widgets/widget');




sb_light.define('widgets/svg',['widgets/widget'], function( W ) {

	var SVG = W.extend({

		_d3:null,
		_pd3:null,
		_svgDiv:null, // placeholder div for the SVG element so we can absolutely position it properly
		_children:null,
		_rootElement: null,

		//d3 custom events
		_dispatcher:null,

		_width:null,
		_height:null,
		_left:null,
		_top:null,

		//do not override
		init:function(sb, parent, def, rootElement) {
			if(!d3) {
				throw "You need to load the d3.js library to use SVG widgets";
			}
			this._rootElement = rootElement || (sb.ext.isStr(def.widget) ? def.widget : "svg");
			this._super(sb, parent, def);
		},

		create:function() {
			this._name = this._name || (this._rootElement + " " + this.id());
			this._children = {};
			this._dispatches = this._dispatches || {};

			this._pd3 = d3.select(this.parentDom());
			this._d3 = this.createDom(this._def);

			this._dom = this._d3.node();

			this.createChildren(this.childrenLayout());
		},

		postCreate:function() {

			//create a dispatcher if we've got dispatches
			var dk = this._sb.ext.keys(this._def.dispatches);
			if(dk.length) {
				this._dispatcher = d3.dispatch.apply(d3, dk);
			}
			this._super();
		},


		pd3: function() {	return this._pd3;	},
		d3: function() {	return this._d3;	},

		parentId:function() {	return this.pd3().attr("id");	},

		_propertyOverrides: function() {
			var po = this._super();
			var self = this;
			po["default"] = this.bind("attr");
			po.style = this.bind("css");
			po.dispatches = this.bind("dispatches");

			this._sb.ext.mixin(po, [
				"stroke", "stroke-width", "stroke-linecap", "stroke-opacity", "stroke-linejoin", "stroke-dasharray",
				"fill", "fill-opacity",	"text-anchor"
			].reduce(function(prev,el) {
				prev[el] = self.bind("style");
				return prev;
			}, {}));

			this._sb.ext.mixin(po, ["left", "top", "width", "height"].reduce(function(prev,el) {
				prev[el] = self.bind("prop");
				return prev;
			}, {}));

			return po;
		},

		childrenLayout: function() {
			return null;
		},

		createChildren: function(childrenDef) {
			try {
				var d;
				childrenDef = this._sb.ext.isArr(childrenDef) ? childrenDef : (childrenDef ? [childrenDef] : []);
				for(var i = 0; i < childrenDef.length; ++i) {
					d = childrenDef[i];
					d.id = this._sb.layout.uniqueId(d);
					this._children[d.id] = this._sb.ext.isString(d.widget) ? (new SVG(this._sb, this.dom(), d)) : (new d.widget(this._sb, this.dom(), d));
					if(d.children) {
						this._children[d.id].createChildren(d.children);
					}
				}
			} catch(e) {
				throw ["SB_Light::SVG::create ", e.message, d.id].join(" -- ");
			}
		},
		child: function(id) {
			return this._children[id] || this._children[this.cid(id)] || null;
		},

		appendChild: function(c) {		},

		createDom:function(opts) {
			if(!opts.widget) { throw "The \'widget\' option must be specified, and be the name of a valid HTML element."; }
			if(this._rootElement == "svg" && !this.parentDom().ownerSVGElement) {
				this._svgDiv  = this.pd3().append("div").attr("class", "sb_light_widget");
			}
			return (this._svgDiv || this.pd3()).append(this._rootElement);
		},



		//d3 functions--------------------------------------------------
		attr: function() {
			return this.d3().attr.apply(this._d3, arguments);
		},
		style:function() {
			return this.d3().style.apply(this._d3, arguments);
		},
		css:function() {
			if(this._svgDiv){
				return this.cssText.apply(this, arguments);
			} else {
				return this.style.apply(this, arguments);
			}
		},
		text: function() {
			var t = this._sb.ext.slice(arguments, arguments.length == 2 ? 1 : 0);
			return this.d3().text.apply(this.d3(), t);
		},

		className: function() {
			var args = this._sb.ext.slice(arguments, (arguments[0] == "class" || arguments[0] == "className") ? 1 : 0 );
			var d3 = this._svgDiv || this._d3;
			if(args.length) {
				var classes = args[0].split(/\s/);
				classes.forEach(function(c) {
					d3.classed(c, args[1] !== true );
				});
				return this;
			}
			return d3.attr("class");
		},


		//add function handlers for d3 dispatching
		dispatches:function(/*"dispatches", {name:func}*/) {
			var args = this._sb.ext.slice(arguments, arguments.length == 2 ? 1 : 0);
			if(args.length) {
				var list = args[0];
				for(var n in list) {
					this._dispatcher.on(n, list[n]);
				}
				return this;
			}
			return this._dispatches;
		},


		dispatch: function(name, context, data, index) {
			if(this._dispatcher && this._dispatcher[name]) {
				//call d3 style where "this" is normally the dom element from the original event,
				this._dispatcher[name].apply(context, [data,index]);
			}
		},

		dispatcher: function() {
			return this._dispatcher;
		},
		////-----------------------------------------------------------


		//this gets called by the sb_light layout.js engine.
		applyLayout: function() {
			var d = (this._svgDiv || this._d3).node();
			var dim = this.bind("dim");
			var px = this._sb.ext.px;
			var sz = this.bind("sizeFuncs");

			["left","top","width","height"].forEach(function(s) {
				var f = sz(s);
				if(f) {
					dim(s, f() );
				}
			});

			//this._sb.ext.debug("sb_light Widget: applyLayout: ", this.id(), this.style());
			this.redraw();
		},

		handleResize: function() {
			this.redraw();
		},


		redraw: function() {
			//update the children of this SVG. This should be managed by D3 functions.
		},

		dim: function(name, value) {
			if(name.match(/left|top|width|height/)) {
				this.prop.apply(this, this._sb.ext.slice(arguments));
			}
			if(this._svgDiv) {
				//for root svg which sits under a layout parsed DOM
				if(arguments.length > 1) {
					this._svgDiv.style(name,  this._sb.ext.px(value));
					if(name.match(/width|height/)) {
						this.d3().attr(name,  value);
					}
					return this;
				}
			} else {
				//use the d3 methods instead
				if(arguments.length > 1) {
					this.d3().attr(name, value);
					return this;
				}
			}
			return this.prop(name);
		},


		rect:function() {
			return this._super();
		}

	});

	return SVG;

});

 exports.svg = sb_light.require('widgets/svg');





sb_light.define('sb_light/layout',['sb_light/globals', 'widgets/widget', "widgets/svg"], function(sb,Widget, SvgWidget) {
	var lo =  {};

	lo.init = function() {
	};


	lo.create = function(parent, def) {
		try {
			var el;
			if(sb.ext.isStr(def.widget)) {
				if(def.widget == "svg") {
					el = (new SvgWidget(sb,parent,def));
				} else {
					el = (new Widget(sb, parent, def));
				}
			} else {
				//widget -- needs to inherit from layout/widget.js
				var W = def.widget;
				el = new W(sb, parent, def);
			}
			return el;
		} catch(e) {
			console.log(["SB_Light::Layout::create ", JSON.stringify(e), def.id].join(" -- "));
			throw new Error(["SB_Light::Layout::create ", JSON.stringify(e), def.id].join(" -- "));
		}
	};






	//parse the def(inition) of the layout and inject the widgets into root.
	lo.parse = function(root, def, preventResize/*==false*/) {
		var rect = root.ownerDocument ?  root.getBoundingClientRect() : root.rect();
		var layout = {root: root, widgets:{}, rootWidth:rect.width, rootHeight:rect.height};
		_createWidgets(null, def, layout);
		if(!preventResize) {
			lo.resize(layout);
		}
		return layout;
	};

	lo.resize = function(layout) {
		_buildLayout(layout);
		_evalLayout(layout);
		_applyLayout(layout);
	};

	//change the layout def for a single item and relayout.
	//specify "true" if you want to prevent the re-layout -- this is useful when applying a bunch of changes (e.g., in a loop) and you 
	//		want to call resize manually. 
	lo.change = function(layout, key, dim, value, wait/*==false*/) {
		layout.widgets[key].source(dim, value);
		if(!wait) {
			lo.resize(layout);
		}
	};
	lo.uniqueId = function(def) {
		if(!def.id) { 
			def.id = "unknown_" + sb.ext.unique();
		}	
		return def.id;
	};

	var _createWidgets = function(parentId,def, layout) {
		var p = parentId ? layout.widgets[parentId] : layout.root;
		if(!p) { 
			throw new Error("Warning: missing parent id", parentId);
		}
		def = sb.ext.isArray(def) ? def : [def];
		def.forEach(function(d,i) {
			d.id = lo.uniqueId(d);
			d.style = d.style || "";
			d.style = d.style + (d.style.match("/z-index/") ? "" : ";z-index:"+i);	

			var widget = lo.create(p, d);
			layout.widgets[d.id] = widget; //{id:d.id, source:d, dom:obj, parentId:parentId};
			
			if(d.children && d.children.length) {
				if(d.widget == "svg") {
					//skip the layout engine and let the SVG widgets manage themselves. They don't have gimpy
					//positioning like HTML DOM / CSS (even before using d3 )
					widget.createChildren(d.children);
				} else {
					_createWidgets(d.id, d.children, layout);
				}
			}

		});
	};



	var _matchLink = /^@(.+?)(#(left|right|top|bottom|height|width))?(#(-?\d+))?$/;
	var _matchNum = /^(-?\d+)([^0-9]+)?$/;
	var _dimList = ["left","right", "top","bottom", "height","width"];
	var _vDimList = ["top","bottom", "height"];

	var _buildLayout = function( layout) {
		for(var wid in layout.widgets) {
			var w = layout.widgets[wid];
			var p = layout.widgets[w.parentId()] || null; //parent might be root


			var sz = w.sizeDefs.bind(w);//func
			var v = sb.ext.valid;
			
			_dimList.forEach(function(s){
				sz(s,w.source(s));
			});

			//remove conflicting "right"
			if(v(sz("left")) && v(sz("width")) && v(sz("right"))) {
				//console.log("sb_light::utils::layout Warning: ", wid, " has left/width/right all specified. Removing 'right'");
				sz("right", null);
			}
			//remove conflicting "bottom"
			if(v(sz("top")) && v(sz("bottom")) && v(sz("height"))) {
				// //console.log("sb_light::utils::layout Warning: ", wid, " has top/height/bottom all specified. Removing 'bottom'")		
				sz("bottom", null);
			}

			//apply the "fringe" setting to the left/right/bottom/top where appropriate
			var fringe = v(w.source("fringe")) ? w.source("fringe") : 0;
			if(!v(sz("left")) 		&& (!v(sz("width")) 	|| !v(sz("right")))) 		{ sz("left", fringe);}
			if(!v(sz("right")) 		&& (!v(sz("width")) 	|| !v(sz("left")))) 		{ sz("right", fringe);}
			if(!v(sz("top")) 		&& (!v(sz("height")) 	|| !v(sz("bottom")))) 		{ sz("top", fringe);}
			if(!v(sz("bottom")) 	&& (!v(sz("height")) 	|| !v(sz("top")))) 			{ sz("bottom", fringe);}
		}
	};

	var _isV = function(dim) { return _vDimList.indexOf(dim) > -1; };

	var _evalLayout = function( layout) {
		for(var wid in layout.widgets) {

			var w = layout.widgets[wid];
			var sz = w.sizeFuncs.bind(w);
			//all elements from here should have a parentId with sizes
			var p = layout.widgets[w.parentId()] || null; //parent might be root
			var pid = w.parentId() || "_root"; //parent might be root
			var pz = (p && p.sizeFuncs.bind(p)) || null;
			var pzw = pz ? [pz, "width", (pid+"@width") ] : layout.rootWidth;
			var pzh = pz ? [pz, "height", (pid+"@height") ] : layout.rootHeight;

			var v = sb.ext.valid;

			// if(wid == "infoResize"){
			// //	console.log("DivB");
			// }

			_dimList.forEach(function(s) {
				var dim = String(w.sizeDefs(s));
				var m = dim ? dim.match(_matchLink) : null;
				var mn = dim.match(_matchNum); 

				if(mn) {
					//25%, -45%, etc... 
					if(mn.length == 3 && mn[2] == "%") 	{ 
						mn = (sb.ext.to_f(mn[1])/100);
						//console.log("Fixed %: ", wid, s, mn);
						sz(s, _sizeFunc(wid, s, sb.ext.prod,  (_isV(s) ? pzh : pzw), mn));
					//50, 20, -23, ....
					} else if(mn.length == 2 || !v(mn[2])) { 
						//console.log("Fixed Num: ", wid, s, mn);
					 	mn = sb.ext.to_f(mn[1]);
						sz(s, _sizeFunc(wid, s, sb.ext.sum, mn));
					} else {
						// console.log("sb_light::utils::layout Warning: ", "Number is not a valid dimension", w.id, s, dim);
					}
				} else if (dim == "auto") {
					sz(s, _autoFunc(wid, s, w, layout));
				} else if (!m) {
					//console.log("Undefined: ", wid, s, w.parentId);
					//console.log("Undefined: ", pzw, pzh);

						 if(s == "width") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzw, [sz,"left", (wid+"@left")], 		[sz,"right", (wid+"@right")]))	;}	
					else if(s == "height") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzh, [sz,"top", (wid+"@top")], 		[sz,"bottom", (wid+"@bottom")]))	;}	
					else if(s == "left") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzw, [sz,"width", (wid+"@width")], 	[sz,"right", (wid+"@right")]))	;}	
					else if(s == "top") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzh, [sz,"height", (wid+"@height")],	[sz,"bottom", (wid+"@bottom")]))	;}	
					else if(s == "right") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzw, [sz,"width", (wid+"@width")], 	[sz,"left", (wid+"@left")]))	;}	
					else if(s == "bottom") 	{ sz(s,_sizeFunc(wid,s, sb.ext.diff, pzh, [sz,"height", (wid+"@height")], 	[sz,"top", (wid+"@top")]))		;}	
					return;
				} else {

					var linkKey = m[1]  && layout.widgets[m[1]] ? m[1] : null;
					var linkDim = v(m[3]) ? m[3] : s;
					var linkAmt = v(m[5]) ? sb.ext.to_f(m[5],0) : 0;

					var lw = layout.widgets[linkKey];
					if(!lw) {
						throw new Error("SB_LIGHT::Layout: No element found matching the definition:" + dim + ". Please check your layout definition.");
					}
					var lz = lw.sizeFuncs.bind(lw);
					if(linkDim == "right" && s == "left") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"left", (linkKey+"@left")], [lz,"width", (linkKey+"@width")],  linkAmt));
					} else if (linkDim == "left" && s == "right") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"right", (linkKey+"@right")], [lz,"width", (linkKey+"@width")],  linkAmt));
					} else if (linkDim == "bottom" && s == "top") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"top", (linkKey+"@top")], [lz,"height", (linkKey+"@height")],  linkAmt));
					} else if (linkDim == "top" && s == "bottom") { 
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,"bottom", (linkKey+"@bottom")], [lz,"height", (linkKey+"@height")],  linkAmt));
					} else {
						sz(s, _sizeFunc(wid, s, sb.ext.sum, [lz,linkDim, (linkKey+"@"+linkDim)], linkAmt));
					}
				}


			});

		}

	};

	var _sizeFunc = function(id, dim, op /*, list */ ) {
		var dimId = id + ":" + dim;

		var list = sb.ext.slice(arguments, 3);

		return function(chain) {
			chain = chain ||"Chain: ";
			if(chain.match(dimId)) { 
				throw new Error("sb_light::utils::layout Error -- Circular dependancy (" + chain + ") " + dimId);
			}
			var nl = list.map(function(el) {	
				return sb.ext.isArr(el) ? [el[0](el[1]), (chain+"_"+dimId + ( el[2] ? ("("+el[2]+")") :"" ))] : el;
			});
			
			var res = op.apply(op, nl);
			// if(id=="divB") {
			// 	console.log(id,dim,chain, res, nl);
			// }
			
			return res;
		}
	};

	var _autoFunc = function(id, dim, w, layout) {
		var dimId = id + ":" + dim;

		w.dim(dim, "auto");

		return function(chain) { 
			chain = chain || "Chain: ";
			if(chain.match(dimId)) { 
				throw new Error("sb_light::utils::layout Error -- Circular dependancy (" + chain + ") " + dimId);
			}

			var list = [];
			for(var wid in layout.widgets)  {
				var cw = layout.widgets[wid];
				var cz = cw.sizeFuncs.bind(cw)
				if(cw.parentId() == id) { 
					list.push(
						function() {
							if(dim == "width") {
								return  cz("left")(chain+"_"+dimId+"_"+ wid +"@"+dim) + cz("width")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							} else if (dim == "height") {
								return cz("top")(chain+"_"+dimId+"_"+ wid +"@"+dim) + cz("height")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							} else 	if(dim == "left") {
								return cz("left")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							} else if (dim == "top") {
								return cz("top")(chain+"_"+dimId+"_"+ wid +"@"+dim);
							}
						}
						
					); 
				}
			}

			if(list.length) {
				return (dim == "width" || dim =="height") ? sb.ext.max.apply(null, list) : sb.ext.min.apply(null,list);
			} else {

				var pid = w.parentId();
				var p =  layout.widgets[pid] || null;
				var pd = p ? p.dom() : (layout.root.dom() || layout.root || null) 
				var rect = w.dom().getBoundingClientRect();
				var prect = pd ? pd.getBoundingClientRect() : {left:0, top:0, bottom:0, right:0, width:0, height:0}; 
				
				var ph = p ? p.sizeFuncs("height")(chain+"_"+dimId) : layout.rootHeight;
				var pw = p ? p.sizeFuncs("width")(chain+"_"+dimId) : layout.rootWidth;

				if(dim !== "bottom" && dim != "right") {
					return rect[dim];
				} else if(dim == "bottom"){
					return ph - rect.height - (rect.top- prect.top);
				} else {
					return pw - rect.width  - (rect.left - prect.left);
				}
			}
		}
	};

	var _applyLayout = function(layout) {
		for (var wid in layout.widgets) {
			var w = layout.widgets[wid];
			var sz = w.sizeFuncs.bind(w);
			var r = sb.ext.roundTo;
			// console.log(wid, 
			// 		"left",		r(sz("left")(wid),1),
			// 		"right",	r(sz("right")(wid),1),
			// 		"top",		r(sz("top")(wid),1),
			// 		"bottom",	r(sz("bottom")(wid),1),
			// 		"width", 	r(sz("width")(wid),1),
			// 		"height", 	r(sz("height")(wid),1)
			// );

			w.applyLayout();

		}

	};



	return lo;
});

 exports.layout = sb_light.require('sb_light/layout');


/*globals define*/

sb_light.define('sb_light/utils/consts',['sb_light/globals'], function(sb) {

	var consts  =  {};
	
	consts.COLOR = {
		BLOCK: {
			"green":	"#176717",
			"yellow":	"#77771B",
			"red":		"#641717"
		}
	};
	
	consts.STATE = {
			BLOCK: 					"block",
			BLOCK_TREE_ZOOM: 		"blockTreeZoom",
			BLOCK_MAP_ZOOM: 		"blockMapZoom",
			CHILD_BLOCK: 			"childBlock",
			BLOCK_SETTINGS_VIEW: 	"blockSettingsView",
			BLOCK_SETTINGS_COLLAPSE:"blockSettingsCollapse",
			BLOCKS_TREE_VIEW: 		"blocksTreeView",
			BLOCKS_MAP_VIEW: 		"blocksMapView",
			BLOCKS_TIMELINE_VIEW: 	"blocksTimelineView",
			MANAGE_BLOCK_VIEW: 		"manageBlockView",
			PAGE: 					"page",
			USER_ID: 				"userId",
			COMPANY_ID:				"companyId",
			COMPANY: 				"company",
			USER: 					"user",
			SESSION: 				"session",
			PREV_PAGE: 				"previousPage",
			PREV_BLOCK: 			"previousBlock"
			
	};
		
	
	consts.BLOCK_SETTINGS = {
			VIEW: {
				DEFAULT: 	{name: "Default", 	key: "bd"},
				STATUS: 	{name: "Status", 	key: "bs"},
				PROGRESS: 	{name: "Progress", 	key: "bp"},
				HEALTH: 	{name: "Health", 	key: "bh"},
				KPI: 		{name: "Outputs", 	key: "bk"},
				RISK: 		{name: "Risk", 		key: "br"},
				NPV: 		{name: "Value", 	key: "bn"}
			},
			COLLAPSE: "c"
	};
		
	consts.BLOCKS_MAP = {
			VIEW: {
				RADIAL: "radial",
				HIERARCHY: "hierarchy"
			}
	};
	
	consts.BLOCKS_TREE = {
			VIEW: {
				STATUS: 	consts.BLOCK_SETTINGS.VIEW.STATUS.key,
				PROGRESS: 	consts.BLOCK_SETTINGS.VIEW.PROGRESS.key,
				HEALTH: 	consts.BLOCK_SETTINGS.VIEW.HEALTH.key,
				KPI: 		consts.BLOCK_SETTINGS.VIEW.KPI.key,
				RISK: 		consts.BLOCK_SETTINGS.VIEW.RISK.key,
				NPV: 		consts.BLOCK_SETTINGS.VIEW.NPV.key
			}
	};
	
	consts.BLOCKS_TIMELINE = {
		VIEW: {
			CHART:		"chart",
			TABLE:		"table"
		}
	};
	
	consts.MANAGE_BLOCK = {
		VIEW: {
			BLOCK:			"block",
			NEW_CHILD:		"newChild",
			EDIT_CHILD:		"editChild",
			CHILDREN_LIST:	"childrenList",
			NEW_LINK:		"newLink",
			EDIT_LINK:		"editLink"
		}
	};
		
		
	consts.SIZES = {
		BLOCK_WIDTH: 350,
		BLOCK_HEIGHT: 185,
		BLOCK_HEIGHT_SMALL: 150,
		BLOCK_PADDING_X: 80,
		BLOCK_PADDING_Y: 90
	};

	return consts;
	
});


 exports.consts = sb_light.require('sb_light/utils/consts');




sb_light.define('sb_light/models/_abstractModel',['sb_light/utils/Class'], function( Class ) {

	var Abstract = Class.extend({
		name: null,
		_sb:null,
		_model: null,
		_modelArray: null,
		_urlDef: null,
		_selectQueue: null,
		_subscriptions:null,
	
		init: function(sb, name, urlDef) {
			if(!name) { throw new Error("AbstractModel: Model name must be declared"); }
			if(!urlDef) { throw new Error("AbstractModel: Model urlDef must be declared"); }
			
			this._sb = sb;
			this.name = name;
			this._urlDef = urlDef;
			this._selectQueue = [];
			this._subscriptions = {};
			
			this._sb.state.register(this, this._urlDef, this._handleUpdate.bind(this));
		},
	
		reset: function(publish) {
			this._model = null;
			this._modelArray = null;
			this._sb.state.resetTimestamp(this.name);
			if(publish) {
				this._publish();
			}
		},
		
		isValid: function() {
			return this.get() != null;
		},
	
		get: function() {
			if(!this._model) {
				this._sb.ext.debug("Getting the " + this.name + " model.");
				if(this._sb.state.authorized() ) {
					this._sb.ext.debug("Forcing the update");
					this._sb.state.forceModelUpdate(this);
				} else {
					//this._sb.queue.add(this.get.bind(this), this.name+"::model::get", 200);
				}
				return null;
			} 
			return this._modelArray;
		},
		
		raw: function() {
			return this._model;
		},
		rawArray: function() {
			return this._modelArray;
		},
	
		subscribe: function(cb, domNode/*=null*/) {
			var id = "Sub_" + this.name + "_" + this._sb.ext.unique();
			this._subscriptions[id] = cb;
			var m = this.get();
			if(m) {
				this._sb.queue.add(cb, id, 0);
			}
			return id;
		},
	
		//unsubnscribe unsing a callback or an id
		unsubscribe:function(remove) {
			var ext = this._sb.ext;
			var del = [];
			var subs= this._subscriptions;
			//collect matches
			ext.each(subs, function(v,k, subs) {
				if(v == remove || k == remove) { 
					del.push(k);
				}
			});
			del.forEach(function(el) {
				delete subs[el];
			})

		},
		
		_publish: function() {
			var m = this.get();
			var q = this._sb.queue;
			this._sb.ext.each(this._subscriptions, function(cb,k) {
				q.add(cb, k, 0);
			});	
		},
		
		//one-off selection that will wait until the model is available.
		select: function(type, cb, func) {
			this._selectQueue.push({type:type, cb:cb, func:func});
			this._processQueue();
		},	
		
		/*************************************************************
			This is expecting the response to be a map with the following keys: {
				"deleted": Array of ids that have been deleted since the last request. They do not have to exist the our
							view of the model.
				"added":  Map of objects that have been added to the company since our last update
				"updated": Map of objects that have been changed since our last update. 
				"timestamp": ms since epoch that the model was changed.
				NOTE: most of the time added/updated are effectively the same result, but the intention was
						to be able to treat the objects differently if we wanted to.
		
		**************************************************************/
		_handleUpdate: function(response) {
			this._processResponse(response);
			if(!this._model) { 
				return;
			} 
			this._publish();
			this._processQueue();
		},
		
		_processQueue: function() {
			var data = this.get();
			if(!data) { return; }
			
			while(this._selectQueue.length) {
				var sel = this._selectQueue.pop();
				switch(sel.type) {
					case "map": 	sel.cb(this._model); break;					//raw map
					case "all": 	sel.cb(data); break;						//array -- unsorted
					case "filter": 	sel.cb( data.filter(sel.func) ); break; 	//run array through a filter
				} 
			}
			
		},	
		
		_processResponse: function(data) {
			this._model = this._model || {};
			
			this._sb.ext.debug("Processin Model", this.name);
			
			//The following order assumes a faulty server and ensures we don't update  or delete missing
			//items.
			this._addItems(data.added);
			
			this._updateItems(data.updated);
			
			this._deleteItems(data.deleted);
			
			this._massageUpdatedModel();
			
			this._resetArrayCache();
		},
	
		
		_addItems: function(added) {
			added = added || {};
			for (var k in added) {
				this._model[k] = added[k];
			}
		},
		
		_updateItems: function(updated) {
			updated  = updated || {};
			for (var k in updated) {
				this._model[k] = updated[k];
			}
		},	
		
		_deleteItems:function(deleted) {
			var model = this._model;
			deleted = deleted || [];
			var self =this;
			deleted.forEach(function(v) {
				if(model[v]) {
					self._sb.ext.debug("Deleting Model", self.name, v);
				}
				delete model[v];
			});
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			
		},
		
		//build an array cache of the model to make list-fetches / iterations / sorting quicker. 
		//but preserve the model as a map for key-value queries
		_resetArrayCache:function() {
			this._modelArray = this._sb.ext.map(this._model, function(v, k) { return v; });
			//this._sb.ext.debug(this.name, this._modelArray.length);
		}
	});
	return Abstract;
});



 exports._abstractModel = sb_light.require('sb_light/models/_abstractModel');



sb_light.define('sb_light/models/tagsModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "tags", sb.urls.MODEL_TAGS);
		}
	});
	return Model;	
});


 exports.tagsModel = sb_light.require('sb_light/models/tagsModel');



sb_light.define('sb_light/models/newsModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "news", sb.urls.MODEL_NEWS);
		},
		
		
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			// for(var k in this._model) {
			// }
		}
	});	
	return Model;
});



 exports.newsModel = sb_light.require('sb_light/models/newsModel');




sb_light.define('sb_light/models/usersModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "users", sb.urls.MODEL_USERS);
		},
		_massageUpdatedModel: function() {
			this._super();
			
			for(var i in this._model) {
				var u = this._model[i];
				u.name = u.first_name + " " + u.last_name;
			}
		}
	});	
	return Model;
});


 exports.usersModel = sb_light.require('sb_light/models/usersModel');




sb_light.define('sb_light/models/blocksModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		_progress: null,
		_health: null,
		_npv: null,
		_npv_queue:null,
		_progress_queue:null,
		_health_queue:null,
		
		_properties: null,
		_propertiesList: ["comments","news","tags","documents", "context", "watching_users"],
	
		init: function(sb) {
			this._npv_queue = [];
			this._progress_queue = [];
			this._health_queue = [];
			this._properties = {};

			this._dataHandlers = {
				"_health": 	this._massageHealth,
				"_progress": 	this._massageProgress,
				"_npv": 	this._massageNpv
			}
			
			this._super(sb, "blocks", sb.urls.MODEL_BLOCKS);
		},
		
		_handleUpdate: function(update) {
			this._progress = null;
			this._health = null;
			this._npv = null;
			
			this._super(update);
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			var root = this._model[this._sb.state.value("company").root_block.id];
			this._massage(root, null, 0, (new Date()).getTime());
			this._sb.ext.debug("Finished massaging blocks");
		},
		

		//return the raw object map, but use the paths as keys
		rawPaths: function() {
			var bl = this.rawArray() || [];
			var paths = {};
			bl.forEach(function(b) {
				b.paths.forEach(function(bp) {
					paths[bp] = b;
				});
			});
			return paths;
		},
		//return an array of all the paths + blocks from rawPaths
		rawArrayPaths: function() {
			return this._sb.ext.map(this.rawPaths(), function(v,k) {
				return {path:k, block:v};
			});
		},
		
		progress: function(cb) {
			this._data(cb, "_progress", this._sb.urls.BLOCKS_PROGRESS);
		},
		health: function(cb) {
			this._data(cb, "_health", this._sb.urls.BLOCKS_HEALTH);
		},
		npv: function(cb) {
			this._data(cb, "_npv", this._sb.urls.BLOCKS_NPV);
		},
			
		comments: function(id, cb, force) {	this._property(cb, "comments", id, force);		},
		news: function(id, cb, force) {		this._property(cb, "news", id, force);		},
		tags: function(id, cb, force) {		this._property(cb, "tags", id, force);		},
		documents: function(id, cb, force) {	this._property(cb, "documents", id, force);		},
		context: function(id, cb, force) {		this._property(cb, "context", id, force);		},
		watching: function(id, cb, force) {		this._property(cb, "watching_users", id, force);		},
		
		_property: function(cb, type, id, force) {
			if(this._propertiesList.indexOf(type) >= 0) {
				this._properties[type]  =  this._properties[type] || {};
				if(!this._properties[type][id] || force) {
					this._properties[type][id] = "waiting";
					
					//add callback to queue
					this._properties[type+"_queue"] = this._properties[type+"_queue"] || {};
					this._properties[type+"_queue"][id] =  this._properties[type+"_queue"][id] || [];
					this._properties[type+"_queue"][id].push(cb);
					
					this._sb.controller.invoke(this._sb.urls.BLOCKS_PROPERTIES, {id:id, type:type}, this._handleProperty.bind(this, type,id));
				} else if ( this._properties[type][id] == "waiting") {
					this._properties[type+"_queue"][id].push(cb);
				} else {
					cb(this._properties[type][id]);
				}
			} else {
				throw new Error("BlockModel property is not valid:" + type);
			}
		},
		
		//push all requests onto the queue and only invoke the controller if it's the first one and we don't have data
		_data: function(cb, name, url) {
			var func = this._handleData.bind(this,name );
			this[name+"_queue"].push(cb);
			
			if (!this[name]) {
				if(this[name+"_queue"].length == 1) {
					this._sb.controller.invoke(url, null, func);
				}
			} else {
				func();
			}
		},
		
		//process the queue for the data.
		_handleData: function(name, data) {
			this[name] = data ? data.result : this[name];
			if(this._dataHandlers[name] && data && data.result) {
				this._dataHandlers[name].call(this, this[name]);
			}
			while(this[name+"_queue"].length) {
				var cb = this[name+"_queue"].pop();
				cb(this[name]);
			}
		},
		
		//process the properties
		_handleProperty: function(type, id, data) {
			this._properties[type] = this._properties[type] || {};
			this._properties[type][id] = data ? data.result : this._properties[type][id];
			
			while(this._properties[type+"_queue"][id].length) {
				var cb = this._properties[type+"_queue"][id].pop();
				cb(this._properties[type][id]);
			}
		},
		
		_massageHealth: function(d) {
			var f = this._sb.ext.massageHealth;
			this._sb.ext.each(d, function(dv,dk) {
				f(dv);
			});

		},
		_massageProgress: function(d) {
			var f = this._sb.ext.massageTA;
			this._sb.ext.each(d, function(dv,dk) {
				f(dv);
			});			
		},
		_massageNpv: function(d) {

		},
		
		_massage: function(b, ppath, depth, schema) {
			var cleanup = b._schema != schema;
			b._schema = cleanup ? schema : b._schema;
			
			b.paths = (!cleanup && b.paths) || [];
			b.children = b.children || [];
			
			var p = ppath ? this._model[ppath.last()] : null;
			if(p) {
				var pel =  b.parents.find("parent_id", p.id).value;
				var dpel = b.parents.find("linked_parent_id", null).value;
				pel.position = p.children.indexOf(b.id);
				pel.level = depth;
				
				b.paths.put(ppath.concat([b.id]));
				if(p.id == dpel.parent_id) {
					b.default_path = b.paths.last();
					b.default_parent = p.id;
					b.default_level = depth;
					b.default_position = pel.position;
				} 
				if(p.is_owner) {
					pel.can_move_left = pel.position > 0;
					pel.can_move_right = pel.position < (p.children.length-1) && p.children.length > 1;
					pel.can_delete = true;
				}
			} else {
				b.default_path = [b.id];
				b.default_parent = null;
				b.paths.put([b.id]);
				b.default_position = 0;
				b.default_level = 0;
			}
			
			var bpath = b.paths.last();
	
			for (var i = 0; i < b.children.length; ++i) {
				this._massage(this._model[b.children[i]], bpath, depth+1, schema);
			}
		},
		_resetArrayCache:function() {
			this._super();
			this._modelArray.sort(this._sb.ext.sortBlocksByProgress);
			//this._sb.ext.debug(this.name, this._modelArray.length);
		}
	});
	
	return Model;		
});




 exports.blocksModel = sb_light.require('sb_light/models/blocksModel');



sb_light.define('sb_light/models/levelsModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "levels", sb.urls.MODEL_LEVELS);
		}
	});	
	return Model;
});


 exports.levelsModel = sb_light.require('sb_light/models/levelsModel');



sb_light.define('sb_light/models/focusModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "focus", sb.urls.MODEL_FOCUS);
		}
	});	
	return Model;	
});


 exports.focusModel = sb_light.require('sb_light/models/focusModel');



sb_light.define('sb_light/models/risksModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "risks", sb.urls.MODEL_RISKS);
		}
	});
	return Model;	
});


 exports.risksModel = sb_light.require('sb_light/models/risksModel');



sb_light.define('sb_light/models/kpisModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "kpis", sb.urls.MODEL_KPIS);
		},

		_massageUpdatedModel: function() {
			this._super();
			var sb = this._sb;
			sb.ext.each(this._model, function(v,k) {
				sb.ext.massageKpi(v);
			});
		},

	});
	return Model;	
});



 exports.kpisModel = sb_light.require('sb_light/models/kpisModel');





sb_light.define('sb_light/models/companiesModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		
		init: function(sb) {
			this._super(sb, "companies", sb.urls.MODEL_COMPANIES);
		}
	});	
	return Model;
});


 exports.companiesModel = sb_light.require('sb_light/models/companiesModel');



sb_light.define('sb_light/models/timezonesModel',['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "timezones", sb.urls.MODEL_TIMEZONES);
		},
		
	});
	
	return Model;	
});




 exports.timezonesModel = sb_light.require('sb_light/models/timezonesModel');





sb_light.define('sb_light/models',[
	'sb_light/globals',
	'sb_light/models/tagsModel',
	'sb_light/models/newsModel',
	'sb_light/models/usersModel',
	'sb_light/models/blocksModel',
	'sb_light/models/levelsModel',
	'sb_light/models/focusModel',
	'sb_light/models/risksModel',
	'sb_light/models/kpisModel',
	//'sb_light/models/groupsModel',
	'sb_light/models/companiesModel',
	'sb_light/models/timezonesModel'
], function(sb, tags,news,users,blocks,levels,focus,risks,kpis,/*groups,*/companies,timezones) {
	
	var _models = {
		tags:		{klass:tags},
		news:		{klass:news},
		users:		{klass:users},
		blocks:		{klass:blocks},
		levels:		{klass:levels},
		focus:		{klass:focus},
		risks:		{klass:risks},
		kpis:		{klass:kpis},
		//groups:		{klass:groups},
		companies:	{klass:companies},
		timezones:	{klass:timezones}
	};
	
	var models = {};
	
	models.reset = function(publish) {
		for(var mn in _models) {
			var m = _models[mn] ? _models[mn].model : null;
			if(m) { m.reset(publish); }
		}
	},
	models.get = function(modelName) {
		var m = _verifyModel(modelName);
		return m.model;
	},
	
	//adds a callback watcher. 
	//returns whether the model is valid or not. 
	models.subscribe = function(modelName,  cb, domNode/*==null*/) {
		var m = _verifyModel(modelName);
		return m.model.subscribe(cb, domNode);
	},
	
	//"remove" can be an actual cb function, or the id returned from the subscribe. 
	models.unsubscribe = function(modelName, remove) {
		var m = _verifyModel(modelName);
		return m.model.unsubscribe(remove);
	},
	
	models.rawArray = function(modelName) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.rawArray();
		}
	},
	
	models.raw = function(modelName) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.raw();
		}
	},
	
	//one-off selection that will wait until the model is ready
	models.select = function(modelName, type, cb, func) {
		var m = _verifyModel(modelName);
		if(m.model) {
			sb.ext.debug("Doing a select on the model.", modelName);
			m.model.select(type, cb, func);
		}
	},
	
	models.isValid = function(modelName) {
		var m = _verifyModel(modelName);
		var valid = false; 
		if(m.model) {
			valid =  m.model.isValid();
		}
		return valid;
	}
	
	function _verifyModel (modelName) {
		var m = _models[modelName];
		if(!m) {
			throw new Error("sb.appModel.js: Model name not found: " + modelName);
		}
		if(!m.model) {
			m.model = new (m.klass)(sb);
		}

		return m;
	}
	
	
	return models;
	
});




 exports.models = sb_light.require('sb_light/models');



sb_light.define('sb_light/controller',['sb_light/globals'], function(sb) {

	var controller = {};

	controller.invoke = function(urlObj, args, successCb, errorCb, stateCheck) {
		var url = sb.urls.url(urlObj, args);
		var params = {};
		
		if (urlObj.deleteId) {
			delete args.id;
		}
		
		var requestArgs = urlObj.massageParamsFunc ? sb.urls[urlObj.massageParamsFunc](args) : args;
		
		if (requestArgs != null) {
			if (requestArgs instanceof Array) {
				params.json = JSON.stringify(requestArgs);
			}
			else if (Object.keys(requestArgs).length > 0) {
				if (urlObj.normalParams) {
					params = requestArgs;
				}
				else {
					params.json = JSON.stringify(requestArgs);
				}
			}
		}
		var post = typeof urlObj.post === "undefined" || urlObj.post || false;
		sb.api.request(url, params, post, successCb, errorCb, stateCheck||null);
	};
	
	
	controller.forgotPassword =  function(email,cb,errCb) {
		controller.invoke(sb.urls.LOGIN_FORGOT_PASSWORD, {username:email}, cb,errCb, sb.state.invalid);
	};
	
	controller.blockComment = function(id, message, cb) {
		controller.invoke(sb.urls.COMMENT_PROPERTIES_ADD, {id:id, body:message}, cb,cb);
	};
	controller.blockClose = function(id, closeObj, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_CLOSE, sb.ext.mixin({id:id}, closeObj), cb,cb);
	};
	controller.blockPublish = function(id, children, cb) {
		//children:bool
		controller.invoke(sb.urls.BLOCKS_MAKE_PUBLIC, {id:id, children:children}, cb,cb);
	};
	controller.changeDefaultCompany = function(id,cb, errCb) {
		controller.invoke(sb.urls.USERS_CHANGE_DEFAULT_COMPANY, {id:sb.state.value("userId"),default_company_id:id}, cb,errCb);
	};
	
	
	return controller;
});



 exports.controller = sb_light.require('sb_light/controller');



sb_light.define('sb_light/api/state',['sb_light/globals', 'sb_light/utils/consts'], function(sb,consts) {
	//console.log("State:",sb.version);
	
	var state = {};
	
	state.stateKeys = [ 
		"session_unknown", 
		"session_normal", 
		"session_payment", 
		"session_invalid", 
		"session_disconnected",
		"session_startup"
	];
	//create a map
	state.stateKeys.reduce(function(prev,el,i) {
		prev[el] = i;
		return prev;
	}, state);

	var _state = {
		page:"",

		block:null,		//normally block path
		news:null,		//news item id		
		kpi:null,		//kpi  id		
		risk:null,		//risk id		
		tag:null,		//tag id		

		userId:null,
		companyId:null,
		company: null,
		user: null,
		
		session: state.session_startup,
		url:"",
		
		childBlock:null,		
		
		blockTreeZoom:1,
		blockMapZoom:1,
		blockSettingsView: "",
		blockSettingsCollapse: "",
		blocksTreeView: consts.BLOCKS_TREE.VIEW.STATUS,
		blocksMapView: consts.BLOCKS_MAP.VIEW.RADIAL,
		blocksTimelineView: consts.BLOCKS_TIMELINE.VIEW.CHART,
		//manageBlockView: "block",
				
				
		previousBlock:null,
		previousPage:null
	};
	
	
	var _forceUpdateBuffer = {};
	var _forceUpdateBusy = {};
	var _stateFunctions = {};
	
	//the url definition. The order of the url parts will be consistent with this list.
	var _urlParts = ["page", "block", "childBlock", "blocksTreeView","blocksMapView","blocksTimelineView","manageBlockView"]; 
	
	
	state.host = "";
	state.models = {};
	state.subscriptions = {};
	
	
		
	//accepts several value types specified by: sb.urls.url_to_o
	//RETURNS: The string form of the url.
	state.url = function(value) {
		//update the url
		if(value !== undefined) { 
			value = typeof value == "string" ? sb.urls.url_to_o(value) : value;
			sb.ext.each(value, function(k, v) {
				state.value(k,v, false);
			});
			state.publish("url");
		}
	
		return "#"+_urlParts.reduce(function(prev, el) {
			val = state.value(el);
			if(val !== null && val !== undefined) {
				return prev.put([el, state.value(el)].join("="));
			} 
			return prev;
		}, []).join(";");
	};
	
	state.register = function(model, urlDef, cb) {
		if(!state.models[model.name]) {
			state.models[model.name] = {timestamp:0, cb:cb, urlDef:urlDef};
			if(state.authorized() && !_forceUpdateBuffer && !_forceUpdateBuffer[model.name]) {
				//if we do a bunch of these at the same time, only run the first. The others will get picked up.
				_forceUpdateBuffer[model.name] = _forceModelUpdate.bindDelay(state, 200, model);
			}
		} 
	};
	
	state.resetTimestamp = function(name) {
		if(state.models[name]) {
			state.models[name].timestamp = 0;	
		}
	};
	
	state.login = function(uname, pword, cb, errCb) {
		var params = {};
		if(uname && pword) {
			params.username = uname;
			params.password = pword;
		}
		if(_state.companyId) {
			params.company_id = _state.companyId;
		}
		sb.api.post(sb.urls.url(sb.urls.LOGIN), params, cb, errCb, state.unauthorized);
	};
	
	state.reset = function(cid) {
		_state.session = state.session_unknown;
		if(cid) {
			_state.companyId = cid;
		}
		_state.block = null;
		_state.news = null;
		_state.kpi = null;
		_state.risk = null;
		_state.tag = null;
		sb.queue.add(sb.models.reset.bind(sb.models), "sblight_models_reset");
	}

	state.logout = function() {
		sb.api.post(sb.urls.url(sb.urls.LOGOUT));
		state.reset();
	};
	
	state.changeCompany = function(cid) {
		state.reset(cid);
		sb.queue.add(state.publish.bind(state, "session"), "sblight_state_publish");
	};
	
	state.forceModelUpdate = function(model) {
		if(_forceUpdateBuffer[model.name]) {
			clearTimeout(_forceUpdateBuffer[model.name]);
			_forceUpdateBuffer[model.name] = null;
		}
		
		if(!_forceUpdateBusy[model.name] && state.authorized()) {
			_forceUpdateBusy[model.name] = true;
			var m = state.models[model.name];
			m.timestamp = 0;
			//request the model directly, but we will only process the high level model elements
			// IF THOSE HLM elements exist
			var url = sb.urls.url(m.urlDef);
			var cb = _handleModelResponse.bind(state,model);
			sb.api.get(url, null, cb);
		}
	};
	
	
	state.any = function() { 		return true; };

	//startup -- the first state of this system. This used to be "unknown", but in some cases it's useful to
	//know that we're in the initialization phase. So we always start in the "startup" state, and then
	//move into the "unknown" state.  
	state.startup = function() {	return _state.session == state.session_startup;	};
	
	//any state but unknown 
	state.known = function() {	return _state.session != state.session_unknown;	};
	//not tried auth yet. 
	state.unknown = function() {	return _state.session == state.session_unknown;	};
	//no auth
	state.unauthorized = function() {	return  _state.session == state.session_unknown || _state.session == state.session_invalid || _state.session == state.session_startup;	};
	//invalid
	state.invalid = function() {	return  _state.session == state.session_invalid;	};
	//has user/company
	state.authorized = function() {	return _state.session == state.session_normal || _state.session == state.session_payment; };	

	//failed server response
	state.disconnected = function() { return _state.session == state.session_disconnected; };
	
	//returns true / false depending on whether the response session is valid
	state.update = function(data) {
		_updateSession(data);
		_updateModels(data);
		state.publish.bindDelay(state, 50, "session");
		return state.authorized();
	};
	
	
	//setter/getter
	//supports "State.value()" to determine the current session state
	// or normally: "sb.state.value("block") for fetching current block path. 
	state.value = function(type, val, publishUrl) {
		if(val !== undefined && _state[type] != val) {
			var from = _state[type];
			var func = _stateFunctions[type];
			var newVal = func ? func(from||null,val) : val;
			//$sblog("Setting Type: ", type, " To ", newVal, "Original:", from);
			if(type == "url") { throw "Please use State.url to change the url object directly."; }
			_state[type] = newVal;
			
			//publish is timeout delayed, so the state functions should execute before any notifications
			state.publish(type);
			
			if(_urlParts.indexOf(type) > -1) {
				_state.url = state.url();
				if(publishUrl !== false) {
					state.publish("url");
				}
			}
		}
		return _state[type];
	};
	
	state.clone = function() {
		return sb.ext.mixin({}, _state);
	};
	
	//only used for settings where we want to check the single value in a group of many
	//e.g., State.value(type) = <key 1>!<value 1>-<key 2>!<value 2>-...
	// 1223_232_222!bp-2232-223-233!bk-...
	state.getValueKey = function(type, key) {
		//$sblog("Get Value Key: ", type, key);
		var val = sb.urls.s_to_o(state.value(type));
		return val[key] || null;
	};
	
	state.setValueKey = function(type, key, value) {
		var val = sb.urls.s_to_o(state.value(type));
		if(value == null) {
			delete val[key];
		} else {
			val[key] = value;
		}
		state.value(type, sb.urls.o_to_s(val));
	};
	
	state.subscribe = function(type, cb) {
		if(!sb.ext.isFunc(cb)) {
			throw "SB_LIGHT:State -- subscribing to an event with an invalid function.";
		}
		
		//console.log(sb.version);
		sb.ext.debug("subscribing to: ", type);
		state.subscriptions[type] = state.subscriptions[type] || {};
		
		var id = "Sub_state_" + type + "_" + sb.ext.unique();
		state.subscriptions[type][id] = cb;
	};

	/**
	*	When "remove" is a func, it will not work unless the function definition
	*	has not changed. E.g., if you create a temporary
	*	function using func.bind, then you need to store
	*	that instance and use it for unsubscribing
	*/
	state.unsubscribe = function(type, remove) {
		var ext = this._sb.ext;
		var del = [];
		//collect matches
		ext.each(state.subscriptions[type], function(v,k) {
			//"remove" can be the key or the cb func
			if(v == remove || k == remove) { 
				del.push(k);
			}
		});
		del.forEach(function(el) {
			sb.ext.debug("unsubscribing from: ", type);
			delete state.subscriptions[type][el];
		})
	};

	state.publish = function(type) {
		var list = state.subscriptions[type] || [];
		var value = state.value(type);
		var ext= sb.ext;
		ext.each(state.subscriptions[type], function(v) {
			if(type.indexOf("Zoom") > -1) {
				ext.debug("Publish Zoom: ", type, value);
				v.bindDelay(null, 0, value);
			} else {
				ext.debug("Publish: ", type, value);
				v.bindDelay(null, 50, value);
			}
			
		});
	};
	
	state.addTimestamps = function(params) {
		sb.ext.debug("Adding timestamp for ", Object.keys(state.models).join(","));
		
		for (var m in state.models) {
			params[m+"_timestamp"] = state.models[m].timestamp;
		}
	};

	function _updateSession (data) {
		if(data) {
			var uid = data.user ? data.user.id : null;
			var cid = data.company ? data.company.id : null;
			if(uid != _state.userId || cid != _state.companyId) {
				_state.userId = data.user ? data.user.id : null;
				_state.companyId = data.company ? data.company.id : _state.companyId;
			}
			if(_state.block == null && data.block != null) {
				//delay so notification happens after the session is valid
				_state.block = String(data.block);
			}
		} else {
			_state.userId = /*_state.companyId =*/ null;
			_state.user = _state.company = null;
		}
		if(state.value("userId") == null) {
			sb.ext.debug("setting session to unauthorized");
			if(state.unknown() || state.startup()) {
				data.flash = {notice:"Please enter your login credentials."};
			}
			_state.session =  state.session_invalid;
		} else {
			_state.company = data.company;
			_state.user = data.user; 
			if (data.company && data.company.license && data.company.license.status =="expired") {
				sb.ext.debug("setting session to payment");
				_state.session =  state.session_payment;
			} else {
				sb.ext.debug("setting session to normal");
				_state.session =  state.session_normal;
			}
		}
		
		if(!state.authorized()) {
			sb.models.reset();
		}
		state.value("flash", data.flash);
		state.value("errors", data.errors);
	}
	
	function _updateModels (data) {
		for (var m in state.models) {
			if(data && data[m]) {
				_forceUpdateBusy[m] = _forceUpdateBuffer[m] = null;
				state.models[m].timestamp = data[m].timestamp;
				state.models[m].cb(data[m]);
			}
		}	
	}


	//Handle the response from a model which doesn't use timestamps. 
	function _handleModelResponse (model, result) {
		var res = result && result.result;
		var m = res[model.name] || res;
		
		if(model.raw() == null && m) {
			if(sb.ext.isArray(m)) {
				m = m.reduce( (function(prev,el) { 
					prev[el.id] = el;
					return prev;
				}), {});	
			}
			model._handleUpdate({added:m});
		}
		_forceUpdateBusy[model.name] = false;
	}
		
	function _handleBlockChange (oldVal, newVal) {
		state.value.bindDelay(state, 0, "previousBlock", oldVal);
		return sb.queries.blockPath(newVal).join("_");
	}
	function _handlePageChange (oldVal, newVal) {
		oldVal = oldVal || "home";
		state.value.bindDelay(state, 0, "previousPage", oldVal);
		sb.ext.debug("HandlePageChange: ", oldVal, " to ", newVal);
		return newVal;
	}
	

	return state; 	
	
});


 exports.state = sb_light.require('sb_light/api/state');








/*************************
	These functions assume that the models you need have been 
	fetched and are up to date in "sb.models"
	They're intended to be convenience functions that exploit the global
	nature of the models. 
************************/

sb_light.define('sb_light/api/queries',['sb_light/globals'], function(sb) {
	
	
	var q = {};
	
	/********************************
		COMPANIES
	*********************************/
	q.company = function(cid) {
		var cs = sb.models.raw("companies");
		cid = cid || sb.state.value("companyId");
		return (cs && cid && cs[cid] ) || null; 
	};
	
	
	/********************************
		USERS
	*********************************/
	q.fullname = function(uid) {
		var us = sb.models.raw("users");
		return us && uid && us[uid] ? us[uid].name : "<removed>";
	};
	q.firstname = function(uid) {
		var us = sb.models.raw("users");
		return us && uid && us[uid] ? us[uid].first_name : "<removed>";
	};
	q.currentUser = function() {
		var us = sb.models.raw("users");
		return (us && us[sb.state.value("userId")] ) || null;
	};
	q.user = function(uid) {
		var us = sb.models.raw("users");
		return us[uid];	
	};
	q.companyMembership = function() {
		var u = q.currentUser();
		if(u.company_membership) {
			return u.company_membership;
		} else {
			//TODO: Remove this code - legacy api.
			var c = q.company();
			return u && c && u.companies[c.id] || null;
		}
	}; 
	q.userDate = function(date, opts) {
		var u = q.currentUser();
		return sb.moment(date, opts).format(u.date_format);	
	
	};
	var _serverDateFormat =  "YYYY/MM/DD";
	q.userToServerDate = function(date, opts) {
		var u = q.currentUser();
		var m = sb.moment(date, u.date_format);
		return m.format(_serverDateFormat);
	};
	
	q.authors  = function() {
		var cid = sb.state.value("companyId");
		return sb.models.rawArray("users").filter(function(el) {
			
												//TODO: Remove legacy API support
			var cm = el.company_membership || (el.companies && el.companies[cid] || null);
			return cm && cm.active && (cm.role == "Author" || cm.role =="Administrator");
		}).sort(sb.ext.sortUsers);
	};
	
	/********************************
		FOCUS AREAS
	*********************************/
	q.focusArea = function(fid) {
		var fs = sb.models.raw("focus");
		return fs && fs[fid] ? fs[fid].title : null;
	};
	q.focusAreaDesc = function(fid) {
		var fs = sb.models.raw("focus");
		return fs && fs[fid] ? fs[fid].description : null;
	};
	
	/********************************
		Levels
	*********************************/
	q.levelColor = function(id) {
		var ls = sb.models.raw("levels");
		var c = ls && ls[id] ? ls[id].color : null; 
		return c ? sb.ext.to_color(c) : null;
	};
	q.levelName = function(fid) {
		var ls = sb.models.raw("levels");
		return ls && ls[id] ? ls[id].title : null;
	};
	q.levelPos = function(fid) {
		var ls = sb.models.raw("levels");
		return ls && ls[id] ? ls[id].title : null;
	};
	


	/********************************
		NEWS
	*********************************/
	
	q.currentNewsItem = function() {
		var id = sb.state.value("news");
		var model = sb.models.raw("news");
		
		return model && id ? model[id] : null;	
	};
	
	var _newsMsgRE = /%(users|blocks)_(\d+)%/g;
	q.newsMessage = function(n) {
		var re= _newsMsgRE;
		var blocks = sb.models.raw("blocks");
		var users = sb.models.raw("users");
		
		return n.msg.replace(re, function(match,type, id) {
			if(type == "blocks") {
				return blocks[id] ? blocks[id].title : "(unknown block)"; 
			}
			if(type == "users") {
				return users[id] ? users[id].name : "(unknown user)";
			}
		});	
	};
	
	var _newsUsersRE = /%users_(\d+)%/g;
	q.newsUsers = function(n) {
		var re = _newsUsersRE;
		var users = [];
		var match = null;
		do {
			if(match) { users.push(match[1]); }
			match = re.exec(n.msg);
		} while(match);
		return users;
	};
	
	var _newsBlocksRE = /%blocks_(\d+)%/g;
	q.newsBlocks = function(n) {
		var re = _newsBlocksRE;
		var blocks = [];
		var match = null;
		do {
			if(match) { blocks.push(match[1]); }
			match = re.exec(n.msg);
		} while(match);
		return blocks;
	};
	
	

	/********************************
		BLOCKS
	*********************************/
	q.currentBlock = function() {
		return q.block(q.currentBlockId()); 
	};
	q.previousBlock = function() {
		return q.block(q.previousBlockId()); 
	};
	q.rootBlock = function() {
		var c= sb.state.value("company");
		return c ? q.block(c.root_block.id) : null; 
	};
	q.currentBlockId = function() {
		var p = q.currentBlockPath(); 
		return (p && p.length) ? p.last() : null;
	};
	q.previousBlockId = function() {
		var p = q.previousBlockPath(); 
		return (p && p.length) ? p.last() : null;
	};
	q.currentBlockPath = function(str/*==false*/) {
		return q.blockPath(sb.state.value("block"), str);
	};
	q.currentBlockLevel = function() {
		return q.blockLevel(q.currentBlockPath());		
	};
	q.previousBlockPath = function(str/*==false*/) {
		var pp = sb.state.value("previousBlock") || sb.state.value("company").root_block.id;
		return q.blockPath(pp, str);
	};
	q.previousBlockLevel = function() {
		return q.blockLevel(q.previousBlockPath());		
	};
	q.managedBlocks = function() {
		return sb.models.rawArray("blocks").reduce(function(pre, el) {
			if(el.is_manager) {
				return pre.put(el);
			} 
			return pre;
		}, []);
	};
	q.parentPath = function(bpath, str/*==false*/) {
		bpath = q.blockPath(bpath);
		return q.blockPath(bpath.slice(0,-1), str);
	};
	q.blockParentInfo = function(bpath) {
		bpath = q.blockPath(bpath);
		var b = q.block(bpath);
		if(b && b.parents && b.parents.length) {
			return b.parents.find("parent_id", bpath.last(1)).value;
		}
		return null;	
	};
	
	q.blockPath = function(bpath, str/*==false*/) {
		bpath = _pathToArray(bpath);
		var b = q.block(bpath);
		if(b && bpath.length < 2 && b.parents.length > 0) {
			bpath = b.default_path;
		}
		return str ? bpath.join("_") : bpath;
	};

	var _pathToArray = function(bpath) {
		if(typeof bpath == "array") { return bpath; }
		if(typeof bpath == "number") { return [String(bpath)]; }
		if(typeof bpath == "string") { return bpath.split("_"); }
		return bpath;
	};
	
	q.blockId = function(bpath) {
		bpath = _pathToArray(bpath);
		return (bpath && bpath.length) ? bpath.last() : null;
	};
	
	q.block = function(bpath) {
		var bid = q.blockId(bpath);
		var blocks = sb.models.raw("blocks");
		return bid && blocks && blocks[bid] ? blocks[bid] : null;
	};
	
	q.blockLevel = function(bpath) {
		var pinfo = q.blockParentInfo(bpath||q.currentBlockPath());
		return pinfo ? pinfo.level : 0;
	};
	
	q.childrenPaths = function(bpath, str/*==false*/) {
		//array, so we can concat
		bpath = q.blockPath(bpath);
		var b= q.block(bpath);
		//concat each child id to the bpath array and return using internal blockPath function, passing the "str" option. 
		return b ? 
				b.children.map(function(el) { return q.blockPath(bpath.concat([el]), str); }) :
				null; 
		
	};
	q.parentPaths = function(bpath, str/*==false*/) {
		var b= q.block(bpath);
		return b.paths.reduce(function(prev,el) {
					var pp =  sb.queries.parentPath(el, str);
					return pp && pp.length  ? prev.put(pp) : prev;
		}, []);
	};
	
	//includes siblings from *ALL* parents
	q.siblingPaths = function(bpath, str/*==false*/) {
		var b= q.block(bpath);
		return b.paths.reduce(function(prev,el) {
			var cp = sb.queries.childrenPaths(sb.queries.parentPath(el), str);
			if(cp) {
				cp = cp.filter(function(el) { 
					return sb.queries.blockPath(el,true) != sb.queries.blockPath(bpath,true); 
				});  
				return prev.concat(cp);
			} 
			return prev;
		}, []);
	};
	
	
	q.arePathsEqual = function(apath, bpath) {
		return q.blockPath(apath, true) == q.blockPath(bpath, true);
	};
	q.isCenterPath = function(apath) {
		return q.currentBlockPath(true).indexOf(q.blockPath(apath,true)) > -1;
	};
	q.isCurrentPath = function(apath) {
		return q.arePathsEqual(apath, q.currentBlockPath());
	};
	
	
	q.maxDate = function() {
		return sb.ext.moment(q.rootBlock().end_date);
	};
	q.minDate = function() {
		return sb.ext.moment(q.rootBlock().start_date);
	};

	//returns the available range of dates for the date picker on this block
	// 1. Block cannot START earlier than its parent blocks
	// 2. Block cannot START later than its earliest child start date, or the parent's end date
	// 3. Block cannot  END before its parent's start date or it's latest child's end date.
	// 4. Block cannot END after its parent unless that parent it floating
	q.dateRange = function(b) {
		var dates = {
			minStart: sb.moment(new Date(1980,1,1)),	
			maxStart: sb.moment(new Date(2038,12,31)),	
			minEnd: sb.moment(new Date(1980,1,1)),	
			maxEnd: sb.moment(new Date(2038,12,31))	
		};
		
		var p = q.block(b.default_parent);
		var maxsd = b.children.map(function(cid) { return q.block(cid).start_date; }).put(p ? p.end_date : dates.maxStart);
		var mined = b.children.map(function(cid) { return q.block(cid).end_date; }).put(p ? p.start_date : dates.minEnd);
		
		
		dates.maxStart = sb.ext.minDate.apply(null, maxsd);
		dates.minStart =  p ? p.start_date : dates.minStart;
		dates.maxEnd = p && !p.floating_end_date ? p.end_date : dates.maxEnd;
		dates.minEnd = sb.ext.maxDate.apply(null, mined);
		return dates;
	};
	
	
	q.is_link = function(parent_id, child_id) {
		return _parent_child_link(parent_id, child_id).linked_parent_id != null;
	};
	
	q.custom_progress_weight = function(parent_id, child_id) {
		return sb.ext.to_i(_parent_child_link(parent_id, child_id).custom_progress_weight);
	};
	
	var _parent_child_link = function(parent_id, child_id) {
		var blocks = sb.models.raw("blocks");
		var parent = blocks[parent_id]; 
		var child = blocks[child_id];
		
		if (parent.children.indexOf(child_id) == -1) {
			throw new Error("Block(" + child_id + ") is not a parent of block(" + parent_id + ")");
		}
		
		return child.parents.reduce(function(pre, mel) {return mel.parent_id == parent_id ? pre.put(mel) : pre;}, [])[0];
	};
	
	q.progressVariance = function(bpath) {
		var b = q.block(bpath);
		if(b) {
			var a = b.percent_progress || 100;
			var t = b.expected_progress || 0;
			return t > 0 ? Math.round((a-t)/t*100) : 100;
		}
		return 0;
	};
	
	//recursive function -- no arguments are required on initial call
	//1. If you supply arguments, you can build a subtree
	//2. This function is designed to build trees for the map layout using D3.js
	//3. Linked nodes are duplicated in the structure. 
	//4. If cpath is not passed, cpath is set to the actual root. 
	//5. If ppath is not passed, "cpath" is considered the current root: this is useful
	//			for re-orienting the tree around the currently selected block
	//6. If cpath and ppath is passsed on the initial call, the tree returned will be a branch
	//		
	//6. Blocks is only passed to simplify the recursion -- should never be necessary to pass it
	//			unless you want a tree using a subset of data (
			
	q.blockFullTree = function(cpath,ppath, blocks) {
		blocks = blocks || sb.models.raw("blocks");
		if(!blocks) { return; }
		
		cpath = q.blockPath(cpath || q.rootBlock().default_path);
		ppath = ppath ||[];
		//var ppath = ppath ||cpath.slice(0,-1);                                        
		var b = blocks[cpath.last()];
		
		var d = {
			name: b.title,
			data: b,
			path: cpath,
			children: []
		};

		var children = b.children.cloneExcept(ppath.last());
		children.map(function(el) { return cpath.concat([el]); });
		var rp = cpath.last(1);
		if( rp && ppath.last() != rp) {
			children.unshift(cpath.slice(0,-1));
		}
				
		var size = 1;
		var child;
		
		children.forEach(function(el) {
			var child = q.blockFullTree(el, cpath, blocks);
			size += child.size;
			d.children.put(child);
		});
		d.size  = size;
		return d;
	};


	//linear function that builds the center list from the current block to the root. 
	//1. takes the previous block id so that the position of the children can reflect
	//		where we've come from. 
	
	q.buildStrategyTree = function(prevBlockId) {
		var bpath = q.currentBlockPath();
		var b = q.currentBlock();
		var blocks = sb.models.raw("blocks"); 
		if(!bpath || !b || !blocks) { return null; }
		
		var centerList = bpath.reduce(function(prev, el) {
			var last  = prev.last() || [];
			prev.put(last.concat([el]));
			return prev;
		},[]);
		
		var dy = -(centerList.length-1);
		
		if(b.children.length) {
			var cidx = b.children.indexOf(prevBlockId);
			var cid = b.children[cidx < 0 ? 0 : cidx];
			centerList.push(centerList.last().concat([cid]));
		}
		
		//temp super parent to our root object to simplify the special cases
		var superRoot = {};
		var pnode = superRoot;
		

		//walk down the center
		centerList.forEach(function(cpath) {
			var ppath = sb.ext.slice(cpath,0,-1);
			var pid = ppath.last();
			var cid  = cpath.last();
			
			var siblings = pid ? blocks[pid].children : [cid];
			var cidx = siblings.indexOf(cid);
			
			pnode.children = siblings.map(function(el, idx) {
				var path = ppath.concat([el]).join("_");
				var defaultType = sb.state.value(sb.consts.STATE.BLOCKS_TREE_VIEW);
				var localType = sb.state.getValueKey(sb.consts.STATE.BLOCK_SETTINGS_VIEW, path);
				if(!localType || localType == sb.consts.BLOCK_SETTINGS.VIEW.DEFAULT.key) {
					localType = defaultType;
				} 	

				
				return {
					path:path,
					dy:dy,
					dx:(idx - cidx),
					data: blocks[el],
					viewType: localType
				};
			});
			
			dy += 1;
			pnode = pnode.children[cidx];
		});
		return superRoot.children[0];
	};
	
	return q;
});



 exports.queries = sb_light.require('sb_light/api/queries');




sb_light.define('sb_light/api/urls',['sb_light/globals'], function(sb) {
	//console.log("urls", sb.version);
	var _regExprs = {};

	var urls = {
		//******************************API URLS **********************************************/
		MODEL_BLOCKS:		{url: "/blocks.js", 					post:false},
		MODEL_COMPANIES:	{url: "/companies.js", 					post:false},
		MODEL_CAPABILITIES: {url: "/company_settings.js", 			post:false},
		MODEL_EXPORTS: 		{url: "/exports.js", 					post:false},
		MODEL_FOCUS: 		{url: "/focus.js", 						post:false},
		MODEL_GROUPS: 		{url: "/groups.js", 					post:false},
		MODEL_KPIS: 		{url: "/kpis.js", 						post:false},
		MODEL_RISKS: 		{url: "/risks.js", 						post:false},
		MODEL_LEVELS: 		{url: "/levels.js", 					post:false},
		MODEL_NEWS: 		{url: "/news.js", 						post:false},
		MODEL_LICENSES:		{url: "/licenses.js", 					post:false},
		MODEL_PROGRESS:		{url: "/blocks/progress.js", 			post:false},
		MODEL_HEALTH: 		{url: "/health_calculations.js", 		post:false},
		MODEL_NPV: 			{url: "/blocks/npv.js", 				post:false},		
		MODEL_RISK: 		{url: "/blocks/risk.js", 				post:false},		
		MODEL_USERS: 		{url: "/users.js", 						post:false},
		MODEL_TAGS:			{url: "/tags.js", 						post:false},
		MODEL_TIMEZONES: 	{url: "/companies/timezones.js", 		post:false},
		MODEL_DASHBOARD: 	{url: "/reports/dashboard_layout.js", 	post:false},
			
		BLOCKS_CONTEXT:					{url: "/blocks/context/%id%.js"},
		BLOCKS_CLOSE: 					{url: "/blocks/close/%id%.js", deleteId: true},
		BLOCKS_MANAGE_CHILDREN: 		{url: "/blocks/manage_children/%id%.js", deleteId: true},
		BLOCKS_DELETE :					{url: "/blocks/%type%/%id%.js", normalParams:true},
		BLOCKS_DOCUMENTS: 				{url: "/blocks/documents/%id%.js"},
		BLOCKS_IMPORT 	:				{url: "/blocks/import/%id%.js"},
		BLOCKS_INVITE 	:				{url: "/blocks/invite/%id%.js"},
		BLOCKS_MAKE_PUBLIC :			{url: "/blocks/make_public/%id%.js", normalParams:true},
		//BLOCKS_MOVE_POSITION 			{url: "/blocks/move_position_%dir%/%id%.js"},
		BLOCKS_MOVE :					{url: "/blocks/move/%id%.js", normalParams:true},
		BLOCKS_PROPERTIES: 				{url: "/blocks/%type%/%id%.js"},
		BLOCKS_RELOCATE: 				{url: "/blocks/reassign_parent/%id%.js", normalParams:true},
		BLOCKS_UPDATE: 					{url: "/blocks/update/%id%.js", massageParamsFunc: "massageParamsForBlockUpdate"},
		BLOCKS_UNWATCH: 				{url: "/blocks/unwatch/%id%.js"},
		BLOCKS_WATCHING_USERS: 			{url: "/blocks/watching_users/%id%.js"},
		BLOCKS_TAGGED: 					{url: "/blocks_for_tag/%name%.js"},
		BLOCKS_UPDATE_GROUPS :			{url: "/blocks/update_group_expression/%id%.js", normalParams:true},
		BLOCKS_CHANGE_CHARTED_KPI: 		{url: "/blocks/set_default_kpi/%id%.js"},
		BLOCKS_UPDATE_CASHFLOWS: 		{url: "/blocks/update_net_cashflows/%id%.js"},
		BLOCKS_HEALTH :					{url: "/blocks/health.js", normalParams:true},
		BLOCKS_PROGRESS :				{url: "/blocks/progress.js", normalParams:true},
	
		BLOCK_FILES_UPLOAD_URL: 		{url: "/blocks/%id%/documents/create.js"},
		BLOCK_FILES_DOWNLOAD_URL: 		{url: "/blocks/%id%/documents/show/%doc_id%.js"},
		BLOCK_FILES_DELETE: 			{url: "/blocks/%id%/documents/destroy/%doc_id%.js"},
		
		BOOKMARKS:						{url: "/saved_client_states/index.js"},
		BOOKMARK_CREATE_DYNAMIC:		{url: "/saved_client_states/create_dynamic.js"},
		BOOKMARK_SAVE_DYNAMIC:			{url: "/saved_client_states/%id%/save_dynamic.js", normalParams:true},
		BOOKMARK_CREATE:				{url: "/saved_client_states/create.js", normalParams:true},
		BOOKMARK_UPDATE:				{url: "/saved_client_states/%id%/update.js", normalParams:true},
		BOOKMARK_DELETE:				{url: "/saved_client_states/%id%/delete.js"},
				 
		COMMENT_PROPERTIES_ADD: 		{url: "/blocks/%id%/comment.js", normalParams:true, deleteId:true},
		
		
		COMPANIES_CREATE: 				{url: "/companies/create.js"},
		COMPANIES_UPDATE: 				{url: "/companies/update.js"},
		COMPANIES_HEALTH: 				{url: "/health_calculations.js"},
		COMPANIES_HEALTH_CREATE: 		{url: "/health_calculations/create.js"},
		COMPANIES_HEALTH_UPDATE :		{url: "/health_calculations/%id%/update.js"},
		COMPANIES_HEALTH_DELETE: 		{url: "/health_calculations/%id%/destroy.js"},
		COMPANIES_HEALTH_DEFAULT: 		{url: "/health_calculations/%id%/set_default.js"},
		COMPANIES_LOGO_PREVIEW_URL: 		{url: "/upload/company_logo_preview.js"},
		COMPANIES_REMOVE_PREVIEW_LOGO: 	{url: "/upload/remove_company_logo_preview.js"},
		
		
		CAPABILITIES_UPDATE: 			{url: "/company_settings/update.js"},
		
		
		
		EXPORTS_CREATE :			{url: "/exports/%id%/create.js"},
		EXPORTS_REPORT :			{url: "/exports/%id%/create.js"},
		EXPORTS_DELETE :			{url: "/exports/%id%/destroy.js"},
		
		FOCUS_CREATE :				{url: "/focus/create.js"},
		FOCUS_UPDATE: 				{url: "/focus/update/%id%.js", deleteId: true},
		FOCUS_DELETE :				{url: "/focus/destroy/%id%.js", deleteId: true},
		FOCUS_REPARENT :			{url: "/focus/reparent/%id%.js"},
		
		GROUPS_CREATE: 				{url: "/groups/create.js"},
		GROUPS_DELETE :				{url: "/groups/%id%/destroy.js", deleteId: true},
		GROUPS_UPDATE: 				{url: "/groups/%id%/update.js", deleteId: true},
		GROUPS_ADD 	:				{url: "/groups/%id%/add.js"},
		GROUPS_REMOVE :				{url: "/groups/%id%/remove.js"},
	
	
		RISKS_CREATE :				{url: "/risks/create.js"},
		RISKS_DESTROY :				{url: "/risks/%id%/destroy.js"},
		RISKS_UPDATE :				{url: "/risks/%id%/update.js"},
		RISKS_UPDATE_STATUS: 		{url: "/risks/%id%/update_status.js"},
		RISKS_ADD_IMPACT :			{url: "/risks/%id%/add_impact.js"},
		RISKS_REMOVE_IMPACT: 		{url: "/risks/%id%/remove_impact.js"},
		RISKS_ATTACH_DOC: 			{url: "/risks/%id%/attach_document.js"},
		RISKS_SHOW_DOC :			{url: "/risks/%id%/show_document/%doc_id%.js"},
		RISKS_DESTROY_DOC: 			{url: "/risks/%id%/destroy_document.js"},
		RISKS_DUMMY_REFRESH :		{url: "/risks/%id%/refresh_risk.js"},
		RISKS_SETTINGS: 			{url: "/risk_profiles/update_risk_settings.js"},
		RISKS_MATRIX_SIZE :			{url: "/risk_profiles/set_matrix_size.js"},
		RISKS_PROFILES_UPDATE: 		{url: "/risk_profiles/update_batch.js"},
		
		
	
		KPIS_CREATE :				{url: "/kpis/create.js"},
		KPIS_DESTROY: 				{url: "/kpis/%id%/destroy.js"},
		KPIS_UPDATE :				{url: "/kpis/%id%/update.js"},
		KPIS_ATTACH_BLOCK: 			{url: "/kpis/%id%/attach.js"},
		KPIS_DETACH_BLOCK :			{url: "/kpis/%id%/detach.js"},
		
		LEVELS_UPDATE: 				{url: "/levels/update.js"},
		
		MEASURES_BLOCKS: 			{url: "/blocks/measure_values/%id%.js"},
		
		USERS_CREATE :				{url: "/users/create.js"},
		USERS_CREATE_BATCH: 			{url: "/users/create_batch.js"},
		USERS_ADD_GROUP: 			{url: "/users/%id%/add_group.js", normalParams:true},
		USERS_REMOVE_GROUP: 			{url: "/users/%id%/remove_group.js", normalParams:true},
		USERS_ACTIVATE :				{url: "/users/%id%/activate.js"},
		USERS_DEACTIVATE: 			{url: "/users/%id%/deactivate.js"},
		USERS_UPDATE: 				{url: "/users/%id%/update.js", deleteId: true},
		USERS_REMOVE_MEMBERSHIP: 	{url: "/users/%id%/delete_membership.js"},
		USERS_CHANGE_MEMBERSHIP: 	{url: "/users/%id%/update_membership.js", deleteId: true},
		
		USERS_CHANGE_DEFAULT_COMPANY:	{url: "/users/%id%/change_default_company.js", normalParams:true},
		
		REGISTER_COMPANY: 		{url: "/registration/register_company.js"},
		
		LOGIN :						{url: "/login/auth.js"},
		LOGOUT: 					{url: "/login/logout.js"},
		
		//Args:
		//	username: users email address
		LOGIN_FORGOT_PASSWORD: 		{url: "/login/forgot_password.js", normalParams:true},
		
		LOGIN_REMEMBER_ME :			{url: "/login/remember_me.js"},
	
		URL_SAVE_BOOKMARK :			{url: "/users/save_bookmark.js"},
		PAYMENTS :					{url: "/purchases/index.js"},
		PAYMENTS_QUOTE :				{url: "/purchases/quote.js"},
		PAYMENTS_CREATE: 			{url: "/purchases/create.js"},
		
		ADMIN_RAISE: 				{url:"/admin/log_client_error.js"}
	};
	
	
	
	urls.url = function(urlObj, params) {
		if(!urlObj || !urlObj.url) {
			throw new Error("Url does not exist: " + urlObj);
		}
		params = params || {};
		var s = urlObj.url;
		for (var p in params) {
			s = s.replace(_regExpr(p), params[p]);
		}
		if(s.indexOf("%") > -1) {
			throw new Error( "Bad url." + s);
		}
		return sb.state.host + s ; 
	};
	
	var _regExpr = function(s) {
		//build and cache the regexp. There's a small finite number of them, so just cache them when they're created. 
		_regExprs[s] = _regExprs[s] || new RegExp("\%"+s+"\%");
		return _regExprs[s];
	};
	
	urls.massageParamsForBlockUpdate = function(params) {
		delete params.id;
		return params;
	};
	
	//convers a sub-url pattern into an object
	// e.g., blockSettings=blockA!bs-blockB!bp
	// into:
	//	{ blockA: bs, blockB:bp }
	urls.s_to_o = function(s) {
		return !s ? {} : s.split("-").reduce(function(prev, el) { 
			//shorthand way of setting a property and returning it on one line
			return !el ? prev : sb.ext.set.apply(Object, ([prev]).concat(el.split("!")));
		}, 	{});
	};

	//The reverse of s_to_o
	urls.o_to_s = function(o) {
		return sb.ext.map(o, function(v,k) {
			return [k,v].join("!");
		}).join("-");
	};
	
	//converts several types into a url object
	//STRING: key=value;foo=bar
	//ARRAY: [[key,value],[foo,bar]]
	//		[{key:value}, {foo:bar}]
	// OBJECT: returns self.
	urls.url_to_o = function(url) {
		var o = typeof(url) == "string" ? url.split(";") : url;
		o = sb.ext.isArray(o)  ? o : o.reduce(function(prev,el) {
			el = typeof(el) == "string" ? el.split("=") : el;
			if(sb.ext.isArray(el)) {
				prev[el[0]] = el[1];
			} else if (el.key) {
				prev[el.key] = el.value;
			} else {
				throw "URL Cannot be parsed: " + JSON.stringify(url);
			}
			return prev;
		}, {});
		return o;
	};
	

	//turn an object into url params
	urls.o_to_params = function(obj) {
		return sb.ext.map(obj, function(v,k){
			return k + "=" + encodeURIComponent(v);
		}).join("&")
	}
	
	return urls;
});


 exports.urls = sb_light.require('sb_light/api/urls');





sb_light.define('sb_light/api/api',['sb_light/globals'], function(sb) {
	var api = {};

	var _errorData = null;
	var _errorTimeout = 50;
	var _errorTimeoutDefault = 50;
	var _requestQueue =  [];

		
	api.get = function(url, params, success, failure, stateCheck) {
		api.request(url,params, false, success,failure,stateCheck);
	};
	
	api.post = function(url, params, success, failure, stateCheck) {
		api.request(url,params, true, success,failure,stateCheck);
	};

	api.request =  function(url, params, post, success,failure, stateCheck) {
		var stateFunc = (stateCheck || sb.state.authorized);
		if(stateFunc.call(sb.state)) {
			_request(url, params, post, success, failure); 
		} 
	};
	
	function _request (url, params, post, success, failure) {
		sb.ext.debug("Sending request to ", url, post, JSON.stringify(params));
		if(!api.ajax) {
			throw "Error: sb.api.ajax has not been inititalized. Please set this value to one of the functions available in sb.ajax";
		}
		params = params || {};
		sb.state.addTimestamps(params);
		api.ajax({
			url: url,
			type: (post ? "POST" : "GET"),
			data:params,
			dataType: 'json',
			context: api,
			success: _success.bind(null, sb.ext.slice(arguments)),
			error: _failure.bind(null, sb.ext.slice(arguments))
		});
	}

	function _success(reqArray, data) {
		sb.ext.debug("SUCCESS: SB_Api", reqArray, data);
		_errorTimeout = _errorTimeoutDefault;
		
		var wasValid = sb.state.authorized();
		
		if (sb.state.update(data) ) {
			//success function in the original call
			var errors = sb.ext.getResultMessages(data).errors;
			
			if(!errors && reqArray[3]) {
				reqArray[3](data);
				_popQueue();
			}
			if(errors && reqArray[4]) {
				reqArray[4](data);
				_popQueue();
			}
		} else {
			if(wasValid) {
				//clear the queue
				_requestQueue.length = 0;
			}
			if(reqArray[4]) {
				reqArray[4](data);	
			}	
		}
	}
	
	function _failure (reqArray, data) {
		sb.ext.debug("FAILURE SB_Api", JSON.stringify(data));
		sb.state.value("session", sb.state.session_disconnected);
	}
	
	function _pushQueue (data) {
		var key = data.url + (JSON.stringify(data.params) || "");
		sb.ext.debug("Pushing request on the queue: ", key);
		if(_requestQueue.filter(function(el) { return el.key == key; } ).length == 0) {
			_requestQueue.push({key:key, data:data});
		}
	}
	
	function _popQueue () {
		if(_errorData) {
			sb.ext.debug("Running Error Request");
			_request.apply(this, this._errorData);
		} else if (_requestQueue.length > 0) {
			var r = _requestQueue.shift().data;
			if(r.state()) {
				_request.call(null, r.url, r.params, r.post, r.success, r.failure);
			} else {
				r.count += 1;
				if(r.count < this._maxRetries) {
					_pushQueue.bindDelay(null, _retryDelay, r);
				}
				_popQueue();
			}
		}
	}
	
	return api;
});



 exports.api = sb_light.require('sb_light/api/api');



/*globals define, Ti */

sb_light.define('sb_light/api/ajax',['sb_light/globals'], function(sb) {
	
	var ajax = {};


	ajax.d3 = function(d3) { return function(opts) {
		var url = opts.url.replace(/^(https?:\/\/)/, "//");
		var data =  sb.urls.o_to_params(opts.data);
		if(opts.type !== "POST" && data) {
			url += "?" + data;
		}
		var xhr = d3.json(url)
			.on("load", function(res) {
				//var resp = JSON.parse(res.responseText);
				opts.success(res);
			})
			.on("error", function(res) {
				//var resp = JSON.parse(res.responseText);
				opts.error(res);
			})
		;
		if(sb.state.host !== window.location.host) {
			xhr.header("Access-Control-Request-Method", opts.type);
		}


		if(opts.type !== "POST") {
			xhr.get();
		} else {
			xhr.header("Content-type", "application/x-www-form-urlencoded");
			xhr.post(data);
		}
	};};

	ajax.dojo = function(dojoRequest) { return function(opts) {
		opts.url = opts.url.replace(/^(https?:\/\/)/, "//");
		sb.ext.debug("dojo ajax", opts.type, opts.url);
		dojoRequest(opts.url, {
			method:opts.type,
			data:opts.data

		}).then(opts.success,opts.error);
	};};

	ajax.jquery = function(jquery) { return function(opts) {
		var cd = (sb.state.host != window.location.host);

		opts.url = cd ? opts.url.replace(/^(https?:\/\/)/, "//") : opts.url.replace(/^(https?:\/\/)?.+?\//, "/");
		sb.ext.debug("jquery ajax", opts.type, opts.url);
		

		jquery.ajax({
			type: 		opts.type,
			url: 		opts.url,
			data:		opts.data,
			dataType: 	opts.dataType,
			crossDomain: cd
		})
		.done(opts.success)
		.fail(opts.error);
	};};


	ajax.node = function(requestAgent) {  return function(opts) {
		sb.ext.debug("Request Agent: ", requestAgent);
		var _req = opts.type === "POST" ? requestAgent.post(opts.url).send(opts.data) :
										requestAgent.get(opts.url).query(opts.data);
		
		_req.set("Accept", "application/json")
			.end(function(res) {
				if(res.ok) {
					sb.ext.debug("Node Ajax success!", res.text);
					if(opts.success) {
						opts.success(JSON.parse(res.text));
					}
				} else {
					sb.ext.debug("Node Ajax Error", res.text);
					if(opts.error) { 
						opts.error(res.text);
					}
				}	
			})
		;
	};};
	

	ajax.titanium = function() {	return function(opts) {
		var p, str;
		if(!sb.ext.ti()) { return; }
		
	    // Merge with default props
	    var o = sb.ext.merge({
	        type: 'GET',
	        url: null,
	        data: false,
	        contentType: 'application/json',
	            // Ti API Options
	            async: true,
	            autoEncodeUrl: true,
	 
	            // Callbacks
	            success: null,
	            error: null,
	            beforeSend: null,
	            complete: null
        }, opts);
	 
       // Ti.API.info("XHR " + o.type + ": \n'" + o.url + "'...");
        var xhr = Ti.Network.createHTTPClient({ autoEncodeUrl: o.autoEncodeUrl,   async: o.async   });
 		if(o.type === "GET" && o.data) {
 			str = [];
 			for(p in o.data) {
 				str.put( p + "=" + encodeURIComponent(o.data[p]) );
 			}
 			o.url += "?" + str.join("&");
 			delete o.data;	
 		}
        // URL
        xhr.open(o.type, o.url);
	 
        // Request header
	    xhr.setRequestHeader('Content-Type', o.contentType);
	
        if(o.beforeSend) {
            o.beforeSend(xhr);
        }
	 
        // Errors
	    xhr.setTimeout(10000);
	    xhr.onerror = function() {
	       // Ti.API.info('XHR "onerror" ['+this.status+']: '+this.responseText+'');
	            if(null !== o.error) {
	                return o.error(this);
	            }
	        };
	    xhr.onload = function() {
	        // Success
	        // Log
	        //Ti.API.info('XHR "onload" ['+this.status+']: '+this.responseText.substr(200)  +'');
	 
            // Success = 1xx or 2xx (3xx = redirect)
	        if(this.status < 400) {
	            try {
	                if(null !== o.success) {
	                	var json = JSON.parse(this.responseText);
	                    return o.success(json);
	                }
	            } catch(e) {
	                Ti.API.error('XHR success function threw Exception: ' + e);
	                return;
	            }
	        // Error = 4xx or 5xx
	        } else {
	           //Ti.API.info('XHR error ['+this.status+']: '+this.responseText+'');
                if(null !== o.error) {
                    return o.error(this);
                }
            }
		};
	 
	    // Send
	    if(o.data) {
	        //Ti.API.info(o.data);
	        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(o.data);
		} else {
		    xhr.send();
		}
	 
        // Completed
	    if(null !== o.complete) {
	        return o.complete(this);
	    }
		
	};};
	
	

	
	return ajax;

});

 exports.ajax = sb_light.require('sb_light/api/ajax');




sb_light.define('widgets/layoutWidget',['widgets/widget'], function( Widget ) {

	var LayoutWidget = Widget.extend({

		_layout: null,

		init:function(sb, parentNode, def) {
			this._rootElement = this._rootElement || "div";
			this._super(sb, parentNode, def		);
		},
		//create the 
		createDom:function(opts) {
			opts.widget = this._rootElement;
			this._dom = this._super(opts);
			this._layout = this._sb.layout.parse(this,this.childrenLayout(), true);
			return this._dom;
		},

		childrenLayout: function() {
			return [];
		},


		child: function(id) {
			return this._layout.widgets[id] || this._layout.widgets[this.cid(id)];
		},

		//called by a high-level layout, but we need to apply these sizes to the root of our DOM
		//and run the resize/
		applyLayout:function() {
			this._super();
			this._sb.queue.add(this.bind("handleResize"), "handleResize_"+this.id());
		},

		handleResize: function(e) {
			this._super(e);
			var rect = this._dom.getBoundingClientRect();
			this._layout.rootWidth = rect.width;
			this._layout.rootHeight = rect.height;
			this._sb.layout.resize(this._layout);
		}

	});

	return LayoutWidget;

});

 exports.layoutWidget = sb_light.require('widgets/layoutWidget');




sb_light.define('widgets/formInput',['widgets/layoutWidget'], function( LW ) {

	var FormInput = LW.extend({


		create:function() {
			this._name = "layoutWidget::formInput";
			this._super();
		},

		_propertyOverrides: function() { 
			var po = this._super();
			po.type = this.bind("type");
			po.value = this.bind("value");
			po.label = this.bind("label");
			po.error = this.bind("error");
			return po;
		},

		type: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "type" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("input")].property("type", value);	
				return this;
			}
			return this._layout.widgets[this.cid("input")].property("type");
		},
		label: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "label" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("label")].text(value);	
				return this;
			}
			return this._layout.widgets[this.cid("label")].text();
		},
		value: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "value" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("input")].dom().value = value;	
				return this;
			}
			return this._layout.widgets[this.cid("input")].dom().value;
		},
		error: function(__ignore__, value) {
			var args =this._sb.ext.slice(arguments, arguments[0] == "error" ? 1 : 0);
			if(args.length) {
				this._layout.widgets[this.cid("error")].text(value);	
				return this;
			}
			return this._layout.widgets[this.cid("error")].text();
		},

		childrenLayout:function() {
			return [
				{id:this.cid("label"), widget:"label", left:10, width:"24%", height:20, top:0, text:"Test Form Widget", style:"text-align:right"},
				{id:this.cid("input"), widget:"input", left:this.cidDim("label","r",20), width:"40%", height:20, top:0, value:"Test Input Widget"},
				{id:this.cid("error"), widget:"div", left:this.cidDim("input","r",20), width:"36%", height:20, top:0, text:"Error Widget"}
			];
		}
	});

	return FormInput;

});

 exports.formInput = sb_light.require('widgets/formInput');




sb_light.define('widgets/resizer',['widgets/layoutWidget'], function( LW ) {

	var R = LW.extend({
		_dragPos: null,
		_dragDim:"left",
		_min: 0,
		_max: 0,
		

		create: function() {
			this._name = "layoutWidget::resizer";
			this._provideEvents("resize");
			this._super();
		},

		postCreate:function() {
			this._super();
			this.dom().addEventListener("mousedown", this.bind("_startDrag"));
		},

		_propertyOverrides: function() { 
			var po = this._super();
			po.min = this.bind("prop");
			po.max = this.bind("prop");
			return po;
		},


		childrenLayout:function() {
			return [
				{id:this.cid("mainBar"), widget:"div", fringe:2,  style:"background-color:#FFF;border:solid 1px black;"},
				{id:this.cid("ghostBar"), widget:"div", fringe:3,  left:4, style:"background-color:#000"}
			];
		},


		applyLayout: function() {
			this._super();
		},

		applyProperties: function() {
			this._super();
			var rect = this.dom().getBoundingClientRect();
			this._dragDim = rect.width > rect.height ? "top" : "left";
			this.className(this._horizontal ? "resizer-v" : "resizer-h");
		},

		_startDrag: function(e) {
			this._sb.events.stop(e);
			this._dragging = this.dim(this._dragDim);
			this.className("dragging");
			this.dom().ownerDocument.body.addEventListener("mousemove", this.bind("_drag"));
			this.dom().ownerDocument.body.addEventListener("mouseup", this.bind("_stopDrag"));
		},
		_drag: function(e) {
			var prect = this.parentDom().getBoundingClientRect();
			var pos = (this._dragDim == "left" ? e.clientX : e.clientY) - prect[this._dragDim];


			pos = this._sb.ext.range(this._min, this._max, pos);

			this._sb.ext.debug("Resizer::Drag", this.id(), this._dragDim, this._min, this._max, pos, e.clientX, prect.left);



			this.dim(this._dragDim, pos);
		},
		_stopDrag:function(e) {
			this._sb.ext.debug("Resizer::DragDone", this.id(), this._dragDim)
			this.className("dragging", true);
			this.dom().ownerDocument.body.removeEventListener("mousemove", this.bind("_drag"));
			this.dom().ownerDocument.body.removeEventListener("mouseup", this.bind("_stopDrag"));

			this.trigger("resize");	
		}

	});

	return R;

});

 exports.resizer = sb_light.require('widgets/resizer');


sb_light.define('widgets/pages/loginPage',[
	'widgets/layoutWidget', 
	'widgets/formInput', 
	
], function( W, FormInput) {

	var Login = W.extend({



		create:function() {
			this._name = "widget::loginPage";
			this._super();
		},

		postCreate: function() {
			this._super();
			this.dom().addEventListener("submit", this.bind("_handleSubmit"));
		},

		childrenLayout:function() {

			return [
				{id:this.cid("center_hack"), widget:"div", fringe:"49%" , style:"display:none;"},
				{id:this.cid("form"), widget:"form", left:this.cidDim("center_hack", -300), right:this.cidDim("center_hack", -300), 
					top:50, bottom:50, 
					children: [
						{id:this.cid("title"), widget:"h3", text:"Welcome to StrategyBlocks", left:20, right:20, top:40, height:30, style:"text-align:center"},
						{id:this.cid("error"), widget:"p", left:20, right:20, top:this.cidDim("title", "b", 20), height:30},
						{id:this.cid("username"), widget:FormInput, left:20, right:20, top:this.cidDim("error", "b", 20), height:30, value:"glenn.murphy@strategyblocks.com", label:"Email", error:""},
						{id:this.cid("password"), widget:FormInput, left:20, right:20,  top:this.cidDim("username", "b", 20), type:"password", value:"", height:30, label:"Password", error:""},
						{id:this.cid("submit"), widget:"button", type:"submit", width:80, left:"28%", height:25,  top:this.cidDim("password", "b", 50), text:"Sign-In"}
					]
				}
			];
		},

		_handleSubmit: function(e) {
			this._sb.events.stop(e);

			var uname = this.child("username").value();
			var pw = this.child("password").value();


			this._sb.state.login(uname,pw, this.bind("_handleSubmitResponse"),this.bind("_handleSubmitResponse"));
		},

		_handleSubmitResponse: function(res) {
			var rm = this._sb.ext.getResultMessages(res);
			if(rm.errors) {
				if(res && res.result && res.result.errors && result.errors.form) {
					this.cid("username").error(res.result.errors.form.username);
					this.cid("password").error(res.result.errors.form.password);
				}
			}
			this.child("error").text(rm.errors ? rm.errors.message : (rm.warnings || rm.notices || ""));
			this.child("error").className("error", !rm.errors );
			this.child("error").className("warning", rm.errors || !rm.warnings );
			this.child("error").className("notice", rm.errors || !rm.notices );
		}


	});

	return Login;
});

 exports.loginPage = sb_light.require('widgets/pages/loginPage');





sb_light.define('widgets/main',[
	'widgets/widget',
	'widgets/layoutWidget',
	'widgets/formInput',
	'widgets/resizer',
	'widgets/svg',
	'widgets/pages/loginPage'
], function(
	widget,
	layoutWidget,
	formInput,
	resizer,
	svg,
	login
) {


	return {
		widget:widget,
		layoutWidget:layoutWidget,
		formInput:formInput,
		resizer:resizer,
		svg:svg,
		login:login
	};
});




 exports.sb_light = sb_light.require('widgets/main');





sb_light.define('sb_light/main',[
	'sb_light/globals',
	'sb_light/lib/moment',	
	'sb_light/utils/ext',	
	'sb_light/utils/subman',	
	'sb_light/utils/svg',	
	'sb_light/utils/queue',	
	'sb_light/utils/events',	
	'sb_light/layout',	
	'sb_light/utils/consts',
	'sb_light/utils/Class',
	'sb_light/models',		
	'sb_light/controller',
	'sb_light/api/state',	
	'sb_light/api/queries',	
	'sb_light/api/urls',	
	'sb_light/api/api',
	'sb_light/api/ajax',
	'widgets/main'
], function(
	globals,
	moment,
	ext,	
	subman,	
	svg,
	queue,
	events,
	layout,
	consts,	 
	Class,	 
	models,	
	controller,
	state,	
	queries,	
	urls,	
	api,
	ajax,
	widgets
) {
	//globals.version = "0.0.1";
	globals.debug = true;

	//sometimes the way moment.js gets loaded is different. If it's not loaded properly via AMD, check the global context (this, window).
	globals.moment = moment || this.moment || window.moment;
	if(!globals.moment && !globals.moment.version) { throw "Moment JS has not been loaded properly."; }

	globals.ext = ext;
	globals.subman = subman;
	globals.svg = svg;
	globals.queue = queue;
	globals.events = events;
	globals.layout = layout;
	globals.consts = consts;
	globals.models = models;
	globals.controller = controller;
	globals.state = state;	 
	globals.queries = queries;	 
	globals.urls = urls;	 
	globals.api = api;	 
	globals.ajax = ajax; 
	globals.Class = Class;
	globals.widgets = widgets;
	

	state.host = "https://app.strategyblocks.com";

	globals.ext.debug("Loaded SB: ", globals.state.host);


	return globals;
});



 exports.sb_light = sb_light.require('sb_light/main');

}());