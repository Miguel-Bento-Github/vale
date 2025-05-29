<template>
  <q-page class="row items-center justify-evenly">
    GPS position: <strong>{{ position ? position : 'determining...' }}</strong>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Geolocation, type Position } from '@capacitor/geolocation';

const position = ref<Position>();

async function getCurrentPosition(): Promise<void> {
  try {
    const newPosition = await Geolocation.getCurrentPosition();
    console.log('Current', newPosition);
    position.value = newPosition;
  } catch (error) {
    console.error('Error getting current position:', error);
  }
}

let watchId: string;
onMounted(async () => {
  await getCurrentPosition();

  try {
    watchId = await Geolocation.watchPosition({}, (newPosition, err) => {
      console.log('New GPS position');
      if (newPosition) position.value = newPosition;
      if (err) console.error('Watch position error:', err);
    });
  } catch (error) {
    console.error('Error setting up watch position:', error);
  }
});

onBeforeUnmount(async () => {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId });
  }
});
</script>
