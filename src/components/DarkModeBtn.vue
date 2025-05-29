<template>
  <q-btn push @click="dark.toggle()" :label="label" color="white" text-color="primary" />
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

const { dark } = useQuasar()

const label = dark.isActive ? t('dark') : t('light')
</script>