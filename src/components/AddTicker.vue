<template>
  <div class="flex">
    <div class="max-w-xs">
      <label for="wallet" class="block text-sm font-medium text-gray-700"
      >Ticker</label
      >
      <div class="mt-1 relative rounded-md shadow-md">
        <input
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="DOGE"
            v-model="ticker"
            @keydown.enter="addTicker"
            @input="setSimilarTickers()"
        />
      </div>
      <div v-if="matchTicker.length" class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
        <template v-if="matchTicker.length < 5" v-for="(value, i) in matchTicker" :key="i">
                 <span @click="setSelectedTicker(matchTicker[i])"
                       class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
                {{ matchTicker[i] }}
                </span>
        </template>
        <template v-if="matchTicker.length > 4" v-for="(value, i) in [0,1,2,3]" :key="i">
                 <span @click="setSelectedTicker(matchTicker[i])"
                       class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
                {{ matchTicker[i] }}
                </span>
        </template>
      </div>
      <div v-if="error.length" class="text-sm text-red-600">{{ error }}</div>
    </div>
  </div>
  <button
      @click="addTicker"
      type="button"
      class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
  >
    <!-- Heroicon name: solid/mail -->
    <svg
        class="-ml-0.5 mr-2 h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="#ffffff"
    >
      <path
          d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      ></path>
    </svg>
    Add
  </button>
  <hr class="w-full border-t border-gray-600 my-4"/>
</template>

<script>
import {loadAllBinanceTickers, loadTickers} from "../Api.js";

export default {
  name: "AddTicker",
  props:{
    tickers:{
      type: Array,
      required: false,
      default: [],
    }
  },

  emits:{
    'add-ticker': ticker =>{
      return typeof ticker === 'object' && ticker?.name && ticker?.value;
    }
  },

  data() {
    return {
      ticker: '',
      error: '',
      matchTicker: [],
    }
  },

  methods: {
    addTicker() {
      if (!this.ticker.length) {
        return
      }

      try {
        this.validateTicker();
      } catch (e) {
        this.error = e.message;
        return
      }

      const currentTicker = {
        name: this.ticker,
        value: '-',
      };

      this.$emit('add-ticker', currentTicker);

      this.error = '';
      this.ticker = '';
      this.matchTicker = [];
    },

    setSelectedTicker(tickerName) {
      this.ticker = tickerName;
      this.addTicker();
    },

    setSimilarTickers() {
      this.error = '';

      if (!this.ticker.length) {
        this.matchTicker = [];
        return
      }

      const binanceTickers = JSON.parse(localStorage.getItem('binance-tickers-list'))
      this.matchTicker = binanceTickers.filter(ticker => {
        return ticker.toLowerCase().includes(this.ticker.toLowerCase());
      });
    },

    validateTicker() {
      if (this.tickers.filter(ticker => ticker.name.toLowerCase() === this.ticker.toLowerCase()).length) {
        throw new Error('Ticker is in list');
      }

      const ticketList = JSON.parse(localStorage.getItem('binance-tickers-list'));
      if (!ticketList.filter(name => name === this.ticker.toUpperCase()).length) {
        throw new Error('Ticker is not exist on binance');
      }
    }
  },

  created() {
    loadAllBinanceTickers().then(allBinanceTickers => {
      return allBinanceTickers.map(ticker => {
        if (ticker.symbol.includes('USDT')) {
          return ticker.symbol.slice(0, ticker.symbol.search('USDT'))
        }
      })
    }).then(allBinanceUsdtTickers => {
      const uniqUsdtTickers = new Set(allBinanceUsdtTickers);
      uniqUsdtTickers.delete(undefined);
      localStorage.setItem('binance-tickers-list', JSON.stringify([...uniqUsdtTickers]));
    });
  },
}
</script>

<style scoped>

</style>