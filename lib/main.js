const { windows } = require('sdk/window/utils');
const { data } = require("sdk/self");
const {Cc, Ci, Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
var servicesGet = require("sdk/preferences/service").get;
var { Hotkey } = require("sdk/hotkeys");
var tabs = require("sdk/tabs");

var styleSheetService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var cssURI;

const { BrowserWindow, browserWindows } = require('sdk/windows'); 
var windowListeners = [];
var windowsCache;

var simplePerfs = require("sdk/simple-prefs");
var settingsNames = ["personalOverNav","compressBookmarksToolbarItems","autoHideNavbar","tabsInTitlebar","compressToolbar","smallTabbar"];

var boundHotKeys = [];

var inFocus = false;

function focus(e){
	inFocus = true;
    this.classList.add("nav-bar-visible"); //this = navbar
}

function blur(e){
	inFocus = false;
    this.classList.remove("nav-bar-visible"); //this = navbar
}

function contentMouseover(e){
	if(!inFocus) this.classList.remove("nav-bar-visible"); //this = navbar
}

function contentMouseout(e){
	if(!inFocus) this.classList.add("nav-bar-visible"); //this = navbar
}


function addEventListener(element,name,listener){
    element.addEventListener(name,listener);
    return function(){
        element.removeEventListener(name,listener);
    }
}

function addListeners(window,elements,listenerMap){
    var removeEventListener = [];
        
    for(var i = 0, len = elements.length; i < len; i++){
		for(var key in listenerMap){
			removeEventListener.push(addEventListener(elements[i],key,listenerMap[key]));
		}
    }
    
    if(!(window.faleij_australis_slimmr_removeEventListeners instanceof Array))
        window.faleij_australis_slimmr_removeEventListeners = [];
    window.faleij_australis_slimmr_removeEventListeners = window.faleij_australis_slimmr_removeEventListeners.concat(removeEventListener);
        
    console.log("attached event listeners to window");
}

function removeEventListeners(window){
    if(window.faleij_australis_slimmr_removeEventListeners){
        console.log("window.faleij_australis_slimmr_removeEventListeners",window.faleij_australis_slimmr_removeEventListeners);
        window.faleij_australis_slimmr_removeEventListeners.forEach(function(a){a()});
    }else{
        console.error("window had no eventListeners attached");
    }
    delete window.faleij_australis_slimmr_removeEventListeners;
}

function initializeWindow(window){
    console.log("Initializing new Window");
    
    windowsCache = windows('navigator:browser', { includePrivate: true });
    console.log("windowsCache", windowsCache);
    var chromeWindow = window;
    if(!window.document) {
        chromeWindow = getChromeWindow(window, windowsCache);
        console.log("getChromeWindow")
    }
    
    if(chromeWindow){
        var navbar = chromeWindow.document.getElementById("nav-bar");
        
		var listenerMap = {
			"focus": focus.bind(navbar),
			"blur": blur.bind(navbar)
		};
		
        addListeners(window, chromeWindow.document.querySelectorAll("textbox"), listenerMap);
        addListeners(window, chromeWindow.document.querySelectorAll("searchbar"), listenerMap);   
		addListeners(window, chromeWindow.document.querySelectorAll("#content-deck"), 
		{ "mouseover": contentMouseover.bind(navbar), "mouseout": contentMouseout.bind(navbar) });
    }else{
        console.error("could not get chrome window!");
    }
}

function getChromeWindow(sdkWindow, _windows) {
    _windows = _windows || windows('navigator:browser', { includePrivate: true });
    for (let window of _windows)
        if (BrowserWindow({window: window}) === sdkWindow)
            return window;
            
    return null;
} 

function RegisterWindowEvents(){
    browserWindows.on('open', initializeWindow);
    browserWindows.on('close', removeEventListeners);
    
    windows().forEach(function(window){initializeWindow(BrowserWindow({window: window}))});
}

function UnregisterWindowEvents(){
    browserWindows.removeListener('open', initializeWindow);
    browserWindows.removeListener('close', removeEventListeners);
    
    for(var window in windowListeners){
        try{
            removeEventListeners(window);
        }catch(err){
            console.error(err)
        }
    }
}

function unloadCSS(){
    if(cssURI){
        if(styleSheetService.sheetRegistered(cssURI, styleSheetService.USER_SHEET)){
            styleSheetService.unregisterSheet(cssURI, styleSheetService.USER_SHEET);
            console.log("style unloaded");      
        }
    }
}

function onPrefChange(prefName){
	loadHotKeys();
	loadTabListeners();
    if(prefName){
		if(perfName[0] !== "_"){
			loadCSS();
		}
	}else{
		loadCSS();
	}
}

function watchPerfs(){
    simplePerfs.on("", onPrefChange);
}

function unwatchPerfs(){
    simplePerfs.removeListener("", onPrefChange);
}

function loadCSS(){
    unloadCSS();
    var css = "@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);";
    settingsNames.forEach(function(name){
       if(simplePerfs.prefs[name]) css += data.load("CSS/"+name+".css").toString();
    });
    cssURI = Services.io.newURI("data:text/css," + encodeURIComponent(css), null, null);
    styleSheetService.loadAndRegisterSheet(cssURI, styleSheetService.USER_SHEET);
}

exports.main = function() {
	onPrefChange();
    RegisterWindowEvents();
    watchPerfs();
};

exports.onUnload = function () {
    unloadHotKeys();
    unloadCSS();
	unloadTabListeners();
    UnregisterWindowEvents();
    unwatchPerfs();
};

function showLocationbar(window){
	var chromeWindow = window || tabs.activeTab.window;
	
	if(!chromeWindow.document) {
		chromeWindow = getChromeWindow(chromeWindow, windowsCache);
	}
	
	if(chromeWindow){
		chromeWindow.document.getElementById("nav-bar").classList.add("nav-bar-visible");
		chromeWindow.setTimeout(function(){
			chromeWindow.document.getElementById("urlbar").focus();
		},500);
	}
}

function tabOpenListener(tab){
	tab.on("ready", function readyListener(tab){
		if(tabs.activeTab === tab){
			if(tab.url === servicesGet("browser.newtab.url")){
				showLocationbar(tab.window);
			}
		}
		tab.removeListener("ready", readyListener);
	});
}
	
function loadTabListeners(){
	unloadTabListeners();
	if(simplePerfs.prefs["_selectLocationBar"]){
		tabs.on("open", tabOpenListener);
	}
}

function unloadTabListeners(){
	try{
		tabs.removeListener("open", tabOpenListener);
	}catch(err){
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