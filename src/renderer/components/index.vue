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
                        >
                        </el-input>
                    </div>
                </el-col>
                <el-col :span="4" push="3">  
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
                        @on-success="reload" 
                        @on-modify="modify(item)"
                        :item="item"
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
import {LevelDb,MessageBox,Status,ADD,SEARCH} from '../assets/js/utils'

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
      status:new Status(this),
      keywords:"",
      icon:"el-icon-view"
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
      if(this.status.state !== SEARCH){
          //滚动加载获取数据
        this.loadData();
      }
    },
    getEmptyItem(){
        return {
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
      this.status.switchToView()
    },
    addEmptyCard(){
        var item = this.getEmptyItem()
        console.info(this.status.editingItem)
        this.status
            .switchToADD(item)
            .then((item,state)=>this.items.unshift(item))
    },
    save(item) {
        delete item.rendered_title
        leveldb.put(item,(err)=>{
           this.messageBox.showMessage(err)
           if(!err){
               this.status.switchToView(item)
               this.reload()
           }
        })
    },
    cancel(item = null){
        if(item!==null){ //取消
            this.status
            .switchToView(item)
            .then((item,state)=>{
                if(state==ADD){
                    this.items.shift()
                }
            })
        }else{
            if(this.status.state === SEARCH){
                this.status.switchViewStateToNormal()
                this.reload()
                this.icon = "el-icon-view"
            }
        }
    },
    modify(item){
        this.status.switchToModify(item)
    },
    search(keyword){
        this.status.switchViewStateToSearch()
        // 重新加载页面
        this.items = [] // 清空数据
        this.latestKey = null //从最新开始
        leveldb.search(keyword,(data)=>{
            this.items.push(data)
        })
        this.icon = "el-icon-search"
    }
  }
};
</script>

