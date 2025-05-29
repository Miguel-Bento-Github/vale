import type { RouteRecordRaw } from 'vue-router';

const home = {
  path: '/',
  component: () => import('layouts/MainLayout.vue'),
  children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
}

const geoLocation = {
  path: '/geolocation',
  component: () => import('pages/GeoLocation.vue')
}

const cameraControl = {
  path: '/camera',
  component: () => import('pages/CameraControl.vue')
}

const notFound = {
  path: '/:catchAll(.*)*',
  component: () => import('pages/ErrorNotFound.vue'),
}

export const routes: RouteRecordRaw[] = [
  home,
  geoLocation,
  cameraControl,
  notFound
];
