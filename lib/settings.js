const { data } = require("sdk/self");
const {Cc, Ci, Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
var styleSheetService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var cssURI;

const { setTimeout } = require("sdk/timers");
const { all, defer } = require("sdk/core/promise");

var simplePerfs = require("sdk/simple-prefs");
var settingsNames = ["personalOverNav","compressBookmarksToolbarItems","autoHideNavbar","tabsInTitlebar","compressToolbar","smallTabbar"];

const { showLocationbar, selectSearchBox } = require("utils");
const { Hotkey } = require("sdk/hotkeys");
var boundHotKeys = [];

function onPrefChange(prefName){
	loadHotKeys();
    loadCSS();
}

function deferredLoad(name){
	var deferred = defer();
	setTimeout(function(){
		if(simplePerfs.prefs[name])
			deferred.resolve( data.load("CSS/"+name+".css").toString() );
		else
			deferred.resolve( "" );
		},0);
	return deferred.promise;
}

function loadCSS(){
    unloadCSS();
    all(settingsNames.map(deferredLoad)).then(function(result){
		var css = "@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);\n" + result.join("\n");
		cssURI = Services.io.newURI("data:text/css," + encodeURIComponent(css), null, null);
		styleSheetService.loadAndRegisterSheet(cssURI, styleSheetService.USER_SHEET);
	});
}

function unloadCSS(){
    if(cssURI){
        if(styleSheetService.sheetRegistered(cssURI, styleSheetService.USER_SHEET)){
            styleSheetService.unregisterSheet(cssURI, styleSheetService.USER_SHEET);      
        }
    }
}

function unloadHotKeys(){
	boundHotKeys.forEach(function(a){ a.destroy(); });
	boundHotKeys.length = 0;
}

function loadHotKeys(){
	unloadHotKeys();
	
	if(simplePerfs.prefs["_selectLocationBarShortcut"]){
		boundHotKeys.push(Hotkey({
		  combo: "accel-l",
		  onPress: showLocationbar
		}));
	}
	
	boundHotKeys.push(Hotkey({
		combo: "accel-k",
		onPress: selectSearchBox
	}));
}

exports.load = function(){
	loadHotKeys();
	simplePerfs.on("", onPrefChange);
	onPrefChange();
};

exports.unload = function(){
	simplePerfs.removeListener("", onPrefChange);
	unloadHotKeys();
	unloadCSS();
};