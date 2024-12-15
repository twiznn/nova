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

    if (request.message === "photon-memescope") {
      // console.log("MESSAGE 📌: ", request.message);
      const container = await findTokenContainer();
      if (container) {
        addMemescopeQTButton();
        const observer = new MutationObserver(() => addMemescopeQTButton());
        observer.observe(container, { childList: true, subtree: true });
      }
    }

    if (request.message === "photon-token-save") {
      console.log("SAVE MESSAGE 📌: ", request.message);
      addTopTokenCustomBuyOrSellButtons();
    }

    if (request.message === "photon-token") {
      // console.log("MESSAGE 📌: ", request.message);
      const topBar = await findTopBar();
      const buySellContainer = await findBuySellContainer();
      if (topBar) {
        addTopTokenCustomBuyOrSellButtons();
      }
      if (buySellContainer) {
        addCustomBuyButton();
      }
      let currentMigrating = document.querySelector("div.p-show__migration");
      if (buySellContainer) {
        const observer = new MutationObserver((mutations) => {
          if (
            mutations.every(
              (m) =>
                m.target.nodeName && m.target.nodeName.toLowerCase() === "span",
            )
          )
            return;
          const migrating = document.querySelector("div.p-show__migration");
          if (Boolean(migrating) !== Boolean(currentMigrating)) {
            currentMigrating = migrating;
            addCustomBuyButton();
          }
        });
        observer.observe(buySellContainer, { childList: true, subtree: true });
      }
    }

    if (
      request.message === "photon-discover" ||
      request.message === "photon-trending"
    ) {
      // console.log("MESSAGE 📌 (DISABLED): ", request.message);
      // const container = await findTokenContainer();
      // if (container) {
      //   addDiscoverTrendingQTButton();
      //   const observer = new MutationObserver(() =>
      //     addDiscoverTrendingQTButton(),
      //   );
      //   observer.observe(container, { childList: true, subtree: true });
      // }
    }
  });
});

