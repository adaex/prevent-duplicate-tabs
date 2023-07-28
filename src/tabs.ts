export const TABS: Record<number, chrome.tabs.Tab & { first: boolean }> = {};

// 检查是否重复
export function checkDuplicate(tabId: number, tabUrl: string) {
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

export async function initTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) TABS[tab.id] = { ...tab, first: false };
  }
}
