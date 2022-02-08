import Vue from 'vue'
import VueRouter from 'vue-router'
import Patient from "../views/Patient.vue"
import Personal from "../views/Personal.vue"

Vue.use(VueRouter)

/**Zum Navigieren zwischen den einzelnen Routen */
const routes = [
  {
    path: '/',
    name: 'Patient',
    component: Patient
  },
  {
    path: '/personal',
    name: 'personal',
    component: Personal
  }
]

const router = new VueRouter({
  routes
})

export default router
