// 插件安装或更新时触发
chrome.runtime.onInstalled.addListener(function() {
  console.log('Mobbin Extension installed or updated');
  
  // 初始化存储数据
  chrome.storage.local.set({
    initialized: true,
    mobbinData: [],
    lastVisit: new Date().toISOString()
  }, function() {
    console.log('Initialization complete');
  });
});