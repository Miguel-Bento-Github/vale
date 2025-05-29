<template>
  <q-btn push :label="label" color="white" text-color="primary" @click="dark.toggle()" />
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { dark } = useQuasar()

const label = computed(() => (dark.isActive ? t('light') : t('dark')))
</script>
