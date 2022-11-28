<script>
import {loadAllBinanceTickers, loadTickers} from "./Api.js";

export default {
  name: 'App',
  data() {
    return {
      ticker: '',
      tickers: [],
      selectedTicker: null,
      graph: [],
      error: '',
      matchTicker: [],
      filter: '',
      page: 1,
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

      this.tickers = [...this.tickers, currentTicker];

      this.filter = '';
      this.error = '';
      this.ticker = '';
      this.matchTicker = [];
    },

    deleteTicker(deleteTicker) {
      this.tickers = this.tickers.filter(ticker => ticker !== deleteTicker);

      if (deleteTicker === this.selectedTicker) {
        this.selectedTicker = null;
      }

    },

    setSelectedTicker(tickerName) {
      this.ticker = tickerName;
      this.addTicker();
    },

    formatPrice(price){
      return price > 1 ?
          price.toFixed(2) :
          price.toPrecision(2);
    },

    updateGraphPrices(ticker){
      if (this.selectedTicker?.name === ticker.name) {
        this.graph.push(ticker.value);
        this.normalizeGraphsBarAmount();
      }
    },

    async subscribeToUpdateTickers() {

      if (this.tickers.length === 0) {
        return
      }

      const binanceTickersData = await loadTickers(this.tickers.map(ticker => ticker.name));

      if (binanceTickersData === undefined) {
        return
      }

      this.tickers.forEach(ticker => {
        const binanceTicker = binanceTickersData.filter(binanceTicker => {
          return binanceTicker.symbol === ticker.name.toUpperCase() + 'USDT'
        })[0];

        if (binanceTicker === undefined) {
          return
        }

        ticker.value = this.formatPrice(parseFloat(binanceTicker.price));

        this.updateGraphPrices(ticker);
      });
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
    },

    normalizeGraphsBarAmount(){
      if (!this.selectedTicker){
        return
      }
      const divWidth = this.$refs.graph.clientWidth;
      console.log(divWidth, this.graphsBarMinWidth);
      while (divWidth/this.graphsBarMinWidth < this.graph.length) {
        this.graph.shift();
      }
    }
  },

  computed: {
    endTickerIndex() {
      const tickersByPage = 6
      return tickersByPage * this.page;
    },

    startTickerIndex() {
      const tickersByPage = 6
      return this.page > 1 ? (this.page - 1) * tickersByPage : 0;
    },

    filtredTickers() {
      return this.tickers.filter(ticker => ticker.name.includes(this.filter.toUpperCase()));
    },

    hasNextPage() {
      return this.filtredTickers.length > this.endTickerIndex;
    },

    normalizedGraph() {
      const maxValue = Math.max(...this.graph);
      const minValue = Math.min(...this.graph);

      if (maxValue === minValue) {
        return this.graph.map(price => 50);
      }
      return this.graph.map(price => 2 + ((price - minValue) * 98) / (maxValue - minValue));
    },

    filtredTickersOnPage() {
      return this.filtredTickers.slice(this.startTickerIndex, this.endTickerIndex);
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      }
    },

    graphsBarMinWidth(){
      return 15
    }
  },

  watch: {
    pageStateOptions(newValue) {
      window.history.pushState(
          null,
          document.title,
          `${window.location.origin}/?filter=${newValue.filter}&page=${newValue.page}`
      );
    },

    filtredTickersOnPage() {
      if (this.filtredTickersOnPage.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    selectedTicker() {
      this.graph = [];
    },

    tickers() {
      localStorage.setItem('tickers-list', JSON.stringify(this.tickers.map(t => {
        return {
          name: t.name,
          value: '-'
        }
      })));
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

    const savedTickers = JSON.parse(localStorage.getItem('tickers-list'));

    if (savedTickers) {
      this.tickers = savedTickers;
    }

    const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());

    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = windowData.page;
    }

    setInterval(this.subscribeToUpdateTickers, 5000);
  },

  mounted() {
    window.addEventListener('resize', this.normalizeGraphsBarAmount);
  },

  beforeUnmount() {
    window.removeEventListener('resize');
  },
}
</script>

<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <section>
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
        <div class="flex">
          <div class="max-w-xs">
            <div class="flex flex-col">
              <label for="filter" class="block text-sm font-medium text-gray-700">Filter</label>
              <div class="mt-1 relative rounded-md shadow-md">
                <input
                    type="text"
                    name="filter"
                    id="filter"
                    v-model="filter"
                    class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"/>
              </div>
              <div>
                <button
                    v-if="page > 1"
                    @click="page = page -1"
                    class="my-4 mr-2 inline-flex items-center py-2 px-4  border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  Back
                </button>
                <button
                    v-if="hasNextPage"
                    @click="page = page + 1"
                    class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4"/>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div v-for="(ticker, index) in filtredTickersOnPage" :key="ticker.name"
               @click="this.selectedTicker = ticker"
               :class="{
                  'border-purple-800': selectedTicker === ticker
               }"
               class="bg-white overflow-hidden shadow rounded-lg  border-solid border-4 cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ ticker.name.toUpperCase() }}/USDT
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ ticker.value }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
                @click.stop="deleteTicker(ticker)"
                class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#718096"
                  aria-hidden="true"
              >
                <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                ></path>
              </svg>
              Delete
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4"/>
        <section v-show="selectedTicker != null" class="relative">
          <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
            {{ selectedTicker?.name.toUpperCase() }}/USD
          </h3>
          <div class="flex items-end border-gray-600 border-b border-l h-64" ref="graph">
            <div
                v-for="(bar, index) in normalizedGraph"
                :key="index"
                :style="{
                  height: `${bar}%`,
                  minWidth: `${graphsBarMinWidth}px`,
                }"
                class="bg-purple-800 border w-10"
            ></div>
            <button
                @click="selectedTicker = null"
                type="button"
                class="absolute top-0 right-0"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  width="30"
                  height="30"
                  x="0"
                  y="0"
                  viewBox="0 0 511.76 511.76"
                  style="enable-background:new 0 0 512 512"
                  xml:space="preserve"
              >
          <g>
            <path
                d="M436.896,74.869c-99.84-99.819-262.208-99.819-362.048,0c-99.797,99.819-99.797,262.229,0,362.048    c49.92,49.899,115.477,74.837,181.035,74.837s131.093-24.939,181.013-74.837C536.715,337.099,536.715,174.688,436.896,74.869z     M361.461,331.317c8.341,8.341,8.341,21.824,0,30.165c-4.16,4.16-9.621,6.251-15.083,6.251c-5.461,0-10.923-2.091-15.083-6.251    l-75.413-75.435l-75.392,75.413c-4.181,4.16-9.643,6.251-15.083,6.251c-5.461,0-10.923-2.091-15.083-6.251    c-8.341-8.341-8.341-21.845,0-30.165l75.392-75.413l-75.413-75.413c-8.341-8.341-8.341-21.845,0-30.165    c8.32-8.341,21.824-8.341,30.165,0l75.413,75.413l75.413-75.413c8.341-8.341,21.824-8.341,30.165,0    c8.341,8.32,8.341,21.824,0,30.165l-75.413,75.413L361.461,331.317z"
                fill="#718096"
                data-original="#000000"
            ></path>
          </g>
        </svg>
            </button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style>

</style>
