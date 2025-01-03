browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);
    const domain = url.hostname;

    fetch(`https://beeswax.onrender.com/check_website?domain=${domain}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.coupons.length > 0) {
          browser.browserAction.setBadgeText({ text: "$" });
        } else {
          browser.browserAction.setBadgeText({ text: "" });
        }
      }).catch((err) => console.error(err));
  }
});
  