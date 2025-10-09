// 当页面加载完成后执行
console.log('Mobbin Cracker Extension content script loaded');

// 修改图片链接，将w<80的参数修改为w=1920
function updateImageSources() {
  console.log('Checking and updating image sources...');
  
  // 获取页面上所有的img标签
  const images = document.querySelectorAll('img');
  let updatedCount = 0;
  
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      try {
        // 解析URL和参数
        const url = new URL(src);
        const params = new URLSearchParams(url.search);
        
        // 检查是否有w参数，且值小于80
        if (params.has('w')) {
          const wValue = parseInt(params.get('w'));
          if (wValue < 80) {
            // 修改w参数为1920
            params.set('w', '1920');
            // 移除image参数
            params.delete('image');
            params.delete("gravity");
            params.delete("v");
            url.search = params.toString();
            // 更新图片src
            img.setAttribute('src', url.toString());
            updatedCount++;
            console.log(`Updated image src: ${src} -> ${url.toString()}`);
            // 设置图片父元素的class为grow
            const parentDiv = img.closest('div');
            if (parentDiv) {
              parentDiv.className = 'grow';
            }
            document.querySelector("body > div.isolate.mx-auto.flex.max-w-\\[3840px\\].flex-col.bg-background-primary > main > div > div > main > div > div > div.relative.-z-10.flex.min-h-\\[calc\\(100vh-var\\(--navbar-height\\)-12px\\)\\].min-w-0.flex-col > div > div.flex.min-h-\\[calc\\(100vh-var\\(--navbar-height\\)\\)\\].min-w-0.flex-shrink.flex-grow.flex-col > aside").remove()
          }
        }
      } catch (e) {
        // 处理无效URL的情况
        // console.error(`Error processing image URL: ${src ?? ''}`, e);
      }
    }
  });
  
  console.log(`Updated ${updatedCount} images: w<80 changed to w=1920 and/or removed image parameter`);
  
  // 如果有更新，通知后台脚本
  if (updatedCount > 0) {
    chrome.runtime.sendMessage({
      action: "imagesUpdated",
      count: updatedCount
    });
  }
}

// 查找并移除包含"Access all"的h1标签所在的aside元素
function removeAccessAllAside() {
  // 查找所有h1标签
  const h1Elements = document.querySelectorAll('h1');
  
  // 遍历所有h1标签，查找包含"Access all"的标签
  for (const h1 of h1Elements) {
    if (h1.textContent && h1.textContent.includes('Access all')) {
      console.log('找到包含Access all的h1标签:', h1.textContent);
      
      // 向上查找最近的aside标签
      let currentElement = h1;
      while (currentElement && currentElement.tagName !== 'ASIDE') {
        currentElement = currentElement.parentElement;
      }
      
      // 如果找到aside标签，则移除它
      if (currentElement && currentElement.tagName === 'ASIDE') {
        console.log('找到并移除aside元素');
        currentElement.remove();
      }
    }
  }
}

// 初始化内容脚本功能
function initialize() {
  updateImageSources();
  removeAccessAllAside();
  
  // 监听DOM变化，处理动态加载的图片和新添加的h1标签
  const observer = new MutationObserver(mutations => {
    let hasNewImages = false;
    let hasNewElements = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          // 检查是否是元素节点
          if (node.nodeType === 1) {
            // 检查新添加的节点是否是img或包含img
            if (node.tagName === 'IMG' || node.querySelector('img')) {
              hasNewImages = true;
            }
            
            // 检查新添加的节点是否包含h1标签
            if (node.tagName === 'H1' || node.querySelector('h1')) {
              hasNewElements = true;
            }
          }
        })
      }
    });
    
    // 如果有新图片添加，重新运行更新函数
    if (hasNewImages) {
      updateImageSources();
    }
    
    // 如果有新元素添加，检查并移除包含Access all的h1标签所在的aside元素
    if (hasNewElements) {
      removeAccessAllAside();
    }
  });
  
  // 配置观察器
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 执行初始化
initialize();