// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  const donateButton = document.getElementById('donateButton');
  const donateSection = document.getElementById('donateSection');

  console.log('Popup DOM loaded, elements found:', {
    toggle: !!toggle,
    status: !!status,
    donateButton: !!donateButton,
    donateSection: !!donateSection
  });

  // Add click event listener for donate button
  donateButton.addEventListener('click', function () {
    if (donateSection.classList.contains('show')) {
      donateSection.classList.remove('show');
      setTimeout(function () {
        donateButton.textContent = 'Buy Me A Coffee';
      }, 250);
    } else {
      donateButton.textContent = 'Hide';
      setTimeout(function () {
        donateSection.classList.add('show');
      }, 50);
    }
  });

  // Read extension status from chrome.storage
  chrome.storage.local.get('enabled', function (data) {
    console.log('Initial status from storage:', data);
    const isEnabled = data.enabled !== false; // Default to enabled
    console.log('Initial isEnabled value:', isEnabled);

    // Create temporary style element to disable transition effects
    const tempStyle = document.createElement('style');
    tempStyle.id = 'temp-no-transition';
    tempStyle.textContent = `.slider, .slider:before { transition: none !important; }`;
    document.head.appendChild(tempStyle);

    // Set initial status
    console.log('Setting toggle checked state:', isEnabled);
    toggle.checked = isEnabled;

    // Force reflow to apply changes without transition
    toggle.offsetWidth;

    // Remove temporary style element, restore transition effects
    document.head.removeChild(tempStyle);

    updateStatusText(isEnabled);
  });

  // Listen for switch button click events
  toggle.addEventListener('change', function () {
    const isEnabled = this.checked;
    console.log('Toggle changed, checked value:', isEnabled);

    // Save status to chrome.storage
    chrome.storage.local.set({ 'enabled': isEnabled }, function () {
      console.log('Mobbin Cracker status updated:', isEnabled ? 'ON' : 'OFF');
    });

    // Update status text
    updateStatusText(isEnabled);

    // Send message to all tabs, notify status change
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleExtension',
          enabled: isEnabled
        });
      });
    });
  });

  // Update status text
  function updateStatusText(enabled) {
    console.log('Updating status text with enabled value:', enabled);
    status.textContent = enabled ? 'Mobbin Cracker is ON' : 'Mobbin Cracker is OFF';
    console.log('Status text updated to:', status.textContent);
  }
});