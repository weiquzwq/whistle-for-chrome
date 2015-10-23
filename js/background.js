var proxyList = [
		{
			name: 'whistle',
			host: '127.0.0.1',
			port: 8899
		},
		{	
			name: 'aeproxy',
			host: '127.0.0.1',
			port: 9527
		}
];

var systemProxy = localStorage.systemProxy;
var directProxy = localStorage.directProxy;

try {
	var _proxyList = JSON.parse(localStorage.proxyList);
	if ($.isArray(_proxyList)) {
		$.extend(true, proxyList, _proxyList);
	}
} catch(e) {}

var proxies = {};

proxyList = proxyList.filter(function(item) {
	if (!item || !item.name) {
		return false;
	}
	proxies[item.name] = item;
	return true;
});

function setProxyValue(name, host, port) {
	var item = proxies[name];
	if (!item) {
		proxies[name] = item = {
				name: name,
				host: host,
				port: port
		};
		proxyList.push(item);
	}
	storeProxy();
}

function hasProxyItem(name) {
	return proxies[name];
}

function removeProxyItem(name) {
	var item = proxies[name];
	if (!item) {
		return;
	}
	delete proxies[name];
	proxyList.splice(proxyList.indexOf(item), 1);
}

function _setProxy(host, port) {
	if (typeof port == 'function') {
		callback = port;
		port = null;
	} if (typeof host == 'function') {
		callback = host;
		host = null;
	}
	
	var proxyConfig = {
            scheme: 'http',
            host: host || '127.0.0.1',
            port: port || 8899
        };

	chrome.proxy.settings.set({value: {
	    mode: 'fixed_servers',
	    rules: {
	        proxyForHttp: proxyConfig,
	        proxyForHttps: proxyConfig
	    }
	}});
}

function setProxy(name) {
	var item = name && proxies[name] || proxies.whistle;
	_clearSelection();
	item.selected = true;
	_setProxy(item.host, item.port);
}

function setDirect() {
	chrome.proxy.settings.set({value: {mode: 'direct'}});
	_clearSelection();
	localStorage.directProxy = directProxy = 1;
}

function setSystem() {
	chrome.proxy.settings.set({value: {mode: 'system'}});
	_clearSelection();
	localStorage.systemProxy = systemProxy = 1;
}

function _clearSelection() {
	localStorage.removeItem('directProxy');
	localStorage.removeItem('systemProxy');
	directProxy = systemProxy = null;
	proxyList.forEach(function(item) {
		item.selected = false;
	});
	setTimeout(storeProxy, 0);
}

function storeProxy() {
	localStorage.proxyList = JSON.stringify(proxyList);
}

setInterval(storeProxy, 3000);

function openWhistlePage(name) {
	openWindow(getWhistlePageUrl(name), true);
}

function getWhistlePageUrl(name) {
	return 'http://local.whistlejs.com/#' + name;
}

function openOptions() {
    openWindow(chrome.extension.getURL('options.html'));
}

function openAbout() {
	openWindow(chrome.extension.getURL('about.html'));
}

function openWindow(url, pinned) {
	chrome.tabs.getAllInWindow(null, function (tabs) {
        for (var i = 0, len = tabs.length; i < len; i++) {
        	var tab = tabs[i];
            if (getUrl(tab.url) == getUrl(url)) {
            	var options = {selected: true};
            	if (tab.url != url) {
            		options.url = url;
            	}
                chrome.tabs.update(tab.id, options);
                return;
            }
        }
        
        chrome.tabs.query({active: true}, function(tabs){
		    var tab = tabs[0];
		    chrome.tabs.create({
			    index: tab ? tab.index + 1 : 100,
			    url: url,
			    active: true,
			    pinned: !!pinned
			});
		});
    });
}

function getUrl(url) {
	
	return url && url.replace(/#.*$/, '');
}

function init() {
	setProxy();
}

init();
