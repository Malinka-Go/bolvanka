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
  if (!status) {
    console.error("Element with id 'mint-status' not found");
    return;
  }
  if (!descriptionInput) {
    console.error("Element with id 'nft-description' not found");
    return;
  }
  if (!mintButton) {
    console.error("Element with id 'mint-button' not found");
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

    const imageCell = window.TonCore.beginCell()
  .storeStringTail("https://malinka-go.github.io/bridgeoflove/nft.jpg")
  .endCell();

   const descriptionCell = window.TonCore.beginCell()
  .storeStringTail(description)
  .endCell();

   const metadataCell = window.TonCore.beginCell()
  .storeRef(imageCell)
  .storeRef(descriptionCell)
  .endCell();    

    const Address = window.TonCore.Address;

    const contractAddress = Address.parse("kQDlRyGvCQmabi7WRvHEOSFLr83p8_B1nd4xwzCibphnZEOQ");

    const payload = window.TonCore.beginCell()
      .storeUint(0x6d696e74, 32) // op::mint
      .storeUint(0, 64)          // query_id
      .storeUint(0, 64)          // index
      .storeAddress(Address.parse(wallet.account.address)) // owner
      .storeRef(metadataCell)    // metadata
      .endCell();

    const base64Payload = payload.toBoc().toString("base64");
    console.log("Payload:", base64Payload);

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: contractAddress.toString(),
          amount: "250000000", // 0.25 TON
          payload: base64Payload
        }
      ]
    };

    console.log("Sending transaction:", tx);
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

window.mintNFT = mintNFT;

// Telegram Web App
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();