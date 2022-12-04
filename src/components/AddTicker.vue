<template>
  <section aria-labelledby="add and validate ticker">
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
        >Ticker</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <main-input name="wallet"
                      id="wallet"
                      placeholder="DOGE"
                      v-model:value="ticker"
                      @update:value="setSimilarTickers()"
                      @keydown.enter="addTicker"/>
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
    <black-button @click="addTicker">
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
    </black-button>
    <hr class="w-full border-t border-gray-600 my-4"/>
  </section>
</template>

<script>
import {loadAllBinanceTickers} from "../Api.js";
import BlackButton from "./BlackButton.vue";
import MainInput from "./MainInput.vue";

export default {
  name: "AddTicker",
  components: {BlackButton, MainInput},
  props: {
    tickers: {
      type: Array,
      required: false,
      default: [],
    }
  },

  emits: {
    'add-ticker': ticker => {
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