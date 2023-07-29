import { echo } from './echo.js';
import { checkDuplicate, removeTab, updateTab } from './tabs.js';

chrome.tabs.onCreated.addListener(tab => {
  echo('chrome.tabs.onCreated', tab);
  if (tab.id) updateTab(tab.id, tab, { first: true });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  echo('chrome.tabs.onRemoved', tabId, removeInfo);
  removeTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  echo('chrome.tabs.onUpdated', tabId, changeInfo, tabInfo);
  updateTab(tabId, tabInfo);

  if (changeInfo.status === 'complete') updateTab(tabId, undefined, { first: false });
  if (changeInfo.url) checkDuplicate(tabId, changeInfo.url);
});

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  echo('chrome.webNavigation.onBeforeNavigate', details);
  const { frameType, tabId, url } = details;
  if (frameType === 'outermost_frame' && url) checkDuplicate(tabId, url);
});
