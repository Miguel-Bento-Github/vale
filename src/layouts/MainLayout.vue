<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          Title
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab
          v-for="route in viewRoutes"
          :key="route.path"
          :to="route.path"
          :label="route.meta?.title as string"
        />
      </q-tabs>
    </q-header>

    <q-drawer v-model="rightDrawerOpen" side="right" behavior="mobile" bordered>
      <DarkModeBtn />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import DarkModeBtn from 'src/components/DarkModeBtn.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const routes = router.getRoutes()
const viewRoutes = routes.filter((route) => route.meta?.title)

const rightDrawerOpen = ref(false)

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>
