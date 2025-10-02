// 插件安装或更新时触发
chrome.runtime.onInstalled.addListener(function() {
  console.log('Mobbin Extension installed or updated');
});

// Handle download all request from popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message && message.action === 'downloadAll' && Array.isArray(message.urls)) {
    // always auto-save without prompting
    message.urls.forEach(function(u, idx) {
      try {
        var base;
        try {
          var urlObj = new URL(u);
          base = urlObj.pathname.split('/').pop() || ('image_' + idx + '.png');
        } catch (_) {
          base = 'image_' + idx + '.png';
        }
        chrome.downloads.download({ url: u, saveAs: false, filename: base, conflictAction: 'uniquify' });
      } catch (e) {}
    });
    if (typeof sendResponse === 'function') sendResponse({ ok: true, count: message.urls.length });
  }
});
