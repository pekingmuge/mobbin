// 当页面加载完成后执行
console.log('Image Enhancer Extension content script loaded');

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received in content script:', request);
  
  if (request.action === "performAction") {
    // 在页面上执行操作
    console.log('Performing action on the page');
    
    // 执行收集设计元素的功能
    const collectedData = collectDesignElements();
    
    // 发送响应回background
    sendResponse({status: "success", data: collectedData});
    return true;
  }
  
  if (request.action === "mobbinPageLoaded") {
    console.log('Mobbin page loaded notification received');
    // 页面加载完成后的初始化操作
    initialize();
    sendResponse({status: "success"});
  }
  
  if (request.action === "saveSelectedElement") {
    console.log('Saving selected element');
    // 保存当前选中的元素
    saveSelectedElement();
    sendResponse({status: "success"});
  }
  
  if (request.action === "forceUpdateImages") {
    console.log('Force updating all images');
    // 强制更新所有图片
    updateImageSources();
    sendResponse({status: "success"});
  }
  
  // 注意：如果使用异步响应，需要返回true
  return true;
});

// 添加自定义样式到Mobbin页面
function addCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .mobbin-highlight {
      border: 2px solid #4285f4 !important;
      background-color: rgba(66, 133, 244, 0.1) !important;
    }
    
    .mobbin-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 24px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
  `;
  document.head.appendChild(style);
}

// 为页面元素添加交互功能
function setupPageInteraction() {
  // 在Mobbin网站上添加特定功能
  if (window.location.hostname.includes('mobbin.com')) {
    // 添加浮动按钮
    const floatingButton = document.createElement('button');
    floatingButton.className = 'mobbin-button';
    floatingButton.textContent = '+';
    floatingButton.title = 'Mobbin Extension';
    
    floatingButton.addEventListener('click', function() {
      // 收集页面上的设计元素
      collectDesignElements();
    });
    
    document.body.appendChild(floatingButton);
    
    // 监听页面上的设计元素
    detectMobbinElements();
  }
  
  // 在所有网站上执行图片更新功能
  updateImageSources();
}

// 检测Mobbin页面上的设计元素
function detectMobbinElements() {
  // 这里可以添加特定于Mobbin网站的元素检测逻辑
  console.log('Detecting Mobbin design elements...');
  
  // 示例：检测特定类名的元素
  const designElements = document.querySelectorAll('.design-element, .screen, .component');
  
  if (designElements.length > 0) {
    console.log(`Found ${designElements.length} design elements on the page`);
  }
}

// 收集页面上的设计元素
function collectDesignElements() {
  console.log('Collecting design elements from Mobbin...');
  
  // 收集页面信息
  const pageData = {
    title: document.title,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    elements: []
  };
  
  // 查找设计元素
  const designElements = document.querySelectorAll('.design-element, .screen, .component');
  
  designElements.forEach((element, index) => {
    // 高亮元素
    element.classList.add('mobbin-highlight');
    
    // 收集元素信息
    pageData.elements.push({
      index: index,
      type: element.className,
      text: element.textContent.trim().substring(0, 100),
      rect: element.getBoundingClientRect()
    });
  });
  
  // 将数据存储到本地存储
  chrome.storage.local.set({mobbinData: pageData}, function() {
    console.log('Design elements saved');
    
    // 通知后台脚本
    chrome.runtime.sendMessage({
      action: "elementsCollected",
      count: pageData.elements.length
    });
  });
  
  // 返回收集的数据
  return pageData;
}

// 保存当前选中的元素
function saveSelectedElement() {
  console.log('Saving currently selected element');
  
  // 获取当前选中的元素
  const selection = window.getSelection();
  let selectedElement = null;
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    selectedElement = range.commonAncestorContainer;
    
    // 如果选中的是文本节点，获取其父元素
    if (selectedElement.nodeType === 3) {
      selectedElement = selectedElement.parentElement;
    }
  }
  
  if (!selectedElement) {
    console.log('No element selected');
    return;
  }
  
  // 高亮选中的元素
  selectedElement.classList.add('mobbin-highlight');
  
  // 收集元素信息
  const elementData = {
    title: document.title,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    element: {
      type: selectedElement.tagName,
      className: selectedElement.className,
      text: selectedElement.textContent.trim().substring(0, 100),
      html: selectedElement.outerHTML.substring(0, 500)
    }
  };
  
  // 将数据存储到本地存储
  chrome.storage.local.get('mobbinData', function(data) {
    let mobbinData = data.mobbinData || [];
    
    // 如果mobbinData不是数组，则初始化为数组
    if (!Array.isArray(mobbinData)) {
      mobbinData = [];
    }
    
    // 添加新元素
    mobbinData.push(elementData);
    
    // 保存更新后的数据
    chrome.storage.local.set({mobbinData: mobbinData}, function() {
      console.log('Selected element saved');
      
      // 通知后台脚本
      chrome.runtime.sendMessage({
        action: "elementsCollected",
        count: 1
      });
    });
  });
}

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
            params.set('w', '640');
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
        console.error(`Error processing image URL: ${src}`, e);
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

// 初始化内容脚本功能
function initialize() {
  addCustomStyles();
  setupPageInteraction();
  
  // 监听DOM变化，处理动态加载的图片
  const observer = new MutationObserver(mutations => {
    let hasNewImages = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          // 检查是否是元素节点
          if (node.nodeType === 1) {
            // 检查新添加的节点是否是img或包含img
            if (node.tagName === 'IMG' || node.querySelector('img')) {
              hasNewImages = true;
            }
          }
        });
      }
    });
    
    // 如果有新图片添加，重新运行更新函数
    if (hasNewImages) {
      updateImageSources();
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