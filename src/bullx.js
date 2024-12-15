function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function insertBefore(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

async function transactToken(mintAddress, method, value, authToken) {
  try {
    const response = await fetch("https://api.tradeonnova.io/api-v1/transact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": authToken,
      },
      body: JSON.stringify({
        mint: mintAddress,
        method: method,
        amount: parseFloat(value) ?? null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to buy token: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      // console.log("Token purchased successfully:", result);
    } else {
      console.error("Token purchase failed:", result);
    }

    return result.success;
  } catch (error) {
    console.error("Error buying token:", error);
  }
}

chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local.get(["is_nova_extension_on"]).then(async (result) => {
    const isExtensionOn = result.is_nova_extension_on;

    // Only proceed if the extension is on
    if (!isExtensionOn) return;

    // PumpVision
    if (request.message === "bullx-pump-vision") {
      // console.log("MESSAGE 📌: ", request.message);
      const container = await findPumpVisionContainer();
      if (container) {
        addMemescopeQTButton();
        const observer = new MutationObserver(() => addMemescopeQTButton());
        observer.observe(container, { childList: true, subtree: true });
      }
    }

    if (request.message === "bullx-token-save") {
      console.log("SAVE MESSAGE 📌: ", request.message);
      // addTopTokenCustomBuyOrSellButtons();
    }

    // Terminal
    if (request.message === "bullx-token") {
      console.log("MESSAGE 📌: ", request.message);
      const topBar = await findTopBar();
      const buySellContainer = await findBuySellContainer();
      if (topBar) {
        addTopTokenCustomBuyOrSellButtons();
      } else {
        console.log("TOP BAR DOESNT EXIST");
      }
      if (buySellContainer) {
        addCustomBuyButton();
      }
      let currentMigrating = document.querySelector("div.buy-sell-migrating");
      if (buySellContainer) {
        const observer = new MutationObserver(() => {
          const migrating = document.querySelector("div.buy-sell-migrating");
          if (Boolean(migrating) !== Boolean(currentMigrating)) {
            currentMigrating = migrating;
            addCustomBuyButton();
          }
        });
        observer.observe(buySellContainer, { childList: true, subtree: true });
      }
    }

    // Home
    if (request.message === "bullx-home") {
      // console.log("MESSAGE 📌 (DISABLED): ", request.message);
      // const main = await findMain();
      // if (main) {
      //   await handleBullxHome();
      // }
      // const observer = new MutationObserver(() => handleBullxHome());
      // observer.observe(main, { childList: true, subtree: true });
    }
  });
});

