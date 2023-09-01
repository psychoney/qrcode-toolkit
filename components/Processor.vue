<!-- eslint-disable prefer-template -->
<!-- eslint-disable no-import-assign -->
<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { ScanResult } from 'qr-scanner-wechat'
import { ready } from 'qr-scanner-wechat'
import { SelfBuildingSquareSpinner } from 'epic-spinners'
import { v4 as uuidv4 } from 'uuid'
import { sendParentEvent } from '~/logic/messaging'
import type { State } from '~/logic/types'
import { dataUrlProcessed, dataUrlProcessorUpload } from '~/logic/state'
import { view } from '~/logic/view'

const props = defineProps<{
  state: State
}>()

const state = computed(() => props.state.processor)

const result = ref<ScanResult>()
const reading = ref(false)
const loading = ref(true)
const error = ref<any>()
const generating = ref(false)

const dimension = ref<{
  upload?: {
    width: number
    height: number
  }
  processed?: {
    width: number
    height: number
  }
}>({})

onMounted(() => {
  ready()
    .then(() => {
      loading.value = false
      console.log('Processor loaded')
    })
    .catch((e) => {
      error.value = e
      console.error(e)
    })
})

function clear() {
  error.value = null
  reading.value = false
  result.value = undefined
}

const image = ref<HTMLImageElement>()

async function loadImage() {
  image.value = undefined
  if (dataUrlProcessorUpload.value) {
    const img = new Image()
    const promise = new Promise(resolve => img.onload = resolve)
    img.src = dataUrlProcessorUpload.value
    await promise
    image.value = img
    dimension.value.upload = {
      width: img.width,
      height: img.height,
    }
  }
  else {
    dimension.value.upload = undefined
  }
}

function verify() {
  sendParentEvent('setScannerImage', dataUrlProcessed.value!)
  view.value = 'verify'
}

function compare() {
  const data = {
    image: dataUrlProcessed.value!,
    qrcode: dataUrlProcessorUpload.value!,
  }
  sendParentEvent('setCompareImage', data)
  view.value = 'compare'
}

function download() {
  const a = document.createElement('a')
  a.href = dataUrlProcessed.value!
  a.download = `${uuidv4()}.png`
  a.click()
}

function regenerate() {
  dataUrlProcessed.value = ''
  generate()
}

async function generate() {
  if (!dataUrlProcessorUpload.value)
    return
  generating.value = true

  const response = await fetch('http://0.0.0.0:5030/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: dataUrlProcessorUpload.value,
      prompt: state.value.prompt,
    }),
  })
  const imageBase64 = await response.json()
  dataUrlProcessed.value = imageBase64
  // await sleep(3000)
  // dataUrlProcessed.value =''

  generating.value = false
  const img = new Image()
  img.onload = function () {
    dimension.value.processed = {
      width: img.width,
      height: img.height,
    }
  }
  img.src = dataUrlProcessed.value!
}

watch(
  () => dataUrlProcessorUpload.value,
  async () => {
    await loadImage()
  },
  { immediate: true },
)

const { isOverDropZone } = useDropZone(document.body, {
  onDrop(files) {
    if (view.value !== 'verify')
      return
    if (!files)
      return

    const file = files[0]
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        dataUrlProcessorUpload.value = data
      }
      reader.readAsDataURL(file)
    }
  },
})
</script>

<template>
  <SafariWarning />
  <div flex="~ col gap-3">
    <div grid="~ cols-2 gap-2" mt8>
      <div text-center text-sm op50>
        Upload
      </div>
      <div text-center text-sm op50>
        Processed
      </div>
      <ImageDrop
        v-model="dataUrlProcessorUpload"
        title="QRCode"
        h-auto w-full
        @update:model-value="clear()"
      />
      <div border="~ base rounded" :class="dataUrlProcessorUpload ? '' : 'op50'" position-relative aspect-ratio-1 h-full w-full flex>
        <!-- Spinner -->
        <div v-if="generating" class="absolute inset-0 z-20 flex items-center justify-center">
          <SelfBuildingSquareSpinner
            :animation-duration="6000"
            :size="100"
            color="#ff1d5e"
          />
        </div>

        <!-- Original Image -->
        <img v-if="dataUrlProcessed" :src="dataUrlProcessed" alt="Processed Image" class="h-full w-full object-contain">

        <!-- Prohibited Icon -->
        <div v-if="!dataUrlProcessorUpload" i-ri-prohibited-line ma text-4xl op20 />
      </div>
      <div text-center text-xs font-mono op50>
        {{ dimension.upload ? `${Math.round(dimension.upload.width)}x${Math.round(dimension.upload.height)}` : '' }}
      </div>
      <div text-center text-xs font-mono op50>
        {{ dimension.processed ? `${Math.round(dimension.processed.width)}x${Math.round(dimension.processed.height)}` : '' }}
      </div>
    </div>

    <template v-if="dataUrlProcessorUpload">
      <div border="~ base rounded" flex="~ col gap-2" p4>
        <OptionItem title="Prompt" description="Enter prompt">
          <textarea v-model="state.prompt" placeholder="Enter prompt" style="width: 100%; resize: vertical;" />
          <div flex-auto />
        </OptionItem>
      </div>
      <div flex="~ gap-2 items-center wrap">
        <button
          text-sm op75 text-button hover:op100
          :disabled="generating"
          @click="generate()"
        >
          <div i-ri-refresh-line />
          Generate
        </button>
        <button
          text-sm op75 text-button hover:op100
          :disabled="generating"
          @click="download()"
        >
          <div i-ri-download-line />
          Download
        </button>
        <button
          text-sm op75 text-button hover:op100
          :disabled="generating"
          @click="verify()"
        >
          <div i-ri-qr-scan-2-line />
          Verify
        </button>
        <button
          text-sm op75 text-button hover:op100
          :disabled="generating"
          @click="compare()"
        >
          <div i-ri-compasses-2-line />
          Compare
        </button>
        <button
          text-sm op75 text-button hover:op100
          :disabled="generating"
          @click="regenerate()"
        >
          <div i-ri-refresh-line />
          Regenerate
        </button>
      </div>
    </template>

    <div v-if="isOverDropZone" fixed bottom-0 left-0 right-0 top-0 z-200 flex bg-black:20 backdrop-blur-10>
      <div
        id="upload-zone-qrcode" flex="~ col gap-3 items-center justify-center" m10 ml-1 w-full op40
        border="3 dashed transparent rounded-xl"
      >
        <div i-carbon-qr-code text-20 />
        <div text-xl>
          Generate Image
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.position-relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.z-20 {
  z-index: 20;
}
</style>
