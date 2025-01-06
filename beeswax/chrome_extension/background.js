chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  const server = "https://beeswax.onrender.com";

    if (changeInfo.status === "complete" && tab.url) {
      const url = new URL(tab.url);
      const domain = url.hostname;
      const encoder = new TextEncoder();
      crypto.subtle.digest("SHA-256", encoder.encode(domain))
      .then(hashBuffer => {
        const hashedDomain = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 5);
  
          fetch(`${server}/check_website?hashedDomain=${hashedDomain}`)
          .then((response) => response.json())
          .then((data) => {

            if (data.success) {
              let coupons = data.coupons.filter(coupon => coupon.website === domain);
              if (coupons.length > 0) {
                chrome.action.setBadgeText({ text: "$" });
              } else {
                chrome.action.setBadgeText({ text: "" });
              }
            } else {
              chrome.action.setBadgeText({ text: "" });
            }
          }).catch((err) => console.error(err));


      })
    }
  });
  
