// Triggered when extension is installed or updated
chrome.runtime.onInstalled.addListener(function () {
  console.log('Mobbin Extension installed or updated');

  // Initialize extension status to enabled
  chrome.storage.local.set({ 'enabled': true }, function () {
    console.log('Mobbin Cracker default status set to ON');
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'imagesUpdated') {
    console.log(`Updated ${request.count} images`);
  }
});