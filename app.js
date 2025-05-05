const connector = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://malinka-go.github.io/bolvanka/tonconnect-manifest.json",
  buttonRootId: "connect-wallet"
});

let wallet = null;

connector.onStatusChange((walletInfo) => {
  const status = document.getElementById("status");
  const mintButton = document.getElementById("mint-nft");
  if (walletInfo) {
    wallet = walletInfo;
    status.textContent = `Connected: ${wallet.account.address}`;
    mintButton.disabled = false;
  } else {
    wallet = null;
    status.textContent = "Wallet disconnected";
    mintButton.disabled = true;
  }
});

document.getElementById("connect-wallet").addEventListener("click", async () => {
  try {
    await connector.connectWallet();
  } catch (e) {
    document.getElementById("status").textContent = "Error connecting wallet";
    console.error(e);
  }
});

async function mintNFT() {
  const status = document.getElementById("status");
  const descriptionInput = document.getElementById("nft-description");
  const mintButton = document.getElementById("mint-nft");
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
      .storeUint(0x6d696e74, 32) // op::mint
      .storeUint(0, 64)          // query_id
      .storeUint(0, 64)          // index
      .storeAddress(Address.parse(wallet.account.address)) // owner
      .storeRef(metadataCell)    // content
      .endCell();

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
    mintButton.disabled = !wallet;
  }
}

document.getElementById("mint-nft").addEventListener("click", mintNFT);

// Telegram Web App integration
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();