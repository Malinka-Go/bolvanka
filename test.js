const connector = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://malinka-go.github.io/bolvanka/tonconnect-manifest.json",
  buttonRootId: "ton-connect-button"
});

let wallet = null;

connector.onStatusChange((walletInfo) => {
  const status = document.getElementById("mint-status");
  if (walletInfo) {
    wallet = walletInfo;
    status.textContent = `Connected: ${wallet.account.address}`;
  } else {
    wallet = null;
    status.textContent = "Wallet disconnected";
  }
});


async function mintNFT() {
  console.log("mintNFT called"); // Отладка
  const status = document.getElementById("mint-status");
  const descriptionInput = document.getElementById("nft-description");
  const mintButton = document.getElementById("mint-button");
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
    const metadataCell = tonCore.beginCell().storeStringTail(metadataJson).endCell();

    const Address = tonCore.Address;
    const beginCell = tonCore.beginCell;

    const contractAddress = Address.parse("kQAIYlrr3UiMJ9fqI-B4j2nJdiiD7WzyaNL1MX_wiONc4F6o");

    const payload = beginCell()
      .storeUint(0x6d696e74, 32)
      .storeUint(0, 64)
      .storeUint(0, 64)
      .storeAddress(Address.parse(wallet.account.address))
      .storeRef(metadataCell)
      .endCell();

    const base64Payload = payload.toBoc().toString("base64");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: contractAddress.toString(),
          amount: "50000000",
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

window.mintNFT = mintNFT; // Делаем mintNFT глобальной

// Telegram Web App
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();