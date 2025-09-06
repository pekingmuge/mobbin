// 插件安装或更新时触发
chrome.runtime.onInstalled.addListener(function() {
  console.log('Mobbin Extension installed or updated');
});