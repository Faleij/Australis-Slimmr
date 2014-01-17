const { windows } = require('sdk/window/utils');
const { data } = require("sdk/self");
const {Cc, Ci, Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

var styleSheetService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var cssURI;

const { BrowserWindow, browserWindows } = require('sdk/windows'); 
var windowListeners = [];
var windowsCache;

var simplePerfs = require("sdk/simple-prefs");
var settingsNames = ["personalOverNav","compressBookmarksToolbarItems","autoHideNavbar","tabsInTitlebar","compressToolbar","smallTabbar"];

function focus(e){
    console.log("focus");
    this.classList.add("nav-bar-visible"); //this = navbar
}

function blur(e){
    console.log("blur");
    this.classList.remove("nav-bar-visible"); //this = navbar
}

function addEventListener(element,name,listener){
    element.addEventListener(name,listener);
    return function(){
        element.removeEventListener(name,listener);
    }
}

function addListeners(window,elements,context){
    var removeEventListener = [];
    
    var listener0 = focus.bind(context);
    var listener1 = blur.bind(context);
    
    for(var i = 0, len = elements.length; i < len; i++){        
        removeEventListener.push(addEventListener(elements[i],"focus",listener0));
        removeEventListener.push(addEventListener(elements[i],"blur",listener1));
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
        
        addListeners(window, chromeWindow.document.querySelectorAll("textbox"), navbar);
        addListeners(window, chromeWindow.document.querySelectorAll("searchbar"), navbar);   
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

function watchPerfs(){
    settingsNames.forEach(function(name){
        simplePerfs.on(name, loadCSS);
    });
}

function unwatchPerfs(){
    settingsNames.forEach(function(name){
        simplePerfs.removeListener(name, loadCSS);
    });
}

function loadCSS(prefName){
    unloadCSS();
    var css = "@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);";
    settingsNames.forEach(function(name){
       if(simplePerfs.prefs[name]) css += data.load("CSS/"+name+".css").toString();
    });
    cssURI = Services.io.newURI("data:text/css," + encodeURIComponent(css), null, null);
    styleSheetService.loadAndRegisterSheet(cssURI, styleSheetService.USER_SHEET);
    console.log("style loaded");
}

exports.main = function() {
    loadCSS();
    RegisterWindowEvents();
    watchPerfs();
};

exports.onUnload = function () {
    console.log("on unload!")
    unloadCSS();
    UnregisterWindowEvents();
    unwatchPerfs();
};
