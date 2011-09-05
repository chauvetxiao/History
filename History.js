/**
 * History
 * @version: v1.0.0
 * @author: zawa
 * @modify: 2011/07/19
 * 
 * @API:
 * 	1) History.state: current history entry state;
 *  2) History.pushState(data, title, url);
 *  3) History.replaceState(data, title, url); TODO
 *  4) History.popstate(): onpopstate or onhashchange callback handler;
 *  5) History.stateSupport: return true if history.state is support, otherwise false; 
 */
    
(function() {
	var isSupport = !!(window.history && history.pushState);
    
    // operation counter
	var GUID = 0;
    
    // case history.state
    var HistoryState = {};
    
    // cache document title
    var defaultTitle = document.title;
    
    // History API
	var History = {
        state: null,
        pushState: null,
        replaceState: null, // TODO
        popstate: null,
        stateSupport: false
    };
    
    // cache history.state
    var setHistoryState = function(data, title) {
        GUID++; // generator GUID
        var guid = GUID.toString();
        // set document title
        if (title) {
            document.title = title;
        }
        // cache
        HistoryState[guid] = {
            data: data,
            title: title
        };
        // set the current history.state
        History.state = HistoryState[guid].data;
    };
    
	/**
	 * url controller
	 * @param {String} url
	 * @return {String} 
	 */
	var urlController = function(url) {
		if (isSupport) {
			// do sth you need
		} else {
            // do sth you need
		}
		// append guid para
		var i = url.indexOf('?');
		if (i == -1) {
			url += '?guid=' + GUID;
		} else {
			url = url.substring(0, i) + '?' + 'guid=' + GUID + '&' + url.substr(i+1);
		}
		return url;
	};
	
	// onpopstate/onhashchange fire event
	var controller = function() {
        // make sure not to fire for the first time (some bwowser(eg:chrome) will fire this event on its first load) 
        if (GUID == 0) return;

		if (typeof History.popstate == 'function') {
            History.state = null;
            var guid = window.location.href;
            var i = guid.indexOf('guid=');
            if (i != -1) {
                guid = guid.substr(i+5);
                i = guid.indexOf('&');
                guid = guid.substring(0, (i == -1) ? guid.length : i);
                var state = HistoryState[guid] || null;
                // reset the current history.state
                History.state = state && state.data || null;
                // reset document title
                document.title = state && state.title || defaultTitle;
            } else {
                document.title = defaultTitle;
            }
			History.popstate();
		}
	};
	

    
    /**
	 * DOM Ready
	 * @param {Function} fn
	 */
	var DOMReady = function() {
	    var evt = [];
	    // fire event
	    var fire = function() {
	        if (!evt) return;
	        for (var i = 0; evt[i]; i++) {
	            evt[i]();
	        }
	        evt = null;
	    };
	    // IE DOMContentloaded 
	    var doScrollCheck = function() {
	        try {
	            document.documentElement.doScroll('left');
	            fire();
	        } catch (e) {
	            setTimeout(doScrollCheck, 1);
	            return;
	        }
	    }
		if (window.addEventListener) {
			document.addEventListener('DOMContentLoaded', fire, false);
			window.addEventListener('load', fire, false);
		} else {
			doScrollCheck();
			window.attachEvent('onload', fire);
		}
	    return function(fn) {
	        evt ? evt.push(fn) : fn();
	    };
	}();
    
    
	// browser that support html5 history API
	if (isSupport) {
        
        // detect the history.state browser compatibility
        var originalHistoryState = history.state;
        history.replaceState(1, null);
        History.stateSupport = history.state == 1;
        history.replaceState(originalHistoryState, null);
        
        // create history entry
        History.pushState = function(data, title, url) {
            setHistoryState(data, title);
			window.history.pushState(null, null, urlController(url));
		};
        
		// register onpopstate event
		if (window.addEventListener) {
			window.addEventListener('popstate', controller, false);
		} else {
			window.attachEvent('onpopstate', controller);
		}
    
    
    // Hash solution for browser that doesn't support html5 history API
	} else {
        
        // browser detect
	    var Browser = (Browser = /msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase())) ? {type: "ie", version: Browser[1]} : null;
        
        // onhaschange event detect
		var hashChange = !!('onhashchange' in window) && !(Browser.type == "ie" && (Browser.version < 8 || document.documentMode < 8));
         
        var Hash = {
            set: function(hash) {
                window.location.hash = hash.replace(/^#*/, '');
            },
	        get: function() {
                return window.location.hash.replace(/^#*/, '');
            }
        }; 
        
        var iframe = {
            obj: null,
            /**
			 * frame for browser that doesn't support onhashchange event
			 */
            create: function() {
				iframe.obj = document.createElement('iframe');
				iframe.obj.id = 'history_hash_frame';
				iframe.obj.src = 'hash.html?' + Hash.get(); // set iframe hash the same as window.location.hash
				iframe.obj.style.display = 'none';
				document.getElementsByTagName('body')[0].appendChild(iframe.obj);
			},
            addHash: function(hash) {
                var win = iframe.obj.contentWindow;
                win.location.href = 'hash.html?' + hash;    
            }
        };
        
		// create history entry
        History.pushState = function(data, title, url) {
            setHistoryState(data, title);
			var _url = urlController(url);
			if (hashChange) {
                Hash.set(_url);
			} else {
                Hash.set(_url);
                iframe.addHash(_url);
			}
		};
        
        // hash handler for ie6/7 iframe solution
        History.hashHandler = function() {
            // make sure not to fire for the first time
            if (GUID == 0) return;
            
            var curHash = Hash.get();
            var iframeHash = iframe.obj.contentWindow.location.search.replace('?', '');
            if (iframeHash != curHash) { // back or forward
                Hash.set(iframeHash);
            }
            controller();
        };
        
        // initialise
        if (hashChange) { // IE8+¡¢chrome6+¡¢Safari5+¡¢Opera10.6+
            if (window.addEventListener) {
				window.addEventListener('hashchange', controller, false);
			} else {
				window.attachEvent('onhashchange', controller);
			}
		} else {
			DOMReady(iframe.create);
		}
	}
	
	// expose
	window.History = History;
})();
