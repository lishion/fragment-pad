const state = {
  remoteModel: false 
}

const mutations = {
   switchToLocal(state){
      state.remoteModel = false
   },
   switchToRemote(state){
      state.remoteModel = true
   }
}

const actions = {
  // someAsyncTask ({ commit }) {
  //   // do something async
  //   commit('INCREMENT_MAIN_COUNTER')
  // }
}

export default {
  state,
  mutations,
  actions
}
