async function sendToggle() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await browser.tabs.sendMessage(tab.id, { type: "TOGGLE_PSEUDO_FULLSCREEN" });
}

browser.action.onClicked.addListener(() => {
  sendToggle().catch(() => {});
});

browser.commands.onCommand.addListener((cmd) => {
  if (cmd === "toggle-pseudo-fullscreen") {
    sendToggle().catch(() => {});
  }
});

