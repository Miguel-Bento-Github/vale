<template>
  <q-page class="row items-center justify-evenly">
    <div class="column q-gutter-md items-center">
      <!-- Geolocation Section -->
      <div class="q-pa-md">
        <h6 class="q-ma-none">{{ $t('gpsPosition') }}:</h6>
        <strong>
          <pre>{{ position ? position : 'determining...' }}</pre>
        </strong>
      </div>

      <!-- Geolocation Controls -->
      <div class="column q-gutter-md items-center">
        <q-btn color="primary" :label="$t('getCurrentPosition')" @click="getCurrentPosition" />
        <q-btn color="secondary" :label="$t('startWatching')" @click="startWatchingPosition" />
        <q-btn color="negative" :label="$t('stopWatching')" @click="stopWatchingPosition" />
        <q-btn
          color="accent"
          :label="$t('checkLocationPermissions')"
          @click="checkLocationPermissions"
        />

        <div v-if="permissionStatus" class="q-mt-md">
          <q-chip
            :color="permissionStatus.location === 'granted' ? 'green' : 'red'"
            text-color="white"
          >
            {{ $t('location') }}: {{ permissionStatus.location }}
          </q-chip>
          <q-chip
            :color="permissionStatus.coarseLocation === 'granted' ? 'green' : 'red'"
            text-color="white"
          >
            {{ $t('coarseLocation') }}: {{ permissionStatus.coarseLocation }}
          </q-chip>
        </div>

        <div v-if="isWatching" class="q-mt-md">
          <q-chip color="blue" text-color="white" icon="gps_fixed">
            {{ $t('watchingPosition') }}
          </q-chip>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Geolocation, type Position, type PermissionStatus } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const $q = useQuasar()
const { t } = useI18n()

const position = ref<Position>()
const permissionStatus = ref<PermissionStatus | null>(null)
const isWatching = ref<boolean>(false)

const ensureLocationPermissions = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permissions = await Geolocation.checkPermissions()
      permissionStatus.value = permissions

      if (permissions.location !== 'granted') {
        $q.notify({
          message: t('requestingLocationPermissions'),
          type: 'info',
          position: 'bottom',
          actions: [{ icon: 'close', color: 'white' }],
        })

        permissions = await Geolocation.requestPermissions()
        permissionStatus.value = permissions
      }

      if (permissions.location !== 'granted') {
        $q.notify({
          message: t('locationPermissionsRequired'),
          type: 'negative',
          position: 'top',
          actions: [{ icon: 'close', color: 'white' }],
        })
        return false
      }
    }

    // On web, permissions are handled automatically
    return true
  } catch (error) {
    console.error('Error checking location permissions:', error)
    $q.notify({
      message: t('errorCheckingLocationPermissions'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
    return false
  }
}

const checkLocationPermissions = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permissions = await Geolocation.checkPermissions()
      permissionStatus.value = permissions

      $q.notify({
        message: t('locationPermissionsStatus', {
          location: permissions.location,
          coarse: permissions.coarseLocation,
        }),
        type: 'info',
        position: 'bottom',
        actions: [{ icon: 'close', color: 'white' }],
      })
    } else {
      $q.notify({
        message: t('webPermissionsHandled'),
        type: 'info',
        position: 'bottom',
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

async function getCurrentPosition(): Promise<void> {
  const hasPermissions = await ensureLocationPermissions()

  if (!hasPermissions) {
    return
  }

  try {
    const newPosition = await Geolocation.getCurrentPosition()
    console.log('Current position:', newPosition)
    position.value = newPosition
    $q.notify({
      message: t('positionUpdated'),
      type: 'positive',
      position: 'bottom-right',
      actions: [{ icon: 'close', color: 'white' }],
    })
  } catch (error) {
    console.error('Error getting current position:', error)
    $q.notify({
      message: t('errorGettingPosition'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
  }
}

let watchId: string

const startWatchingPosition = async (): Promise<void> => {
  const hasPermissions = await ensureLocationPermissions()

  if (!hasPermissions) {
    return
  }

  if (isWatching.value) {
    $q.notify({
      message: t('alreadyWatching'),
      type: 'warning',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
    return
  }

  try {
    watchId = await Geolocation.watchPosition({}, (newPosition, err) => {
      console.log('New GPS position')
      if (newPosition) {
        position.value = newPosition
        $q.notify({
          message: t('positionUpdate'),
          type: 'positive',
          position: 'bottom-right',
          timeout: 1000,
          actions: [{ icon: 'close', color: 'white' }],
        })
      }
      if (err) {
        console.error('Watch position error:', err)
        $q.notify({
          message: t('errorWatchingPosition'),
          type: 'negative',
          position: 'top',
          actions: [{ icon: 'close', color: 'white' }],
        })
      }
    })

    isWatching.value = true
    $q.notify({
      message: t('startedWatching'),
      type: 'info',
      position: 'bottom',
      actions: [{ icon: 'close', color: 'white' }],
    })
  } catch (error) {
    console.error('Error setting up watch position:', error)
    $q.notify({
      message: t('errorSetupWatching'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
  }
}

const stopWatchingPosition = async (): Promise<void> => {
  if (!isWatching.value || !watchId) {
    $q.notify({
      message: t('notWatching'),
      type: 'warning',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
    return
  }

  try {
    await Geolocation.clearWatch({ id: watchId })
    isWatching.value = false
    $q.notify({
      message: t('stoppedWatching'),
      type: 'info',
      position: 'bottom',
      actions: [{ icon: 'close', color: 'white' }],
    })
  } catch (error) {
    console.error('Error stopping watch position:', error)
    $q.notify({
      message: t('errorStoppingWatch'),
      type: 'negative',
      position: 'top',
      actions: [{ icon: 'close', color: 'white' }],
    })
  }
}

onMounted(async () => {
  await getCurrentPosition()
  await startWatchingPosition()
})

onBeforeUnmount(async () => {
  await stopWatchingPosition()
})
</script>
