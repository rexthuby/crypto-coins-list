export {loadTickers, loadAllBinanceTickers}

function loadTickers(tickersName) {
    const tickers = tickersName.map(tickerName => "\""+ tickerName.toUpperCase()+'USDT'+"\"").join(',');
    return fetch(`https://api.binance.com/api/v3/ticker/price?symbols=[${tickers}]`)
        .then(res => res.json());
}

function loadAllBinanceTickers() {
    return fetch(`https://api.binance.com/api/v3/ticker/price`)
        .then(res => res.json());
}