<template>
  <div>
    <q-btn color="primary" label="Get Picture" @click="captureImage" />

    <img :src="imageSrc">
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Camera, CameraResultType, type Photo } from '@capacitor/camera'

const imageSrc = ref<string>('')

async function captureImage(): Promise<void> {
  try {
    const image: Photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri
    })

    // The result will vary on the value of the resultType option.
    // CameraResultType.Uri - Get the result from image.webPath
    // CameraResultType.Base64 - Get the result from image.base64String
    // CameraResultType.DataUrl - Get the result from image.dataUrl
    if (image.webPath) {
      imageSrc.value = image.webPath
    }
  } catch (error) {
    console.error('Error capturing image:', error)
  }
}
</script>