function handleInstalled(details) {
  console.log(details.reason);
  browser.tabs.create({
    url: "https://diluvian.io/dazzle/thankyou.html"
  });
}
browser.runtime.onInstalled.addListener(handleInstalled);

browser.storage.local.get("COOKIE_COUNT", function(STORE){
COOKIE_COUNT=STORE["COOKIE_COUNT"];
browser.storage.local.get("PROFILE", function(STORE){
PROFILE=STORE["PROFILE"];
browser.storage.local.get("COUNT", function(STORE){
MAX_COUNT=STORE["COUNT"];
browser.storage.local.get("SPOOF_UA", function(STORE){
SPOOF_UA=STORE["SPOOF_UA"];
const storageGet = browser.storage.local.get;
const storageSet = browser.storage.local.set;
const cookiesGetAll = browser.cookies.getAll;
const copyObj = obj => JSON.parse(JSON.stringify(obj));
const toArray = data => {
  const result = [];
  for(const domain in data){
    result.push({domain, "data": data[domain]});
  }
  return result;
}
const JSON_HEADERS = {"method": 'get', "headers": {'Accept': 'application/json, text/plain, */*'}, "credentials": 'include'};
const preffix = "POST_";
const storages = ["localStorage", "sessionStorage"];
const postStorages = storages.map(storage=>preffix+storage);
let BACKEND_URL = "";
if(PROFILE){
  updateURL(PROFILE);
}
if(!MAX_COUNT){
  MAX_COUNT=5;
}
if(!SPOOF_UA){
  SPOOF_UA=false;
}
if(!COOKIE_COUNT){
  COOKIE_COUNT=0;
}
let count = 0;
let countPull = 0;

var port;

function connected(p) {
  port = p;
  port.onMessage.addListener(function(m) {
    if (m.type == 'init'){
      port.postMessage({type: 'init', sync: MAX_COUNT, profile: PROFILE, ua: SPOOF_UA, cookies: COOKIE_COUNT});
    }
    if (m.type == "pull"){
      port.postMessage({sync: MAX_COUNT, profile: PROFILE, ua: SPOOF_UA, cookies: COOKIE_COUNT});
    }
    if (m.type == "profile") {
      PROFILE = m.profile;
      updateURL(PROFILE);
      storageSet({"PROFILE": PROFILE})
      loadDataFromBackend();
      port.postMessage({sync: MAX_COUNT, profile: PROFILE, ua: SPOOF_UA, cookies: COOKIE_COUNT});
    }
    if (m.type == "sync") {
      MAX_COUNT = m.sync;
      storageSet({"COUNT": m.sync})
      port.postMessage({sync: MAX_COUNT, profile: PROFILE, ua: SPOOF_UA, cookies: COOKIE_COUNT});
    }
    if (m.type == "ua") {
      SPOOF_UA=m.ua;
      storageSet({"SPOOF_UA": m.ua})
      port.postMessage({sync: MAX_COUNT, profile: PROFILE, ua: SPOOF_UA, cookies: COOKIE_COUNT});
    }
  });
}

browser.runtime.onConnect.addListener(connected);

function updateURL(profile){
  profileURL=profile.replace(/ /g,"_");
  BACKEND_URL="https://maskirovka.net/"+profileURL;
}

/**
 *  Get Cookies from the Back-End
 */
function loadCookies(){
  const options = JSON_HEADERS;
  return fetch(`${BACKEND_URL}/cookies`, options).then(res => res.json())
}

/**
 *  Get LocalStorage from the Back-End
 */
function loadLs(){
  const options = JSON_HEADERS;
  return fetch(`${BACKEND_URL}/localstorage`, options).then(res => res.json())
}

/**
 *  Get LocalStorage from the Back-End
 */
function loadSs(){
  const options = JSON_HEADERS;
  return fetch(`${BACKEND_URL}/sessionstorage`, options).then(res => res.json())
}

function syncData(evt){
  browser.tabs.query({url: "<all_urls>"}, function(tabs){
    if (tabs.length){
      console.log(tabs[0].id)
      browser.tabs.sendMessage(tabs[0].id, evt);
    }else{
      storageSet(evt);
    }
  });
}

// Get object to save in cookies storage.
function getCookieObject(cookie){
  // Remove unnecessary properties.
  ["hostOnly", "session"].forEach(type=>{
    delete cookie[type];
  });
  // Adde not ontional property URL
  cookie.url = `http://${cookie.domain.replace(/^\./, '')}${cookie.path}`
  return cookie;
}

// Save got cookies.
function cookiesLoaded(cookies){
  console.log("cookiesLoaded", cookies);
  COOKIE_COUNT=COOKIE_COUNT+cookies.length;
  storageSet({"COOKIE_COUNT": COOKIE_COUNT});
  const promises = cookies.map(cookie=>browser.cookies.set(getCookieObject(cookie)));
  // Save all cookies in parrallel
  Promise.all(promises)
    .then(savedCookies=>{
      return storageSet({"cookiesHash": []});
    })
    .then(_=>{
      // Nothing todo.
    })
    .catch(error=>console.log("ERROR", error));
}

function lsLoaded(lsArray){
  const needRestoreLS = {};
  lsArray.forEach(domainData=>{
    const domain = domainData.domain;
    if (!(domain in needRestoreLS)){
      needRestoreLS[domain] = []
    }
    needRestoreLS[domain] = [...needRestoreLS[domain], ...domainData.data];
  });
  storageSet({
    "localStorage": needRestoreLS
  }).then(res=>console.log("stored LS", res));
}

// Storing ss data to globalObject
function ssLoaded(ssArray){
  const needRestoreSS = {};
  ssArray.forEach(domainData=>{
    const domain = domainData.domain;
    if (!(domain in needRestoreSS)){
      needRestoreSS[domain] = []
    }
    needRestoreSS[domain] = [...needRestoreSS[domain], ...domainData.data];
  });
  storageSet({
    "sessionStorage": needRestoreSS
  }).then(res=>console.log("stored SS", res));
}

function loadDataFromBackend(){
  // Loading cookies
  loadCookies().then(cookies=>{
    cookiesLoaded(cookies)
  })
    .catch(err=>console.log("ERR COOKIES", err));
  // Loading LocalStorage Data
  loadLs().then(lsArray=>lsLoaded(lsArray))
    .catch(err=>console.log("ERR LS", err));
  // Loading SessionStorage Data
  loadSs().then(ssArray=>ssLoaded(ssArray))
    .catch(err=>console.log("ERR SS", err))
}

browser.webNavigation.onCompleted.addListener(evt=>navigated(evt)
  , {"url": [{"schemes": ["http", "https"]}]});
/**
 *  onCompleted event handler
 */
function navigated(evt){
  // Filter out any sub-frame related navigation event
  if (evt.frameId !== 0) {
    return;
  }
  count = (++count) % MAX_COUNT;
  if (!count) {
    loadDataFromBackend();
  }
  storageSet({
    "currentCount": count,
  });
}

var userAgents=["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13; rv:57.0) Gecko/20170101 Firefox/57.0", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0) Gecko/20100101 Firefox/57.0", "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:57.0) Gecko/20100101 Firefox/57.0", "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:57.0) Gecko/20100101 Firefox/57.0", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0", "Mozilla/5.0 (X11; Linux x86_64; rv:57.0) Gecko/20100101 Firefox/57.0", "Mozilla/5.0 (X11; FreeBSD amd64; rv:58.0) Gecko/20100101 Firefox/58.0", "Mozilla/5.0 (Windows NT 6.3; Win64; x64;rv:57.0) Gecko/20100101 Firefox/57.0", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:58.0) Gecko/20100101 Firefox/58.0", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0", "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0", "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0"];

browser.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    if(SPOOF_UA){
    var agent = userAgents[Math.floor(Math.random()*userAgents.length)];
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'User-Agent') {
        details.requestHeaders[i].value = agent;
        break;
        }
      }
      return {requestHeaders: details.requestHeaders};
      }else{
      return {requestHeaders: details.requestHeaders};
      }
  }, {urls: ['<all_urls>']}, ['blocking', 'requestHeaders']);
});
});
});
});
