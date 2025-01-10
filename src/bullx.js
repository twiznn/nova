// ###### DOM Manipulation 🌴 ######
const insertElementAfter = (rNode, nNode) => {
  rNode.parentNode.insertBefore(nNode, rNode.nextSibling);
};
const insertElementBefore = (rNode, nNode) => {
  rNode.parentNode.insertBefore(nNode, rNode);
};

// ###### Helpers 🤝 ######
const cleanEscapedSvg = (escapedSvg) => {
  let cleanedSvg = escapedSvg.replace(/\\"/g, '"');
  cleanedSvg = cleanedSvg.replace(/\\n/g, "");
  return cleanedSvg;
};
const saveFlyingModalPosition = (left, top) => {
  chrome.storage.local.set(
    {
      flying_modal_position: { left, top },
    },
    () => {
      // Optional: Handle success callback
      // console.log('Position saved to chrome storage');
    },
  );
};

// ###### Transaction 🪙 ######
const transactToken = async (
  mintAddress,
  method,
  value,
  authToken,
  activePresetValues,
  solAmount,
) => {
  try {
    const payload = {
      mint: mintAddress,
      method: method,
      amount: parseFloat(value) ?? null,
      buyFee: null,
      buyTip: null,
      buySlippage: null,
      sellFee: null,
      sellTip: null,
      sellSlippage: null,
      solAmount: solAmount || null,
    };

    if (method === "buy") {
      payload.buyFee = activePresetValues["buy-fee"];
      payload.buyTip = activePresetValues["buy-tip"];
      payload.buySlippage = activePresetValues["buy-slippage"];
    } else if (method === "sell") {
      payload.sellFee = activePresetValues["sell-fee"];
      payload.sellTip = activePresetValues["sell-tip"];
      payload.sellSlippage = activePresetValues["sell-slippage"];
    } else if (method === "snipe") {
    }

    const response = await fetch("https://api.tradeonnova.io/api-v1/transact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": authToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to buy token: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      // console.log("Token purchased successfully:", result);
    } else {
      // console.error("Token purchase failed:", result);
    }

    return result.success;
  } catch (error) {
    // console.error("Error buying token:", error);
  }
};

// ###### Custom Hotkeys 🔥 ######
let isRequestInProgress = false;
let keydownHandler;
const addCustomBuyAndSellHotkeys = (mintAddress, authToken) => {
  return async function (event) {
    if (isRequestInProgress) {
      // console.warn("Action already in progress, please wait.");
      return;
    }

    if (event.ctrlKey && event.key === "b") {
      event.preventDefault();
      isRequestInProgress = true;
      try {
        const result = await chrome.storage.local.get([
          "default_buy_amount",
          "active_preset_values",
        ]);
        const defaultBuyAmount = result.default_buy_amount || 0.01;
        // console.log(
        //   "Ctrl + B | BUY TRIGGERED ✨",
        //   authToken,
        //   defaultBuyAmount,
        //   mintAddress,
        // );
        const response = await transactToken(
          mintAddress,
          "buy",
          defaultBuyAmount,
          result.nova_auth_token,
          result?.active_preset_values,
        );

        if (response) {
          // console.log("Ctrl + B | BUY SUCCESS ✅", response);
        } else {
          // console.log("Ctrl + B | BUY FAILED ❌");
        }
      } catch (error) {
        // console.error("Ctrl + B | BUY ERROR ❌", error);
      } finally {
        isRequestInProgress = false;
      }
    }

    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      isRequestInProgress = true;
      try {
        const result = await chrome.storage.local.get([
          "default_buy_amount",
          "active_preset_values",
        ]);
        const defaultSellAmount = result.default_buy_amount || 0.01;
        // console.log(
        //   "Ctrl + S | SELL TRIGGERED 🍒",
        //   authToken,
        //   defaultSellAmount,
        //   mintAddress,
        // );
        const response = await transactToken(
          mintAddress,
          "sell",
          defaultSellAmount,
          result.nova_auth_token,
          result?.active_preset_values,
        );

        if (response) {
          // console.log("Ctrl + S | SELL SUCCESS ✅", response);
        } else {
          // console.log("Ctrl + S | SELL FAILED ❌");
        }
      } catch (error) {
        // console.error("Ctrl + S | SELL ERROR ❌", error);
      } finally {
        isRequestInProgress = false;
      }
    }
  };
};
const addHotkey = (mintAddress, authToken) => {
  keydownHandler = addCustomBuyAndSellHotkeys(mintAddress, authToken);
  // console.log("Added Custom Buy & Sell Hotkeys 💰");
  document.addEventListener("keydown", keydownHandler);
};
const removeHotkey = () => {
  // console.log("Removed Custom Buy & Sell Hotkeys 💰");
  document.removeEventListener("keydown", keydownHandler);
};

