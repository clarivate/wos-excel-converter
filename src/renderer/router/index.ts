import { MainScreen, AboutScreen } from '@/renderer/screens'
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
      path: '/second',
      component: () => import('@/renderer/screens/SecondScreen.vue'),
      meta: {
        titleKey: 'title.about'
      }
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
