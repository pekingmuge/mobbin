// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');

  console.log('Popup DOM loaded, elements found:', {
    toggle: !!toggle,
    status: !!status
  });

  // 从chrome.storage读取插件状态
  chrome.storage.local.get('enabled', function (data) {
    console.log('Initial status from storage:', data);
    const isEnabled = data.enabled !== false; // 默认启用
    console.log('Initial isEnabled value:', isEnabled);

    // 创建临时样式元素来禁用过渡效果
    const tempStyle = document.createElement('style');
    tempStyle.id = 'temp-no-transition';
    tempStyle.textContent = `.slider, .slider:before { transition: none !important; }`;
    document.head.appendChild(tempStyle);

    // 设置初始状态
    toggle.checked = isEnabled;

    // 强制重排以应用无过渡的变化
    toggle.offsetWidth;

    // 移除临时样式元素，恢复过渡效果
    document.head.removeChild(tempStyle);

    updateStatusText(isEnabled);
  });

  // 监听switch按钮的点击事件
  toggle.addEventListener('change', function () {
    const isEnabled = this.checked;
    console.log('Toggle changed, checked value:', isEnabled);

    // 保存状态到chrome.storage
    chrome.storage.local.set({ 'enabled': isEnabled }, function () {
      console.log('插件状态已更新:', isEnabled ? '启用' : '禁用');
    });

    // 更新状态文本
    updateStatusText(isEnabled);

    // 向所有标签页发送消息，通知状态变化
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleExtension',
          enabled: isEnabled
        });
      });
    });
  });

  // 更新状态文本
  function updateStatusText(enabled) {
    console.log('Updating status text with enabled value:', enabled);
    status.textContent = enabled ? '插件已启用' : '插件已禁用';
    console.log('Status text updated to:', status.textContent);
  }
});