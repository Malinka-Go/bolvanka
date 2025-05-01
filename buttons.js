// tonconnect button
window.connector = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://malinka-go.github.io/bolvanka/tonconnect-manifest.json",
  buttonRootId: "ton-connect-button"
});
// mint button
async function mintNFT() {
  const button = document.getElementById("mint-button");
  const status = document.getElementById("mint-status");
  status.textContent = "";
  status.className = "status-message";
  button.classList.add("loading");

  try {
    const connector = window.connector;
    const wallet = await connector.connectedWallet;  
    if (!wallet) {
      alert("Сначала подключи кошелёк");
      return;
    }
    
   // Получаем данные из формы
   const description = document.getElementById("nft-description").value;
   const imageUrl = "https://malinka-go.github.io/bolvanka/kub.png"; // пока фиксированная картинка
   
   const metadata = {
     title,
     description,
     image: imageUrl
   };

   // Преобразуем метаданные в JSON
  const metadataJson = JSON.stringify(metadata);
  const metadataBytes = new TextEncoder().encode(metadataJson);

    const Address = tonCore.Address;
    const beginCell = tonCore.beginCell;

    // Здесь подставь адрес своего смарт-контракта
    const contractAddress = Address.parse("kQAIYlrr3UiMJ9fqI-B4j2nJdiiD7WzyaNL1MX_wiONc4F6o");
   // Здесь — логика формирования payload под твой контракт
    const payload = beginCell()
      .storeUint(0x01, 32)              // Пример: op код "mint"
      .storeUint(0, 64)                 // query_id
      .storeAddress(Address.parse(wallet.account.address)) // кому минтить
      .endCell();

    const base64Payload = payload.toBoc().toString("base64");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: contractAddress,
          amount: "100000000", // nanoton = 0.01 TON
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