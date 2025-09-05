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
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "saveMobbinElement",
    title: "保存Mobbin元素",
    contexts: ["all"],
    documentUrlPatterns: ["*://*.mobbin.com/*"]
  });
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(function(tab) {
  console.log('Extension icon clicked');
  
  // 向content script发送消息，执行操作
  chrome.tabs.sendMessage(tab.id, {action: "performAction"}, function(response) {
    if (response && response.status === 'success') {
      console.log('Action performed successfully:', response.data);
      
      // 如果是在Mobbin网站上，处理收集的元素
      if (tab.url && tab.url.includes('mobbin.com')) {
        console.log('Elements collected from Mobbin site');
      } else {
        // 在其他网站上，强制更新图片
        chrome.tabs.sendMessage(tab.id, {action: "forceUpdateImages"});
      }
    } else {
      console.log('Failed to perform action');
      
      // 显示通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: 'Image Enhancer',
        message: '无法执行操作，请刷新页面后重试'
      });
    }
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received in background script:', request);
  
  if (request.action === "backgroundAction") {
    // 执行后台操作
    console.log('Performing background action');
    
    // 示例：发送响应
    sendResponse({status: "success", message: "Action completed"});
  }
  
  // 处理从content script收集的元素
  if (request.action === "elementsCollected") {
    console.log(`Received ${request.count} elements from Mobbin page`);
    
    // 更新徽章显示收集的元素数量
    if (request.count > 0) {
      chrome.action.setBadgeText({text: request.count.toString()});
      chrome.action.setBadgeBackgroundColor({color: '#4285f4'});
      
      // 发送通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: 'Mobbin元素已收集',
        message: `成功从Mobbin页面收集了${request.count}个设计元素`
      });
    }
    
    sendResponse({status: "success", message: "Elements processed"});
  }
  
  // 处理图片更新消息
  if (request.action === "imagesUpdated") {
    console.log(`Updated ${request.count} images on the page`);
    
    // 更新徽章显示更新的图片数量
    if (request.count > 0) {
      chrome.action.setBadgeText({text: request.count.toString()});
      chrome.action.setBadgeBackgroundColor({color: '#00C853'});
      
      // 发送通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: '图片已更新',
        message: `成功将${request.count}张小尺寸图片(w<80)更新为高清图片(w=1920)`
      });
    }
    
    sendResponse({status: "success", message: "Images updated"});
  }
  
  // 注意：如果使用异步响应，需要返回true
  return true;
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "saveMobbinElement") {
    // 向content script发送消息，保存当前选中的元素
    chrome.tabs.sendMessage(tab.id, {action: "saveSelectedElement"});
  }
});

// 监听标签页更新，检测是否访问了mobbin.com
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('mobbin.com')) {
    console.log('Detected navigation to Mobbin site:', tab.url);
    
    // 更新最后访问时间
    chrome.storage.local.set({lastVisit: new Date().toISOString()});
    
    // 向content script发送消息
    chrome.tabs.sendMessage(tabId, {action: "mobbinPageLoaded"});
  }
});