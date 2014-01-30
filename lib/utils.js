const { windows } = require('sdk/window/utils');
const { BrowserWindow } = require("sdk/windows");
var tabs = require("sdk/tabs");

function getChromeWindow(sdkWindow) {
	for (let window of windows('navigator:browser', { includePrivate: true }))
		if (BrowserWindow({window: window}) === sdkWindow)
			return window;
	return null;
}

exports.getChromeWindow = getChromeWindow;

exports.addEventListener = function (element,name,listener){
	element.addEventListener(name,listener);
	return function(){
		element.removeEventListener(name,listener);
	}
};
	
exports.showLocationbar = function (_window){
	var window = getChromeWindow(_window || tabs.activeTab.window);
	
	if(window){
		window.setTimeout(function(){
			window.document.getElementById("nav-bar").classList.add("nav-bar-visible");
			window.setTimeout(function(){
				window.document.getElementById("urlbar").focus();
			},500);
		},300);
		console.log("showLocationbar");
	}
};
