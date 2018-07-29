<template>
  <div id="app" :style="{backgroundImage: 'url(' + bg_url + ')',height:clientHeight,backgroundAttachment:attachment,backgroundRepeat:repeat,backgroundSize:size}">
   
    <!-- 使得去掉窗口以后可以拖动 -->
    <div style="height:50px;-webkit-app-region: drag" ></div>

    <router-view style="-webkit-app-region: no-drag"></router-view>
  </div>
</template>

<script>
  import bg from './assets/bg.jpeg'
  export default {
    name: 'fragment-pad',
    data:function(){
      return {
        bg_url:bg,
        clientHeight:"600px",
        attachment:"fixed",
        repeat:"no-repeat",
        size:"cover"
        }
    },
    mounted() {
    
    //监听 resize 与 onscroll 事件，动态调整div大小，避免背景图空白
    const that = this;
    var rollHeight = 0
    var clientHeight = 0
    window.onresize = function temp() {
        clientHeight = document.documentElement.clientHeight
        that.clientHeight = `${document.documentElement.clientHeight + window.scrollY}px`;
    };
    window.onscroll = function scroll(){
       let rollHeigth = window.scrollY
       that.clientHeight = `${document.documentElement.clientHeight + window.scrollY}px`
        
    };
},

  }
</script>

<style>
  *{border: 0;margin: 0%}
    ::-webkit-scrollbar {
            display: none;
    }
</style>
