<template>
  <div id="app" :style="{backgroundImage: 'url(' + bg_url + ')',height:clientHeight,backgroundAttachment:attachment,backgroundSize:size,backgroundPosition:position}">
    <div>
        <el-row>
          <el-col :span="20"><div style="height:50px;-webkit-app-region: drag"></div></el-col>
          <el-col :span="4">
            <el-popover
                placement="bottom"
                trigger="click">
                <setting @on-bg-change="changeBackground"></setting>
                <el-button slot="reference" type="text" icon="el-icon-setting"></el-button>
                <!-- <el-button slot="reference">click 激活</el-button> -->
            </el-popover>
          </el-col>
       </el-row>
    </div>
    <router-view style="-webkit-app-region: no-drag"></router-view>
  </div>
</template>

<script>
  import setting from './components/setting'
  import {UserSetting} from './assets/js/utils'
  let userSetting = UserSetting.getInstance()
  export default {
    name: 'fragment-pad',
    components:{setting},
    data:function(){
      return {
        bg_url:require('./assets/bg/'+userSetting.getBackgroundImageOr("./assets/bg/watermelon.jpg")),
        clientHeight:"600px",
        attachment:"fixed",
        repeat:"no-repeat",
        position:"center",
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
    methods:{
      changeBackground(bg){
        this.bg_url = require(`./assets/bg/${bg}`)
        userSetting.setBackgroundImage(bg)
      }
    }

  }
</script>

<style>
  *{border: 0;margin: 0%}
    ::-webkit-scrollbar {
            display: none;
    }
</style>
