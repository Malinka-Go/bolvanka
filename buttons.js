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
  const button = document.getElementById("mint-button");
  const status = document.getElementById("mint-status");
  status.textContent = "";
  status.className = "status-message";
  button.classList.add("loading");

  try {
    // Проверяем кошелёк
    if (!wallet) {
      alert("Сначала подключи кошелёк");
      return;
    }

    // Данные NFT
    const description = document.getElementById("nft-description").value;
    const title = "My NFT";
    const imageUrl = "https://malinka-go.github.io/bolvanka/kub.png";

    const metadata = {
      title,
      description,
      image: imageUrl
    };

    const metadataJson = JSON.stringify(metadata);
    const metadataBytes = new TextEncoder().encode(metadataJson);

    const Address = tonCore.Address;
    const beginCell = tonCore.beginCell;

    const contractAddress = Address.parse("kQAIYlrr3UiMJ9fqI-B4j2nJdiiD7WzyaNL1MX_wiONc4F6o");

    const payload = beginCell()
      .storeUint(0x01, 32)
      .storeUint(0, 64)
      .storeAddress(Address.parse(wallet.account.address))
      // .storeBytes(metadataBytes) // позже активируем
      .endCell();

    const base64Payload = payload.toBoc().toString("base64");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: contractAddress,
          amount: "100000000",
          payload: base64Payload
        }
      ]
    };

    await connector.sendTransaction(tx);
    status.textContent = "Транзакция на минт отправлена!";
    status.classList.add("success");
  } catch (e) {
    console.error(e);
    status.textContent = "Ошибка при отправке транзакции.";
    status.classList.add("error");
  } finally {
    button.classList.remove("loading");
  }
}
