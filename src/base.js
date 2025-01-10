const getAuthOnLocalStorage = async () => {
  const interval = 1200;
  let isTokenFound;

  while (!isTokenFound) {
    const novaAuthToken = localStorage.getItem("nova_auth_token");
    if (novaAuthToken) {
      isTokenFound = true;
      return novaAuthToken;
    } else {
      // console.log("Token not found ♾️", novaAuthToken);
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};

const removeLocalStorageAfterStoring = () => {
  chrome.storage.local.get(["nova_auth_token"]).then((result) => {
    if (result.nova_auth_token) {
      // console.log("Clear local storage after storing 📦");
      localStorage.clear();
    }
  });
};

const main = async () => {
  const novaAuthToken = await getAuthOnLocalStorage();

  if (novaAuthToken) {
    await chrome.runtime.sendMessage({
      context: "Nova Auth Token Found 🪙",
      token: novaAuthToken,
    });

    chrome.storage.local.set(
      {
        nova_auth_token: novaAuthToken,
      },
      () => {
        // console.log(
        //   "Success to get Nova Auth Token from local storage from base.js ✅",
        // );
        removeLocalStorageAfterStoring();
      },
    );
  }
};

const observeForSuccess = () => {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        const successElement = document.querySelector(
          "h3.font__gothic__bold.text-2xl.text-white",
        );
        if (
          successElement &&
          successElement.textContent.trim() === "Success!"
        ) {
          // console.log("Success element detected! 🚀");
          observer.disconnect();
          main();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};
observeForSuccess();

chrome.runtime.onMessage.addListener((request) => {
  if (request.context === "Trigger base.js") {
    // console.log("Trigger base.js 🪝");
    main();
  }
});
