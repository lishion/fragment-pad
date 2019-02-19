<template>
  <div style="width:300px">
    <el-select v-model="value" placeholder="请选择壁纸" @change="onBackgroundChange" style="width:100%">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
    </el-select>
    <splitline :color="'rgb(240,235,213)'"></splitline>
    <el-switch
      v-model="isRemoteMode"
      active-text="远程模式"
      inactive-text="本地模式"
      active-color="#13ce66"
      inactive-color="#409EFF"
      @change="storageModelChange"
    ></el-switch>
    <splitline :color="'rgb(240,235,213)'"></splitline>
    <div class="block">
      <el-slider v-model="initValue" :min="0" :max="100" @change="onTransparencyChange"></el-slider>
    </div>
    <splitline :color="'rgb(240,235,213)'"></splitline>
    <div class="login-input">
      <div v-if="isLogin" style="width:100%">
        <el-button
          :style="{width:'100%',textAlign:'center'}"
          @click="loginOrOut"
          :type="tagType"
          size="small"
          plain
        >{{userStatus}}</el-button>
      </div>
      <div v-else>
        <el-input v-model="user.username" placeholder="用户名"></el-input>
        <el-input v-model="user.password" placeholder="密码"></el-input>
        <el-button size="mini" :style="{width:'100%'}" @click="loginOrOut">登录</el-button>
      </div>
    </div>
    <splitline :color="'rgb(240,235,213)'"></splitline>
    <el-button size="mini" :style="{width:'100%'}" @click="openConsole">控制台</el-button>
  </div>
</template>

<style>
.login-input input {
  margin-top: 3px;
  margin-bottom: 3px;
}
.login-input button {
  margin-top: 3px;
  margin-bottom: 3px;
}
</style>

<script>
import Bus from "../assets/js/bus";
import { UserSetting, MessageBox } from "../assets/js/utils";
import Sender from "../assets/js/sender";
import { open } from "fs";
import splitline from "./split-line";
import { constants } from "http2";
import { sep } from "path";

const setting = UserSetting.getInstance();
const ipc = require("electron").ipcRenderer;
const path = require("path");
const sender = Sender.getInstance();
const LOCAL_MODEL = false;
const REMOTE_MODEL = true;
export default {
  components: { splitline },
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
          user: true
        },
        {
          value: "__set__",
          label: "设置",
          set: true
        }
      ],
      value: setting.getBackgroundImageOr("watermelon.jpg"),
      initValue: setting.getAlphaOr(0.5),
      user: { username: "", password: "" },
      messageBox: new MessageBox(this),
      isRemoteMode: false, // true: 远程模式, false: 本地模式
      isLogin: true,
      tagType: "primary",
      userStatus: "登录"
    };
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
    openConsole() {
      ipc.send("open-console");
    },
    login() {
      sender
        .post("login", this.user)
        .then(() => {
          this.messageBox.success("登录成功");
          this.tagType = "primary";
          this.userStatus = "已登录|退出";
          this.isLogin = true;
          this.isRemoteMode = true
          this.storageModelChange(this.isRemoteMode)
          Bus.$emit("login-state-change");
        })
        .catch(message => this.messageBox.failed(message));
    },
    logout() {
      sender
        .get("logout")
        .then(() => {
          this.userStatus = "登录";
          this.isLogin = false;
          Bus.$emit("login-state-change");
        })
        .catch(message => this.messageBox.failed(message));
    },
    loginOrOut() {
      if (this.userStatus === "网络错误") {
        return;
      }
      if (this.isLogin) {
        this.logout();
      } else {
        this.login();
      }
    },
    storageModelChange(isRemoteMode) {
      const storageModel = isRemoteMode ? "remote" : "local";
      setting.setDbType(storageModel);
      if (isRemoteMode) {
        this.$store.commit("switchToRemote");
      } else {
        this.$store.commit("switchToLocal");
      }
      Bus.$emit("change-storage-model");
    }
  },
  mounted() {
    ipc.on("selected-directory", (event, ext) => {
      if (ext === "$cancel-by-user$") {
        this.value = setting.getBackgroundImageOr("watermelon.jpg");
      } else {
        let bg = `user${ext}`;
        setting.setBackgroundImage(bg);
        setting.setUserBackGroundImage(bg);
        ipc.send("on-bg-set");
      }
    });
    sender
      .get("status")
      .then(() => {
        this.userStatus = "已登录|退出";
        this.tagType = "primary"
        this.isLogin = true;
      })
      .catch(message => {
        if (message.indexOf("未登录") !== -1) {
          this.isLogin = false;
        } else {
          this.isLogin = true;
          this.userStatus = "网络错误";
          this.tagType = "warning";
        }
      });
    if (setting.getDbType() === "remote") {
      this.isRemoteMode = true;
      this.$store.commit("switchToRemote");
    } else {
      this.$store.commit("switchToLocal");
    }
  }
};
</script>

