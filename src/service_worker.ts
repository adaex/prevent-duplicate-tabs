const CONFIGS = {
  ignoreQueryPrefix: ['https://bytedance.feishu.cn/', 'https://bytedance.us.feishu.cn'],
  ignoreHashPrefix: [],
};
const TABS: Record<number, chrome.tabs.Tab & { first: boolean }> = {};
const DEBUG = false;

chrome.tabs.onCreated.addListener(tab => {
  log('chrome.tabs.onCreated', tab);
  if (tab.id) TABS[tab.id] = { ...tab, first: true };
});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  log('chrome.tabs.onRemoved', tabId, removeInfo);
  delete TABS[tabId];
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  log('chrome.tabs.onUpdated', tabId, changeInfo, tabInfo);
  const tab = TABS[tabId];
  if (!tab) return;
  Object.assign(tab, tabInfo);
  if (changeInfo.status === 'complete') tab.first = false;
  if (changeInfo.url) checkDuplicate(tabId, changeInfo.url);
});

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  log('chrome.webNavigation.onBeforeNavigate', details);
  const { frameType, tabId, url } = details;
  if (!TABS[tabId]) return;

  if (frameType === 'outermost_frame' && url) checkDuplicate(tabId, url);
});

function checkDuplicate(tabId: number, tabUrl: string) {
  const tab = TABS[tabId];
  if (!tabId || !tabUrl || !tab) return;

  const duplicateTab = findDuplicateTab(tabId, tabUrl);
  if (duplicateTab?.id) {
    chrome.tabs.update(duplicateTab.id, { active: true });

    if (duplicateTab.windowId !== tab?.windowId) chrome.windows.update(duplicateTab.windowId, { focused: true });
    if (tab.first) chrome.tabs.remove(tabId);
  }
}

function findDuplicateTab(id: number, url: string) {
  const urls = [url];
  CONFIGS.ignoreQueryPrefix.forEach(i => {
    if (url.startsWith(i)) urls.push(url.split('?')[0]);
  });
  for (const tab of Object.values(TABS)) {
    if (tab.id !== id && tab.url && urls.includes(tab.url)) return tab;
  }
}

async function initTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) TABS[tab.id] = { ...tab, first: false };
  }
}

function log(...args: any[]) {
  if (DEBUG) console.log(`[${new Date().toISOString()}]`, ...args);
}

initTabs();
