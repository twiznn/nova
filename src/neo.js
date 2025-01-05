// Utility Functions
function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
  
  function insertBefore(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
  }


  function handleThemeAndTargetUpdates() {
    const rootElement = document.documentElement;
  
    // Apply theme logic
    const applyTheme = () => {
      if (rootElement.classList.contains("theme2")) {
        rootElement.classList.remove("theme2");
        if (!rootElement.classList.contains("theme3")) {
          rootElement.classList.add("theme3");
        }
        if (rootElement.getAttribute("data-theme") !== "theme3") {
          rootElement.setAttribute("data-theme", "theme3");
        }
      }
    };
  
    // Update target element
    const updateTargetElement = () => {
      const isHomePage = window.location.href === "https://neo.bullx.io/";
      if (!isHomePage) {
        return;
      }
    
      // Proceed if either theme2 or theme3 is active
      if (
        !rootElement.classList.contains("theme2") &&
        !rootElement.classList.contains("theme3")
      ) {
        return;
      }
    
      const targetContainer = document.querySelector(
        "div.flex.gap-x-1.items-center"
      );
      if (targetContainer) {
        const targetSpan = targetContainer.querySelector(
          "span.text-base.font-semibold.whitespace-nowrap"
        );
        if (targetSpan && targetSpan.textContent !== "Vision") {
          targetSpan.textContent = "Vision";
          targetSpan.style.color = "purple";
        }
    
        const targetSvg = targetContainer.querySelector("svg");
        if (targetSvg) {
          const newImg = document.createElement("img");
          if (rootElement.classList.contains("theme2")) {
            newImg.src = chrome.runtime.getURL("src/nova.avif");
            newImg.alt = "Nova Vision Icon";
          } else if (rootElement.classList.contains("theme3")) {
            // If theme3 has a different image or behavior, handle accordingly
            newImg.src = chrome.runtime.getURL("src/nova.avif"); // Replace with appropriate image if different
            newImg.alt = "Nova Vision Icon";
          }
          newImg.className = targetSvg.className;
          newImg.style = `
            height: 10em;
            aspect-ratio: 512 / 178;
            vertical-align: middle; 
          `;
          targetSvg.replaceWith(newImg);
          console.log("SVG replaced with nova.avif image.");
        }
      }
    };
    
    // Apply changes
    applyTheme();
    updateTargetElement();
  
    // Observe for changes
    const themeObserver = new MutationObserver(() => {
      applyTheme();
    });
  
    themeObserver.observe(rootElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
  
    const domObserver = new MutationObserver(() => {
      updateTargetElement();
    });
  
    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  

  

  
  // Transaction Function
  async function transactToken(mintAddress, method, value, authToken) {
    console.log(`[transactToken] Initiating transaction: Mint=${mintAddress}, Method=${method}, Value=${value}`);
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
  
      console.log(`[transactToken] Response Status: ${response.status} ${response.statusText}`);
  
      if (!response.ok) {
        throw new Error(`Failed to ${method} token: ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log(`[transactToken] Response JSON:`, result);
  
      if (result.success) {
        console.log(`[transactToken] Token ${method}ed successfully.`);
      } else {
        console.error(`[transactToken] Token ${method} failed:`, result);
      }
  
      return result.success;
    } catch (error) {
      console.error(`[transactToken] Error during ${method} transaction:`, error);
      return false;
    }
  }
  
  // Message Listener
  chrome.runtime.onMessage.addListener(async function (request) {
   
  
    chrome.storage.local.get(["is_nova_extension_on"]).then(async (result) => {
      const isExtensionOn = result.is_nova_extension_on;
     
  
      // Only proceed if the extension is on
      if (!isExtensionOn) {
        
        return;
      }
  
      // PumpVision (Unchanged)
      if (request.message === "bullx-pump-vision") {
       
        const container = await findPumpVisionContainer();
        if (container) {
         
          addMemescopeQTButton();
          handleThemeAndTargetUpdates()
          const observer = new MutationObserver(() => {
           
            addMemescopeQTButton();
          });
          observer.observe(container, { childList: true, subtree: true });
        } else {
          console.warn(`[bullx-pump-vision] PumpVision container not found.`);
        }
      }
  
      // Save Message (Unchanged)
      if (request.message === "bullx-token-save") {
       
        // Uncomment and implement if needed
        // addTopTokenCustomBuyOrSellButtons();
      }
  
      // Terminal (Modified)
      if (request.message === "neo-token") {
        handleThemeAndTargetUpdates()
        
       
        const topBar = await findTopBar();
        const buySellContainer = await findBuySellContainer(); // May not be needed
  
        if (topBar) {
        
          addTopTokenCustomBuyOrSellButtons();
        } else {
          console.error(`[bullx-token] Top Bar not found.`);
        }
  
        // If buySellContainer is still relevant, handle accordingly
        if (buySellContainer) {
        
          addCustomBuyButton();
        } else {
          console.warn(`[bullx-token] Buy/Sell Container not found.`);
        }
  
        // Observe changes in buySellContainer
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
  
      // Home (Unchanged - Disabled)
      if (request.message === "bullx-home") {
      
        // Home-related code remains unchanged or disabled
      }
    }).catch((storageError) => {
      console.error(`[onMessage] Error accessing storage:`, storageError);
    });
  });
  
  // Find Functions
  async function findMain(timeout = 12000) {
  
    for (let i = 0; i < timeout / 600; i++) {
      const main = document.querySelector(".ant-layout-content");
      if (main) {
       
        return main;
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.error(`[findMain] Main container not found within timeout.`);
    return null;
  }
  
  async function findPumpVisionContainer(timeout = 12000) {
     for (let i = 0; i < timeout / 600; i++) {
      const container = document.querySelector("div.grid");
      if (container) {
    
        return container;
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.error(`[findPumpVisionContainer] PumpVision container not found within timeout.`);
    return null;
  }
  
  async function findTableContainer(timeout = 12000) {
   
    for (let i = 0; i < timeout / 600; i++) {
      const container = document.querySelector(".ant-table-tbody");
      if (container) {
      
        return container;
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.error(`[findTableContainer] Table container not found within timeout.`);
    return null;
  }
  
  async function findTopBar(timeout = 12000) {
   
    for (let i = 0; i < timeout / 600; i++) {
      const topBar = document.querySelector(
        'div.text-xs.flex.flex-col.md\\:flex-row.items-center.font-medium.text-left > div.flex.items-center.justify-between.py-\\[7px\\].w-full.md\\:w-auto.md\\:mt-0.md\\:border-t-0.px-2.md\\:pr-8'
      );
      if (topBar) {
       
        return topBar;
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.error(`[findTopBar] Top Bar not found within timeout.`);
    return null;
  }
  
  async function findBuySellContainer(timeout = 12000) {
   
    for (let i = 0; i < timeout / 600; i++) {
      const container = document.querySelector("div.ant-drawer-content-wrapper");
      if (container) {
      
        return container;
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.error(`[findBuySellContainer] Buy/Sell Container not found within timeout.`);
    return null;
  }
  
  // Add Custom Buy Button (Debug Enhanced)
  function addCustomBuyButton() {
    try {
    
      let novaAuthToken;
      chrome.storage.local.get("nova_auth_token").then((result) => {
      
        novaAuthToken = result.nova_auth_token;
  
        const migrationContainer = document.querySelector("div.buy-sell-migrating");
        if (!migrationContainer) {
         
          return;
        }
      
  
        const previousSnipingButton = document.querySelector(".nova-snipe-qt-btn");
        const previousBuyButton = document.querySelector(".nova-buy-qt-btn1");
  
        if (previousSnipingButton) {
         
          previousSnipingButton.remove();
        }
        if (previousBuyButton) {
       
          previousBuyButton.remove();
        }
  
        const migrationText = Array.from(migrationContainer.querySelectorAll("p")).find((p) =>
          p.textContent.includes("may take a few minutes")
        );
        if (!migrationText) {
          console.warn(`[addCustomBuyButton] Migration text not found.`);
          return;
        }
       
  
        // Create Custom Button
        const customButton = document.createElement("button");
        const buttonImg = document.createElement("img");
      
        buttonImg.src = chrome.runtime.getURL('src/logo.png');
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
        customButton.classList.add("nova-snipe-qt-btn", "ant-btn", "ant-btn-text");
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
              novaAuthToken
            );
  
            if (result) {
            
              customButton.querySelector("span").textContent = "Success!";
            } else {
            
              customButton.querySelector("span").textContent = "Failed!";
            }
          });
        };
  
        insertBefore(migrationText, customButton);
       
      }).catch((storageError) => {
        console.error(`[addCustomBuyButton] Error accessing storage:`, storageError);
      });
    } catch (error) {
      console.error(`[addCustomBuyButton] Failed to add Custom Buy button:`, error);
    }
  }

  // Override the modal creation function



  
  // Add Top Token Custom Buy or Sell Buttons (Debug Enhanced)
  function addTopTokenCustomBuyOrSellButtons() {
    try {
     
      let novaAuthToken;
      let buyButtonsList;
      let sellButtonsList = [20, 50, 100];
      chrome.storage.local
        .get(["nova_auth_token", "custom_buy_value_list"])
        .then((result) => {
        
          novaAuthToken = result.nova_auth_token;
  
          // Determine Buy Buttons List
          if (
            Array.isArray(result.custom_buy_value_list) &&
            result.custom_buy_value_list.length > 0
          ) {
            buyButtonsList = result.custom_buy_value_list;
          
          } else {
            buyButtonsList = [0.5, 1, 2, 5, 10];
          }
  
          // Element Adjustment (Optional: Modify based on new layout)
          const navbarContainer = document.querySelector(
            ".w-full.relative.md\\:border-b.md\\:py-\\[12px\\].p-0.md\\:p-3.flex.flex-col.gap-y-\\[10px\\].md\\:flex-row.justify-between.items-center.md\\:h-\\[54px\\].bg-grey-900.md\\:border-solid.md\\:border-grey-600.z-\\[100\\]"
          );
          if (navbarContainer) {
         
            navbarContainer.classList.remove("md:h-[54px]");
          } else {
            console.warn(`[addTopTokenCustomBuyOrSellButtons] Navbar container not found.`);
          }
  
          // Remove Previous Buy and Sell Buttons if Any
          const previousBuyAndSellButtonsContainer = document.querySelector(
            ".nova1-buy-and-sell-buttons-container"
          );
          if (previousBuyAndSellButtonsContainer) {
           
            previousBuyAndSellButtonsContainer.remove();
          }
  
          // Locate the Updated Top Bar
          const topBar = document.querySelector(
            'div.text-xs.flex.flex-col.md\\:flex-row.items-center.font-medium.text-left > div.flex.items-center.justify-between.py-\\[7px\\].w-full.md\\:w-auto.md\\:mt-0.md\\:border-t-0.px-2.md\\:pr-8'
          );
          if (!topBar) {
            console.error(`[addTopTokenCustomBuyOrSellButtons] Top Bar not found.`);
            return;
          }
        
  
          topBar.classList.add("flex-col", "gap-y-2");
  
          // State to Toggle Buy/Sell
          let isBuy = true;
  
          // Create Buy and Sell Buttons Container
          const buyAndSellButtonsContainer = document.createElement("div");
          buyAndSellButtonsContainer.classList.add(
            "nova1-buy-and-sell-buttons-container"
          );
          buyAndSellButtonsContainer.style.width = "100%";
          buyAndSellButtonsContainer.style.display = "flex";
          buyAndSellButtonsContainer.style.flexDirection = "column";
          buyAndSellButtonsContainer.style.justifyContent = "start";
          buyAndSellButtonsContainer.style.alignItems = "start";
          buyAndSellButtonsContainer.style.rowGap = "8px";
  
          // Top Container for Buy/Sell Toggle
          const topContainer = document.createElement("div");
          topContainer.style.width = "100%";
          topContainer.style.display = "flex";
          topContainer.style.flexDirection = "row";
          topContainer.style.alignItems = "center";
          topContainer.style.columnGap = "8px";
  
          // Bottom Container for Input and Toggle Button
          const bottomContainer = document.createElement("div");
          bottomContainer.style.width = "100%";
          bottomContainer.style.display = "flex";
          bottomContainer.style.flexDirection = "row";
          bottomContainer.style.alignItems = "center";
          bottomContainer.style.columnGap = "8px";
  
          // Toggle Buy/Sell Button
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
  
          // Separators (Optional: Adjust based on design)
          const firstSeparator = document.createElement("div");
          firstSeparator.style.width = "1px";
          firstSeparator.style.height = "16px";
          firstSeparator.style.background = "rgba(255, 255, 255, 0.1)";
          const secondSeparator = document.createElement("div");
          secondSeparator.style.width = "100%";
          secondSeparator.style.height = "0.5px";
          secondSeparator.style.background = "rgba(255, 255, 255, 0.1)";
  
          // Buy Container
          const buyContainer = document.createElement("div");
          buyContainer.style.display = "flex";
          buyContainer.style.justifyContent = "start";
          buyContainer.style.alignItems = "center";
          buyContainer.style.columnGap = "8px";
          buyContainer.style.rowGap = "8px";
  
          // Sell Container
          const sellContainer = document.createElement("div");
          sellContainer.style.display = "none";
          sellContainer.style.justifyContent = "start";
          sellContainer.style.alignItems = "center";
          sellContainer.style.columnGap = "8px";
          sellContainer.style.rowGap = "8px";
  
          // Custom Buy/Sell Input and Button
          const customBuyAndSellContainer = document.createElement("div");
          customBuyAndSellContainer.style.display = "flex";
          customBuyAndSellContainer.style.justifyContent = "start";
          customBuyAndSellContainer.style.alignItems = "center";
          customBuyAndSellContainer.style.columnGap = "8px";
          customBuyAndSellContainer.style.rowGap = "8px";
  
          // Input Group for Amount
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
            "max-w-[300px]"
          );
  
          const inputWrapper = document.createElement("div");
          inputWrapper.classList.add(
            "ant-input-number-wrapper",
            "ant-input-number-group"
          );
  
          const inputAddon = document.createElement("div");
          inputAddon.classList.add("ant-input-number-group-addon");
  
          const addonText = document.createElement("span");
          addonText.classList.add(
            "text-grey-200",
            "uppercase",
            "tracking-[1.68px]",
            "text-xs",
            "font-medium"
          );
          addonText.textContent = "Amount";
          inputAddon.appendChild(addonText);
  
          const inputContainer = document.createElement("div");
          inputContainer.classList.add(
            "ant-input-number-affix-wrapper",
            "ant-input-number-affix-wrapper-lg",
            "ant-input-number-outlined"
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
              console.warn(`[addTopTokenCustomBuyOrSellButtons] Invalid input detected: ${value}`);
              e.target.value = value.slice(0, -1);
            }
          });
  
          const inputSuffix = document.createElement("span");
          inputSuffix.classList.add("ant-input-number-suffix");
  
          const suffixIcon = document.createElement("span");
          suffixIcon.classList.add("text-grey-300");
  
          const suffixSvg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );
          suffixSvg.setAttribute("width", "12");
          suffixSvg.setAttribute("height", "12");
          suffixSvg.setAttribute("viewBox", "0 0 14 14");
          suffixSvg.setAttribute("fill", "none");
          suffixSvg.setAttribute("alt", "");
  
          const suffixPath1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          suffixPath1.setAttribute(
            "d",
            "M3.12368 9.36949C3.19298 9.30019 3.28826 9.25977 3.38932 9.25977H12.5541C12.7215 9.25977 12.8053 9.46189 12.6869 9.58027L10.8765 11.3907C10.8072 11.46 10.7119 11.5004 10.6108 11.5004H1.44608C1.27861 11.5004 1.19487 11.2983 1.31326 11.1799L3.12368 9.36949Z"
          );
          suffixPath1.setAttribute("fill", "currentColor");
  
          const suffixPath2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          suffixPath2.setAttribute(
            "d",
            "M3.12368 2.60972C3.19587 2.54042 3.29115 2.5 3.38932 2.5H12.5541C12.7215 2.5 12.8053 2.70212 12.6869 2.82051L10.8765 4.63093C10.8072 4.70023 10.7119 4.74065 10.6108 4.74065H1.44608C1.27861 4.74065 1.19487 4.53853 1.31326 4.42015L3.12368 2.60972Z"
          );
          suffixPath2.setAttribute("fill", "currentColor");
  
          const suffixPath3 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          suffixPath3.setAttribute(
            "d",
            "M10.8765 5.96714C10.8072 5.89785 10.7119 5.85742 10.6108 5.85742H1.44608C1.27861 5.85742 1.19487 6.05954 1.31326 6.17793L3.12368 7.98835C3.19298 8.05765 3.28826 8.09807 3.38932 8.09807H12.5541C12.7215 8.09807 12.8053 7.89595 12.6869 7.77757L10.8765 5.96714Z"
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
          //buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
          buttonImg.src = chrome.runtime.getURL('src/logo.png');
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
          
            const inputElement = document.querySelector("[name='nova_buy_and_sell']");
            const buyOrSellValue = parseFloat(inputElement.value); // Get the value of the input field
  
            if (isNaN(buyOrSellValue) || buyOrSellValue <= 0) {
              console.warn(`[addTopTokenCustomBuyOrSellButtons] Invalid input value: ${buyOrSellValue}`);
              alert("Please enter a valid amount.");
              return;
            }
  
            buyOrSellButton.disabled = true;
            buyOrSellButton.querySelector("span").textContent = "Processing...";
  
            const url = new URL(window.location.href);
            const tokenMint = url.searchParams.get("address");
         
  
            if (!tokenMint) {
              console.error(`[addTopTokenCustomBuyOrSellButtons] Token mint address not found in URL.`);
              alert("Token mint address not found in URL.");
              buyOrSellButton.disabled = false;
              buyOrSellButton.querySelector("span").textContent = isBuy ? "Buy" : "Sell";
              return;
            }
  
            const result = await transactToken(
              tokenMint,
              isBuy ? "buy" : "sell",
              buyOrSellValue,
              novaAuthToken
            );
  
            if (result) {
             
              buyOrSellButton.querySelector("span").textContent = "Success!";
              setTimeout(() => {
                buyOrSellButton.querySelector("span").textContent = isBuy ? "Buy" : "Sell";
                buyOrSellButton.disabled = false;
                inputElement.value = "";
              }, 2000);
            } else {
              console.error(`[addTopTokenCustomBuyOrSellButtons] ${isBuy ? 'Buy' : 'Sell'} transaction failed.`);
              buyOrSellButton.querySelector("span").textContent = "Failed!";
              setTimeout(() => {
                buyOrSellButton.querySelector("span").textContent = isBuy ? "Buy" : "Sell";
                buyOrSellButton.disabled = false;
                inputElement.value = "";
              }, 2000);
            }
          });
  
          customBuyAndSellContainer.appendChild(inputGroup);
          customBuyAndSellContainer.appendChild(buyOrSellButton);
  
          // Create Buy Buttons Based on Buy Buttons List
          buyButtonsList.forEach((value) => {
          
            const customBuyButton = document.createElement("button");
            const buttonImg = document.createElement("img");
            //buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
            buttonImg.src = chrome.runtime.getURL('src/logo.png');
            buttonImg.alt = "Nova Logo";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";
            const buttonText = document.createElement("span");
            buttonText.textContent = `Buy ${value} SOL`;
  
            customBuyButton.appendChild(buttonImg);
            customBuyButton.appendChild(buttonText);
            customBuyButton.type = "button";
            customBuyButton.classList.add("nova-buy-qt-btn-list", "ant-btn", "ant-btn-text");
            customBuyButton.style.border = "1px solid #ce7bed";
  
            customBuyButton.onclick = async function () {
             
              const url = new URL(window.location.href);
              const tokenMint = url.searchParams.get("address");
            
  
              if (!tokenMint) {
                console.error(`[addTopTokenCustomBuyOrSellButtons] Token mint address not found in URL.`);
                alert("Token mint address not found in URL.");
                return;
              }
  
              customBuyButton.disabled = true;
              customBuyButton.querySelector("span").textContent = "Processing...";
              const result = await transactToken(
                tokenMint,
                "buy",
                value,
                novaAuthToken
              );
  
              if (result) {
              
                customBuyButton.querySelector("span").textContent = "Success!";
                setTimeout(() => {
                  customBuyButton.disabled = false;
                  customBuyButton.querySelector("span").textContent = `Buy ${value} SOL`;
                }, 2000);
              } else {
                console.error(`[addTopTokenCustomBuyOrSellButtons] Buy ${value} SOL transaction failed.`);
                customBuyButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  customBuyButton.disabled = false;
                  customBuyButton.querySelector("span").textContent = `Buy ${value} SOL`;
                }, 2000);
              }
            };
  
            buyContainer.append(customBuyButton);
          });
  
          // Create Sell Buttons Based on Sell Buttons List
          sellButtonsList.forEach((value) => {
         
            const customSellButton = document.createElement("button");
            const buttonImg = document.createElement("img");
            //buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
            buttonImg.src = chrome.runtime.getURL('src/logo.png');
            buttonImg.alt = "Nova Logo";
            buttonImg.style.aspectRatio = "1/1";
            buttonImg.style.height = "15px";
            buttonImg.style.width = "15px";
            buttonImg.style.marginRight = "5px";
            const buttonText = document.createElement("span");
            buttonText.textContent = `Sell ${value}%`;
  
            customSellButton.appendChild(buttonImg);
            customSellButton.appendChild(buttonText);
            customSellButton.type = "button";
            customSellButton.classList.add("nova-sell-qt-btn-list", "ant-btn", "ant-btn-text");
            customSellButton.style.border = "1px solid #ce7bed";
  
            customSellButton.onclick = async function () {
            
              const url = new URL(window.location.href);
              const tokenMint = url.searchParams.get("address");
            
  
              if (!tokenMint) {
                console.error(`[addTopTokenCustomBuyOrSellButtons] Token mint address not found in URL.`);
                alert("Token mint address not found in URL.");
                return;
              }
  
              customSellButton.disabled = true;
              customSellButton.querySelector("span").textContent = "Processing...";
              const result = await transactToken(
                tokenMint,
                "sell",
                value,
                novaAuthToken
              );
  
              if (result) {
             
                customSellButton.querySelector("span").textContent = "Success!";
                setTimeout(() => {
                  customSellButton.disabled = false;
                  customSellButton.querySelector("span").textContent = `Sell ${value}%`;
                }, 2000);
              } else {
                console.error(`[addTopTokenCustomBuyOrSellButtons] Sell ${value}% transaction failed.`);
                customSellButton.querySelector("span").textContent = "Failed!";
                setTimeout(() => {
                  customSellButton.disabled = false;
                  customSellButton.querySelector("span").textContent = `Sell ${value}%`;
                }, 2000);
              }
            };
  
            sellContainer.append(customSellButton);
          });
  
          // Assemble Containers
          topContainer.append(buyContainer);
          topContainer.append(sellContainer);
          bottomContainer.append(customBuyAndSellContainer);
          bottomContainer.append(firstSeparator);
          bottomContainer.append(toggleBuyOrSellButton);
          buyAndSellButtonsContainer.append(topContainer);
          buyAndSellButtonsContainer.append(bottomContainer);
  
          // Append to Top Bar
          topBar.appendChild(buyAndSellButtonsContainer);
        
        }).catch((storageError) => {
          console.error(`[addTopTokenCustomBuyOrSellButtons] Error accessing storage:`, storageError);
        });
    } catch (error) {
      console.error(`[addTopTokenCustomBuyOrSellButtons] Failed to add Custom Buy/Sell buttons:`, error);
    }
  }
  
  // Add Memescope QT Button (Unchanged)
  function addMemescopeQTButton() {
    try {
      let novaAuthToken;
      chrome.storage.local.get("nova_auth_token").then((result) => {
      
        novaAuthToken = result.nova_auth_token;
  
         const combinedCards = Array.from(
          document.querySelectorAll("div.neo-card, div.pump-card")
        );
        const cards =
          combinedCards.filter((card) => card.matches("div.neo-card")).length >
          0
            ? combinedCards.filter((card) => card.matches("div.neo-card"))
            : combinedCards.filter((card) => card.matches("div.pump-card"));

  
        cards.forEach((card, index) => {
          
          const isMigrating = Array.from(card.querySelectorAll("span")).some(
            (span) => span.textContent === "Migrating..."
          );
        
  
          const existingBuyButton = card.querySelector(".nova-buy-qt-btn1");
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
          if (!poolLink) {
        
            return;
          }
        
  
          let actionArea = card.querySelector("button");
          if (isMigrating) {
            actionArea = Array.from(card.querySelectorAll("span")).find(
              (span) => span.textContent === "Migrating..."
            );
          }
          if (!actionArea) {
           
            return;
          }
  
          const buttonClass = isMigrating ? "nova-snipe-qt-btn" : "nova-buy-qt-btn1";
  
          const buttonImg = document.createElement("img");
          //buttonImg.src = "https://click.tradeonnova.io/images/logo.png";
          buttonImg.src = chrome.runtime.getURL('src/logo.png');
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
          anotherCustomButton.classList.add(buttonClass, "ant-btn", "ant-btn-text");
          anotherCustomButton.style.border = "1px solid #ce7bed";
          anotherCustomButton.style.margin = "0px 6px";
          anotherCustomButton.style.zIndex = "1000";
  
          const poolUrl = new URL(poolLink.href);
          const tokenMint = poolUrl.searchParams.get("address");

  
          anotherCustomButton.onclick = async function (event) {
            event.preventDefault();
            event.stopPropagation();
        
          
            anotherCustomButton.disabled = true;
            anotherCustomButton.querySelector("span").textContent = "Processing...";
        
            
        
            if (!tokenMint) {
                console.error("[anotherCustomButton] Token mint address not found in URL.");
                anotherCustomButton.querySelector("span").textContent = "Error!";
                anotherCustomButton.disabled = false;
                return;
            }
        
            // Retrieve `default_buy_amount` from storage
            chrome.storage.local.get("default_buy_amount", async (r) => {
                const defaultBuyAmount = r.default_buy_amount || 0.01;
        
                try {
                    // Call `transactToken` and process the result
                    const result = await transactToken(
                        tokenMint,
                        isMigrating ? "snipe" : "buy",
                        defaultBuyAmount,
                        novaAuthToken
                    );
        
                    if (result) {
                        anotherCustomButton.querySelector("span").textContent = "Success!";
                    } else {
                        anotherCustomButton.querySelector("span").textContent = "Failed!";
                    }
                } catch (error) {
                    console.error("[anotherCustomButton] Transaction error:", error);
                    anotherCustomButton.querySelector("span").textContent = "Error!";
                } finally {
                    // Reset the button state after 2 seconds
                    setTimeout(() => {
                        anotherCustomButton.disabled = false;
                        anotherCustomButton.querySelector("span").textContent = isMigrating ? "Snipe" : "Buy";
                    }, 2000);
                }
            });
        };
  
          insertBefore(actionArea, anotherCustomButton);
         
        });
      }).catch((storageError) => {
        console.error(`[addMemescopeQTButton] Error accessing storage:`, storageError);
      });
    } catch (error) {
      console.log(`[addMemescopeQTButton] Failed to add Nova button:`, error);
    }
  }
  
  // Helper Function: Insert before a reference node
  function insertBefore(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
  }

  handleThemeAndTargetUpdates();

  
  // Note: The rest of your code (e.g., handleBullxHome) remains unchanged or commented out.
  
