document.addEventListener("DOMContentLoaded", async () => {
  const addCouponButton = document.getElementById("add-coupon");
  const couponSection = document.getElementById("section");
  const toggleExpiry = document.getElementById("toggle-expiry");
  const toggleSeasonal = document.getElementById("toggle-seasonal");

  const server = "https://beeswax.onrender.com";

  var type = 'coupon';
  
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;

    const encoder = new TextEncoder();
    crypto.subtle.digest("SHA-256", encoder.encode(domain))
      .then(hashBuffer => {
        const hashedDomain = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 5);
    

        const currSite = document.querySelector(".curr_site");
        if (currSite) {
          currSite.textContent = " to " + domain;
        }

        fetch(`${server}/check_website?hashedDomain=${hashedDomain}`)
          .then((response) => response.json())
          .then((data) => {
            
            if (data.success && data.coupons.length > 0) {
              let coupons = data.coupons;
             coupons = coupons.filter(coupon => coupon.website === domain);
              
              if (coupons.length > 0) {
                couponSection.innerHTML = ""; 

               let shown = 0;
               coupons.sort(function(a, b){ return b.rating - a.rating });
  
               for (let i = 0; i < Math.min(coupons.length, 3); i++) {
                 if (coupons[i]) {
                    showcoupon(coupons[i]);
                  }
                }
  
                if (coupons.length > 3) {
                 const temptemplate = document.getElementById("showmore").content.cloneNode(true);
                  const showmoreButton = temptemplate.querySelector(".showmoreButton");
  
                 showmoreButton.addEventListener("click", () => {
                   for (let i = shown; i < coupons.length; i++) {
                     showcoupon(coupons[i]);
                   }
                   showmoreButton.remove(); 
                 });
                 couponSection.appendChild(showmoreButton);
               }
          }
        }
      })
      .catch((err) => console.error(err));
      })
      .catch(err => console.error("Error hashing domain:", err));

  });

  addCouponButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const website = url.hostname; 
      const coupon = document.getElementById("coupon").value;
      const desc = document.getElementById("desc").value;

      if(coupon){

      if(type === 'expires'){

        const expiryDate = document.getElementById("expiry-date").value;

        if(expiryDate){
        fetch(`${server}/add_coupon`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website, coupon , desc, type , expiryDate}),
        })
          .then((response) => response.json())
          .then((data) => {
            location.reload()
          }).catch((err) => console.error(err));
        }else{alert('Please enter an expiry date')}
      }else if(type === 'seasonal'){
        const expiryDate = document.getElementById("expiry-date").value;
        const startDate = document.getElementById("start-date").value;

        if(expiryDate){
        if(startDate){

        fetch(`${server}/add_coupon`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website, coupon , desc, type, expiryDate, startDate}),
        })
          .then((response) => response.json())
          .then((data) => {
            location.reload()
          }).catch((err) => console.error(err));

        }else{alert('Please enter an expiry date')}
        }alert('Please enter a start date')

      }else{
        fetch(`${server}/add_coupon`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website, coupon , desc, type}),
        })
          .then((response) => response.json())
          .then((data) => {
            location.reload()
          }).catch((err) => console.error(err));
      }



      }else{
        alert('Please enter a coupon code')
      }
    });

  });

  toggleExpiry.addEventListener("click", () => {
    const settingsExpiary = document.getElementById("expiry-settings");
    if (settingsExpiary.style.display === "none") {
      type = 'expires';
      settingsExpiary.style.display = "block";
      toggleExpiry.textContent = "↑ Hide expiry settings ";
    } else {
      type = 'coupon';
      settingsExpiary.style.display = "none";
      toggleExpiry.textContent = "↓ Add expiry date";
    }
  });

  toggleSeasonal.addEventListener("click", () => {
    const settingsSeasonal = document.getElementById("seasonal-settings");
    if (settingsSeasonal.style.display === "none") {
      type = 'seasonal';
      settingsSeasonal.style.display = "block";
      toggleSeasonal.textContent = "↑ Hide Seasonal settings ";
    } else {
      type = 'expires';
      settingsSeasonal.style.display = "none";
      toggleSeasonal.textContent = "↓ Add seasonal coupon";
    }
  });
  

  function showcoupon(coupon) {
    const template = document.getElementById("template").content.cloneNode(true);
    const couponElement = template.querySelector(".coupon");
    couponElement.setAttribute("data-id", coupon._id);
    template.querySelector(".code").textContent = coupon.code;
    template.querySelector(".rating").textContent = coupon.rating;
    template.querySelector(".desc").textContent = coupon.desc;
    if(coupon.expiryDate){template.querySelector(".expiryDate").textContent = "Expires in " + coupon.expiresIn + " day(s)";}

    template.querySelector(".rate-up").addEventListener("click", () => {
      rateCoupon(coupon._id, 1);
    });
    template.querySelector(".rate-down").addEventListener("click", () => {
      rateCoupon(coupon._id, -1);
    });

    couponSection.appendChild(template);
  }

  function rateCoupon(couponId, ratingChange) {
    fetch(`${server}/rate_coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon_id: couponId, rating_change: ratingChange }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const couponElement = document.querySelector(`.coupon[data-id="${couponId}"]`);
          if (couponElement) {
            if (data.deleted) {
              couponElement.style.transition = "opacity 0.3s";
              couponElement.style.opacity = "0";
              setTimeout(() => couponElement.remove(), 300);
            } else {
              const ratingElement = couponElement.querySelector(".rating");
              const newRating = parseInt(ratingElement.textContent) + ratingChange;
              ratingElement.textContent = newRating;

              const rateButtons = couponElement.querySelectorAll(".rate-buttons button");
              rateButtons.forEach((button) => {
                button.disabled = true;
                button.style.opacity = "0.5";
              });
            }
          }
        } else {
          alert("Failed to update rating.");
        }
      })
      .catch((err) => console.error("Error updating rating:", err));
  }
});
