// ####### Auth Token Configuration 🔐 #######
let ALL_COOKIES = [];
const LANDING_PAGE_URL = "https://click.tradeonnova.io/";
chrome.cookies.get(
  { url: LANDING_PAGE_URL, name: "nova_auth_token" },
  (novaAuthToken) => {
    if (novaAuthToken) {
      console.log("Initial 🏁 - novaAuthToken Cookie Found 🍪:", novaAuthToken);

      // Storage 📦
      chrome.storage.local
        .get("nova_auth_token")
        .then((stored) => {
          if (stored.nova_auth_token !== novaAuthToken.value) {
            chrome.storage.local
              .set({ nova_auth_token: novaAuthToken.value })
              .then(() => {
                console.log(
                  "Initial 🏁 - New token !== Old token | Storage been set ✅",
                  novaAuthToken.value,
                  stored.nova_auth_token
                );
              });
          } else {
            console.log(
              "Initial 🏁 - New token === Old token | Storage not been set ❌",
              novaAuthToken.value,
              stored.nova_auth_token
            );
          }
        })
        .catch((error) => console.error("Error reading storage 📦❌:", error));
    } else {
      console.log("Initial 🏁 - novaAuthToken Cookie Not Found ❌");
    }
  }
);

function getNovaAuthToken(eventName) {
  chrome.cookies.get(
    { url: LANDING_PAGE_URL, name: "nova_auth_token" },
    (novaAuthToken) => {
      if (novaAuthToken) {
        // Cookie 🍪
        ALL_COOKIES = ALL_COOKIES.filter(
          (cookie) => cookie.name !== "nova_auth_token"
        );
        ALL_COOKIES.push(novaAuthToken);
        console.log(
          `${eventName} 🚨 - New Cookies with novaAuthToken 🍪: `,
          ALL_COOKIES
        );

        // Storage 📦
        chrome.storage.local
          .get("nova_auth_token")
          .then((stored) => {
            if (stored.nova_auth_token !== novaAuthToken.value) {
              chrome.storage.local
                .set({ nova_auth_token: novaAuthToken.value })
                .then(() => {
                  console.log(
                    `${eventName} 🚨 - New token !== Old token | Storage been set ✅`,
                    novaAuthToken.value,
                    stored.nova_auth_token
                  );
                });
            } else {
              console.log(
                `${eventName} 🚨 - New token === Old token | Storage not been set ❌`,
                novaAuthToken.value,
                stored.nova_auth_token
              );
            }
          })
          .catch((error) =>
            console.error("Error reading storage 📦❌:", error)
          );
      } else {
        console.log(`${eventName} 🚨 - novaAuthToken Cookie Not Found ❌`);
      }
    }
  );
}

chrome.tabs.onHighlighted.addListener((highlightInfo) => {
  setTimeout(() => {
    console.log("Tab On | Highlighted ✨", highlightInfo);
    getNovaAuthToken("onHightlighted");
  }, 1000);
});
chrome.tabs.onActivated.addListener((activatedInfo) => {
  console.log("Tab On | Activated ✨", activatedInfo);
  getNovaAuthToken("onActivated");
});
chrome.tabs.onReplaced.addListener((replacedInfo) => {
  console.log("Tab On | Replaced ✨", replacedInfo);
  getNovaAuthToken("onReplaced");
});
chrome.tabs.onRemoved.addListener((removedInfo) => {
  console.log("Tab On | Removed ✨", removedInfo);
  getNovaAuthToken("onRemoved");
});
chrome.tabs.onCreated.addListener((createdInfo) => {
  console.log("Tab On | Created ✨", createdInfo);
  getNovaAuthToken("onCreated");
});

// ####### Chrome Event Extension Event Configuration 🌐 #######
function getMessage(url) {
  if (url.includes("photon-sol.tinyastro.io")) {
    if (url.includes("/memescope")) return "photon-memescope";
    if (url.includes("/lp/")) return "photon-token";
    if (url.includes("/discover")) return "photon-discover";
    if (url.includes("/trending")) return "photon-trending";
  } else if (url.includes("neo.bullx.io")) {
    // Check for the most specific path first
    if (url.includes("/terminal")) return "neo-token";
    // Then check for other specific paths if any
    // Add other specific paths here if needed
    // Finally, handle the general case
    if (url.includes("/")) return "bullx-pump-vision";
    if (!url.split("neo.bullx.io/")[1]) return "bullx-home";
  } else if (url.includes("bullx.io")) {
    // Similarly, reorder conditions for bullx.io
    if (url.includes("/terminal")) return "bullx-token";
    if (url.includes("/pump-vision")) return "bullx-pump-vision";
    if (!url.split("bullx.io/")[1]) return "bullx-home";
  }

  return;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log("Tab On | Updated ✨", changeInfo);
  getNovaAuthToken("onUpdated");

  if (!changeInfo.url || changeInfo.status !== "complete") return;
  const message = getMessage(changeInfo.url);
  if (message) {
    chrome.tabs
      .sendMessage(tabId, { message })
      .then(() => {
        // console.log("Tab is Updated - Send Message ✉️", message);
      })
      .catch((err) => {
        console.error("Failed to send message:", err);
      });
  }
});

function handleNavigation(details) {
  if (!details.url) return;
  const message = getMessage(details.url);
  if (message) {
    chrome.tabs
      .sendMessage(details.tabId, { message })
      .then(() => {
        // console.log("Navigation event - Send Message ✉️", message);
      })
      .catch((err) => {
        console.error("Failed to send message:", err);
        chrome.tabs.reload(details.id, {}, () => {
          // console.log(`Reloaded tab with ID: ${details.id}`);
        });
      });
  }
}
chrome.webNavigation.onCompleted.addListener(handleNavigation);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation);

chrome.runtime.onMessage.addListener(function (request) {
  if (request.message === "openTab") {
    chrome.tabs.create({
      url: request.url,
    });
    return true;
  }
});
