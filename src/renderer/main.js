import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

import App from './App'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import 'highlight.js/styles/default.css'
import index from './components/index'
import "./assets/font/index.css"
import Vuex from 'vuex'

Vue.use(Vuex)
Vue.use(VueAxios, axios)
Vue.use(ElementUI)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false


/* eslint-disable no-new */
new Vue({
  components: { App ,index},
  router,
  store,
  template: '<App/>'
}).$mount('#app')
