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
import { useNotifications } from '../composables/useNotifications'

const { showError, showWarning, showInfo, showSuccess } = useNotifications()

const position = ref<Position>()
const permissionStatus = ref<PermissionStatus | null>(null)
const isWatching = ref<boolean>(false)

const ensureLocationPermissions = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permissions = await Geolocation.checkPermissions()
      permissionStatus.value = permissions

      if (permissions.location !== 'granted') {
        showInfo('requestingLocationPermissions')

        permissions = await Geolocation.requestPermissions()
        permissionStatus.value = permissions
      }

      if (permissions.location !== 'granted') {
        showError('locationPermissionsRequired')
        return false
      }
    }

    // On web, permissions are handled automatically
    return true
  } catch (error) {
    console.error('Error checking location permissions:', error)
    showError('errorCheckingLocationPermissions')
    return false
  }
}

const checkLocationPermissions = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permissions = await Geolocation.checkPermissions()
      permissionStatus.value = permissions

      showInfo('locationPermissionsStatus', {
        location: permissions.location,
        coarse: permissions.coarseLocation,
      })
    } else {
      showInfo('webPermissionsHandled')
    }
  } catch (error) {
    console.error('Error checking permissions:', error)
    showError('errorCheckingPermissions')
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
    showSuccess('positionUpdated')
  } catch (error) {
    console.error('Error getting current position:', error)
    showError('errorGettingPosition')
  }
}

let watchId: string

const startWatchingPosition = async (): Promise<void> => {
  const hasPermissions = await ensureLocationPermissions()

  if (!hasPermissions) {
    return
  }

  if (isWatching.value) {
    showWarning('alreadyWatching')
    return
  }

  try {
    watchId = await Geolocation.watchPosition({}, (newPosition, err) => {
      console.log('New GPS position')
      if (newPosition) {
        position.value = newPosition
        showSuccess('positionUpdate', undefined, { timeout: 1000 })
      }
      if (err) {
        console.error('Watch position error:', err)
        showError('errorWatchingPosition')
      }
    })

    isWatching.value = true
    showInfo('startedWatching')
  } catch (error) {
    console.error('Error setting up watch position:', error)
    showError('errorSetupWatching')
  }
}

const stopWatchingPosition = async (): Promise<void> => {
  if (!isWatching.value || !watchId) {
    showWarning('notWatching')
    return
  }

  try {
    await Geolocation.clearWatch({ id: watchId })
    isWatching.value = false
    showInfo('stoppedWatching')
  } catch (error) {
    console.error('Error stopping watch position:', error)
    showError('errorStoppingWatch')
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
