<script setup lang="ts">
import { storeIndex, toggleDark } from '~/logic/state'

const config = useRuntimeConfig()
const buildTime = useTimeAgo(config.public.buildTime as any)
</script>

<template>
  <div flex="~ justify-center" px3 py4 lg:p10 lg:py10>
    <div flex="~ col gap-4" class="max-w-full min-h-[calc(100vh-100px)] w-250">
      <div fixed right-5 top-14 flex="col gap-2" hidden xl:flex>
        <VTooltip v-for="n in 10" :key="n" placement="left" distance="10">
          <button
            :style="{
              opacity: storeIndex === n ? 1 : 1 - (Math.abs(storeIndex - n) + 2) * 0.18,
              transform: storeIndex === n ? 'scale(1.1)' : 'scale(0.95)',
            }"
            class="hover:op100!"
            h-8 w-8 transition-all duration-300 icon-button @click="storeIndex = n"
          >
            {{ n }}
          </button>
          <template #popper>
            <div text-sm>
              Save slot {{ n }}
            </div>
          </template>
        </VTooltip>
      </div>

      <StateProvider :key="storeIndex" :index="storeIndex" />

      <div flex-auto />

      <div my4 h-1px border="t base" w-10 />

      <div flex="~ gap-3 items-center">
        <button op50 hover:op100 @click="toggleDark()">
          <div i-ri-sun-fill dark:i-ri-moon-fill />
        </button>
        <div flex="~ gap-1 items-center" ml-3>
          <span op35>Made with </span> <a mt--2 href="https://nuxt.com" target="_blank" flex="~ inline gap-1 items-center" translate-y-0.9 op75 hover:op100><div i-logos-nuxt-icon /> <span font-bold op65>Nuxt</span></a><br>
        </div>
      </div>
    </div>
  </div>
</template>
