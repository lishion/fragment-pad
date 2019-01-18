<template>
  <div>
    <el-select v-model="value" placeholder="请选择壁纸" @change="onBackgroundChange">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
    </el-select>
    <div class="block">
      <el-slider v-model="initValue" :min="0" :max="100" @change="onTransparencyChange"></el-slider>
    </div>
    <el-button size="mini" :style="{width:'100%'}" @click="openConsole">控制台</el-button>
  </div>
</template>

<script>
import Bus from "../assets/js/bus";
import { UserSetting } from "../assets/js/utils";
import { open } from 'fs';
var setting = UserSetting.getInstance();
const ipc = require("electron").ipcRenderer;
var path = require("path");
export default {
  data: function() {
    return {
      options: [
        {
          value: "poetry.jpg",
          label: "诗和远方"
        },
        {
          value: "sleep.jpeg",
          label: "大懒猫"
        },
        {
          value: "summer.jpg",
          label: "夏天的回忆"
        },
        {
          value: "watermelon.jpg",
          label: "西瓜西瓜"
        },
        {
          value: setting.getUserBackGroundImage(),
          label: "自定义背景",
          user:true
        },
        {
          value: "__set__",
          label: "设置",
          set: true
        }
      ],
      value: setting.getBackgroundImageOr("watermelon.jpg"),
      initValue: setting.getAlphaOr(0.5)
    }
  },
  methods: {
    onBackgroundChange(value) {
      if (value === "__set__") {
        ipc.send("open-file-dialog");
      } else {
        this.$emit("on-bg-change", value);
      }
    },
    onTransparencyChange(value) {
      Bus.$emit("on-tp-change", value);
    },
    openConsole(){
      ipc.send("open-console")
    }
  },
  mounted() {
    let that = this
    ipc.on("selected-directory", function(event, ext) {
      if(ext === "$cancel-by-user$"){
        that.value = setting.getBackgroundImageOr("watermelon.jpg")
      }else{
        let bg = `user${ext}`;
        setting.setBackgroundImage(bg)
        setting.setUserBackGroundImage(bg)
        ipc.send('on-bg-set')
      }
    });
  }
};
</script>

