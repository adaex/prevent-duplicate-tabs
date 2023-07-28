chrome.tabs.onCreated.addListener(tab => {
  echo('chrome.tabs.onCreated', tab);
  if (tab.id) TABS[tab.id] = { ...tab, first: true };
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  echo('chrome.tabs.onRemoved', tabId, removeInfo);
  delete TABS[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  echo('chrome.tabs.onUpdated', tabId, changeInfo, tabInfo);
  const tab = TABS[tabId];
  if (!tab) return;
  Object.assign(tab, tabInfo);
  if (changeInfo.status === 'complete') tab.first = false;
  if (changeInfo.url) checkDuplicate(tabId, changeInfo.url);
});

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  echo('chrome.webNavigation.onBeforeNavigate', details);
  const { frameType, tabId, url } = details;
  if (!TABS[tabId]) return;
  if (frameType === 'outermost_frame' && url) checkDuplicate(tabId, url);
});

initTabs();
