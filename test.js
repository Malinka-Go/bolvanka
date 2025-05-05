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
  if (!window.TonWeb) {
    console.error("TonWeb library not loaded");
    throw new Error("TonWeb library not loaded");
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

    const metadata = {
      name: "My NFT",
      description,
      image: "https://malinka-go.github.io/bridgeoflove/nft.jpg"
    };

    const metadataJson = `data:application/json,${JSON.stringify(metadata)}`;
    const metadataCell = new TonWeb.boc.Cell();
    metadataCell.bits.writeString(metadataJson);

    const Address = TonWeb.utils.Address;

    const contractAddress = new Address("kQAIYlrr3UiMJ9fqI-B4j2nJdiiD7WzyaNL1MX_wiONc4F6o");

    const payload = new TonWeb.boc.Cell();
    payload.bits.writeUint(0x6d696e74, 32); // op::mint
    payload.bits.writeUint(0, 64);          // query_id
    payload.bits.writeUint(0, 64);          // index
    payload.bits.writeAddress(new Address(wallet.account.address)); // owner
    payload.refs[0] = metadataCell;

    const base64Payload = payload.toBoc().toString("base64");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: contractAddress.toString(),
          amount: "50000000", // 0.05 TON
          payload: base64Payload
        }
      ]
    };

    await connector.sendTransaction(tx);
    status.textContent = "Mint transaction sent!";
  } catch (e) {
    status.textContent = e.message || "Error sending transaction";
    console.error(e);
  } finally {
    mintButton.disabled = false;
  }
}

window.mintNFT = mintNFT;

// Telegram Web App
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();