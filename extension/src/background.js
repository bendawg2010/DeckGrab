// DeckGrab — service worker (background script)
//
// Manifest V3 requires a service worker to register an action click
// handler that opens DeckGrab when the user clicks the toolbar icon
// outside a Quizlet page. Inside Quizlet, the content script's
// floating button is the primary entry point.

chrome.action.onClicked.addListener((tab) => {
  // If they clicked the icon while on Quizlet, focus the floating
  // button by re-injecting the content script (no-op if mounted).
  // Otherwise just open deckgrab.pages.dev so they know what we are.
  if (tab && tab.url && /^https:\/\/(?:www\.)?quizlet\.com\//.test(tab.url)) {
    // Already on Quizlet — content script handles it. Surface a tab.
    chrome.tabs.update(tab.id, { url: tab.url });
  } else {
    chrome.tabs.create({ url: "https://deckgrab.pages.dev/" });
  }
});

// Welcome page on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://deckgrab.pages.dev/?installed=1" });
  }
});
