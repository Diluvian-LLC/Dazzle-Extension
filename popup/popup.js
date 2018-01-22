var current_profile;
var current_sync_count;
var SPOOF_UA;

port = browser.runtime.connect({name:"port"});
port.postMessage({type: 'init'});
port.onMessage.addListener(function(m) {
  if (m.type == 'init'){
    updateVisible(m.profile, m.sync, m.ua, m.cookies);
    current_profile=m.profile;
    current_sync_count=m.sync;
    SPOOF_UA=m.ua;
    main();
  }else{
    updateVisible(m.profile, m.sync, m.ua, m.cookies);
    current_profile=m.profile;
    current_sync_count=m.sync;
    SPOOF_UA=m.ua;
  }
});

function changeVisible(id, shouldShow){
  const elemDOM = document.querySelector("#" + id);
  elemDOM.style.display = shouldShow? 'block': "none";
}

function updateVisible(profile, sync, ua, cookies){
  const display_disguise = document.querySelector("#worn_disguise");
  display_disguise.innerText = profile;
  const display_count = document.querySelector("#cookies");
  display_count.innerText = cookies;
  const display_sync = document.querySelector("#syncSettings");
  display_sync.value = sync;
  const syncNum = document.querySelector("#SyncNum");
  syncNum.innerText = sync;
  const ua_toggle = document.querySelector("#UA_Toggle");
  const ua_bool = document.querySelector("#spoof_bool");
  if(ua == true){
    ua_toggle.checked=true;
    ua_bool.innerText=' On';
  }else{
    ua_toggle.checked=false;
    ua_bool.innerText=' Off';
  }
  loggedIn();
}

function setData(backend, username){
  setTimeout(()=>{
    const serverDom = document.querySelector("#content_server");
    serverDom.innerText = extractHostname(backend);
    const usernameDom = document.querySelector("#content_username");
    usernameDom.innerText = username;  
  }, 1000);
}

function main(){
  if(!current_profile){
    loggedOut();
  }else{
    loggedIn();
    port.postMessage({type: 'pull'});
  }
  const pic1 = document.querySelector("#main1");
  pic1.addEventListener("click", ()=>{
    openMain()
  });
  const pic2 = document.querySelector("#main2");
  pic2.addEventListener("click", ()=>{
    openMain()
  });
  const help1 = document.querySelector("#more_info1");
  help1.addEventListener("click", ()=>{
    openHelp()
  });
  const help2 = document.querySelector("#more_info2");
  help2.addEventListener("click", ()=>{
    openHelp()
  });
  const prof = document.querySelector("#profile");
  prof.value=current_profile;
  if(! prof.value){
    prof.value="Fashion Girl";
  }
  prof.addEventListener("click", ()=>{
      current=prof.value;
      description="";
        if(current=="Fashion Girl"){
          description="A very fashionable disguise giving you the appearance of keeping up with trends";
        }
        if(current=="2nd Amendment Enthusiast"){
          description="Makes trackers think you are a right-wing, gun-loving American";
        }
        if(current=="Botanist"){
          description="Gives you the digital appearance of an obsessed plant collector";
        }
        if(current=="Health Fanatic"){
          description="Your digital identity now has toned abs and an extremely healthy diet";
        }
        if(current=="Software Engineer"){
          description="Makes you look like a software geek, obsessed with all the hottest technologies";
        }
      document.getElementById("description").textContent=description;
  });
  const submit = document.querySelector("#submit");
  submit.addEventListener("click", ()=>{
    const formDOM = document.querySelector("#form");
    const formData = new FormData(formDOM);
    formData.append("appCodeName", navigator.appCodeName);
    formData.append("appName", navigator.appName);
    formData.append("appVersion", navigator.appVersion);
    formData.append("cookieEnabled", navigator.cookieEnabled);
    formData.append("geolocation", navigator.geolocation);
    formData.append("language", navigator.language);
    formData.append("onLine", navigator.onLine);
    formData.append("platform", navigator.platform);
    formData.append("product", navigator.product);
    formData.append("userAgent", navigator.userAgent);
    formData.append("screenHeight", window.screen.height);
    formData.append("screenWidth", window.screen.width);
    port.postMessage({type: 'profile', profile: formDOM.profile.value});
  });

  const logout = document.querySelector("#logout");
  logout.addEventListener("click", ()=>{
    loggedOut();
  });
  const slider = document.querySelector("#syncSettings");
  const syncNum = document.querySelector("#SyncNum");
  slider.addEventListener("input", (evt)=>{
    syncNum.innerText = slider.value;
    port.postMessage({type: 'sync', sync: (parseInt(slider.value) || "N/A")});
  });
  const ua_bool = document.querySelector("#spoof_bool");
  const ua_toggle = document.querySelector("#UA_Toggle");
  ua_toggle.addEventListener("input", (evt)=>{
    if(ua_toggle.checked == true){
      ua_bool.innerText = " On";
      port.postMessage({type: 'ua', ua: true});
    }else{
      ua_bool.innerText = " Off";
      port.postMessage({type: 'ua', ua: false})
    }
  });
}

function loggedIn(){
  changeVisible("form", false);
  changeVisible("content", true);
}

function loggedOut(){
  changeVisible("form", true);
  changeVisible("content", false);
}

function openMain() {
    window.open("https://diluvian.io");
}

function openHelp() {
    window.open("https://diluvian.io/dazzle.html");
}