async function findTokenContainer(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const lpLink = document.querySelector('a[href*="/lp/"]');
    if (lpLink) {
      const container = lpLink.closest("div").parentElement;
      if (container) return container;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

async function findTopBar(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const topBar = document.querySelector(".p-show__bar__row");
    if (topBar) {
      const lastDiv = topBar.querySelector(".l-col-md-auto:last-of-type");
      if (lastDiv) return lastDiv;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

async function findBuySellContainer(timeout = 12000) {
  for (let i = 0; i < timeout / 600; i++) {
    const container = document.querySelector("div.js-show__trade-tabs");
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
        "div.p-show__migration",
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
        const migrationText = migrationContainer.querySelector("h2");
        if (!migrationText) return;

        const tokenMint = document
          .querySelector(".js-copy-to-clipboard:not(.p-show__bar__copy)")
          ?.getAttribute("data-address");
        if (!tokenMint) return;

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
        customButton.classList.add("nova-buy-qt-btn", "c-btn", "c-btn--lt");
        customButton.style.height = "32px";
        customButton.style.padding = "0 10px";
        customButton.style.marginBottom = "12px";

        customButton.onclick = async function () {
          customButton.disabled = true;
          customButton.querySelector("span").textContent = "Processing...";

          chrome.storage.local.get("default_buy_amount", async (r) => {
            const defaultBuyAmount = r.default_buy_amount || 0.01;

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

        const tokenMint = document
          .querySelector(".js-copy-to-clipboard:not(.p-show__bar__copy)")
          ?.getAttribute("data-address");
        if (!tokenMint) return;

        const previousBuyAndSellButtonsContainer = document.querySelector(
          ".nova-buy-and-sell-buttons-container",
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        // Detect placement of container
        const topBar = document.querySelector(".p-show__bar__row");
        if (!topBar) return;

        // State
        let isBuy = true;

        // Create buy & sell container
        const buyAndSellButtonsContainer = document.createElement("div");
        buyAndSellButtonsContainer.classList.add(
          "nova-buy-and-sell-buttons-container",
        );
        buyAndSellButtonsContainer.style.width = "100%";
        buyAndSellButtonsContainer.style.paddingLeft = "12px";
        buyAndSellButtonsContainer.style.paddingRight = "12px";
        buyAndSellButtonsContainer.style.paddingBottom = "10px";
        buyAndSellButtonsContainer.style.display = "flex";
        buyAndSellButtonsContainer.style.flexDirection = "row";
        buyAndSellButtonsContainer.style.justifyContent = "start";
        buyAndSellButtonsContainer.style.alignItems = "center";
        buyAndSellButtonsContainer.style.columnGap = "8px";
        buyAndSellButtonsContainer.style.rowGap = "8px";

        const toggleBuyOrSellButton = document.createElement("button");
        toggleBuyOrSellButton.type = "button";
        toggleBuyOrSellButton.classList.add("c-btn", "c-btn--lt");
        toggleBuyOrSellButton.style.height = "36px";
        toggleBuyOrSellButton.style.padding = "0 12px";
        toggleBuyOrSellButton.style.border = "1px solid #6A60E8";
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
        secondSeparator.style.width = "1px";
        secondSeparator.style.height = "16px";
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
        const fieldContainer = document.createElement("div");
        fieldContainer.className =
          "c-field c-field--xs c-w-form__amount__field is-selected";
        fieldContainer.style.width = "100%";
        const row = document.createElement("div");
        row.className = "l-row no-gutters u-align-items-center u-h-100";
        const colAutoIcon = document.createElement("div");
        colAutoIcon.className = "l-col-auto c-field__col";
        const icon = document.createElement("div");
        icon.className = "c-icon c-field__icon";
        icon.setAttribute("data-icon", "sol");
        colAutoIcon.appendChild(icon);
        const colInput = document.createElement("div");
        colInput.className = "l-col u-h-100";
        const input = document.createElement("input");
        input.setAttribute("autocomplete", "off");
        input.className = "c-field__input js-price-form__input";
        input.setAttribute("data-type", "quote");
        input.setAttribute("lang", "en");
        input.setAttribute("maxlength", "13");
        input.setAttribute("name", "nova_buy_and_sell");
        input.setAttribute("placeholder", "Buy Amount (SOL)");
        input.setAttribute("type", "number");
        input.setAttribute("step", "2");
        input.style.maxWidth = "100%";
        input.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        colInput.appendChild(input);
        const colAutoClear = document.createElement("div");
        colAutoClear.className = "l-col-auto c-field__col c-field__clear-col";
        const clearIcon = document.createElement("div");
        clearIcon.className = "c-icon c-icon--x c-field__clear";
        colAutoClear.appendChild(clearIcon);
        row.appendChild(colAutoIcon);
        row.appendChild(colInput);
        row.appendChild(colAutoClear);
        fieldContainer.appendChild(row);
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
        buttonText.style.fontFamily = "Inter";
        buyOrSellButton.appendChild(buttonImg);
        buyOrSellButton.appendChild(buttonText);
        buyOrSellButton.type = "button";
        buyOrSellButton.classList.add("c-btn", "c-btn--lt");
        buyOrSellButton.style.height = "32px";
        buyOrSellButton.style.padding = "0 10px";
        buyOrSellButton.style.flexShrink = "0";
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
        customBuyAndSellContainer.appendChild(fieldContainer);
        customBuyAndSellContainer.appendChild(buyOrSellButton);

        // Create buy & sell button with map
        buyButtonsList.map((value) => {
          // console.log("BUY BUTTON VALUE", value);
          // Use an IIFE to create a new scope
          (function (buttonValue) {
            const buttonImg = document.createElement("img");
            buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
            buttonImg.alt = "Nova Logo";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";

            const buttonText = document.createElement("span");
            buttonText.textContent = `Buy ${buttonValue} SOL`;

            const customBuyButton = document.createElement("button");
            customBuyButton.appendChild(buttonImg);
            customBuyButton.appendChild(buttonText);
            customBuyButton.type = "button";
            customBuyButton.classList.add(
              "nova-buy-qt-btn-list",
              "c-btn",
              "c-btn--lt",
            );
            customBuyButton.style.height = "32px";
            customBuyButton.style.padding = "0 10px";

            customBuyButton.onclick = async function () {
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
            const buttonImg = document.createElement("img");
            buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
            buttonImg.alt = "Nova Logo";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";

            const buttonText = document.createElement("span");
            buttonText.textContent = `Sell ${buttonValue}%`;

            const customSellButton = document.createElement("button");
            customSellButton.appendChild(buttonImg);
            customSellButton.appendChild(buttonText);
            customSellButton.type = "button";
            customSellButton.classList.add(
              "nova-sell-qt-btn-list",
              "c-btn",
              "c-btn--lt",
            );
            customSellButton.style.height = "32px";
            customSellButton.style.padding = "0 10px";

            customSellButton.onclick = async function () {
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

        const handleResponsiveLayout = () => {
          if (window.innerWidth < 768) {
            buyAndSellButtonsContainer.style.flexDirection = "column";
            firstSeparator.style.width = "100%";
            firstSeparator.style.height = "1px";
            secondSeparator.style.width = "100%";
            secondSeparator.style.height = "1px";
            toggleBuyOrSellButton.style.width = "100%";
            buyContainer.style.flexDirection = "column";
            buyContainer.style.width = "100%";
            sellContainer.style.flexDirection = "column";
            sellContainer.style.width = "100%";
            const buyButtons = document.querySelectorAll(".nova-buy-qt-btn");
            const sellButtons = document.querySelectorAll(".nova-sell-qt-btn");
            buyButtons.forEach((button) => {
              button.style.width = "100%";
            });
            sellButtons.forEach((button) => {
              button.style.width = "100%";
            });
            customBuyAndSellContainer.style.width = "100%";
          } else {
            buyAndSellButtonsContainer.style.flexDirection = "row";
            firstSeparator.style.width = "1px";
            firstSeparator.style.height = "16px";
            secondSeparator.style.width = "1px";
            secondSeparator.style.height = "16px";
            toggleBuyOrSellButton.style.width = "auto";
            buyContainer.style.flexDirection = "row";
            buyContainer.style.width = "auto";
            sellContainer.style.flexDirection = "row";
            sellContainer.style.width = "auto";
            const buyButtons = document.querySelectorAll(".nova-buy-qt-btn");
            const sellButtons = document.querySelectorAll(".nova-sell-qt-btn");
            buyButtons.forEach((button) => {
              button.style.width = "auto";
            });
            sellButtons.forEach((button) => {
              button.style.width = "auto";
            });
            customBuyAndSellContainer.style.width = "auto";
          }
        };
        handleResponsiveLayout();
        window.addEventListener("resize", handleResponsiveLayout);

        buyAndSellButtonsContainer.append(buyContainer);
        buyAndSellButtonsContainer.append(sellContainer);
        buyAndSellButtonsContainer.append(customBuyAndSellContainer);
        // buyAndSellButtonsContainer.append(secondSeparator);
        buyAndSellButtonsContainer.append(firstSeparator);
        buyAndSellButtonsContainer.append(toggleBuyOrSellButton);

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

      const lpLinks = Array.from(document.querySelectorAll('a[href*="/lp/"]'));

      const cards = lpLinks.flatMap((link) => {
        const card = link.closest("div");
        const isMemescopecard =
          card &&
          card.querySelector('[data-tooltip-id="tooltip-memescopecard"]');
        return isMemescopecard ? [card] : [];
      });

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

        const tokenMint = card
          .querySelector(".js-copy-to-clipboard")
          ?.getAttribute("data-address");
        if (!tokenMint) return;

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
          "c-btn",
          "c-btn--lt",
          "u-px-xs",
        );
        anotherCustomButton.style.bottom = "3px";
        anotherCustomButton.style.right = "6px";
        anotherCustomButton.style.position = "relative";
        anotherCustomButton.style.zIndex = "1000";

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
//     const lpLinks = Array.from(document.querySelectorAll('a[href*="/lp/"]'));
//     const cards = lpLinks.flatMap((link) => {
//       const isMemescopecard = link.querySelector(".c-indx-table__btn--buy");
//       return isMemescopecard ? [link] : [];
//     });

//     cards.forEach((card) => {
//       const existingBuyButton = card.querySelector(".nova-buy-qt-btn");

//       if (existingBuyButton) {
//         return;
//       }

//       const actionArea = card.querySelector("button");
//       if (!actionArea) return;

//       const poolId = card.href.split("lp/")[1].split("?")[0];
//       if (!poolId) return;

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
//       anotherCustomButton.classList.add(
//         buttonClass,
//         "c-btn",
//         "c-btn--lt",
//         "c-indx-table__btn",
//       );
//       anotherCustomButton.style.margin = "4px 0px";
//       anotherCustomButton.style.zIndex = "1000";
//       actionArea.style.marginTop = "-6px";

//       anotherCustomButton.onclick = function (event) {
//         event.preventDefault();
//         event.stopPropagation();
//         chrome.runtime.sendMessage({
//           message: "openTab",
//           url: "https://t.me/NovaSolana_bot?start=ref_QT_ca_" + poolId,
//         });
//       };

//       insertAfter(actionArea, anotherCustomButton);
//     });
//   } catch (error) {
//     console.log("Failed to add Nova button:", error);
//   }
// }
