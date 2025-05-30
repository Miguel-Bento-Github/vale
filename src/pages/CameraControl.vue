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
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const $q = useQuasar()
const { t } = useI18n()
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
          message: t('requestingCameraPermissions'),
          type: 'info',
          position: 'top',
          actions: [{ icon: 'close', color: 'white' }],
        })

        try {
          permissions = await Camera.requestPermissions()
          permissionStatus.value = permissions
          console.log('Permissions after request:', permissions)
        } catch (requestError) {
          console.error('Error requesting permissions:', requestError)
          $q.notify({
            message: t('permissionsFailed'),
            type: 'negative',
            position: 'top',
            actions: [{ icon: 'close', color: 'white' }],
          })
          return false
        }
      }

      // Check final permission status
      const cameraGranted = permissions.camera === 'granted'
      const photosGranted = permissions.photos === 'granted' || permissions.photos === 'limited'

      if (!cameraGranted || !photosGranted) {
        $q.notify({
          message: t('cameraPermissionsError', {
            camera: permissions.camera,
            photos: permissions.photos,
          }),
          type: 'negative',
          position: 'top',
          actions: [{ icon: 'close', color: 'white' }],
        })
        return false
      }

      // Show limited photos warning
      if (permissions.photos === 'limited') {
        $q.notify({
          message: t('limitedPhotoAccess'),
          type: 'warning',
          position: 'top',
          actions: [{ icon: 'close', color: 'white' }],
        })
      }
    }

    return true // On web, permissions are handled automatically
  } catch (error) {
    console.error('Error in ensurePermissions:', error)
    $q.notify({
      message: `${t('errorCheckingPermissions')}: ${error as string}`,
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
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
        message: t('cameraPermissionsStatus', {
          camera: permissions.camera,
          photos: permissions.photos,
        }),
        type: 'info',
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
      })
    } else {
      $q.notify({
        message: t('webPermissionsHandled'),
        type: 'info',
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
      })
    }
  } catch (error) {
    console.error('Error checking permissions:', error)
    $q.notify({
      message: t('errorCheckingPermissions'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
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
        message: t('photoTaken'),
        type: 'positive',
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
      })
    }
  } catch (error) {
    console.error('Error taking photo:', error)
    $q.notify({
      message: t('errorTakingPhoto'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
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
      $q.notify({
        message: t('photoSelected'),
        type: 'positive',
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
      })
    }
  } catch (error) {
    console.error('Error selecting photo:', error)
    $q.notify({
      message: t('errorSelectingPhoto'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
  }
}
</script>
