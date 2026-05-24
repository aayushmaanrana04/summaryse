// Minimal popup script - just handles navigation
function openOnboarding() {
  chrome.tabs.create({ url: 'pages/onboarding.html' });
}
