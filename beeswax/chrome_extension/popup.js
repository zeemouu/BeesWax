document.addEventListener("DOMContentLoaded", async () => {
    const couponSection = document.getElementById("section");
    const addCouponButton = document.getElementById("add-coupon");
  
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
  
      const currSite = document.querySelector(".curr_site");
      if (currSite) {currSite.textContent = " to " + domain;}
  
      fetch(`https://beeswax.onrender.com/check_website?domain=${domain}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.coupons.length > 0) {
            couponSection.innerHTML = ""; 
            data.coupons.forEach((coupon) => {
              const template = document.getElementById("template").content.cloneNode(true);
              const couponElement = template.querySelector(".coupon");
              couponElement.setAttribute("data-id", coupon.id);
              template.querySelector(".code").textContent = coupon.code;
              template.querySelector(".rating").textContent = coupon.rating;
              template.querySelector(".desc").textContent = coupon.desc;
  
              template.querySelector(".rate-up").addEventListener("click", () => {
                rateCoupon(coupon.id, 1);
              });
              template.querySelector(".rate-down").addEventListener("click", () => {
                rateCoupon(coupon.id, -1);
              });
  
              couponSection.appendChild(template);
            });
          }
        }).catch((err) => console.error(err));
    });
  
    addCouponButton.addEventListener("click", () => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const url = new URL(tabs[0].url);
        const website = url.hostname; 
        const coupon = document.getElementById("coupon").value;
        const desc = document.getElementById("desc").value;

        if(coupon){
  
        fetch("https://beeswax.onrender.com/add_coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website, coupon , desc }),
        })
          .then((response) => response.json())
          .then((data) => {
            location.reload()
          }).catch((err) => console.error(err));

        }else{
          alert('Please enter a coupon code')
        }
      });
  
    });
  
    function rateCoupon(couponId, ratingChange) {
      fetch("https://beeswax.onrender.com/rate_coupon", {
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
        }).catch((err) => console.error("Error updating rating:", err));
    }
  });
  