import { MainScreen, AboutScreen, LogScreen } from '@/renderer/screens'
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
      component: LogScreen
    },
    {
      path: '/error',
      component: () => import('@/renderer/screens/LogScreen.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
