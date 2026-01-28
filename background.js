// 插件安装或更新时触发
chrome.runtime.onInstalled.addListener(function() {
  console.log('Mobbin Extension installed or updated');
  
  // 初始化插件状态为启用
  chrome.storage.local.set({ 'enabled': true }, function() {
    console.log('插件默认状态已设置为启用');
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'imagesUpdated') {
    console.log(`Updated ${request.count} images`);
  }
});