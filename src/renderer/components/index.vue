<template>
  <el-container>
    <!-- header 包括搜索以及添加按钮 -->
    <el-header id="header" :style="{display:showSearch}">
      <el-row type="flex" justify="center">
        <el-col :span="10" style="width:60%">
          <div class="grid-content" @keydown.enter="search(keywords)">
            <el-input
              v-model="keywords"
              placeholder="输入以搜索"
              :prefix-icon="icon"
              :disabled="editingItemKey!=null"
            ></el-input>
          </div>
        </el-col>
        <el-col :span="4" :push="3">
          <div class="grid-content">
            <el-button
              slot="reference"
              icon="el-icon-plus"
              type="text"
              @click="addEmptyCard"
              :disabled="searchMode||editingItemKey!=null"
            ></el-button>
          </div>
        </el-col>
      </el-row>
    </el-header>

    <el-main style="margin-top: 60px" id="main">
      <div v-for="item in items" :key="item.key" class="card">
        <!--如果是编辑模式，则显示编辑界面-->
        <addcard v-if="edit_able[item.key]" :item="item" @on-save="save" id="addcard"></addcard>

        <!--否则显示普通界面-->
        <!--searchMode||editingItemKey 用于控制删除按钮是否可用-->
        <infocard
          v-else
          id="infocard"
          @on-delete="onDeleteSuccess"
          @on-modify="modify(item)"
          @on-sync="sync(item)"
          :itemKey="item.key"
          :sync="item.value.sync"
          :searchMode="searchMode"
          :editingItemKey="editingItemKey"
          :style="{backgroundColor: 'rgba(255, 255, 255,' + alpha + ')'}"
        >
          <template slot="title">
            <div v-html="item.value.rendered_title" v-if="item.value.rendered_title"></div>
            <div v-else>{{item.value.title}}</div>
          </template>
          <template slot="content">
            <div v-html="item.value.marked_content"></div>
          </template>
        </infocard>
      </div>
    </el-main>

    <div v-infinite-scroll="loadMore" infinite-scroll-disabled="busy"></div>
  </el-container>
</template>

<style >
#header {
  width: 100%;
  height: 60px;
  position: fixed;
  left: 0;
  top: 50px;
}
#header input {
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  outline: none;
  border-radius: 0px;
}

#header input:focus {
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
}

#addcard .el-input__inner {
  border: 0px;
  border-bottom: 1px solid rgb(200, 200, 159);
  border-radius: 0;
}
#addcard .el-textarea__inner {
  border: 0px;
  border-bottom: 1px solid rgb(200, 200, 159);
  border-radius: 0;
}
</style>

<script>
import infocard from "./info-card";
import addcard from "./add-card";
import infiniteScroll from "vue-infinite-scroll";
import { MessageBox, UserSetting } from "../assets/js/utils";
import db from "../assets/js/db.js";
import Bus from "../assets/js/bus";
let setting = UserSetting.getInstance();
let ipcRender = require("electron").ipcRenderer;

export default {
  name: "index",
  components: { infocard, addcard },
  directives: { infiniteScroll },
  latestKey: null,
  data: function() {
    return {
      items: [],
      edit_able: {},
      messageBox: new MessageBox(this),
      uuid: require("uuid"),
      keywords: "",
      icon: "el-icon-view",
      editingItemKey: null,
      searchMode: false,
      canInput: true,
      canDelete: true,
      alpha: setting.getAlphaOr(50) / 100,
      showSearch: true
    };
  },
  methods: {
    loadData() {
      db.instance.getLatest(
        5,
        this.latestKey,
        data => {
          if (this.latestKey !== data.key) {
            this.items.push(data);
            this.latestKey = data.key;
          }
        },
        err => this.messageBox.failed(err)
      );
    },
    loadMore: function() {
      if (!this.searchMode) {
        this.loadData();
      }
    },
    getEmptyItem() {
      return {
        key: "new-one",
        value: {
          title: "",
          content: "",
          marked_content: ""
        }
      };
    },
    sync(item){
      const value = Object.assign({}, item["value"])
      if("" in value){
        delete value["rendered_title"]
      }
      db.remoteDb.put(
        {"value":value}, 
        () => this.messageBox.success("同步成功"),
        err => this.messageBox.failed(err)
      )
    },
    reload() {
      // 重新加载页面
      this.items = []; // 清空数据
      this.latestKey = null; //从最新开始
      this.loadData();
    },
    editMode(key) {
      this.editingItemKey = key;
      this.$set(this.edit_able, this.editingItemKey, true);
    },
    exitEditMode() {
      this.$set(this.edit_able, this.editingItemKey, false);
      this.editingItemKey = null;
    },
    addEmptyCard() {
      if (this.editingItemKey == null) {
        var item = this.getEmptyItem();
        this.items.unshift(item);
        this.editMode(item.key);
      }
    },
    save(item) {
      delete item.value.rendered_title;
      if (item.key === "new-one") {
        // 如果key为new-one 则表示这是一条需要新增的数据，需要删除key
        delete item.key;
      }
      db.instance.put(
        item, 
        data => {
          this.messageBox.success("成功啦^_^")
          this.exitEditMode()
          if(data){
            this.items.shift()
            this.items.unshift(data)
          }
        },
        err => this.messageBox.showMessage(err)
      );
    },

    cancel(item = null) {
      if (item !== null) {
        //取消编辑操作
        if (this.items[0].key === "new-one") {
          this.items.shift();
        }
        this.exitEditMode();
      } else if (this.searchMode) {
        // 退出搜索模式
        this.searchMode = false;
        this.reload();
        Bus.$emit("cancel-search");
        this.icon = "el-icon-view";
      }
    },
    modify(item) {
      if (this.editingItemKey == null) {
        this.editMode(item.key);
      }
    },
    search(keyword) {
      this.searchMode = true;
      this.items = []; // 清空数据
      db.instance.search(keyword, data => {
        this.items.push(data);
      });
      this.icon = "el-icon-search";
      Bus.$emit("on-search");
    },
    onDeleteSuccess(key) {
      var indexToDelete = -1;
      db.instance.deleteById(key, err => {
        this.messageBox.showMessage(err);
        if (!err) {
          this.items = this.items.filter(item => item.key != key);
          if (this.items.length <= 4) {
            this.loadData();
          }
        }  
      });
    }
  },
  mounted() {
    Bus.$on("on-tp-change", alpha => {
      this.alpha = alpha / 100.0;
      setting.setAlpha(alpha);
    });
    //登录成功、改变存储模式时自动切换数据显示
    Bus.$on(["login-success", "change-storage-model"], () => {
      this.reload();
    });
    // 滚动时搜索框自动消失
    Bus.$on("on-scrolly", top => {
      this.showSearch = top ? "block" : "none";
    });
    ipcRender.on("cancel", () => {
      this.cancel(this.editingItemKey);
    });
  }
};
</script>

