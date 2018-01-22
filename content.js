const preffix = "POST_";
const storageGet = browser.storage.local.get;
const storageSet = browser.storage.local.set;
const hostname = window.location.hostname;
const storages = ["localStorage", "sessionStorage"];
const postStorages = storages.map(storage=>preffix+storage);
const log = obj=>console.log(JSON.stringify(obj));
const getAllStorageData = (storageObj)=>{
  if (!storageObj) return ;
  const retObj = [];
  for (let idx = 0; idx < storageObj.length; idx += 1){
    const name = storageObj.key(idx);
    const value = storageObj.getItem(name);
    retObj.push({name, value});
  }
  return retObj;
};

function _fireWindowEvent(eventName, data){
  if (document && document.body){
    const evt = new CustomEvent(eventName, {'detail': data});
    document.body.dispatchEvent(evt);
  } else {
    setTimeout(()=>{
      _fireWindowEvent(eventName, data);
    }, 250);
  }
}

storageGet(storages)
  .then(data=>{
    storages.forEach(storage=>{
      if (data[storage]) {
        const _data = data[storage][hostname] || [];
        for (const elem of _data){
          window[storage][elem.name] = elem.value;
        }
        // 
        delete data[storage][hostname];
      }
    });
    browser.storage.local.set(data)
  });

// Save current storages
storageGet(postStorages)
    .then(_data=>{
      postStorages.forEach(storage=>{
        if (!_data[storage]) {
          _data[storage] = {}
        }
        for (const storage in _data){
          const storageName = storage.replace(preffix, "");
          _data[storage][hostname] = getAllStorageData(window[storageName]);
        }
      });
      storageSet(_data);
    })
    .catch(err=>console.log(err));

browser.runtime.onMessage.addListener(function(msg) {
  fireEvent(msg);
});
