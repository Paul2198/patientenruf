import Vue from 'vue'
import VueRouter from 'vue-router'
// import Home from '../views/Home.vue'
import Patient from "../views/Patient.vue"
import Personal from "../views/Personal.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Patient',
    component: Patient
  },
  {
    path: '/personal',
    name: 'personal',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: Personal
  }
]

const router = new VueRouter({
  routes
})

export default router
