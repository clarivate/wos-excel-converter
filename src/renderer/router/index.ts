import { MainScreen, AboutScreen, ErrorScreen } from '@/renderer/screens'
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: MainScreen
    },
    {
      path: '/about',
      component: AboutScreen
    },
    {
      path: '/log',
      component: ErrorScreen
    },
    {
      path: '/error',
      component: () => import('@/renderer/screens/ErrorScreen.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
