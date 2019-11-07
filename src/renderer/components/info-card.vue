<template>
    <el-card class="box-card" style="margin-bottom: 18px;border:0px" shadow="hover" header-style="background-color:#409EFF" >
        <!--标题存在则显示-->
        <div slot="header" v-if="item.value.title">
            <el-row :gutter="20" type="flex" justify="space-between">
                <el-col :span="16">
                    <slot name="title"></slot>
                </el-col>
                <el-col :span="4">
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-close" @click="$emit('delete',item.key)" :disabled="searchMode||(editingItemKey!=null)"></el-button>
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-refresh" @click="$emit('sync',item.key)" v-if="!remoteModel"></el-button>
                </el-col>
            </el-row>
        </div>
        <!--否则只显示删除按钮-->
        <div v-else>
            <el-row :gutter="20" type="flex" justify="space-between">
                <el-col :span="16">
                </el-col>
                <el-col :span="4">
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-close" @click="$emit('delete',item.key)" :disabled="searchMode||(editingItemKey!=null)"></el-button>
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-refresh" @click="$emit('sync',item.key)" v-if="!remoteModel"></el-button>
                </el-col>
            </el-row>
        </div>
        <div class="text item" @dblclick="$emit('modify')" @mousedown="mousedown" @mouseup="mouseup">
            <slot name="content"></slot>
        </div>
    </el-card>
</template>

<style>
    blockquote {
          margin-top: 1em;
          margin-bottom: 1em;
          margin-left: 2em;
          padding-left: 1em;
          padding-top: 1em;
          padding-right: 1em;
          padding-bottom: 1em;
          border-left: 2px dashed whitesmoke;
    }
    .line {
        height: 1px;
        margin-top: 1em;
        margin-bottom: 1em;
        margin-left: 0;
        margin-right: 0;
        background:whitesmoke;
    }
    .box-card{
        font-family:Consola,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
    }
</style>



<script>
let ipcRender = require('electron').ipcRenderer
import { remote } from 'electron';
export default {
    name:"infocard",
    props:['item','searchMode','editingItemKey'],
    data: function(){
        return {
            dialogTableVisible : false,
            mousedownPosition: { clientX: 0, clientY: 0}
        }
    },
    computed:{
        remoteModel(){
            return this.$store.state.Fragment.remoteModel
        }
    },
    methods:{
        mousedown(e){
            this.mousedownPosition.clientX = e.clientX
            this.mousedownPosition.clientY = e.clientY
        },
        mouseup(e){
            // 鼠标按钮松开时，如果鼠标存在移动距离，则认为鼠标存在选则文本的操作
            const isMousePositionMoved = (start, end) => Math.abs(end - start) > 0
            const isMouseXAxisMoved = isMousePositionMoved(e.clientX, this.mousedownPosition.clientX)
            const isMouseYAxisMoved = isMousePositionMoved(e.clientY, this.mousedownPosition.clientY)
            const isMouseMoved = isMouseXAxisMoved && isMouseYAxisMoved
            if (isMouseMoved) {
                this.$emit("select", { clientX: e.x, clientY: e.y}) // 传递鼠标移动时间到父组件
            }
        }

    },
    mounted(){
       var doms =  document.getElementsByClassName('content-url')
       for(var i=0;i<doms.length;i++){
           var dom = doms[i]
           doms[i].onmousedown=(value)=>{
               var target = dom.getAttribute("my-target")
               ipcRender.send('click-content-url',target) // 主动发送点击事件到主线程，使其打开浏览器
           }
       }
    } 
}
</script>
