document.addEventListener('DOMContentLoaded', function() {
    var $ = function(id) { return document.getElementById(id); };
    var btn = $('download');
    var status = $('status');
    btn.addEventListener('click', function() {
      status.textContent = 'Collecting images...';
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs && tabs[0];
        if (!tab || !tab.id) { status.textContent = 'No active tab.'; return; }
        chrome.tabs.sendMessage(tab.id, { action: 'getImageUrls' }, function(response) {
          var urls = (response && Array.isArray(response.urls)) ? response.urls : [];
          if (!urls.length) { status.textContent = 'No upgraded images found. Scroll to load more and try again.'; return; }
          status.textContent = 'Downloading ' + urls.length + ' images...';
          chrome.runtime.sendMessage({ action: 'downloadAll', urls: urls }, function(res) {
            if (res && res.ok) {
              status.textContent = 'Started ' + res.count + ' downloads.';
            } else {
              status.textContent = 'Download start failed.';
            }
          });
        });
      });
    });
  });
