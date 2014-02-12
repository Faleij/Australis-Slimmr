const { windows } = require('sdk/window/utils');
const { BrowserWindow } = require("sdk/windows");
var tabs = require("sdk/tabs");
var simplePerfs = require("sdk/simple-prefs");

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

exports.selectSearchBox = function(_window){
	var window = getChromeWindow(_window || tabs.activeTab.window);
	if(window){
		var navbar = window.document.getElementById("nav-bar");
		navbar.classList.add("nav-bar-visible");
		var searchbar = window.document.getElementById("searchbar");
		window.setTimeout(function(){
			searchbar.focus();
			searchbar.select();
		},100);
	}
};

exports.showLocationbar = function(_window){
	var window = getChromeWindow(_window || tabs.activeTab.window);
	if(window){
		var delay = (simplePerfs.prefs["autoHideNavbar"]?50:0);
		window.setTimeout(function(){
			var focused = window.document.querySelector("navigator-toolbox :focus") || window.document.querySelector("navigator-toolbox :active");
			if(!focused){
				var navbar = window.document.getElementById("nav-bar");
				navbar.classList.add("nav-bar-visible");
				var urlbar = window.document.getElementById("urlbar");
				window.setTimeout(function(){
					urlbar.focus();
					urlbar.select();
				},delay);
			}
		},delay);
	}
};