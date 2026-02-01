// Execute when page loads
console.log('Mobbin Cracker Extension content script loaded');

// Extension toggle status
let isEnabled = true;

// Read initial status from chrome.storage and initialize
chrome.storage.local.get('enabled', function (data) {
  isEnabled = data.enabled !== false; // Default to enabled
  console.log('Mobbin Cracker Extension status:', isEnabled ? 'enabled' : 'disabled');

  // Execute initialization after getting correct status
  initialize();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'toggleExtension') {
    isEnabled = request.enabled;
    console.log('Mobbin Cracker Extension status updated:', isEnabled ? 'enabled' : 'disabled');

    // If enabled, execute functionality immediately
    if (isEnabled) {
      removeAccessAllAside();
      updateImageSources();
    }
  }
});

// Modify image links, change w<80 parameter to w=1920
function updateImageSources() {
  // If extension is disabled, do not perform operations
  if (!isEnabled) return;

  // console.log('Checking and updating image sources...');

  // Get all img tags on the page
  const images = document.querySelectorAll('img');
  let updatedCount = 0;

  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      try {
        // Parse URL and parameters
        const url = new URL(src);
        const params = new URLSearchParams(url.search);
        // Check if there is a w parameter with value less than 80
        if (params.has('w')) {
          const wValue = parseInt(params.get('w'));
          if (wValue < 80) {
            // Modify w parameter to 1920
            params.set('w', '1920');
            // Remove image parameter
            params.delete('image');
            params.delete("gravity");
            params.delete("v");
            url.search = params.toString();
            // Update image src
            img.setAttribute('src', url.toString());
            updatedCount++;
            // console.log(`Updated image src: ${src} -> ${url.toString()}`);
            // Find next div sibling of img
            const nextDiv = img.nextElementSibling;
            if (nextDiv && nextDiv.tagName === 'DIV') {
              // Further process the found div
              nextDiv.remove();
            }
            // 在 img 的上级 div 外包裹一层 <a>，结构为 <a><div><img></div></a>，并给 a 添加 url
            const parentDiv = img.closest('div');
            if (parentDiv && !parentDiv.parentElement.matches('a')) {
              // 创建新的 <a> 元素
              const link = document.createElement('a');
              // 设置链接地址为图片地址
              link.href = url.toString();
              link.target = '_blank'; // 可选：新标签页打开
              // 将 div 包裹进 a
              parentDiv.parentNode.insertBefore(link, parentDiv);
              link.appendChild(parentDiv);
            }
          }
        }
      } catch (e) {
        // Handle invalid URL cases
        // console.error(`Error processing image URL: ${src ?? ''}`, e);
      }
    }
  });

  // console.log(`Updated ${updatedCount} images: w<80 changed to w=1920 and/or removed image parameter`);

  // If there are updates, notify background script
  if (updatedCount > 0) {
    chrome.runtime.sendMessage({
      action: "imagesUpdated",
      count: updatedCount
    });
  }
}

// Find and remove aside element containing h1 tag with "Access all"
function removeAccessAllAside() {
  // If extension is disabled, do not perform operations
  if (!isEnabled) return;

  // Find all h1 tags
  const h1Elements = document.querySelectorAll('h1');

  // Iterate through all h1 tags, find tags containing "Access all"
  for (const h1 of h1Elements) {
    if (h1.textContent && h1.textContent.includes('Access all')) {
      // console.log('Found h1 tag containing Access all:', h1.textContent);

      // Find nearest aside tag by moving up the DOM tree
      let currentElement = h1;
      while (currentElement && currentElement.tagName !== 'ASIDE') {
        currentElement = currentElement.parentElement;
      }

      // If aside tag is found, remove it
      if (currentElement && currentElement.tagName === 'ASIDE') {
        // console.log('Found and removed aside element');
        currentElement.remove();
      }
    }
  }
}

// Initialize content script functionality
function initialize() {
  // Only execute initialization operations when enabled
  if (isEnabled) {
    removeAccessAllAside();
    updateImageSources();
  }

  // Listen for DOM changes, handle dynamically loaded images and newly added h1 tags
  const observer = new MutationObserver(mutations => {
    // If extension is disabled, do not perform operations
    if (!isEnabled) return;

    let hasNewImages = false;
    let hasNewElements = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          // Check if it's an element node
          if (node.nodeType === 1) {
            // Check if the newly added node is an img or contains img
            if (node.tagName === 'IMG' || node.querySelector('img')) {
              hasNewImages = true;
            }

            // Check if the newly added node contains h1 tag
            if (node.tagName === 'H1' || node.querySelector('h1')) {
              hasNewElements = true;
            }
          }
        })
      }
    });

    // If new images are added, re-run the update function
    if (hasNewImages) {
      updateImageSources();
    }

    // If new elements are added, check and remove aside element containing h1 tag with Access all
    if (hasNewElements) {
      removeAccessAllAside();
    }
  });

  // Configure observer
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Note: The initialize() function is now called in the chrome.storage.local.get callback to ensure correct status is obtained before execution