async function findMain(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const main = document.querySelector(".ant-layout-content");
    if (main) return main;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

async function findPumpVisionContainer(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const container = document.querySelector("div.grid");
    if (container) return container;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

async function findTableContainer(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const container = document.querySelector(".ant-table-tbody");
    if (container) return container;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

async function findTopBar(timeout = 120000) {
  // let isTopBarExist = false;
  // do {
  //   const topBar = document.querySelector(
  //     '[class="w-full gap-x-2 px-3 md:px-0 absolute -bottom-7 md:relative md:bottom-0 flex"]',
  //   );
  //   if (topBar) return topBar;

  //   await new Promise((r) => setTimeout(r, 600));
  // } while (!isTopBarExist);
  for (let i = 0; i < timeout / 600; i++) {
    const topBar = document.querySelector(
      '[class="w-full gap-x-2 px-3 md:px-0 absolute -bottom-7 md:relative md:bottom-0 flex"]',
    );
    if (topBar) return topBar;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function findBuySellContainer(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const container = document.querySelector("div.ant-drawer-content-wrapper");
    if (container) return container;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

function addCustomBuyButton() {
  try {
    let novaAuthToken;
    chrome.storage.local.get("nova_auth_token").then((result) => {
      // console.log("Nova Auth Token 🗝️ " + result.nova_auth_token);
      novaAuthToken = result.nova_auth_token;

      const migrationContainer = document.querySelector(
        "div.buy-sell-migrating",
      );
      const previousSnipingButton =
        document.querySelector(".nova-snipe-qt-btn");
      const previousBuyButton = document.querySelector(".nova-buy-qt-btn");

      if (previousSnipingButton) {
        previousSnipingButton.remove();
      }
      if (previousBuyButton) {
        previousBuyButton.remove();
      }

      if (migrationContainer) {
        const migrationText = Array.from(
          migrationContainer.querySelectorAll("p"),
        ).filter((p) => p.textContent.includes("may take a few minutes"))?.[0];
        if (!migrationText) return;

        const customButton = document.createElement("button");
        const buttonImg = document.createElement("img");
        buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
        buttonImg.alt = "Nova Logo";
        buttonImg.style.aspectRatio = "1/1";
        buttonImg.style.height = "15px";
        buttonImg.style.width = "15px";
        buttonImg.style.marginRight = "5px";
        const buttonText = document.createElement("span");
        buttonText.textContent = "Snipe";

        customButton.appendChild(buttonImg);
        customButton.appendChild(buttonText);
        customButton.type = "button";
        customButton.classList.add(
          "nova-snipe-qt-btn",
          "ant-btn",
          "ant-btn-text",
        );
        customButton.style.marginTop = "6px";
        customButton.style.marginBottom = "-24px";
        customButton.style.border = "1px solid #ce7bed";

        customButton.onclick = async function () {
          const url = new URL(window.location.href);
          const tokenMint = url.searchParams.get("address");

          chrome.storage.local.get("default_buy_amount", async (r) => {
            const defaultBuyAmount = r.default_buy_amount || 0.01;

            customButton.disabled = true;
            customButton.querySelector("span").textContent = "Processing...";
            const result = await transactToken(
              tokenMint,
              "snipe",
              defaultBuyAmount,
              novaAuthToken,
            );

            if (result) {
              customButton.querySelector("span").textContent = "Success!";
            } else {
              customButton.querySelector("span").textContent = "Failed!";
            }
          });
        };

        insertBefore(migrationText, customButton);
      }
    });
  } catch (error) {
    console.error("Failed to add Custom Buy button:", error);
  }
}

function addTopTokenCustomBuyOrSellButtons() {
  try {
    let novaAuthToken;
    let buyButtonsList;
    let sellButtonsList = [20, 50, 100];
    chrome.storage.local
      .get(["nova_auth_token", "custom_buy_value_list"])
      .then((result) => {
        // console.log("Nova Auth Token 🗝️ " + result.nova_auth_token);
        novaAuthToken = result.nova_auth_token;

        if (
          Array.isArray(result.custom_buy_value_list) &&
          result.custom_buy_value_list.length > 0
        ) {
          // console.log(
          //   "ASSIGN CUSTOM BUY VALUE LIST ✅",
          //   result.custom_buy_value_list,
          // );
          buyButtonsList = result.custom_buy_value_list;
        } else {
          // console.log(
          //   "NOT ASSIGN CUSTOM BUY VALUE LIST ❌",
          //   result.custom_buy_value_list,
          // );
          buyButtonsList = [0.5, 1, 2, 5, 10];
        }

        // Element Adjustment
        const navbarContainer = document.querySelector(
          ".w-full.relative.md\\:border-b.md\\:py-\\[12px\\].p-0.md\\:p-3.flex.flex-col.gap-y-\\[10px\\].md\\:flex-row.justify-between.items-center.md\\:h-\\[54px\\].bg-grey-900.md\\:border-solid.md\\:border-grey-600.z-\\[100\\]",
        );
        if (navbarContainer) {
          // console.log("ADJUSTING HEIGHT ✨", navbarContainer);
          navbarContainer.classList.remove("md:h-[54px]");
        }

        // Clear previous container contains all buy buttons
        const previousBuyAndSellButtonsContainer = document.querySelector(
          ".nova-buy-and-sell-buttons-container",
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        // Detect placement of container
        const topBar = document.querySelector(
          '[class="w-full gap-x-2 px-3 md:px-0 absolute -bottom-7 md:relative md:bottom-0 flex"]',
        );
        if (!topBar) return;
        topBar.classList.add("flex-col", "gap-y-2");

        // State
        let isBuy = true;

        // Create buy & sell container
        const buyAndSellButtonsContainer = document.createElement("div");
        buyAndSellButtonsContainer.classList.add(
          "nova-buy-and-sell-buttons-container",
        );
        buyAndSellButtonsContainer.style.width = "100%";
        buyAndSellButtonsContainer.style.display = "flex";
        buyAndSellButtonsContainer.style.flexDirection = "column";
        buyAndSellButtonsContainer.style.justifyContent = "start";
        buyAndSellButtonsContainer.style.alignItems = "start";
        buyAndSellButtonsContainer.style.rowGap = "8px";
        const topContainer = document.createElement("div");
        topContainer.style.width = "100%";
        topContainer.style.display = "flex";
        topContainer.style.flexDirection = "row";
        topContainer.style.alignItems = "center";
        topContainer.style.columnGap = "8px";
        const bottomContainer = document.createElement("div");
        bottomContainer.style.width = "100%";
        bottomContainer.style.display = "flex";
        bottomContainer.style.flexDirection = "row";
        bottomContainer.style.alignItems = "center";
        bottomContainer.style.columnGap = "8px";

        const toggleBuyOrSellButton = document.createElement("button");
        toggleBuyOrSellButton.type = "button";
        toggleBuyOrSellButton.classList.add("ant-btn", "ant-btn-text");
        toggleBuyOrSellButton.style.border = "1px solid rgb(255 83 236)";
        toggleBuyOrSellButton.style.height = "36px";
        toggleBuyOrSellButton.style.padding = "0 12px";
        toggleBuyOrSellButton.textContent = "Switch to Sell";
        toggleBuyOrSellButton.style.fontSize = "14px";
        toggleBuyOrSellButton.addEventListener("click", () => {
          if (buyContainer.style.display === "flex") {
            isBuy = false;
            buttonText.textContent = "Sell";
            toggleBuyOrSellButton.textContent = "Switch to Buy";
            input.setAttribute("placeholder", "Sell Percentage (%)");
            buyContainer.style.display = "none";
            sellContainer.style.display = "flex";
          } else {
            isBuy = true;
            buttonText.textContent = "Buy";
            toggleBuyOrSellButton.textContent = "Switch to Sell";
            input.setAttribute("placeholder", "Buy Amount (SOL)");
            buyContainer.style.display = "flex";
            sellContainer.style.display = "none";
          }
        });
        const firstSeparator = document.createElement("div");
        firstSeparator.style.width = "1px";
        firstSeparator.style.height = "16px";
        firstSeparator.style.background = "rgba(255, 255, 255, 0.1)";
        const secondSeparator = document.createElement("div");
        secondSeparator.style.width = "100%";
        secondSeparator.style.height = "0.5px";
        secondSeparator.style.background = "rgba(255, 255, 255, 0.1)";
        const buyContainer = document.createElement("div");
        buyContainer.style.display = "flex";
        buyContainer.style.justifyContent = "start";
        buyContainer.style.alignItems = "center";
        buyContainer.style.columnGap = "8px";
        buyContainer.style.rowGap = "8px";
        const sellContainer = document.createElement("div");
        sellContainer.style.display = "none";
        sellContainer.style.justifyContent = "start";
        sellContainer.style.alignItems = "center";
        sellContainer.style.columnGap = "8px";
        sellContainer.style.rowGap = "8px";

        // Create Custom Buy or Sell Container
        const customBuyAndSellContainer = document.createElement("div");
        customBuyAndSellContainer.style.display = "flex";
        customBuyAndSellContainer.style.justifyContent = "start";
        customBuyAndSellContainer.style.alignItems = "center";
        customBuyAndSellContainer.style.columnGap = "8px";
        customBuyAndSellContainer.style.rowGap = "8px";
        // Create input
        const inputGroup = document.createElement("div");
        inputGroup.classList.add(
          "ant-input-number-group-wrapper",
          "ant-input-number-group-wrapper-lg",
          "ant-input-number-group-wrapper-outlined",
          "bg-grey-700",
          "flex-1",
          "!border",
          "border-solid",
          "border-grey-500",
          "rounded",
          "overflow-hidden",
          "w-full",
          "max-w-[300px]",
        );
        const inputWrapper = document.createElement("div");
        inputWrapper.classList.add(
          "ant-input-number-wrapper",
          "ant-input-number-group",
        );
        const inputAddon = document.createElement("div");
        inputAddon.classList.add("ant-input-number-group-addon");
        const addonText = document.createElement("span");
        addonText.classList.add(
          "text-grey-200",
          "uppercase",
          "tracking-[1.68px]",
          "text-xs",
          "font-medium",
        );
        addonText.textContent = "Amount";
        inputAddon.appendChild(addonText);
        const inputContainer = document.createElement("div");
        inputContainer.classList.add(
          "ant-input-number-affix-wrapper",
          "ant-input-number-affix-wrapper-lg",
          "ant-input-number-outlined",
        );
        const inputElement = document.createElement("div");
        inputElement.classList.add("ant-input-number", "ant-input-number-lg");
        const inputWrap = document.createElement("div");
        inputWrap.classList.add("ant-input-number-input-wrap");
        const input = document.createElement("input");
        input.classList.add("ant-input-number-input");
        input.type = "number";
        input.value = "";
        input.step = "1";
        input.placeholder = "Buy Amount (SOL)";
        input.autocomplete = "off";
        input.role = "spinbutton";
        input.name = "nova_buy_and_sell";
        input.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        const inputSuffix = document.createElement("span");
        inputSuffix.classList.add("ant-input-number-suffix");
        const suffixIcon = document.createElement("span");
        suffixIcon.classList.add("text-grey-300");
        const suffixSvg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        suffixSvg.setAttribute("width", "12");
        suffixSvg.setAttribute("height", "12");
        suffixSvg.setAttribute("viewBox", "0 0 14 14");
        suffixSvg.setAttribute("fill", "none");
        suffixSvg.setAttribute("alt", "");
        const suffixPath1 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        suffixPath1.setAttribute(
          "d",
          "M3.12368 9.36949C3.19298 9.30019 3.28826 9.25977 3.38932 9.25977H12.5541C12.7215 9.25977 12.8053 9.46189 12.6869 9.58027L10.8765 11.3907C10.8072 11.46 10.7119 11.5004 10.6108 11.5004H1.44608C1.27861 11.5004 1.19487 11.2983 1.31326 11.1799L3.12368 9.36949Z",
        );
        suffixPath1.setAttribute("fill", "currentColor");
        const suffixPath2 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        suffixPath2.setAttribute(
          "d",
          "M3.12368 2.60972C3.19587 2.54042 3.29115 2.5 3.38932 2.5H12.5541C12.7215 2.5 12.8053 2.70212 12.6869 2.82051L10.8765 4.63093C10.8072 4.70023 10.7119 4.74065 10.6108 4.74065H1.44608C1.27861 4.74065 1.19487 4.53853 1.31326 4.42015L3.12368 2.60972Z",
        );
        suffixPath2.setAttribute("fill", "currentColor");
        const suffixPath3 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        suffixPath3.setAttribute(
          "d",
          "M10.8765 5.96714C10.8072 5.89785 10.7119 5.85742 10.6108 5.85742H1.44608C1.27861 5.85742 1.19487 6.05954 1.31326 6.17793L3.12368 7.98835C3.19298 8.05765 3.28826 8.09807 3.38932 8.09807H12.5541C12.7215 8.09807 12.8053 7.89595 12.6869 7.77757L10.8765 5.96714Z",
        );
        suffixPath3.setAttribute("fill", "currentColor");
        suffixSvg.appendChild(suffixPath1);
        suffixSvg.appendChild(suffixPath2);
        suffixSvg.appendChild(suffixPath3);
        suffixIcon.appendChild(suffixSvg);
        inputSuffix.appendChild(suffixIcon);
        inputWrap.appendChild(input);
        inputElement.appendChild(inputWrap);
        inputContainer.appendChild(inputElement);
        inputContainer.appendChild(inputSuffix);
        inputWrapper.appendChild(inputAddon);
        inputWrapper.appendChild(inputContainer);
        inputGroup.appendChild(inputWrapper);
        // Buy or Sell Button
        const buyOrSellButton = document.createElement("button");
        const buttonText = document.createElement("span");
        const buttonImg = document.createElement("img");
        buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
        buttonImg.alt = "Nova Logo";
        buttonImg.style.aspectRatio = "1/1";
        buttonImg.style.height = "15px";
        buttonImg.style.width = "15px";
        buttonImg.style.marginRight = "5px";
        buttonText.textContent = "Buy";
        buyOrSellButton.appendChild(buttonImg);
        buyOrSellButton.appendChild(buttonText);
        buyOrSellButton.type = "button";
        buyOrSellButton.classList.add("ant-btn", "ant-btn-text");
        buyOrSellButton.style.height = "32px";
        buyOrSellButton.style.padding = "0 10px";
        buyOrSellButton.style.flexShrink = "0";
        buyOrSellButton.style.border = "1px solid #ce7bed";
        buyOrSellButton.addEventListener("click", async () => {
          const inputElement = document.querySelector(
            "[name='nova_buy_and_sell']",
          );
          const buyOrSellValue = parseFloat(inputElement.value); // Get the value of the input field
          buyOrSellButton.disabled = true;
          buyOrSellButton.querySelector("span").textContent = "Processing...";

          const result = await transactToken(
            tokenMint,
            isBuy ? "buy" : "sell",
            buyOrSellValue,
            novaAuthToken,
          );

          if (result) {
            buyOrSellButton.querySelector("span").textContent = "Success!";
            setTimeout(() => {
              buyOrSellButton.querySelector("span").textContent = "Buy";
              buyOrSellButton.disabled = false;
              inputElement.value = "";
            }, 2000);
          } else {
            buyOrSellButton.querySelector("span").textContent = "Failed!";
            setTimeout(() => {
              buyOrSellButton.querySelector("span").textContent = "Buy";
              buyOrSellButton.disabled = false;
              inputElement.value = "";
            }, 2000);
          }
        });
        customBuyAndSellContainer.appendChild(inputGroup);
        customBuyAndSellContainer.appendChild(buyOrSellButton);

        // Create buy & sell button with map
        buyButtonsList.map((value) => {
          // console.log("BUY BUTTON VALUE", value);
          // Use an IIFE to create a new scope
          (function (buttonValue) {
            const customBuyButton = document.createElement("button");
            const buttonImg = document.createElement("img");
            buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
            buttonImg.alt = "Nova Logo";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";
            const buttonText = document.createElement("span");
            buttonText.textContent = `Buy ${buttonValue} SOL`;

            customBuyButton.appendChild(buttonImg);
            customBuyButton.appendChild(buttonText);
            customBuyButton.type = "button";
            customBuyButton.classList.add(
              "nova-buy-qt-btn-list",
              "ant-btn",
              "ant-btn-text",
            );
            customBuyButton.style.border = "1px solid #ce7bed";

            customBuyButton.onclick = async function () {
              const url = new URL(window.location.href);
              const tokenMint = url.searchParams.get("address");

              customBuyButton.disabled = true;
              customBuyButton.querySelector("span").textContent =
                "Processing...";
              const result = await transactToken(
                tokenMint,
                "buy",
                buttonValue,
                novaAuthToken,
              );

              if (result) {
                customBuyButton.querySelector("span").textContent = "Success!";
                setTimeout(() => {
                  customBuyButton.disabled = false;
                  customBuyButton.querySelector("span").textContent =
                    `Buy ${buttonValue} SOL`;
                }, 2000);
              } else {
                customBuyButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  customBuyButton.disabled = false;
                  customBuyButton.querySelector("span").textContent =
                    `Buy ${buttonValue} SOL`;
                }, 2000);
              }
            };

            buyContainer.append(customBuyButton);
          })(value);
        });
        sellButtonsList.map((value) => {
          // console.log("SELL BUTTON VALUE", value);
          // Use an IIFE to create a new scope
          (function (buttonValue) {
            const customSellButton = document.createElement("button");
            const buttonImg = document.createElement("img");
            buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
            buttonImg.alt = "Nova Logo";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";
            const buttonText = document.createElement("span");
            buttonText.textContent = `Sell ${buttonValue}%`;

            customSellButton.appendChild(buttonImg);
            customSellButton.appendChild(buttonText);
            customSellButton.type = "button";
            customSellButton.classList.add(
              "nova-sell-qt-btn-list",
              "ant-btn",
              "ant-btn-text",
            );
            customSellButton.style.border = "1px solid #ce7bed";

            customSellButton.onclick = async function () {
              const url = new URL(window.location.href);
              const tokenMint = url.searchParams.get("address");

              customSellButton.disabled = true;
              customSellButton.querySelector("span").textContent =
                "Processing...";
              const result = await transactToken(
                tokenMint,
                "sell",
                buttonValue,
                novaAuthToken,
              );

              if (result) {
                customSellButton.querySelector("span").textContent = "Success!";
                setTimeout(() => {
                  customSellButton.disabled = false;
                  customSellButton.querySelector("span").textContent =
                    `Sell ${buttonValue}%`;
                }, 2000);
              } else {
                customSellButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  customSellButton.disabled = false;
                  customSellButton.querySelector("span").textContent =
                    `Sell ${buttonValue}%`;
                }, 2000);
              }
            };

            sellContainer.append(customSellButton);
          })(value);
        });

        topContainer.append(buyContainer);
        topContainer.append(sellContainer);
        bottomContainer.append(customBuyAndSellContainer);
        bottomContainer.append(firstSeparator);
        bottomContainer.append(toggleBuyOrSellButton);
        buyAndSellButtonsContainer.append(topContainer);
        buyAndSellButtonsContainer.append(bottomContainer);

        topBar.appendChild(buyAndSellButtonsContainer);
      });
  } catch (error) {
    console.error("Failed to add Custom Buy button:", error);
  }
}

function addMemescopeQTButton() {
  try {
    let novaAuthToken;
    chrome.storage.local.get("nova_auth_token").then((result) => {
      // console.log("Nova Auth Token 🗝️ " + result.nova_auth_token);
      novaAuthToken = result.nova_auth_token;

      const cards = Array.from(document.querySelectorAll("div.pump-card"));

      cards.forEach((card) => {
        const isMigrating = Array.from(card.querySelectorAll("span")).some(
          (span) => span.textContent === "Migrating...",
        );

        const existingBuyButton = card.querySelector(".nova-buy-qt-btn");
        const existingSnipeButton = card.querySelector(".nova-snipe-qt-btn");

        if (existingBuyButton || existingSnipeButton) {
          if (isMigrating && existingBuyButton) {
            existingBuyButton.remove();
          } else if (!isMigrating && existingSnipeButton) {
            existingSnipeButton.remove();
          } else {
            return;
          }
        }

        const poolLink = card.querySelector('a[href*="/terminal"]');
        if (!poolLink) return;

        let actionArea = card.querySelector("button");
        if (isMigrating) {
          actionArea = Array.from(card.querySelectorAll("span")).find(
            (span) => span.textContent === "Migrating...",
          );
        }
        if (!actionArea) return;

        const buttonClass = isMigrating
          ? "nova-snipe-qt-btn"
          : "nova-buy-qt-btn";

        const buttonImg = document.createElement("img");
        buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
        buttonImg.alt = "Nova Logo";
        buttonImg.style.aspectRatio = "1/1";
        buttonImg.style.height = "15px";
        buttonImg.style.width = "15px";
        buttonImg.style.marginRight = "5px";
        const buttonText = document.createElement("span");
        buttonText.textContent = isMigrating ? "Snipe" : "Buy";
        const anotherCustomButton = document.createElement("button");

        anotherCustomButton.appendChild(buttonImg);
        anotherCustomButton.appendChild(buttonText);
        anotherCustomButton.type = "button";
        anotherCustomButton.classList.add(
          buttonClass,
          "ant-btn",
          "ant-btn-text",
        );

        anotherCustomButton.style.border = "1px solid #ce7bed";
        anotherCustomButton.style.margin = "0px 6px";
        anotherCustomButton.style.zIndex = "1000";

        const poolUrl = new URL(poolLink.href);
        const tokenMint = poolUrl.searchParams.get("address");

        anotherCustomButton.onclick = async function (event) {
          event.preventDefault();
          event.stopPropagation();
          anotherCustomButton.disabled = true;
          anotherCustomButton.querySelector("span").textContent =
            "Processing...";

          chrome.storage.local.get("default_buy_amount", async (r) => {
            const defaultBuyAmount = r.default_buy_amount || 0.01;

            const result = await transactToken(
              tokenMint,
              isMigrating ? "snipe" : "buy",
              defaultBuyAmount,
              novaAuthToken,
            );

            if (result) {
              anotherCustomButton.querySelector("span").textContent =
                "Success!";
            } else {
              anotherCustomButton.querySelector("span").textContent = "Failed!";
            }
          });
        };

        insertBefore(actionArea, anotherCustomButton);
      });
    });
  } catch (error) {
    console.log("Failed to add Nova button:", error);
  }
}

// function addDiscoverTrendingQTButton() {
//   try {
//     const cards = Array.from(document.querySelectorAll("tr.ant-table-row"));

//     cards.forEach((card) => {
//       const existingBuyButton = card.querySelector(".nova-buy-qt-btn");
//       if (existingBuyButton) {
//         return;
//       }

//       const allTds = card.querySelectorAll("td");
//       const lastTd = allTds[allTds.length - 1];
//       const actionArea = lastTd?.querySelector("button");

//       if (!actionArea) return;

//       const buttonClass = "nova-buy-qt-btn";
//       const buttonImg = document.createElement("img");
//       buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
//       buttonImg.alt = "Nova Logo";
//       buttonImg.style.aspectRatio = "1/1";
//       buttonImg.style.height = "15px";
//       buttonImg.style.width = "15px";
//       buttonImg.style.marginRight = "5px";
//       const buttonText = document.createElement("span");
//       buttonText.textContent = "Buy";
//       const anotherCustomButton = document.createElement("button");

//       anotherCustomButton.appendChild(buttonImg);
//       anotherCustomButton.appendChild(buttonText);
//       anotherCustomButton.type = "button";
//       anotherCustomButton.classList.add(buttonClass, "ant-btn", "ant-btn-text");

//       anotherCustomButton.style.border = "1px solid #ce7bed";
//       anotherCustomButton.style.margin = "0px 6px";
//       anotherCustomButton.style.zIndex = "1000";

//       const [poolId, chainId] = card.getAttribute("data-row-key")?.split("_");
//       if (!poolId || chainId !== "1399811149") return;

//       anotherCustomButton.onclick = function (event) {
//         event.preventDefault();
//         event.stopPropagation();
//         chrome.runtime.sendMessage({
//           message: "openTab",
//           url: "https://t.me/NovaSolana_bot?start=ref_QT_ca_" + poolId,
//         });
//       };

//       insertBefore(actionArea, anotherCustomButton);
//     });
//   } catch (error) {
//     console.log("Failed to add Nova button:", error);
//   }
// }

// async function handleBullxHome() {
//   const container = await findTableContainer();
//   if (container) {
//     addDiscoverTrendingQTButton();
//     const observer = new MutationObserver(() => addDiscoverTrendingQTButton());
//     observer.observe(container, { childList: true, subtree: true });
//   }
// }
