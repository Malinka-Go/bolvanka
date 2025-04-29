<script>
    const connector = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: "https://yourdomain.com/tonconnect-manifest.json",
      buttonRootId: "ton-connect-button"
    });

    async function mintNFT() {
      const wallet = await connector.connectedWallet;
      if (!wallet) {
        alert("Сначала подключи кошелёк");
        return;
      }

      const Address = tonCore.Address;
      const beginCell = tonCore.beginCell;

      // Здесь подставь адрес своего смарт-контракта
      const contractAddress = "kQAIYlrr3UiMJ9fqI-B4j2nJdiiD7WzyaNL1MX_wiONc4F6o";

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
            amount: "0.1", // 0.01 TON
            payload: base64Payload
          }
        ]
      };

      try {
        await connector.sendTransaction(tx);
        alert("Транзакция на минт отправлена!");
      } catch (e) {
        console.error(e);
        alert("Ошибка при отправке транзакции.");
      }
    }
  </script>