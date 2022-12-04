<template>
  <input
      type="text"
      :value="value"
      @input="$emit('update:value', $event.target.value)"
      class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"/>
</template>

<script>
export default {
  name: "MainInput",

  props: {
    value: {
      type: String,
    }
  },

  emits: ['update:value'],

}
</script>

<style scoped>

</style>