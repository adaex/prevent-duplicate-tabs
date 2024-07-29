const TABS: Record<number, chrome.tabs.Tab> = {};

///// 事件绑定 /////
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
});
chrome.tabs.onCreated.addListener(tab => {
  // echo('chrome.tabs.onCreated', tab);
  if (tab.id) TABS[tab.id] = tab;
});
chrome.tabs.onRemoved.addListener(tabId => {
  // echo('chrome.tabs.onRemoved', tabId, removeInfo);
  delete TABS[tabId];
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  // if (changeInfo.url) echo('chrome.tabs.onUpdated', tabId, changeInfo);
  TABS[tabId] = tabInfo;
  if (changeInfo.url) checkDuplicate(tabId, changeInfo.url);
});
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (
    details.frameType === 'outermost_frame' &&
    details.url &&
    details.tabId &&
    TABS[details.tabId] &&
    !TABS[details.tabId].url
  ) {
    TABS[details.tabId].url = details.url;
    checkDuplicate(details.tabId, details.url);
  }
});
start();

///// 辅助方法 /////
const noop = () => {};
function echo(...args: any[]) {
  console.info('[' + new Date().toISOString() + ']', ...args);
}
async function start() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) if (tab.id) TABS[tab.id] = tab;
}
///// 核心逻辑 /////
async function checkDuplicate(tabId: number, url: string) {
  const tabs = Object.values(TABS);
  const existedTab = tabs.find(tab => tab.id !== tabId && tab.url === url);
  const currentTab = TABS[tabId];

  // 如果有重复的 tab 则关闭，注意这里忽略复制 tab 的情况，即自己打开自己的情况
  if (existedTab?.id && currentTab.openerTabId !== existedTab.id) {
    // 如果没有加载，则强制刷新，否则无法跳转，一般是关闭浏览器后重新打开，历史的 tab 会设置为 unloaded 状态（这个逻辑适用于 arc 浏览器）
    if (existedTab.status === 'unloaded') await chrome.tabs.reload(existedTab.id, { bypassCache: true }).catch(noop);

    // 激活目标 tab 并关闭当前 tab
    await chrome.tabs.update(existedTab.id, { active: true }).catch(noop);
    await chrome.tabs.remove(tabId).catch(noop);
  }
}
