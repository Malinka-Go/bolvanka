const connector = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://malinka-go.github.io/bolvanka/tonconnect-manifest.json",
  buttonRootId: "ton-connect-button"
});

window.connector = connector;

let wallet = null;

wallet = connector.wallet;
if (wallet) {
  console.log("Кошелёк уже подключён:", wallet.account.address);
}

connector.onStatusChange(async (walletInfo) => {
  if (walletInfo) {
    wallet = walletInfo;
    console.log("Кошелёк подключен:", wallet.account.address);
  } else {
    wallet = null;
    console.log("Кошелёк отключен");
  }
});

async function mintNFT() {
  const button = document.getElementById("mint-button");
  const status = document.getElementById("mint-status");
  const descriptionInput = document.getElementById("nft-description");
  status.textContent = "";
  status.className = "status-message";
  button.classList.add("loading");

  try {
    if (!wallet) {
      throw new Error("Сначала подключи кошелёк");
    }

    const description = descriptionInput.value.trim();
    if (description.length === 0) {
      throw new Error("Введите описание");
    }
    const descriptionBytes = new TextEncoder().encode(description);
    if (descriptionBytes.length > 1023) {
      throw new Error("Описание не должно превышать 1023 байт");
    }

    const metadata = {
      name: "My NFT",
      description,
      image: "https://malinka-go.github.io/bridgeoflove/nft.jpg"
    };

    const metadataJson = `data:application/json,${JSON.stringify(metadata)}`;
    const metadataCell = beginCell().storeStringTail(metadataJson).endCell();

    const Address = tonCore.Address;
    const beginCell = tonCore.beginCell;

    const contractAddress = Address.parse("EQACgCMeKWFmW1Diojb1q8Nw1cRC9zlHBjWgbpwabjIK_mrg");

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
    status.textContent = "Транзакция на минт отправлена!";
    status.classList.add("success");
  } catch (e) {
    console.error(e);
    status.textContent = e.message || "Ошибка при отправке транзакции.";
    status.classList.add("error");
  } finally {
    button.classList.remove("loading");
  }
}