<template>
  <q-page class="row items-center justify-evenly">
    <div class="column q-gutter-md items-center">
      <q-btn color="primary" label="Take Photo" @click="takePicture" />
      <q-btn color="secondary" label="Select Photo" @click="selectPhoto" />
      <q-btn color="accent" label="Check Permissions" @click="checkCameraPermissions" />

      <div v-if="permissionStatus" class="q-mt-md">
        <q-chip :color="permissionStatus.camera === 'granted' ? 'green' : 'red'" text-color="white">
          Camera: {{ permissionStatus.camera }}
        </q-chip>
        <q-chip
          :color="
            permissionStatus.photos === 'granted'
              ? 'green'
              : permissionStatus.photos === 'limited'
                ? 'orange'
                : 'red'
          "
          text-color="white"
        >
          Photos: {{ permissionStatus.photos }}
        </q-chip>
      </div>

      <img v-if="imageSrc" :src="imageSrc" style="max-width: 300px; border-radius: 8px" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Camera,
  CameraResultType,
  CameraSource,
  type Photo,
  type PermissionStatus,
} from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const imageSrc = ref<string>('')
const permissionStatus = ref<PermissionStatus | null>(null)

const ensurePermissions = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permissions = await Camera.checkPermissions()
      permissionStatus.value = permissions

      console.log('Current permissions:', permissions)

      // Check if we need to request permissions
      const needsCameraPermission = permissions.camera !== 'granted'
      const needsPhotosPermission =
        permissions.photos !== 'granted' && permissions.photos !== 'limited'

      if (needsCameraPermission || needsPhotosPermission) {
        $q.notify({
          message: 'Requesting camera permissions...',
          type: 'info',
          position: 'top',
        })

        try {
          permissions = await Camera.requestPermissions()
          permissionStatus.value = permissions
          console.log('Permissions after request:', permissions)
        } catch (requestError) {
          console.error('Error requesting permissions:', requestError)
          $q.notify({
            message: 'Failed to request camera permissions',
            type: 'negative',
            position: 'top',
          })
          return false
        }
      }

      // Check final permission status
      const cameraGranted = permissions.camera === 'granted'
      const photosGranted = permissions.photos === 'granted' || permissions.photos === 'limited'

      if (!cameraGranted || !photosGranted) {
        $q.notify({
          message: `Camera permissions required. Camera: ${permissions.camera}, Photos: ${permissions.photos}`,
          type: 'negative',
          position: 'top',
        })
        return false
      }

      // Show limited photos warning
      if (permissions.photos === 'limited') {
        $q.notify({
          message: 'Limited photo library access granted',
          type: 'warning',
          position: 'top',
        })
      }
    }

    return true // On web, permissions are handled automatically
  } catch (error) {
    console.error('Error in ensurePermissions:', error)
    $q.notify({
      message: `Error checking camera permissions: ${error as string}`,
      type: 'negative',
      position: 'top',
    })
    return false
  }
}

const checkCameraPermissions = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permissions = await Camera.checkPermissions()
      permissionStatus.value = permissions

      $q.notify({
        message: `Camera: ${permissions.camera}, Photos: ${permissions.photos}`,
        type: 'info',
        position: 'top',
      })
    } else {
      $q.notify({
        message: 'Running on web - permissions handled automatically',
        type: 'info',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error checking permissions:', error)
    $q.notify({
      message: 'Error checking permissions',
      type: 'negative',
      position: 'top',
    })
  }
}

const takePicture = async (): Promise<void> => {
  const hasPermissions = await ensurePermissions()

  if (!hasPermissions) {
    return
  }

  try {
    const image: Photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    })

    if (image.webPath) {
      imageSrc.value = image.webPath
      $q.notify({
        message: 'Photo captured successfully!',
        type: 'positive',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error taking photo:', error)
    $q.notify({
      message: 'Error taking photo',
      type: 'negative',
      position: 'top',
    })
  }
}

const selectPhoto = async (): Promise<void> => {
  const hasPermissions = await ensurePermissions()

  if (!hasPermissions) return

  try {
    const image: Photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    })

    if (image.webPath) {
      imageSrc.value = image.webPath
      $q.notify({
        message: 'Photo selected successfully!',
        type: 'positive',
        position: 'top',
      })
    }
  } catch (error) {
    console.error('Error selecting photo:', error)
    $q.notify({
      message: 'Error selecting photo',
      type: 'negative',
      position: 'top',
    })
  }
}
</script>