// ######################
// ###### Main ✨ ######
// ######################
// Remove suspicious detection function ⚠️
const findAndRemoveSuspiciousDetectionModal = (selectors) => {
  // const prevTrigger = document.querySelector(".nova-click-trigger");
  // if (!prevTrigger) {
  //   const triggerSuspiciousDetection = document.createElement("div");
  //   triggerSuspiciousDetection.classList.add("nova-click-trigger");
  //   document.body.appendChild(triggerSuspiciousDetection);
  // } else {
  //   prevTrigger.remove();
  // }

  const observer = new MutationObserver(() => {
    selectors.forEach((selector) => {
      const suspiciousModal = document.querySelector(selector);

      if (!suspiciousModal) return;

      // console.log("Remove ✅", suspiciousModal);
      suspiciousModal.style.display = "none";
      suspiciousModal.style.visibility = "hidden";
      suspiciousModal.style.opacity = "0";
      suspiciousModal.remove();
    });

    const remainingElements = selectors.some((selector) =>
      document.querySelector(selector),
    );

    if (!remainingElements) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setInterval(() => {
    selectors.forEach((selector) => {
      const suspiciousModal = document.querySelector(selector);

      if (!suspiciousModal) return;

      // console.log("Remove ✅", suspiciousModal);
      suspiciousModal.style.display = "none";
      suspiciousModal.style.visibility = "hidden";
      suspiciousModal.style.opacity = "0";
      suspiciousModal.remove();
    });
  }, 300);
};

// Detect reference node for placement functions 🔍
const searchAndFindPumpVisionContainer = async (timeoutDuration = 12000) => {
  const interval = 1000;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const container = document.querySelector("div.grid");
    if (container) return container;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindChartsContainer = async (timeoutDuration = 20000) => {
  const interval = 1000;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const chartsContainer = document.querySelector(
      '[class="charts bg-grey-900 rounded-[2px] border-y border-grey-500"]',
    );
    if (chartsContainer) return chartsContainer;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};
const searchAndFindBuyAndSellContainer = async (timeoutDuration = 12000) => {
  const interval = 600;
  const endTime = Date.now() + timeoutDuration;

  while (Date.now() < endTime) {
    const container = document.querySelector("div.ant-drawer-content-wrapper");
    if (container) return container;
    await new Promise((r) => setTimeout(r, interval));
  }

  return null;
};

// Inject elements functions 💉
const injectNovaSnipeButton = () => {
  try {
    let novaAuthToken;
    let elementsClassname;
    chrome.storage.local
      .get(["nova_auth_token", "elements_classname"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        novaAuthToken = result.nova_auth_token;

        const migrationElement = document.querySelector(
          "div.buy-sell-migrating",
        );
        const previousSnipingButton = document.querySelector(
          `button.${CSS.escape(elementsClassname?.sn)}`,
        );

        if (previousSnipingButton) {
          previousSnipingButton.remove();
        }

        if (migrationElement) {
          const migrationText = Array.from(
            migrationElement.querySelectorAll("p"),
          ).filter((p) =>
            p.textContent.includes("may take a few minutes"),
          )?.[0];
          if (!migrationText) return;

          const customButton = document.createElement("button");
          const buttonImg = document.createElement("img");
          buttonImg.src = elementsClassname?.pp;
          buttonImg.alt = "";
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
            elementsClassname?.sn,
            "ant-btn",
            "ant-btn-text",
          );
          customButton.style.marginTop = "6px";
          customButton.style.marginBottom = "-24px";
          customButton.style.border = elementsClassname?.br?.b;

          customButton.onclick = async function () {
            const url = new URL(window.location.href);
            const tokenMintAddress = url.searchParams.get("address");

            chrome.storage.local.get("default_buy_amount", async (r) => {
              const defaultBuyAmount = r.default_buy_amount || 0.01;

              customButton.disabled = true;
              customButton.querySelector("span").textContent = "Processing...";
              const result = await transactToken(
                tokenMintAddress,
                "snipe",
                defaultBuyAmount,
                novaAuthToken,
                {},
              );

              if (result) {
                customButton.querySelector("span").textContent = "Success!";
              } else {
                customButton.querySelector("span").textContent = "Failed!";
              }
            });
          };

          insertElementBefore(migrationText, customButton);
        }
      });
  } catch (error) {
    // console.error("Failed to inject Nova Buy button ❌:", error);
  }
};
const injectNovaContainer = () => {
  try {
    let novaAuthToken;
    let elementsClassname;
    let buyButtonsList;
    let sellButtonsList;
    chrome.storage.local
      .get([
        "nova_auth_token",
        "custom_buy_value_list",
        "custom_sell_value_list",
        "elements_classname",
      ])
      .then((result) => {
        elementsClassname = result.elements_classname;
        novaAuthToken = result.nova_auth_token;

        // Custom Buy and Sell Values 💰
        if (
          Array.isArray(result.custom_buy_value_list) &&
          result.custom_buy_value_list.length > 0
        ) {
          buyButtonsList = result.custom_buy_value_list;
        } else {
          buyButtonsList = [0.5, 1, 2, 5, 10];
        }
        if (
          Array.isArray(result.custom_sell_value_list) &&
          result.custom_sell_value_list.length > 0
        ) {
          sellButtonsList = result.custom_sell_value_list;
        } else {
          sellButtonsList = [10, 25, 50, 100];
        }

        const url = new URL(window.location.href);
        const tokenMintAddress = url.searchParams.get("address");
        if (!tokenMintAddress) return;

        // Add Hotkeys 🔥
        // addHotkey(tokenMintAddress, novaAuthToken);

        const previousBuyAndSellButtonsContainer = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsc)}`,
        );
        if (previousBuyAndSellButtonsContainer) {
          previousBuyAndSellButtonsContainer.remove();
        }

        // Detect placement of container
        const chartsContainer = document.querySelector(
          '[class="charts bg-grey-900 rounded-[2px] border-y border-grey-500"]',
        );
        if (!chartsContainer) return;

        // State
        let isBuy = true;

        // Create buy & sell container
        const generatedNovaBuyAndSellButtonsContainerClassName =
          elementsClassname?.bsc;
        const buyAndSellButtonsContainer = document.createElement("div");
        buyAndSellButtonsContainer.classList.add(
          generatedNovaBuyAndSellButtonsContainerClassName,
        );
        buyAndSellButtonsContainer.style.width = "100%";
        buyAndSellButtonsContainer.style.marginTop = "8px";
        buyAndSellButtonsContainer.style.paddingLeft = "12px";
        buyAndSellButtonsContainer.style.paddingRight = "12px";
        buyAndSellButtonsContainer.style.paddingBottom = "10px";
        buyAndSellButtonsContainer.style.display = "flex";
        buyAndSellButtonsContainer.style.flexDirection = "column";
        buyAndSellButtonsContainer.style.justifyContent = "start";
        buyAndSellButtonsContainer.style.alignItems = "start";
        buyAndSellButtonsContainer.style.gap = "12px";

        const toggleBuyOrSellButton = document.createElement("button");
        toggleBuyOrSellButton.type = "button";
        toggleBuyOrSellButton.style.padding = "8px 14px";
        toggleBuyOrSellButton.style.background = "#44103f";
        toggleBuyOrSellButton.style.border = elementsClassname?.br?.tg;
        toggleBuyOrSellButton.style.borderRadius = "8px";
        toggleBuyOrSellButton.textContent = "Switch to Sell";
        toggleBuyOrSellButton.style.textWrap = "nowrap";
        toggleBuyOrSellButton.style.fontSize = "14px";
        toggleBuyOrSellButton.style.fontWeight = "600";
        toggleBuyOrSellButton.style.color = "white";
        toggleBuyOrSellButton.style.cursor = "pointer";
        toggleBuyOrSellButton.style.transition = ".2 ease-in-out";

        toggleBuyOrSellButton.addEventListener("mouseenter", () => {
          toggleBuyOrSellButton.style.background = "#5a1353";
        });
        toggleBuyOrSellButton.addEventListener("mouseleave", () => {
          toggleBuyOrSellButton.style.background = "#44103f";
        });

        toggleBuyOrSellButton.addEventListener("click", () => {
          if (buyContainer.style.display === "flex") {
            fieldContainer.replaceChild(sellOptionsContainer, buyLabelOption);
            isBuy = false;
            buttonText.textContent = "Sell";
            toggleBuyOrSellButton.textContent = "Switch to Buy";
            input.setAttribute(
              "placeholder",
              `${activeSellOption === "%" ? "Sell Percentage (%)" : "SOL Amount (SOL)"}`,
            );
            input.value = "";
            buyContainer.style.display = "none";
            sellContainer.style.display = "flex";
          } else {
            fieldContainer.replaceChild(buyLabelOption, sellOptionsContainer);
            isBuy = true;
            buttonText.textContent = "Buy";
            toggleBuyOrSellButton.textContent = "Switch to Sell";
            input.setAttribute("placeholder", "Buy Amount (SOL)");
            input.value = "";
            buyContainer.style.display = "flex";
            sellContainer.style.display = "none";
          }
        });
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
        Object.assign(fieldContainer.style, {
          boxSizing: "border-box",
          display: "flex",
          width: "270px",
          justifyContent: "center",
          background: "rgb(13 13 16)",
          height: "36px",
          border: "1px solid rgb(86 86 86)",
          borderRadius: "8px",
          overflow: "hidden",
        });

        const buyLabelOption = document.createElement("div");
        Object.assign(buyLabelOption.style, {
          display: "flex",
          whiteSpace: "nowrap",
          background: "inherit",
          border: "none",
          height: "100%",
          padding: "0 12px",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "12px",
          borderRight: "1px solid rgb(86 86 86)",
        });
        buyLabelOption.textContent = "SOL";

        const input = document.createElement("input");

        let activeSellOption = "";
        const sellOptions = ["%", "SOL"];
        const sellOptionsContainer = document.createElement("div");
        Object.assign(sellOptionsContainer.style, {
          display: "flex",
          alignItems: "center",
          borderRight: "1px solid rgb(86 86 86)",
        });
        const setActiveOption = (optionElement) => {
          Array.from(sellOptionsContainer.children).forEach((child) => {
            Object.assign(child.style, {
              color: "gray",
              fontWeight: "normal",
            });
          });
          Object.assign(optionElement.style, {
            color: "white",
            fontWeight: "bold",
          });
          activeSellOption = optionElement.textContent;

          input.placeholder =
            optionElement.textContent === "%"
              ? "Sell Percentage (%)"
              : "SOL Amount (SOL)";
        };
        sellOptions.forEach((option, index) => {
          const sellLabelOption = document.createElement("button");
          Object.assign(sellLabelOption.style, {
            display: "flex",
            whiteSpace: "nowrap",
            background: "inherit",
            border: "none",
            height: "100%",
            padding: "0 12px",
            justifyContent: "center",
            alignItems: "center",
            color: "gray",
            fontSize: "12px",
            cursor: "pointer",
          });
          sellLabelOption.textContent = option;
          sellLabelOption.addEventListener("click", () => {
            input.value = "";
            setActiveOption(sellLabelOption);
          });
          sellOptionsContainer.appendChild(sellLabelOption);
          if (index < sellOptions.length - 1) {
            const separator = document.createElement("div");
            Object.assign(separator.style, {
              height: "50%",
              borderRight: "1px solid rgb(86 86 86)",
            });
            sellOptionsContainer.appendChild(separator);
          }
          if (index === 0) {
            setActiveOption(sellLabelOption);
          }
        });
        Object.assign(input.style, {
          width: "100%",
          height: "100%",
          borderRadius: "0.375rem",
          minWidth: "0px",
          outline: "transparent solid 2px",
          outlineOffset: "2px",
          position: "relative",
          appearance: "none",
          verticalAlign: "top",
          background: "inherit",
          textAlign: "left",
          fontSize: "12px",
          border: "none",
          outline: "none",
          color: "white",
          fontWeight: "500",
          padding: "0 12px",
        });
        input.type = "number";
        input.value = "";
        input.setAttribute("role", "spinbutton");
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("name", elementsClassname?.customs?.bs);
        input.setAttribute("placeholder", "Buy Amount (SOL)");
        input.setAttribute("type", "number");
        input.setAttribute("step", "2");
        input.style.maxWidth = "100%";
        input.addEventListener("input", (e) => {
          const value = e.target.value;

          if (isBuy) {
            const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

            if (!isValid) {
              e.target.value = value.slice(0, -1);
            }
          } else {
            const isValid =
              activeSellOption === "%"
                ? /^[1-9]$|^[1-9][0-9]$|^100$/.test(value)
                : /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

            if (!isValid) {
              e.target.value = value.slice(0, -1);
            }
          }
        });

        fieldContainer.appendChild(buyLabelOption);
        // fieldContainer.appendChild(sellOptionsContainer);
        fieldContainer.appendChild(input);

        // Buy or Sell Button
        const buyOrSellButton = document.createElement("button");
        const buttonText = document.createElement("span");
        const buttonImg = document.createElement("img");
        buttonImg.src = elementsClassname?.pp;
        buttonImg.alt = "";
        buttonImg.style.aspectRatio = "1/1";
        buttonImg.style.height = "15px";
        buttonImg.style.width = "15px";
        buttonImg.style.marginRight = "5px";
        buttonText.textContent = "Buy";
        buttonText.style.color = "white";
        buttonText.style.fontWeight = "600";

        buyOrSellButton.appendChild(buttonImg);
        buyOrSellButton.appendChild(buttonText);

        buyOrSellButton.type = "button";
        buyOrSellButton.style.boxSizing = "border-box";
        buyOrSellButton.style.width = "max-content";
        buyOrSellButton.style.display = "flex";
        buyOrSellButton.style.justifyContent = "center";
        buyOrSellButton.style.alignItems = "center";
        buyOrSellButton.style.gap = "4px";
        buyOrSellButton.style.background = "rgb(44 46 51)";
        buyOrSellButton.style.padding = "6px 12px";
        buyOrSellButton.style.marginRight = "6px";
        buyOrSellButton.style.borderRadius = "8px";
        buyOrSellButton.style.border = "none";
        buyOrSellButton.style.outline = "none";
        buyOrSellButton.style.flexShrink = "0";
        buyOrSellButton.style.cursor = "pointer";
        buyOrSellButton.style.transition = ".2 ease-in-out";

        buyOrSellButton.addEventListener("mouseenter", () => {
          buyOrSellButton.style.background = "rgb(78 80 85)";
        });
        buyOrSellButton.addEventListener("mouseleave", () => {
          buyOrSellButton.style.background = "rgb(44 46 51)";
        });

        buyOrSellButton.addEventListener("click", async () => {
          const inputElement = document.querySelector(
            `[name=${elementsClassname?.customs?.bs}]`,
          );
          const buyOrSellValue = parseFloat(inputElement.value);
          buyOrSellButton.disabled = true;
          buyOrSellButton.querySelector("span").textContent = "Processing...";

          chrome.storage.local.get("active_preset_values", async (r) => {
            const result = await transactToken(
              tokenMintAddress,
              isBuy ? "buy" : "sell",
              isBuy
                ? buyOrSellValue
                : activeSellOption === "SOL"
                  ? null
                  : buyOrSellValue,
              novaAuthToken,
              r?.active_preset_values,
              isBuy ? null : activeSellOption === "SOL" ? buyOrSellValue : null,
            );

            if (result) {
              buyOrSellButton.querySelector("span").textContent = "Success!";
              setTimeout(() => {
                buyOrSellButton.querySelector("span").textContent = isBuy
                  ? "Buy"
                  : "Sell";
                buyOrSellButton.disabled = false;
                // inputElement.value = "";
              }, 700);
            } else {
              buyOrSellButton.querySelector("span").textContent = "Failed!";
              setTimeout(() => {
                buyOrSellButton.querySelector("span").textContent = isBuy
                  ? "Buy"
                  : "Sell";
                buyOrSellButton.disabled = false;
                // inputElement.value = "";
              }, 700);
            }
          });
        });
        customBuyAndSellContainer.appendChild(fieldContainer);
        customBuyAndSellContainer.appendChild(buyOrSellButton);

        // Create buy & sell button with map
        buyButtonsList.map((value) => {
          (function (buttonValue) {
            const buttonImg = document.createElement("img");
            buttonImg.src = elementsClassname?.pp;
            buttonImg.alt = "";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";

            const buttonText = document.createElement("span");
            buttonText.textContent = `Buy ${buttonValue} SOL`;
            buttonText.style.fontWeight = "600";
            buttonText.style.color = "white";

            const customBuyButton = document.createElement("button");
            customBuyButton.appendChild(buttonImg);
            customBuyButton.appendChild(buttonText);
            customBuyButton.type = "button";
            customBuyButton.style.boxSizing = "border-box";
            customBuyButton.style.width = "max-content";
            customBuyButton.style.display = "flex";
            customBuyButton.style.justifyContent = "center";
            customBuyButton.style.alignItems = "center";
            customBuyButton.style.gap = "4px";
            customBuyButton.style.background = "rgb(44 46 51)";
            customBuyButton.style.padding = "6px 12px";
            customBuyButton.style.marginRight = "6px";
            customBuyButton.style.borderRadius = "8px";
            customBuyButton.style.border = "none";
            customBuyButton.style.outline = "none";
            customBuyButton.style.cursor = "pointer";
            customBuyButton.style.transition = ".2 ease-in-out";
            customBuyButton.addEventListener("mouseenter", () => {
              customBuyButton.style.background = "rgb(78 80 85)";
            });
            customBuyButton.addEventListener("mouseleave", () => {
              customBuyButton.style.background = "rgb(44 46 51)";
            });

            customBuyButton.onclick = async function () {
              customBuyButton.disabled = true;
              customBuyButton.querySelector("span").textContent =
                "Processing...";

              chrome.storage.local.get("active_preset_values", async (r) => {
                const result = await transactToken(
                  tokenMintAddress,
                  "buy",
                  buttonValue,
                  novaAuthToken,
                  r?.active_preset_values,
                );

                if (result) {
                  customBuyButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    customBuyButton.disabled = false;
                    customBuyButton.querySelector("span").textContent =
                      `Buy ${buttonValue} SOL`;
                  }, 700);
                } else {
                  customBuyButton.querySelector("span").textContent = "Failed!";
                  setTimeout(() => {
                    customBuyButton.disabled = false;
                    customBuyButton.querySelector("span").textContent =
                      `Buy ${buttonValue} SOL`;
                  }, 700);
                }
              });
            };

            buyContainer.append(customBuyButton);
          })(value);
        });
        sellButtonsList.map((value) => {
          (function (buttonValue) {
            const buttonImg = document.createElement("img");
            buttonImg.src = elementsClassname?.pp;
            buttonImg.alt = "";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";

            const buttonText = document.createElement("span");
            buttonText.textContent = `Sell ${buttonValue}%`;
            buttonText.style.fontWeight = "600";
            buttonText.style.color = "white";

            const customSellButton = document.createElement("button");
            customSellButton.appendChild(buttonImg);
            customSellButton.appendChild(buttonText);
            customSellButton.type = "button";
            customSellButton.style.boxSizing = "border-box";
            customSellButton.style.width = "max-content";
            customSellButton.style.display = "flex";
            customSellButton.style.justifyContent = "center";
            customSellButton.style.alignItems = "center";
            customSellButton.style.gap = "4px";
            customSellButton.style.background = "rgb(44 46 51)";
            customSellButton.style.padding = "6px 12px";
            customSellButton.style.marginRight = "6px";
            customSellButton.style.borderRadius = "8px";
            customSellButton.style.border = "none";
            customSellButton.style.outline = "none";
            customSellButton.style.cursor = "pointer";
            customSellButton.style.transition = ".2 ease-in-out";
            customSellButton.addEventListener("mouseenter", () => {
              customSellButton.style.background = "rgb(78 80 85)";
            });
            customSellButton.addEventListener("mouseleave", () => {
              customSellButton.style.background = "rgb(44 46 51)";
            });

            customSellButton.onclick = async function () {
              customSellButton.disabled = true;
              customSellButton.querySelector("span").textContent =
                "Processing...";

              chrome.storage.local.get("active_preset_values", async (r) => {
                const result = await transactToken(
                  tokenMintAddress,
                  "sell",
                  buttonValue,
                  novaAuthToken,
                  r?.active_preset_values,
                );

                if (result) {
                  customSellButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    customSellButton.disabled = false;
                    customSellButton.querySelector("span").textContent =
                      `Sell ${buttonValue}%`;
                  }, 700);
                } else {
                  customSellButton.querySelector("span").textContent =
                    "Failed!";
                  setTimeout(() => {
                    customSellButton.disabled = false;
                    customSellButton.querySelector("span").textContent =
                      `Sell ${buttonValue}%`;
                  }, 700);
                }
              });
            };

            sellContainer.append(customSellButton);
          })(value);
        });

        // Wrappers
        const buyAndSellWrapper = document.createElement("div");
        buyAndSellWrapper.style.display = "flex";
        buyAndSellWrapper.style.gap = "8px";
        const customBuyAndSellWithToggleWrapper = document.createElement("div");
        customBuyAndSellWithToggleWrapper.style.display = "flex";
        customBuyAndSellWithToggleWrapper.style.gap = "8px";

        buyAndSellWrapper.append(buyContainer);
        buyAndSellWrapper.append(sellContainer);
        buyAndSellButtonsContainer.append(buyAndSellWrapper);

        customBuyAndSellWithToggleWrapper.append(customBuyAndSellContainer);
        customBuyAndSellWithToggleWrapper.append(toggleBuyOrSellButton);
        buyAndSellButtonsContainer.append(customBuyAndSellWithToggleWrapper);

        insertElementBefore(chartsContainer, buyAndSellButtonsContainer);
      });
  } catch (error) {
    // console.error("Failed to inject Nova Buy button ❌:", error);
  }
};
const injectNovaFlyingModal = () => {
  try {
    let showFlyingModal;
    let flyingModalPosition;
    let novaAuthToken;
    let elementsClassname;
    let buyButtonsList;
    let sellButtonsList;
    let activePresetLabel;
    let firstPresetValues;
    let secondPresetValues;
    chrome.storage.local
      .get([
        "show_flying_modal",
        "flying_modal_position",
        "nova_auth_token",
        "custom_buy_value_list",
        "custom_sell_value_list",
        "elements_classname",
        "active_preset_label",
        "first_preset_values",
        "second_preset_values",
      ])
      .then((result) => {
        showFlyingModal = result.show_flying_modal;
        flyingModalPosition = result.flying_modal_position;
        elementsClassname = result.elements_classname;
        novaAuthToken = result.nova_auth_token;
        activePresetLabel = result.active_preset_label;
        firstPresetValues = result.first_preset_values;
        secondPresetValues = result.second_preset_values;

        if (!showFlyingModal) return;

        // Style 🎨
        if (!document.getElementById(elementsClassname?.i)) {
          const style = document.createElement("style");
          style.id = "custom-style";
          style.type = "text/css";
          style.textContent = `
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield; /* For Firefox */
              appearance: textfield; /* For modern browsers */
            }
          `;
          document.head.appendChild(style);
        }

        // Custom Buy and Sell Values 💰
        if (
          Array.isArray(result.custom_buy_value_list) &&
          result.custom_buy_value_list.length > 0
        ) {
          buyButtonsList = result.custom_buy_value_list;
        } else {
          buyButtonsList = [0.5, 1, 2, 5, 10];
        }
        if (
          Array.isArray(result.custom_sell_value_list) &&
          result.custom_sell_value_list.length > 0
        ) {
          sellButtonsList = result.custom_sell_value_list;
        } else {
          sellButtonsList = [10, 25, 50, 100];
        }

        const url = new URL(window.location.href);
        const tokenMintAddress = url.searchParams.get("address");
        if (!tokenMintAddress) return;

        // Add Hotkeys 🔥
        // addHotkey(tokenMintAddress, novaAuthToken);

        // ######## REMOVE FLYING MODAL 🤚 #########
        const previousDraggableNovaModal = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsfm)}`,
        );
        if (previousDraggableNovaModal) {
          previousDraggableNovaModal.remove();
        }

        // ######## FLYING MODAL 🤚 #########
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        const draggable = document.createElement("div");
        draggable.classList.add(elementsClassname?.bsfm);
        Object.assign(draggable.style, {
          boxSizing: "border-box",
          position: "fixed",
          zIndex: "9999",
          width: "290px",
          height: "auto",
          paddingTop: "12px",
          backgroundColor: "rgba(13, 13, 16, 0.95)",
          backdropFilter: "blur(1.5px)",
          top: `${flyingModalPosition.top}px`,
          left: `${flyingModalPosition.left}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          border: "1px dashed rgba(255,83,236,0.7)",
          borderRadius: "6px",
          boxShadow:
            "0 0px 20px -1px rgba(169,0,150,0.64), inset 0 0px 20px -5px rgba(255,83,236,0.4)",
        });

        // ######## HEADER 🔝 #########
        const header = document.createElement("div");
        Object.assign(header.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "0 12px 12px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
          columnGap: "6px",
          borderBottom: "1px dashed rgba(255, 255, 255, 0.1)",
          cursor: "grab",
        });
        // +++ LEFT
        const leftHeaderContainer = document.createElement("div");
        Object.assign(leftHeaderContainer.style, {
          width: "fit",
          display: "flex",
          alignItems: "center",
          color: "white",
          columnGap: "8px",
        });
        const headerText = document.createElement("h5");
        headerText.textContent = "Presets";
        Object.assign(headerText.style, {
          fontWeight: "700",
          fontSize: "16px",
          margin: "0px",
          color: "white",
        });
        let presets = [
          {
            label: "S1",
            active: activePresetLabel === "S1" ? true : false,
            values: firstPresetValues,
          },
          {
            label: "S2",
            active: activePresetLabel === "S2" ? true : false,
            values: secondPresetValues,
          },
        ];
        const presetsContainer = document.createElement("div");
        Object.assign(presetsContainer.style, {
          display: "flex",
          alignItems: "center",
          columnGap: "6px",
        });
        leftHeaderContainer.append(headerText, presetsContainer);
        // +++ RIGHT
        const rightHeaderContainer = document.createElement("div");
        Object.assign(rightHeaderContainer.style, {
          width: "fit",
          display: "flex",
          alignItems: "center",
          color: "white",
          columnGap: "6px",
        });
        const settingSVG = cleanEscapedSvg(elementsClassname?.svgs?.setting);
        const backSVG = cleanEscapedSvg(elementsClassname?.svgs?.back);
        const settingButton = document.createElement("button");
        settingButton.innerHTML = settingSVG;
        Object.assign(settingButton.style, {
          boxSizing: "border-box",
          width: "20px",
          height: "20px",
          padding: 0,
          border: 0,
          background: "transparent",
          color: "white",
          cursor: "pointer",
        });
        settingButton.addEventListener("click", () => {
          if (settingContainer.style.display === "none") {
            settingButton.innerHTML = backSVG;
            buyAndSellContainer.style.display = "none";
            settingContainer.style.display = "flex";
          } else {
            settingButton.innerHTML = settingSVG;
            buyAndSellContainer.style.display = "flex";
            settingContainer.style.display = "none";
          }
        });

        const closeSVG = cleanEscapedSvg(elementsClassname?.svgs?.close);
        const closeButton = document.createElement("button");
        closeButton.innerHTML = closeSVG;
        Object.assign(closeButton.style, {
          boxSizing: "border-box",
          width: "24px",
          height: "24px",
          padding: 0,
          border: 0,
          background: "transparent",
          color: "white",
          cursor: "pointer",
          marginBottom: "1px",
        });
        closeButton.addEventListener("click", () => {
          const currentDraggableNovaModal = document.querySelector(
            `div.${CSS.escape(elementsClassname?.bsfm)}`,
          );

          if (currentDraggableNovaModal) {
            currentDraggableNovaModal.remove();
            chrome.storage.local.set(
              {
                show_flying_modal: false,
              },
              () => {
                // console.log(
                //   "Success to close flying modal ⚙️"
                // );
              },
            );
          }
        });

        rightHeaderContainer.append(settingButton, closeButton);
        // ==> APPEND
        header.append(leftHeaderContainer, rightHeaderContainer);

        // ######## DRAG EVENT 🚨 #########
        header.addEventListener("mousedown", (e) => {
          isDragging = true;
          offsetX = e.clientX - draggable.offsetLeft;
          offsetY = e.clientY - draggable.offsetTop;
          draggable.style.cursor = "grabbing";
        });
        document.addEventListener("mousemove", (e) => {
          if (isDragging) {
            e.preventDefault();

            // Calculate new position
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Get the modal width and height
            const modalWidth = draggable.offsetWidth + 20;
            const modalHeight = draggable.offsetHeight + 20;

            // Calculate the maximum allowed positions for the left and top
            const maxLeft = window.innerWidth - modalWidth; // right edge of the screen
            const maxTop = window.innerHeight - modalHeight; // bottom edge of the screen

            // Clamp the position to keep within bounds
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            // Apply clamped position
            draggable.style.left = `${newLeft + 10}px`;
            draggable.style.top = `${newTop + 10}px`;

            saveFlyingModalPosition(newLeft + 10, newTop + 10);
          }
        });
        document.addEventListener("mouseup", () => {
          isDragging = false;
          draggable.style.cursor = "grab";
        });

        // ######## BUY & SELL CONTAINER 🗳️ #########
        const buyAndSellContainer = document.createElement("div");
        Object.assign(buyAndSellContainer.style, {
          boxSizing: "border-box",
          width: "100%",
          height: "auto",
          padding: "8px 12px 16px 12px",
          display: "flex",
          flexDirection: "column",
          rowGap: "12px",
          cursor: "default",
        });

        // ######### BUY 📈 #########
        const buyContainer = document.createElement("div");
        Object.assign(buyContainer.style, {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          rowGap: "4px",
        });
        const buyHeaderText = document.createElement("span");
        buyHeaderText.textContent = "Buy";
        Object.assign(buyHeaderText.style, {
          display: "block",
          fontWeight: "600",
          fontSize: "14px",
          margin: "0px",
          color: "rgba(255, 255, 255, 0.9)",
        });
        const buyGrid = document.createElement("div");
        Object.assign(buyGrid.style, {
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "6px",
        });
        buyButtonsList.map((value) => {
          (function (buttonValue) {
            const customBuyButton = document.createElement("button");
            customBuyButton.type = "button";

            Object.assign(customBuyButton.style, {
              width: "100%",
              padding: "5px 8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              columnGap: "5px",
              border: "1px solid rgba(255,83,236,0.6)",
              borderRadius: "5px",
              background: "transparent",
              cursor: "pointer",
            });
            const buttonText = document.createElement("span");
            buttonText.style.color = "white";
            Object.assign(buttonText.style, {
              fontWeight: "600",
              color: "rgba(219,110,207,1)",
            });
            buttonText.textContent = buttonValue;

            customBuyButton.addEventListener("mouseenter", () => {
              customBuyButton.style.background = "rgba(255,83,236,0.1)";
            });

            customBuyButton.addEventListener("mouseleave", () => {
              customBuyButton.style.background = "transparent";
            });

            customBuyButton.append(buttonText);

            customBuyButton.onclick = async function () {
              customBuyButton.disabled = true;
              customBuyButton.querySelector("span").textContent = "...";

              chrome.storage.local.get(
                ["default_buy_amount", "active_preset_values"],
                async (r) => {
                  const result = await transactToken(
                    tokenMintAddress,
                    "buy",
                    buttonValue,
                    novaAuthToken,
                    r?.active_preset_values,
                  );

                  if (result) {
                    customBuyButton.querySelector("span").textContent = "✅";
                    setTimeout(() => {
                      customBuyButton.disabled = false;
                      customBuyButton.querySelector("span").textContent =
                        `${buttonValue}`;
                    }, 700);
                  } else {
                    customBuyButton.querySelector("span").textContent = "❌";
                    setTimeout(() => {
                      customBuyButton.disabled = false;
                      customBuyButton.querySelector("span").textContent =
                        `${buttonValue}`;
                    }, 700);
                  }
                },
              );
            };

            buyGrid.append(customBuyButton);
          })(value);
        });
        // +++ CUSTOM BUY
        const buyCustomValueWrapper = document.createElement("div");
        Object.assign(buyCustomValueWrapper.style, {
          width: "100%",
          display: "flex",
          columnGap: "5px",
          marginTop: "5px",
        });
        const buyCustomValueInput = document.createElement("input");
        buyCustomValueInput.name = elementsClassname?.customs?.b;
        buyCustomValueInput.type = "number";
        buyCustomValueInput.placeholder = "Buy Amount (SOL)";
        buyCustomValueInput.addEventListener("focus", () => {
          buyCustomValueInput.style.outline = "none";
        });
        buyCustomValueInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(buyCustomValueInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
        });
        const buyCustomValueButton = document.createElement("button");
        buyCustomValueButton.textContent = "Buy";
        Object.assign(buyCustomValueButton.style, {
          flexShrink: "0",
          width: "auto",
          padding: "6px 16px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "rgba(169,0,150,0.64)",
          cursor: "pointer",
          color: "white",
          fontWeight: "bold",
        });
        buyCustomValueButton.addEventListener("click", async () => {
          const buyInputElement = document.querySelector(
            `[name=${elementsClassname?.customs?.b}]`,
          );
          const buyValue = parseFloat(buyInputElement.value);
          buyCustomValueButton.disabled = true;
          buyCustomValueButton.textContent = "...";

          chrome.storage.local.get(
            ["default_buy_amount", "active_preset_values"],
            async (r) => {
              const result = await transactToken(
                tokenMintAddress,
                "buy",
                buyValue,
                novaAuthToken,
                r?.active_preset_values,
              );

              if (result) {
                buyCustomValueButton.textContent = "Success!";
                setTimeout(() => {
                  buyCustomValueButton.textContent = "Buy";
                  buyCustomValueButton.disabled = false;
                  buyInputElement.value = "";
                }, 700);
              } else {
                buyCustomValueButton.textContent = "Failed!";
                setTimeout(() => {
                  buyCustomValueButton.textContent = "Buy";
                  buyCustomValueButton.disabled = false;
                  buyInputElement.value = "";
                }, 700);
              }
            },
          );
        });
        // ==> APPEND
        buyCustomValueWrapper.append(buyCustomValueInput, buyCustomValueButton);
        buyContainer.append(buyHeaderText, buyGrid, buyCustomValueWrapper);

        // ######### SELL 📉 #########
        const sellContainer = document.createElement("div");
        Object.assign(sellContainer.style, {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          rowGap: "4px",
        });
        const sellHeaderText = document.createElement("span");
        sellHeaderText.textContent = "Sell";
        Object.assign(sellHeaderText.style, {
          display: "block",
          fontWeight: "600",
          fontSize: "14px",
          margin: "0px",
          color: "rgba(255, 255, 255, 0.9)",
        });
        const sellGrid = document.createElement("div");
        Object.assign(sellGrid.style, {
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "6px",
        });
        sellButtonsList.map((value) => {
          (function (buttonValue) {
            const customSellButton = document.createElement("button");
            customSellButton.type = "button";

            Object.assign(customSellButton.style, {
              width: "100%",
              padding: "5px 8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              columnGap: "5px",
              border: "1px solid rgba(180,180,180,0.6)",
              borderRadius: "5px",
              background: "transparent",
              cursor: "pointer",
              transition: "background 0.1s ease",
            });
            const buttonText = document.createElement("span");
            buttonText.style.color = "white";
            Object.assign(buttonText.style, {
              fontWeight: "600",
              color: "rgba(130,130,130,1)",
            });
            buttonText.textContent = `${buttonValue}%`;

            customSellButton.append(buttonText);

            customSellButton.addEventListener("mouseenter", () => {
              customSellButton.style.background = "rgba(255,255,255, 0.08)";
              buttonText.style.color = "rgba(160,160,160,1)";
            });

            customSellButton.addEventListener("mouseleave", () => {
              customSellButton.style.background = "transparent";
              buttonText.style.color = "rgba(130,130,130,1)";
            });

            customSellButton.onclick = async function () {
              customSellButton.disabled = true;
              customSellButton.querySelector("span").textContent = "...";

              chrome.storage.local.get(
                ["default_buy_amount", "active_preset_values"],
                async (r) => {
                  const result = await transactToken(
                    tokenMintAddress,
                    "sell",
                    buttonValue,
                    novaAuthToken,
                    r?.active_preset_values,
                  );

                  if (result) {
                    customSellButton.querySelector("span").textContent = "✅";
                    setTimeout(() => {
                      customSellButton.disabled = false;
                      customSellButton.querySelector("span").textContent =
                        `${buttonValue}%`;
                    }, 700);
                  } else {
                    customSellButton.querySelector("span").textContent = "❌";
                    setTimeout(() => {
                      customSellButton.disabled = false;
                      customSellButton.querySelector("span").textContent =
                        `${buttonValue}%`;
                    }, 700);
                  }
                },
              );
            };

            sellGrid.append(customSellButton);
          })(value);
        });
        // +++ CUSTOM SELL
        const sellCustomValueWrapper = document.createElement("div");
        Object.assign(sellCustomValueWrapper.style, {
          width: "100%",
          display: "flex",
          columnGap: "5px",
          marginTop: "5px",
        });
        const sellCustomValueInput = document.createElement("input");
        sellCustomValueInput.name = elementsClassname?.customs?.s;
        sellCustomValueInput.type = "number";
        sellCustomValueInput.placeholder = "Sell Percentage (%)";
        sellCustomValueInput.addEventListener("focus", () => {
          sellCustomValueInput.style.outline = "none";
        });
        sellCustomValueInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]$|^[1-9][0-9]$|^100$/.test(value);

          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        sellCustomValueInput.addEventListener("keydown", (e) => {
          if (e.key === ".") {
            e.preventDefault();
          }
        });
        Object.assign(sellCustomValueInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
        });
        const sellCustomValueButton = document.createElement("button");
        sellCustomValueButton.textContent = "Sell";
        Object.assign(sellCustomValueButton.style, {
          flexShrink: "0",
          width: "auto",
          padding: "6px 16px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "rgba(169,0,150,0.64)",
          cursor: "pointer",
          color: "white",
          fontWeight: "bold",
        });
        sellCustomValueButton.addEventListener("click", async () => {
          const sellInputElement = document.querySelector(
            `[name=${elementsClassname?.customs?.s}]`,
          );
          const sellValue = parseFloat(sellInputElement.value);
          sellCustomValueButton.disabled = true;
          sellCustomValueButton.textContent = "...";

          chrome.storage.local.get(
            ["default_buy_amount", "active_preset_values"],
            async (r) => {
              const result = await transactToken(
                tokenMintAddress,
                "sell",
                sellValue,
                novaAuthToken,
                r?.active_preset_values,
              );

              if (result) {
                sellCustomValueButton.textContent = "Success!";
                setTimeout(() => {
                  sellCustomValueButton.textContent = "Buy";
                  sellCustomValueButton.disabled = false;
                  sellInputElement.value = "";
                }, 700);
              } else {
                sellCustomValueButton.textContent = "Failed!";
                setTimeout(() => {
                  sellCustomValueButton.textContent = "Buy";
                  sellCustomValueButton.disabled = false;
                  sellInputElement.value = "";
                }, 700);
              }
            },
          );
        });
        // ==> APPEND
        sellCustomValueWrapper.append(
          sellCustomValueInput,
          sellCustomValueButton,
        );
        sellContainer.append(sellHeaderText, sellGrid, sellCustomValueWrapper);

        // ######### SETTINGS ⚙️ #########
        const settingContainer = document.createElement("div");
        Object.assign(settingContainer.style, {
          boxSizing: "border-box",
          width: "100%",
          height: "auto",
          padding: "8px 12px 16px 12px",
          display: "none",
          flexDirection: "column",
          rowGap: "12px",
          cursor: "default",
        });
        const settingHeaderText = document.createElement("span");
        settingHeaderText.textContent = "Settings";
        Object.assign(settingHeaderText.style, {
          display: "block",
          fontWeight: "600",
          fontSize: "14px",
          margin: "0px",
          color: "rgba(255, 255, 255, 0.9)",
        });
        // +++ INPUT SETTINGS WRAPPER & LIST
        const settingGrid = document.createElement("div");
        Object.assign(settingGrid.style, {
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
        });
        // +++ 1: Buy Fee
        const buyFeeWrapper = document.createElement("div");
        const buyFeeHeader = document.createElement("span");
        buyFeeHeader.textContent = "Buy Fee";
        Object.assign(buyFeeHeader.style, {
          display: "block",
          fontSize: "10px",
          marginBottom: "3.5px",
          color: "rgba(255, 255, 255, 0.6)",
        });
        const buyFeeInput = document.createElement("input");
        buyFeeInput.name = elementsClassname?.settings["buy-fee"];
        buyFeeInput.type = "number";
        buyFeeInput.placeholder = "(SOL)";
        buyFeeInput.addEventListener("focus", () => {
          buyFeeInput.style.outline = "none";
        });
        buyFeeInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(buyFeeInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
          textAlign: "center",
        });
        buyFeeWrapper.append(buyFeeHeader, buyFeeInput);
        // +++ 2: Buy Tip
        const buyTipWrapper = document.createElement("div");
        const buyTipHeader = document.createElement("span");
        buyTipHeader.textContent = "Buy Tip";
        Object.assign(buyTipHeader.style, {
          display: "block",
          fontSize: "10px",
          marginBottom: "3.5px",
          color: "rgba(255, 255, 255, 0.6)",
        });
        const buyTipInput = document.createElement("input");
        buyTipInput.name = elementsClassname?.settings["buy-tip"];
        buyTipInput.type = "number";
        buyTipInput.placeholder = "(SOL)";
        buyTipInput.addEventListener("focus", () => {
          buyTipInput.style.outline = "none";
        });
        buyTipInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(buyTipInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
          textAlign: "center",
        });
        buyTipWrapper.append(buyTipHeader, buyTipInput);
        // +++ 3: Buy Slippage
        const buySlippageWrapper = document.createElement("div");
        const buySlippageHeader = document.createElement("span");
        buySlippageHeader.textContent = "Buy Slippage";
        Object.assign(buySlippageHeader.style, {
          display: "block",
          fontSize: "10px",
          marginBottom: "3.5px",
          color: "rgba(255, 255, 255, 0.6)",
        });
        const buySlippageInput = document.createElement("input");
        buySlippageInput.name = elementsClassname?.settings["buy-slippage"];
        buySlippageInput.type = "number";
        buySlippageInput.placeholder = "(%)";
        buySlippageInput.addEventListener("focus", () => {
          buySlippageInput.style.outline = "none";
        });
        buySlippageInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(buySlippageInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
          textAlign: "center",
        });
        buySlippageWrapper.append(buySlippageHeader, buySlippageInput);
        // +++ 4: Sell Fee
        const sellFeeWrapper = document.createElement("div");
        const sellFeeHeader = document.createElement("span");
        sellFeeHeader.textContent = "Sell Fee";
        Object.assign(sellFeeHeader.style, {
          display: "block",
          fontSize: "10px",
          marginBottom: "3.5px",
          color: "rgba(255, 255, 255, 0.6)",
        });
        const sellFeeInput = document.createElement("input");
        sellFeeInput.name = elementsClassname?.settings["sell-fee"];
        sellFeeInput.type = "number";
        sellFeeInput.placeholder = "(SOL)";
        sellFeeInput.addEventListener("focus", () => {
          sellFeeInput.style.outline = "none";
        });
        sellFeeInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(sellFeeInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
          textAlign: "center",
        });
        sellFeeWrapper.append(sellFeeHeader, sellFeeInput);
        // +++ 5: Sell Tip
        const sellTipWrapper = document.createElement("div");
        const sellTipHeader = document.createElement("span");
        sellTipHeader.textContent = "Sell Tip";
        Object.assign(sellTipHeader.style, {
          display: "block",
          fontSize: "10px",
          marginBottom: "3.5px",
          color: "rgba(255, 255, 255, 0.6)",
        });
        const sellTipInput = document.createElement("input");
        sellTipInput.name = elementsClassname?.settings["sell-tip"];
        sellTipInput.type = "number";
        sellTipInput.placeholder = "(SOL)";
        sellTipInput.addEventListener("focus", () => {
          sellTipInput.style.outline = "none";
        });
        sellTipInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(sellTipInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
          textAlign: "center",
        });
        sellTipWrapper.append(sellTipHeader, sellTipInput);
        // +++ 6: Sell Slippage
        const sellSlippageWrapper = document.createElement("div");
        const sellSlippageHeader = document.createElement("span");
        sellSlippageHeader.textContent = "Sell Slippage";
        Object.assign(sellSlippageHeader.style, {
          display: "block",
          fontSize: "10px",
          marginBottom: "3.5px",
          color: "rgba(255, 255, 255, 0.6)",
        });
        const sellSlippageInput = document.createElement("input");
        sellSlippageInput.name = elementsClassname?.settings["sell-slippage"];
        sellSlippageInput.type = "number";
        sellSlippageInput.placeholder = "(%)";
        sellSlippageInput.addEventListener("focus", () => {
          sellSlippageInput.style.outline = "none";
        });
        sellSlippageInput.addEventListener("input", (e) => {
          const value = e.target.value;
          const isValid = /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);
          if (!isValid) {
            e.target.value = value.slice(0, -1);
          }
        });
        Object.assign(sellSlippageInput.style, {
          boxSizing: "border-box",
          width: "100%",
          padding: "5px 12px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "transparent",
          color: "rgba(219,110,207,1)",
          placeholder: "rgba(219,110,207,1)",
          textAlign: "center",
        });
        sellSlippageWrapper.append(sellSlippageHeader, sellSlippageInput);
        // +++ Save Settings
        const saveSettingButton = document.createElement("button");
        saveSettingButton.textContent = "Save Settings";
        Object.assign(saveSettingButton.style, {
          flexShrink: "0",
          width: "auto",
          padding: "6px 16px",
          columnGap: "5px",
          border: "1px solid rgba(255,83,236,0.6)",
          borderRadius: "5px",
          background: "rgba(169,0,150,0.64)",
          cursor: "pointer",
          color: "white",
          fontWeight: "bold",
        });
        saveSettingButton.addEventListener("click", () => {
          const activePreset = presets.find((preset) => preset.active);

          if (activePreset) {
            activePreset.values["buy-fee"] =
              parseFloat(buyFeeInput.value) || 0.001;
            activePreset.values["buy-tip"] =
              parseFloat(buyTipInput.value) || 0.005;
            activePreset.values["buy-slippage"] =
              parseFloat(buySlippageInput.value) || 50;
            activePreset.values["sell-fee"] =
              parseFloat(sellFeeInput.value) || 0.001;
            activePreset.values["sell-tip"] =
              parseFloat(sellTipInput.value) || 0.005;
            activePreset.values["sell-slippage"] =
              parseFloat(sellSlippageInput.value) || 50;

            if (activePreset.label === "S1") {
              chrome.storage.local.set(
                {
                  first_preset_values: activePreset?.values,
                  active_preset_values: activePreset.values,
                },
                () => {
                  // console.log(
                  //   "Success to set preset values ⚙️",
                  //   activePreset?.values,
                  // );
                },
              );
            } else {
              chrome.storage.local.set(
                {
                  second_preset_values: activePreset?.values,
                  active_preset_values: activePreset.values,
                },
                () => {
                  // console.log(
                  //   "Success to set preset values ⚙️",
                  //   activePreset?.values,
                  // );
                },
              );
            }

            saveSettingButton.textContent = "Success!";
            setTimeout(() => {
              saveSettingButton.textContent = "Save Settings";
            }, 1000);
          } else {
            // alert("No active preset selected!");
          }
        });
        // +++ Preset Option
        const renderPresets = () => {
          presetsContainer.innerHTML = "";

          presets.forEach((preset) => {
            const presetButton = document.createElement("button");
            presetButton.textContent = preset?.label;
            Object.assign(presetButton.style, {
              flexShrink: "0",
              width: "auto",
              padding: "4px 12px",
              columnGap: "5px",
              border: "1px solid rgba(255,83,236,0.6)",
              borderRadius: "6px",
              background: preset?.active
                ? "rgba(169,0,150,0.64)"
                : "transparent",
              cursor: "pointer",
              color: "white",
              fontWeight: "bold",
            });

            if (!preset?.active) {
              presetButton.addEventListener("mouseenter", () => {
                presetButton.style.background = "rgba(255,83,236,0.1)";
              });

              presetButton.addEventListener("mouseleave", () => {
                presetButton.style.background = "transparent";
              });
            } else {
              buyFeeInput.value = preset?.values["buy-fee"];
              buyTipInput.value = preset?.values["buy-tip"];
              buySlippageInput.value = preset?.values["buy-slippage"];
              sellFeeInput.value = preset?.values["sell-fee"];
              sellTipInput.value = preset?.values["sell-tip"];
              sellSlippageInput.value = preset?.values["sell-slippage"];

              chrome.storage.local.set(
                {
                  active_preset_values: preset?.values,
                },
                () => {
                  // console.log(
                  //   "Success to set preset values ⚙️",
                  //   preset?.values,
                  // );
                },
              );
            }

            presetButton.addEventListener("click", () => {
              chrome.storage.local.set(
                {
                  active_preset_label: preset?.label,
                },
                () => {
                  // console.log(
                  //   "Success to set preset label ⚙️",
                  //   preset?.label,
                  // );
                },
              );

              // Reset
              presets.forEach((p) => {
                p.active = false;
              });

              // Set new one
              preset.active = true;

              // Set value
              buyFeeInput.value = preset?.values["buy-fee"];
              buyTipInput.value = preset?.values["buy-tip"];
              buySlippageInput.value = preset?.values["buy-slippage"];
              sellFeeInput.value = preset?.values["sell-fee"];
              sellTipInput.value = preset?.values["sell-tip"];
              sellSlippageInput.value = preset?.values["sell-slippage"];
              renderPresets();
            });

            presetsContainer.append(presetButton);
          });
        };
        renderPresets();
        // ==> APPEND
        settingGrid.append(
          buyFeeWrapper,
          buyTipWrapper,
          buySlippageWrapper,
          sellFeeWrapper,
          sellTipWrapper,
          sellSlippageWrapper,
        );
        settingContainer.append(
          settingHeaderText,
          settingGrid,
          saveSettingButton,
        );

        // ######### APPEND 🧩 #########
        draggable.append(header, buyAndSellContainer, settingContainer);
        buyAndSellContainer.append(buyContainer, sellContainer);

        document.querySelector("body").append(draggable);
      });
  } catch (error) {
    // console.error("Failed to inject Draggable Nova Modal ❌:", error);
  }
};
const injectNovaMemescopeButtonList = () => {
  try {
    let novaAuthToken;
    let elementsClassname;
    chrome.storage.local
      .get(["nova_auth_token", "elements_classname"])
      .then((result) => {
        elementsClassname = result.elements_classname;
        novaAuthToken = result.nova_auth_token;

        const cards = Array.from(document.querySelectorAll("div.pump-card"));

        cards.forEach((card) => {
          const isMigrating = Array.from(card.querySelectorAll("span")).some(
            (span) => span.textContent === "Migrating...",
          );

          const existingBuyButton = card.querySelector(
            `button.${CSS.escape(elementsClassname?.b)}`,
          );
          const existingSnipeButton = card.querySelector(
            `button.${CSS.escape(elementsClassname?.sn)}`,
          );

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

          const generatedBuyButtonClassName = elementsClassname?.b;
          const generatedSnipeButtonClassName = elementsClassname?.sn;
          const buttonClass = isMigrating
            ? generatedSnipeButtonClassName
            : generatedBuyButtonClassName;

          const buttonImg = document.createElement("img");
          buttonImg.src = elementsClassname?.pp;
          buttonImg.alt = "";
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

          anotherCustomButton.style.border = elementsClassname?.br?.b;
          anotherCustomButton.style.margin = "0px 6px";
          anotherCustomButton.style.zIndex = "1000";

          const poolUrl = new URL(poolLink.href);
          const tokenMintAddress = poolUrl.searchParams.get("address");

          anotherCustomButton.onclick = async function (event) {
            event.preventDefault();
            event.stopPropagation();
            anotherCustomButton.disabled = true;
            anotherCustomButton.querySelector("span").textContent =
              "Processing...";

            chrome.storage.local.get(
              ["default_buy_amount", "active_preset_values"],
              async (r) => {
                const defaultBuyAmount = r.default_buy_amount || 0.01;

                const result = await transactToken(
                  tokenMintAddress,
                  isMigrating ? "snipe" : "buy",
                  defaultBuyAmount,
                  novaAuthToken,
                  isMigrating ? {} : r?.active_preset_values,
                );

                if (result) {
                  anotherCustomButton.querySelector("span").textContent =
                    "Success!";
                  setTimeout(() => {
                    anotherCustomButton.querySelector("span").textContent =
                      "Buy";
                    anotherCustomButton.disabled = false;
                  }, 700);
                } else {
                  anotherCustomButton.querySelector("span").textContent =
                    "Failed!";
                  setTimeout(() => {
                    anotherCustomButton.querySelector("span").textContent =
                      "Buy";
                    anotherCustomButton.disabled = false;
                  }, 700);
                }
              },
            );
          };

          insertElementBefore(actionArea, anotherCustomButton);
        });
      });
  } catch (error) {
    if (error?.message === "Extension context invalidated.") {
      // console.warn(
      //   "The extension context is invalidated. Likely due to extension removal.",
      // );
      window.location.reload();
    } else {
      // console.error("An unexpected error occurred:", error);
    }
  }
};

// ###### Message Listener 📩 ######
chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local
    .get(["is_nova_extension_on", "elements_classname"])
    .then(async (result) => {
      const isExtensionOn = result.is_nova_extension_on;
      const elementsClassname = result.elements_classname;

      // Only proceed if the extension is on
      if (!isExtensionOn) return;

      findAndRemoveSuspiciousDetectionModal(
        elementsClassname?.suspicious_modal_selectors,
      );

      // PumpVision
      if (request.message === "bullx-pump-vision") {
        const previousDraggableNovaModal = document.querySelector(
          `div.${CSS.escape(elementsClassname?.bsfm)}`,
        );
        if (previousDraggableNovaModal) {
          previousDraggableNovaModal.remove();
        }

        // Remove Hotkeys 🔥
        removeHotkey();

        // console.log("MESSAGE 📌: ", request.message);
        setInterval(() => {
          injectNovaMemescopeButtonList();
        }, 1500);

        const container = await searchAndFindPumpVisionContainer();
        if (container) {
          injectNovaMemescopeButtonList();
          const observer = new MutationObserver(() =>
            injectNovaMemescopeButtonList(),
          );
          observer.observe(container, { childList: true, subtree: true });
        }
      }

      // Save
      if (request.message === "bullx-token-save") {
        // console.log("SAVE MESSAGE 📌: ", request.message);
        const currentUrl = window.location.href;
        if (currentUrl.includes("/terminal")) {
          injectNovaContainer();
          injectNovaFlyingModal();
        }
      }

      // Terminal
      if (request.message === "bullx-token") {
        // console.log("BULLX TOKEN MESSAGE 📌: ", request.message);

        const chartsContainer = await searchAndFindChartsContainer();
        const buySellContainer = await searchAndFindBuyAndSellContainer();
        if (chartsContainer) {
          injectNovaContainer();
          injectNovaFlyingModal();
        } else {
          // console.log("CHARTS CONTAINER DOESNT EXIST ❌");
        }
        if (buySellContainer) {
          injectNovaSnipeButton();
        }
        let currentMigrating = document.querySelector("div.buy-sell-migrating");
        if (buySellContainer) {
          const observer = new MutationObserver(() => {
            const migrating = document.querySelector("div.buy-sell-migrating");
            if (Boolean(migrating) !== Boolean(currentMigrating)) {
              currentMigrating = migrating;
              injectNovaSnipeButton();
            }
          });
          observer.observe(buySellContainer, {
            childList: true,
            subtree: true,
          });
        }
      }
    });
});
