<script>
import {loadAllBinanceTickers, loadTickers} from "./Api.js";
import AddTicker from "./components/AddTicker.vue";
import TickerGraph from "./components/GraphOfNumbers.vue";
import BlackButton from "./components/BlackButton.vue";
import MainInput from "./components/MainInput.vue";

export default {
  name: 'App',
  components: {BlackButton, TickerGraph, AddTicker, MainInput},
  data() {
    return {
      tickers: [],
      selectedTicker: null,
      graph: [],
      filter: '',
      page: 1,
    }
  },

  tickersByPage: 6,
  graphsBarMinWidth: 15, //width in px

  methods: {
    addTicker(ticker) {
      this.tickers = [...this.tickers, ticker];
    },

    deleteTicker(deleteTicker) {
      this.tickers = this.tickers.filter(ticker => ticker !== deleteTicker);

      if (deleteTicker === this.selectedTicker) {
        this.selectedTicker = null;
      }
    },

    formatPrice(price) {
      if (price > 5000) {
        return price.toFixed(1);
      } else if (price > 10) {
        return price.toFixed(2);
      } else if (price > 1) {
        return price.toFixed(3);
      } else if (price > 0.1) {
        return price.toFixed(4);
      } else if (price <= 0.1) {
        return price.toPrecision(5);
      }
    },

    updateGraphPrices(ticker) {
      if (this.selectedTicker?.name === ticker.name) {
        this.graph.push(ticker.value);
        this.normalizeGraphsBarAmount();
      }
    },

    updateTickersPrices(binanceTickersData) {
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

    async subscribeToUpdateTickers() {

      if (this.tickers.length === 0) {
        return
      }

      const binanceTickersData = await loadTickers(this.tickers.map(ticker => ticker.name));

      if (binanceTickersData === undefined) {
        return
      }

      this.updateTickersPrices(binanceTickersData);
    },

    normalizeGraphsBarAmount() {
      if (!this.selectedTicker) {
        return
      }
      const divWidth = this.$refs.graph.clientWidth;
      const maxGraphsBarAmount = divWidth / this.$options.graphsBarMinWidth;
      if (maxGraphsBarAmount < this.graph.length) {
        this.graph = this.graph.slice(this.graph.length - maxGraphsBarAmount, this.graph.length)
      }
    }
  },

  computed: {
    startTickerIndex() {
      return this.page > 1 ? (this.page - 1) * this.$options.tickersByPage : 0;
    },

    endTickerIndex() {
      return this.$options.tickersByPage * this.page;
    },

    filteredTickers() {
      return this.tickers.filter(ticker => ticker.name.includes(this.filter.toUpperCase()));
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endTickerIndex;
    },

    filteredTickersOnPage() {
      return this.filteredTickers.slice(this.startTickerIndex, this.endTickerIndex);
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      }
    },
  },

  watch: {
    pageStateOptions(newValue) {
      window.history.pushState(
          null,
          document.title,
          `${window.location.origin}/?filter=${newValue.filter}&page=${newValue.page}`
      );
    },

    filteredTickersOnPage() {
      if (this.filteredTickersOnPage.length === 0 && this.page > 1) {
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

    setInterval(this.subscribeToUpdateTickers, 1000);
  },

  mounted() {
    window.addEventListener('resize', this.normalizeGraphsBarAmount);
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.normalizeGraphsBarAmount);
  },
}
</script>

<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <section aria-label="tickers control panel">
        <add-ticker :tickers="tickers" @add-ticker="addTicker"/>
        <div class="flex">
          <div class="max-w-xs">
            <div class="flex flex-col">
              <label for="filter" class="block text-sm font-medium text-gray-700">Filter</label>
              <div class="mt-1 relative rounded-md shadow-md">
                <main-input v-model:value="filter" name="filter" id="filter"/>
              </div>
              <div>
                <black-button v-if="page > 1" @click="page = page -1">
                  Back
                </black-button>
                <black-button v-if="hasNextPage" @click="page = page + 1">
                  Next
                </black-button>
              </div>
            </div>
          </div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4"/>
      </section>
      <section aria-label="list of tickers">
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div v-for="(ticker, index) in filteredTickersOnPage" :key="ticker.name"
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
      </section>
      <section aria-label="graph" v-if="selectedTicker != null" class="relative" ref="graph">
        <ticker-graph @close="selectedTicker = null" :numbers="graph" :graph-name="selectedTicker.name"/>
      </section>
    </div>
  </div>
</template>

<style>

</style>
