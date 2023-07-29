import { ignoreQueryHost } from './config.js';

type TabExt = { first?: boolean };
type Tab = chrome.tabs.Tab & TabExt;

///// 基础方法 /////

// tab 存储
export const TABS: Record<number, Tab> = {};

// 更新 tab
export function updateTab(tabId: number, tab?: chrome.tabs.Tab, ext?: TabExt) {
  if (!tabId || !tab) return;
  if (TABS[tabId]) Object.assign(TABS[tabId], tab, ext);
  else TABS[tabId] = Object.assign({}, tab, ext);
}

// 移除 tab
export function removeTab(tabId: number) {
  delete TABS[tabId];
}

///// 判断重复标签

// 检查是否重复
export function checkDuplicate(tabId: number, url: string) {
  const tab = TABS[tabId];
  if (!tabId || !url || !tab) return;

  const duplicateTab = findDuplicateTab(tabId, url);
  if (duplicateTab?.id) {
    // 防止导航错误
    if (tab.openerTabId) chrome.tabs.update(tab.openerTabId, { active: true });
    chrome.tabs.update(duplicateTab.id, { active: true });
    // 定位到对应窗口
    if (duplicateTab.windowId !== tab?.windowId) chrome.windows.update(duplicateTab.windowId, { focused: true });
    // 只有首次才自动关闭
    if (tab.first) chrome.tabs.remove(tabId);
  }
}

// 查找重复的标签
function findDuplicateTab(id: number, url: string) {
  // 处理数据
  const urls = [url];
  const { host } = newURL(url) ?? {};

  // 判断是否忽略 query
  if (isIgnoreQuery(host)) urls.push(url.split('?')[0]);

  // 判断是否忽略 hash
  // todo

  // 判断是否存在
  for (const tab of Object.values(TABS)) {
    if (tab.id !== id && tab.url && urls.includes(tab.url)) return tab;
  }
}

function isIgnoreQuery(host?: string) {
  if (!host) return;
  return ignoreQueryHost.some(i => host === i);
}

function newURL(url: string) {
  try {
    return new URL(url);
  } catch {}
}

///// 初始化 tab /////
// 获取所有 tab 信息
(async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) updateTab(tab.id, tab, { first: false });
  }
})();
