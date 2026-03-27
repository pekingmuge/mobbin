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

// 动态加载图标
const loadingSvg = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="loading-spinner">
    <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="20"/>
    <style>
      .loading-spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  </svg>
`;

/**
 * 创建操作按钮
 * @param {string} icon - 按钮图标
 * @param {string} title - 按钮提示文字
 * @param {Function} onClick - 点击回调函数
 * @returns {HTMLButtonElement} 按钮元素
 */
function createActionButton(icon, title, onClick) {
  const btn = document.createElement('button');
  btn.className = 'mobbin-btn';
  btn.innerHTML = icon;
  btn.title = title;
  btn.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(btn);
  });

  return btn;
}

/**
 * 为图片创建操作按钮浮层
 * @param {HTMLElement} wrapper - 图片包裹层
 * @param {string} imageUrl - 图片URL
 */
function createImageOverlay(wrapper, imageUrl) {
  // 创建浮层
  const overlay = document.createElement('div');
  overlay.className = 'mobbin-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 10px;
    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: 10;
  `;

  // 创建复制图片按钮
  const copySvg = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const copyBtn = createActionButton(copySvg, 'Copy', (btn) => {
    // 显示加载状态
    const originalIcon = btn.innerHTML;
    btn.innerHTML = loadingSvg;

    // 从URL获取图片并复制到剪贴板
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        // 检查是否为webp格式
        if (blob.type === 'image/webp') {
          // 将webp转换为png
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(resolve, 'image/png');
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          });
        }
        return blob;
      })
      .then(blob => {
        const item = new ClipboardItem({
          [blob.type]: blob
        });
        return navigator.clipboard.write([item]);
      })
      .then(() => {
        btn.innerHTML = '✓';
        btn.style.color = '#4ade80';
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.style.color = 'white';
        }, 1500);
      })
      .catch(err => {
        console.error('复制图片失败:', err);
        btn.innerHTML = '✗';
        btn.style.color = '#f87171';
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.style.color = 'white';
        }, 1500);
      });
  });

  // 创建下载按钮
  const downloadSvg = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <!-- 箭头 -->
      <path d="M12 4V14" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M8 10L12 14L16 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- 底部横线（托盘） -->
      <path d="M5 18H19" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  const downloadBtn = createActionButton(downloadSvg, 'Download', (btn) => {
    // 显示加载状态
    const originalIcon = btn.innerHTML;
    btn.innerHTML = loadingSvg;

    // 从URL获取图片并下载
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        // 从URL中提取文件名
        const url = new URL(imageUrl);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop() || 'image.png';

        // 创建object URL
        const objectUrl = URL.createObjectURL(blob);

        // 创建下载链接
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 清理object URL
        URL.revokeObjectURL(objectUrl);

        // 显示成功状态
        btn.innerHTML = '✓';
        btn.style.color = '#4ade80';
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.style.color = 'white';
        }, 1500);
      })
      .catch(err => {
        console.error('下载图片失败:', err);
        btn.innerHTML = '✗';
        btn.style.color = '#f87171';
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.style.color = 'white';
        }, 1500);
      });
  });

  // 将按钮添加到浮层
  overlay.appendChild(copyBtn);
  overlay.appendChild(downloadBtn);
  wrapper.appendChild(overlay);

  // 添加 hover 效果
  wrapper.addEventListener('mouseenter', () => {
    overlay.style.opacity = '1';
  });
  wrapper.addEventListener('mouseleave', () => {
    overlay.style.opacity = '0';
  });
}

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
    if (!src) {
      return;
    }

    try {
      // Parse URL and parameters
      const url = new URL(src);
      const params = new URLSearchParams(url.search);
      // Check if there is a w parameter with value less than 80
      if (!params.has('w')) return;

      const wValue = parseInt(params.get('w'));
      if (wValue > 80) return;

      // Modify w parameter to 1920
      params.set('w', '1920');
      // Remove image parameter
      params.delete('image');
      params.delete("gravity");
      params.delete("v");
      params.delete("extend-bottom");
      url.search = params.toString();
      // Update image src
      img.setAttribute('src', url.toString());
      updatedCount++;
      // console.log(`Updated image src: ${src} -> ${url.toString()}`);
      // Find next div sibling of img
      const nextDiv = img.nextElementSibling;
      if (nextDiv && nextDiv.tagName === 'DIV') {
        // Further process of found div
        nextDiv.remove();
      }
      // 在 img 的上级 div 外包裹一层 <a>，结构为 <a><div><img></div></a>，并给 a 添加 url
      const parentDiv = img.closest('div');
      console.log(parentDiv);
      if (parentDiv && !parentDiv.parentElement.matches('a')) {
        // 创建新的 <a> 元素
        const link = document.createElement('a');
        // 设置链接地址为图片地址
        link.href = url.toString();
        link.target = '_blank'; // 可选：新标签页打开
        // 插入 a 元素到 div 之前
        parentDiv.parentNode.insertBefore(link, parentDiv);
        link.appendChild(parentDiv);

        // 创建包裹层
        const wrapper = document.createElement('div');
        wrapper.className = 'mobbin-img-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';

        // 将 a 元素放入 wrapper
        link.parentNode.insertBefore(wrapper, link);
        wrapper.appendChild(link);

        // 创建图片操作浮层
        createImageOverlay(wrapper, url.toString());
      }
    } catch (e) {
      // Handle invalid URL cases
      // console.error(`Error processing image URL: ${src ?? ''}`, e);
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
