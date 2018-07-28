<template>
    <el-container>
        <el-header id="header"> 
            <el-row type="flex" justify="center">
                <el-col :span="10" style="width:60%">
                    <div class="grid-content bg-purple" 
                    @keydown.enter="search(keywords)" 
                    @keydown.esc="cancel(null)"
                    >
                        <el-input
                            v-model="keywords"
                            placeholder="输入以搜索"
                            :prefix-icon="icon" 
                            :disabled="editingItemKey"
                        >
                        </el-input>
                    </div>
                </el-col>
                <el-col :span="4" :push="3">  
                    <div class="grid-content" >
                        <el-button slot="reference" icon="el-icon-plus" plain type="text" @click="addEmptyCard"></el-button>
                    </div>
                </el-col>
            </el-row>
        </el-header>

        <el-main style="margin-top: 60px">
                
                <div  
                    v-for="(item) in items"  
                    :key="item.key" 
                    @keydown.esc="cancel(item)"
                >
                    <addcard 
                        v-if="edit_able[item.key]" 
                        :item=item
                        @on-save="save"
                    >
                    </addcard>
                    
                    <infocard   
                        @on-delete-success="onDeleteSuccess" 
                        @on-modify="modify(item)"
                        :item="item"
                        :searchMode="searchMode"
                        :editingItemKey="editingItemKey"
                        v-else
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

<style scoped>
    #header{
        width: 100%;
        height: 60px;
        position: fixed;
        left: 0;
        top: 50px;     
    }
</style>


<script>

import infocard from "./info-card";
import addcard from "./add-card";
import infiniteScroll from "vue-infinite-scroll";
import {LevelDb,MessageBox} from '../assets/js/utils'

let leveldb = LevelDb.getInstance();

export default {
  name: "index",
  components: { infocard, addcard },
  directives: { infiniteScroll },
  latestKey: null,
  data: function() {
    return {
      items: [],
      edit_able :{},
      messageBox:new MessageBox(this),
      uuid:require('uuid'),
      keywords:"",
      icon:"el-icon-view",
      editingItemKey : null,
      searchMode :false,
      canInput : true,
      canDelete : true
    };
  },
  methods: {
    loadData() {
      leveldb.getLatest(5, this.latestKey, data => {
        if(this.latestKey !== data.key){
            this.items.push(data);
            this.latestKey = data.key;
        }
      });
    },
    loadMore: function() {
        if(!this.searchMode){
            this.loadData();
        }
    },
    getEmptyItem(){
        return {
            "isNew":true,
            "key":this.uuid.v1(),
            "value":{
                "title":"",
                "content":"",
                "marked_content":""
            }
        }
    },
    reload(){
      // 重新加载页面
      this.items = [] // 清空数据
      this.latestKey = null //从最新开始
      this.loadData()
    },
    editMode(key){
        
        this.editingItemKey = key
        this.$set(this.edit_able,this.editingItemKey,true)
    },
    exitEditMode(){
        this.$set(this.edit_able,this.editingItemKey,false)
        this.editingItemKey = null
    },
    addEmptyCard(){
        console.info(this.editingItemKey)
        if(this.editingItemKey == null){
            var item = this.getEmptyItem()
            this.items.unshift(item)
            this.editMode(item.key)
        }
    },
    save(item) {
        delete item.value.rendered_title
        delete item.isNew
        console.info(item)

        leveldb.put(item,(err)=>{
            this.messageBox.showMessage(err)
            if(!err){
                this.exitEditMode()
                this.reload()
            }
        }) 
        console.info(this.editingItemKey)
    },

    cancel(item = null){
        if(item !== null){ //取消编辑操作
            if(this.items[0].isNew === true){
                this.items.shift()
            } 
            this.exitEditMode()
        }else{
            this.searchMode = false
            this.reload()
            this.icon = "el-icon-view"
        }
    },
    modify(item){
        if(this.editingItemKey == null && this.searchMode == false){
            this.editMode(item.key)
        }
    },
    search(keyword){
        this.cancel(this.editingItemKey)
        this.searchMode = true
        this.items = [] // 清空数据
        leveldb.search(keyword,(data)=>{
            this.items.push(data)
        })
        this.icon = "el-icon-search"
    },
    onDeleteSuccess(){
        this.cancel(this.editingItemKey)
        this.reload()
    }
  }
};
</script>

