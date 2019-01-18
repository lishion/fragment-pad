<template>
  <div
    id="app"
    :style="{backgroundImage: 'url(' + bg_url + ')',height:clientHeight,backgroundAttachment:attachment,backgroundSize:size,backgroundPosition:position}"
  >
    <div>
      <el-row>
        <el-col :span="22">
          <div style="height:50px;-webkit-app-region: drag" id="top"></div>
        </el-col>
        <el-col :span="2">
          <el-popover placement="bottom" trigger="click">
            <setting @on-bg-change="changeBackground"></setting>
            <el-button slot="reference" type="text" icon="el-icon-setting"></el-button>
          </el-popover>
          <!--最小化按钮-->
          <el-button type="text" icon="el-icon-minus" style="margin-left:1em" @click="minimize"></el-button>
        </el-col>
      </el-row>
    </div>
    <i class="el-icon-caret-top" id='to-top' @click="toTop"></i>
    <router-view style="-webkit-app-region: no-drag"></router-view>
  </div>
</template>

<style>
.hljs {
  background: none;
}
#to-top {
  position: fixed;
  right: 10px;
  top: 80%;
  background: rgba(255, 255, 255, 0.5);
  color: #409eff;
  display: block;
  line-height: 40px;
  text-align: center;
  font-size: 20px;
  width: 40px;
  border-radius: 50%;
}

</style>


<script>
import setting from "./components/setting";
import { UserSetting,SmoothPosition } from "./assets/js/utils";
let userSetting = UserSetting.getInstance();
import Bus from "./assets/js/bus";
import { clearInterval } from 'timers';
import { throws } from 'assert';
export default {
  name: "fragment-pad",
  components: { setting },
  data: function() {
    return {
      bg_url: require("./assets/bg/" +
        userSetting.getBackgroundImageOr("./assets/bg/watermelon.jpg")),
      clientHeight: "600px",
      attachment: "fixed",
      repeat: "no-repeat",
      position: "center",
      size: "cover",
      timer:null,
    };
  },
  mounted() {
    //监听 resize 与 onscroll 事件，动态调整div大小，避免背景图空白
    const that = this;
    var rollHeight = 0;
    var clientHeight = 0;
    
    // 窗体目前不允许 resize 所以代码暂时不起作用
    // window.onresize = () => {
    //   clientHeight = document.documentElement.clientHeight;
    //   that.clientHeight = `${document.documentElement.clientHeight + window.scrollY}px`;
    // };

    window.onscroll = () => {
      let rollHeigth = window.scrollY;
      that.clientHeight = `${document.documentElement.clientHeight + window.scrollY}px`;
      console.info(rollHeigth)
      if(rollHeigth > 20){
        Bus.$emit("on-scrolly",false)
      }else if(rollHeigth <= 0){
        window.clearInterval(that.timer)
        Bus.$emit("on-scrolly",true)
      }
    };
    
    //进入/退出搜索时，滚动条设置为0，避免继承上个页面的滚动条
    Bus.$on("on-search", () => {
      that.clientHeight = "600px";
    });
    Bus.$on("cancel-search", () => {
      that.clientHeight = "600px";
    });

    // 更换壁纸
    Bus.$on("on-bg-set", bg => {
      this.bg_url = require(`./assets/bg/${bg}`);
      userSetting.setBackgroundImage(bg);
    });

  },
  methods: {
    changeBackground(bg) {
      this.bg_url = require(`./assets/bg/${bg}`);
      userSetting.setBackgroundImage(bg);
    },
    minimize() {
      var ipc = require("electron").ipcRenderer;
      ipc.send("minimize");
    },
    toTop(){
      let smooth = new SmoothPosition(window.scrollY,50)
      this.timer = setInterval(() => {  
        let position =  smooth.down()
        window.scrollTo(0,position)
      }, 10);
    }
  }
};
</script>

<style>
* {
  border: 0;
  margin: 0%;
}
body { scroll-behavior: smooth }
::-webkit-scrollbar {
  display: none;
}
</style>
