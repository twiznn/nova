// ####### Initialization 🚩 #######
const getElementsClassname = async () => {
  console.log("Get Elements Classname Triggered ✨");
  try {
    const response = await fetch("https://api.tradeonnova.io/api-v1/elements", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get elements classname: ", response);
    }

    const result = await response.json();
    if (result) {
      // console.log("Success to get elements classname ✅: ", result);
      chrome.storage.local.set(
        {
          elements_classname: result,
          show_flying_modal: true,
          flying_modal_position: {
            top: 50,
            left: 100,
          },
          active_preset_label: "S1",
          active_preset_values: {
            "buy-fee": 0.001,
            "buy-tip": 0.005,
            "buy-slippage": 50,
            "sell-fee": 0.001,
            "sell-tip": 0.005,
            "sell-slippage": 50,
          },
          first_preset_values: {
            "buy-fee": 0.001,
            "buy-tip": 0.005,
            "buy-slippage": 50,
            "sell-fee": 0.001,
            "sell-tip": 0.005,
            "sell-slippage": 50,
          },
          second_preset_values: {
            "buy-fee": 0.005,
            "buy-tip": 0.01,
            "buy-slippage": 60,
            "sell-fee": 0.005,
            "sell-tip": 0.01,
            "sell-slippage": 60,
          },
        },
        () => {
          // console.log("Success to set elements classname 📦");
        },
      );
    }
  } catch (error) {
    console.error("Error get elements classname: ", error);
  }
};
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    console.log("Nova Extension Initialization 🚩");

    chrome.storage.local.clear(() => {
      // console.log("Storage cleared 📦");
    });

    getElementsClassname();
  }

  if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    // console.log("Nova Extension Updated 🆙");

    getElementsClassname();
  }
});

// ####### Authentication 🔐 #######
chrome.tabs.onActivated.addListener((activatedInfo) => {
  if (!activatedInfo.tabId) return;
  chrome.tabs
    .sendMessage(activatedInfo?.tabId, { context: "Trigger base.js" })
    .then(() => {
      // console.log("Tab is on activated - Send message ✉️: ", { context: "Trigger base.js" });
    })
    .catch((err) => {
      // console.error("Failed to send message: ", err);
    });

  chrome.tabs.get(activatedInfo.tabId, (tab) => {
    const message = getMessage(tab?.url);
    if (message) {
      chrome.tabs
        .sendMessage(activatedInfo.tabId, { message })
        .then(() => {
          // console.log("Tab is on activated - Send message ✉️: ", message);
        })
        .catch((err) => {
          // console.error("Failed to send message: ", err);
        });
    }
  });
});
chrome.runtime.onMessage.addListener((request) => {
  if (request.context === "Nova Auth Token Found 🪙") {
    chrome.storage.local.set(
      {
        nova_auth_token: request.token,
      },
      () => {
        // console.log(
        //   "Success to get Nova Auth Token from local storage from background.js ✅",
        // );
      },
    );
  }
});

// ####### Chrome Event Extension Event Configuration 🌐 #######
const getMessage = (url) => {
  const parsedUrl = new URL(url);
  const pathname = parsedUrl.pathname;

  if (url.startsWith("https://photon-sol.tinyastro.io/")) {
    // console.log("PHOTON 🔵");
    if (
      pathname.startsWith("/en/memescope") ||
      pathname.startsWith("/zh/memescope")
    )
      return "photon-memescope";
    if (pathname.startsWith("/en/lp/") || pathname.startsWith("/zn/lp/"))
      return "photon-token";
  } else if (
    [
      "https://bullx.io/",
      "https://backup.bullx.io/",
      "https://backup2.bullx.io/",
    ].some((mappedUrl) => url.startsWith(mappedUrl))
  ) {
    // console.log("BULLX 🟢");
    if (pathname.startsWith("/pump-vision")) return "bullx-pump-vision";
    if (pathname.startsWith("/terminal")) return "bullx-token";
  } else if (url.startsWith("https://neo.bullx.io/")) {
    // console.log("NEO BULLX 🟢");
    if (pathname.startsWith("/terminal")) return "neo-bullx-token";
    if (pathname.startsWith("/")) return "neo-bullx-pump-vision";
  } else if (url.startsWith("https://legacy.bullx.io/")) {
    // console.log("LEGACY BULLX 🟢");
    if (pathname.startsWith("/terminal")) return "legacy-bullx-token";
    if (pathname.startsWith("/")) return "legacy-bullx-pump-vision";
  } else if (url.startsWith("https://gmgn.ai/")) {
    // console.log("GMGN 🟡");
    if (pathname.startsWith("/sol/token")) return "gmgn-token";
    if (pathname.startsWith("/meme")) return "gmgn-memescope";
  }
  return;
};
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url || changeInfo.status !== "complete") return;
  const message = getMessage(changeInfo.url);
  if (message) {
    chrome.tabs
      .sendMessage(tabId, { message })
      .then(() => {
        // console.log("Tab is updated - Send message ✉️: ", message);
      })
      .catch((err) => {
        // console.error("Failed to send message: ", err);
      });
  }
});

const handleNavigation = (details) => {
  if (!details.url) return;

  const message = getMessage(details.url);
  if (message) {
    const maxRetries = 5; // Define maximum retries
    let attempt = 0;

    const sendMessageWithRetry = () => {
      chrome.tabs
        .sendMessage(details.tabId, { message })
        .then(() => {
          // console.log("Navigation event - Send Message ✉️", message);
        })
        .catch((err) => {
          attempt++;
          // console.error(`Attempt ${attempt} failed to send message:`, err);
          if (attempt < maxRetries) {
            setTimeout(sendMessageWithRetry, Math.pow(2, attempt) * 100); // Exponential backoff
          } else {
            // console.error("Failed to send message after max retries:", err);
          }
        });
    };

    sendMessageWithRetry();
  }
};
chrome.webNavigation.onCompleted.addListener(handleNavigation);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation);
