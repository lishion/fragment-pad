<template>
  <div id="app" :style="{backgroundImage: 'url(' + bg_url + ')',height:clientHeight}">
   
    <!-- 使得去掉窗口以后可以拖动 -->
    <div style="height:50px;-webkit-app-region: drag" ></div>

    <router-view style="-webkit-app-region: no-drag"></router-view>
  </div>
</template>

<script>
  import bg from './assets/bg.jpg'
  export default {
    name: 'fragment-pad',
    data:function(){
      return {
        bg_url:bg,
        clientHeight:"600px"
        }
    },
    mounted() {
    // 动态设置背景图的高度为浏览器可视区域高度
    // 首先在Virtual DOM渲染数据时，设置下背景图的高度．
    // this.clientHeight.height = `${document.documentElement.clientHeight}px`;
    // 然后监听window的resize事件．在浏览器窗口变化时再设置下背景图高度．
    const that = this;
    window.onresize = function temp() {
        that.clientHeight = `${document.documentElement.clientHeight}px`;
    };
},

  }
</script>

<style>
  *{border: 0;margin: 0%}
</style>
