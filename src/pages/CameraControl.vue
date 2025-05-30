<template>
  <q-page class="row items-center justify-evenly">
    <div class="column q-gutter-md items-center">
      <q-btn color="primary" :label="$t('takePhoto')" @click="takePicture" />
      <q-btn color="secondary" :label="$t('selectPhoto')" @click="selectPhoto" />
      <q-btn color="accent" :label="$t('checkPermissions')" @click="checkCameraPermissions" />

      <div v-if="permissionStatus" class="q-mt-md">
        <q-btn :color="permissionStatus.camera === 'granted' ? 'green' : 'red'" text-color="white">
          {{ $t('camera') }}: {{ permissionStatus.camera }}
        </q-btn>
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
          {{ $t('photos') }}: {{ permissionStatus.photos }}
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
import { useNotifications } from '../composables/useNotifications'

const { showError, showWarning, showInfo, showSuccess } = useNotifications()
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
        showInfo('requestingCameraPermissions')

        try {
          permissions = await Camera.requestPermissions()
          permissionStatus.value = permissions
          console.log('Permissions after request:', permissions)
        } catch (requestError) {
          console.error('Error requesting permissions:', requestError)
          showError('permissionsFailed')
          return false
        }
      }

      // Check final permission status
      const cameraGranted = permissions.camera === 'granted'
      const photosGranted = permissions.photos === 'granted' || permissions.photos === 'limited'

      if (!cameraGranted || !photosGranted) {
        showError('cameraPermissionsError', {
          camera: permissions.camera,
          photos: permissions.photos,
        })
        return false
      }

      // Show limited photos warning
      if (permissions.photos === 'limited') {
        showWarning('limitedPhotoAccess')
      }
    }

    return true // On web, permissions are handled automatically
  } catch (error) {
    console.error('Error in ensurePermissions:', error)
    showError('errorCheckingPermissions')
    return false
  }
}

const checkCameraPermissions = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permissions = await Camera.checkPermissions()
      permissionStatus.value = permissions

      showInfo('cameraPermissionsStatus', {
        camera: permissions.camera,
        photos: permissions.photos,
      })
    } else {
      showInfo('webPermissionsHandled')
    }
  } catch (error) {
    console.error('Error checking permissions:', error)
    showError('errorCheckingPermissions')
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
      showSuccess('photoTaken')
    }
  } catch (error) {
    console.error('Error taking photo:', error)
    showError('errorTakingPhoto')
  }
}

const selectPhoto = async (): Promise<void> => {
  const hasPermissions = await ensurePermissions()

  if (!hasPermissions) {
    return
  }

  try {
    const image: Photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    })

    if (image.webPath) {
      imageSrc.value = image.webPath
      showSuccess('photoSelected')
    }
  } catch (error) {
    console.error('Error selecting photo:', error)
    showError('errorSelectingPhoto')
  }
}
</script>
