const connector = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://malinka-go.github.io/bolvanka/tonconnect-manifest.json",
  buttonRootId: "ton-connect-button"
});

let wallet = null;

connector.onStatusChange((walletInfo) => {
  const status = document.getElementById("mint-status");
  if (!status) {
    console.error("Element with id 'mint-status' not found");
    return;
  }
  if (walletInfo) {
    wallet = walletInfo;
    status.textContent = `Connected: ${wallet.account.address}`;
  } else {
    wallet = null;
    status.textContent = "Wallet disconnected";
  }
});

async function mintNFT() {
  console.log("mintNFT called");
  const status = document.getElementById("mint-status");
  const descriptionInput = document.getElementById("nft-description");
  const mintButton = document.getElementById("mint-button");
  if (!status || !descriptionInput || !mintButton) {
    console.error("Required DOM elements not found");
    return;
  }
  if (!window.TonCore) {
    console.error("TonCore library not loaded");
    throw new Error("TonCore library not loaded");
  }
  mintButton.disabled = true;
  status.textContent = "Processing...";

  try {
    if (!wallet) {
      throw new Error("Connect wallet first");
    }

    const description = descriptionInput.value.trim();
    if (description.length === 0) {
      throw new Error("Enter description");
    }
    const descriptionBytes = new TextEncoder().encode(description);
    if (descriptionBytes.length > 1023) {
      throw new Error("Description must not exceed 1023 bytes");
    }

    const descriptionCell = window.TonCore.beginCell()
      .storeStringTail(description)
      .endCell();

    const Address = window.TonCore.Address;
    const contractAddress = Address.parse("kQAwcEAA9i9R87IrO3iM8Cc0RE_kr2S_pkk2ml28143hRzCg");

    const payload = window.TonCore.beginCell()
      .storeUint(0x6d696e74, 32) // op::mint
      .storeRef(descriptionCell)  // description
      .endCell();

    const boc = payload.toBoc(); // Uint8Array
    const base64Payload = btoa(String.fromCharCode(...boc));

    console.log("Payload:", base64Payload);

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: contractAddress.toString(),
          amount: "1300000000", // 3 TON для покрытия + комиссий
          payload: base64Payload,
          mode: 64
        }
      ]
    };

    console.log("Sending transaction:", tx);
    console.log("Prepared TX object:");
    console.log(JSON.stringify(tx, null, 2)); // ← эта строка покажет tx красиво в консоли
    const result = await connector.sendTransaction(tx);
    console.log("Transaction result:", result);
    status.textContent = "Mint transaction sent!";
  } catch (e) {
    console.error("Error in mintNFT:", e);
    status.textContent = `Error: ${e.message || "Failed to send transaction"}`;
  } finally {
    mintButton.disabled = false;
  }
}

console.log("mintNFT loaded");
window.mintNFT = mintNFT;

// Telegram Web App
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();