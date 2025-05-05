// tonconnect button
const connector = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://malinka-go.github.io/bolvanka/tonconnect-manifest.json",
  buttonRootId: "ton-connect-button"
});

window.connector = connector;

// Переменная для хранения кошелька
let wallet = null;

// Проверка состояния подключения при загрузке страницы
wallet = connector.wallet;
if (wallet) {
  console.log("Кошелёк уже подключён:", wallet.account.address);
}

// Подписка на изменения статуса подключения
connector.onStatusChange(async (walletInfo) => {
  if (walletInfo) {
    wallet = walletInfo;
    console.log("Кошелёк подключен:", wallet.account.address);
  } else {
    wallet = null;
    console.log("Кошелёк отключен");
  }
});

// mint button
async function mintNFT() {
  const status = document.getElementById("status");
  const descriptionInput = document.getElementById("nft-description");
  const mintButton = document.getElementById("mint-nft");
  mintButton.disabled = true;
  status.textContent = "Processing...";

  try {
    // Проверяем кошелёк
    if (!wallet) {
      alert("Сначала подключи кошелёк");
      return;
    }

    // Данные NFT
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
