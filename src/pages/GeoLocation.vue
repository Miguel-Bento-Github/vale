<template>
  <q-page class="row items-center justify-evenly">
    <div class="column q-gutter-md items-center">
      <!-- Geolocation Section -->
      <div class="q-pa-md">
        <h6 class="q-ma-none">GPS Position:</h6>
        <strong>
          <pre>{{ position ? position : 'determining...' }}</pre>
        </strong>
      </div>

      <!-- Geolocation Controls -->
      <div class="column q-gutter-md items-center">
        <q-btn color="primary" label="Get Current Position" @click="getCurrentPosition" />
        <q-btn color="secondary" label="Start Watching Position" @click="startWatchingPosition" />
        <q-btn color="negative" label="Stop Watching Position" @click="stopWatchingPosition" />
        <q-btn
          color="accent"
          label="Check Location Permissions"
          @click="checkLocationPermissions"
        />

        <div v-if="permissionStatus" class="q-mt-md">
          <q-chip
            :color="permissionStatus.location === 'granted' ? 'green' : 'red'"
            text-color="white"
          >
            Location: {{ permissionStatus.location }}
          </q-chip>
          <q-chip
            :color="permissionStatus.coarseLocation === 'granted' ? 'green' : 'red'"
            text-color="white"
          >
            Coarse Location: {{ permissionStatus.coarseLocation }}
          </q-chip>
        </div>

        <div v-if="isWatching" class="q-mt-md">
          <q-chip color="blue" text-color="white" icon="gps_fixed"> Watching Position </q-chip>
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

const $q = useQuasar()

// Geolocation refs
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
          message: 'Requesting location permissions...',
          type: 'info',
          position: 'top',
        })

        permissions = await Geolocation.requestPermissions()
        permissionStatus.value = permissions
      }

      if (permissions.location !== 'granted') {
        $q.notify({
          message: 'Location permissions are required to use this feature',
          type: 'negative',
          position: 'top',
        })
        return false
      }
    }

    // On web, permissions are handled automatically
    return true
  } catch (error) {
    console.error('Error checking location permissions:', error)
    $q.notify({
      message: 'Error checking location permissions',
      type: 'negative',
      position: 'top',
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
        message: `Location: ${permissions.location}, Coarse: ${permissions.coarseLocation}`,
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

// Geolocation functions
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
      message: 'GPS position updated successfully!',
      type: 'positive',
      position: 'top',
    })
  } catch (error) {
    console.error('Error getting current position:', error)
    $q.notify({
      message: 'Error getting GPS position',
      type: 'negative',
      position: 'top',
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
      message: 'Already watching position',
      type: 'warning',
      position: 'top',
    })
    return
  }

  try {
    watchId = await Geolocation.watchPosition({}, (newPosition, err) => {
      console.log('New GPS position')
      if (newPosition) {
        position.value = newPosition
        $q.notify({
          message: 'Position updated',
          type: 'positive',
          position: 'top',
          timeout: 1000,
        })
      }
      if (err) {
        console.error('Watch position error:', err)
        $q.notify({
          message: 'Error watching position',
          type: 'negative',
          position: 'top',
        })
      }
    })

    isWatching.value = true
    $q.notify({
      message: 'Started watching position',
      type: 'info',
      position: 'top',
    })
  } catch (error) {
    console.error('Error setting up watch position:', error)
    $q.notify({
      message: 'Error setting up position watching',
      type: 'negative',
      position: 'top',
    })
  }
}

const stopWatchingPosition = async (): Promise<void> => {
  if (!isWatching.value || !watchId) {
    $q.notify({
      message: 'Not currently watching position',
      type: 'warning',
      position: 'top',
    })
    return
  }

  try {
    await Geolocation.clearWatch({ id: watchId })
    isWatching.value = false
    $q.notify({
      message: 'Stopped watching position',
      type: 'info',
      position: 'top',
    })
  } catch (error) {
    console.error('Error stopping watch position:', error)
    $q.notify({
      message: 'Error stopping position watch',
      type: 'negative',
      position: 'top',
    })
  }
}

// Lifecycle hooks for geolocation
onMounted(async () => {
  await getCurrentPosition()
  await startWatchingPosition()
})

onBeforeUnmount(async () => {
  if (watchId && isWatching.value) {
    await stopWatchingPosition()
  }
})
</script>
