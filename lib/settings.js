const { data } = require("sdk/self");
const {Cc, Ci, Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
var styleSheetService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var cssURI;

var simplePerfs = require("sdk/simple-prefs");
var settingsNames = ["personalOverNav","compressBookmarksToolbarItems","autoHideNavbar","tabsInTitlebar","compressToolbar","smallTabbar"];

const { showLocationbar } = require("utils");
const { Hotkey } = require("sdk/hotkeys");
var boundHotKeys = [];

function onPrefChange(prefName){
	loadHotKeys();
    loadCSS();
}

function loadCSS(){
    unloadCSS();
    var css = "@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);";
    settingsNames.forEach(function(name){
		if(simplePerfs.prefs[name])
			css += data.load("CSS/"+name+".css").toString();
    });
    cssURI = Services.io.newURI("data:text/css," + encodeURIComponent(css), null, null);
    styleSheetService.loadAndRegisterSheet(cssURI, styleSheetService.USER_SHEET);
}

function unloadCSS(){
    if(cssURI){
        if(styleSheetService.sheetRegistered(cssURI, styleSheetService.USER_SHEET)){
            styleSheetService.unregisterSheet(cssURI, styleSheetService.USER_SHEET);      
        }
    }
}

function unloadHotKeys(){
	boundHotKeys.forEach(function(a){
		a.destroy();
	});
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