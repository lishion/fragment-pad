<template>
  <el-container @click.native="clickWindow">
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
            <el-button
              slot="reference"
              icon="el-icon-document-copy"
              type="text"
              @click="addFromCopyboard"
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
          @delete="onDeleteSuccess"
          @modify="modify(item)"
          @sync="sync(item)"
          @select="showPasteIcon"
          :item="item"
          :searchMode="searchMode"
          :editingItemKey="editingItemKey"
          :style="{backgroundColor: 'rgba(255, 255, 255,' + alpha + ')'}"
        >
          <template slot="title">
            <div v-html="item.value.rendered_title" v-if="searchMode"></div>
            <div v-else>{{item.value.title}}</div>
          </template>
          <template slot="content">
            <div v-html="item.value.heighlighted_content" v-if="searchMode"></div>
            <div v-else v-html="item.value.marked_content"></div>
          </template>
        </infocard>
      </div>
    </el-main>
    <el-button circle type="plain" size="mini" icon="el-icon-document-copy" :style="pasteIconStyle" @click="copy"></el-button>
    <div v-infinite-scroll="loadMore" infinite-scroll-disabled="true" infinite-scroll-distance="10"></div>
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
import { log } from 'util';
let setting = UserSetting.getInstance();
let ipcRender = require("electron").ipcRenderer;
export default {
  name: "index",
  components: { infocard, addcard},
  directives: { infiniteScroll },
  latestKey: null,
  data: function() {
    return {
      items: [],
      edit_able: {},
      messageBox: new MessageBox(this),
      keywords: "",
      icon: "el-icon-view",
      editingItemKey: null,
      searchMode: false,
      canInput: true,
      canDelete: true,
      alpha: setting.getAlphaOr(50) / 100,
      showSearch: true,
      pasteIconStyle: {display: 'none', left: 0, top: 0, position: 'fixed'},
      pasteIconTimer: null
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
    sync(item) {
      this.deleteHightField(item);
      const value = { ...item["value"] };
      db.remoteDb.put(
        { value: value },
        () => this.messageBox.success("同步成功"),
        err => this.messageBox.failed(err)
      );
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
    exitSearchMode() {
      this.searchMode = false;
      Bus.$emit("cancel-search");
      this.icon = "el-icon-view";
    },
    addEmptyCard() {
      if (this.editingItemKey == null) {
        var item = this.getEmptyItem();
        this.items.unshift(item);
        this.editMode(item.key);
      }
    },
    deleteHightField(item) {
      delete item.value.rendered_title;
      delete item.value.heighlighted_content;
    },
    save(item) {
      //todo: 修改时，就算没成功显示的内容也会改变
      this.deleteHightField(item);
      if (item.key === "new-one") {
        // 如果key为new-one 则表示这是一条需要新增的数据，需要删除key
        delete item.key;
        this.items.shift();
      }
      db.instance.put(
        item,
        data => {
          this.messageBox.success("成功啦^_^");
          if (data) {
            this.items.unshift(data);
          }
        },
        err => this.messageBox.showMessage(err)
      );
      if (this.searchMode) {
        this.exitSearchMode();
        this.reload();
      }
      this.exitEditMode();
    },
    cancel(item = null) {
      if (item !== null) {
        //取消编辑操作
        if (this.items[0].key === "new-one") {
          this.items.shift();
        }
        this.exitEditMode();
      } else if (this.pasteIconStyle.display === 'block'){
          this.pasteIconStyle.display = 'none'
      }
      else if (this.searchMode) {
        // 退出搜索模式
        this.exitSearchMode();
        this.reload();
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
      Bus.$emit("search");
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
    },
    addFromCopyboard(){
        const copyText = ipcRender.sendSync("get-copy-text")
        if (copyText){
            const emptyItem = this.getEmptyItem()
            emptyItem.key = null
            emptyItem.value.marked_content = copyText
            emptyItem.value.content = copyText
            emptyItem.value.rendered_title = copyText
            this.save(emptyItem)
        }else{
            this.messageBox.showMessage("粘贴板为空")
        }
    },
    showPasteIcon(clientPosition){
        this.pasteIconTimer && clearTimeout(this.pasteIconTimer) // 取消上一次设置的粘贴按钮自动消失
        this.pasteIconStyle.left = clientPosition.clientX + 'px'
        this.pasteIconStyle.top = clientPosition.clientY + 'px'
        this.pasteIconStyle.display = 'block'
        this.pasteIconTimer = setTimeout(()=>this.pasteIconStyle.display = 'none', 1500) // 1.5 秒后粘贴按钮自动消失
    },
    copy(){
        const selectedText = window.getSelection().toString()
        ipcRender.send('copy', selectedText)
        this.pasteIconStyle.display = 'none' // 粘贴按钮点击后，隐藏粘贴按钮
    },
  },
  mounted() {
    Bus.$on("tp-change", alpha => {
      this.alpha = alpha / 100.0;
      setting.setAlpha(alpha);
    });
    //登录成功、改变存储模式时自动切换数据显示
    Bus.$on(["login-state-change"], () => {
      this.reload();
    });
    Bus.$on(["change-storage-model"], () => {
      if (this.searchMode) {
        this.exitSearchMode();
      }
      this.reload();
    });
    // 滚动时搜索框自动消失
    Bus.$on("scrolly", top => {
      this.showSearch = top ? "block" : "none";
    });
    Bus.$on("refersh", () => {
      this.reload();
    });
    ipcRender.on("cancel", () => {
      this.cancel(this.editingItemKey);
    });
  }
};
</script>