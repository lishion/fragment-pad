<template>
   
    <div  @keydown.ctrl.83="save" id="add-card">
        <el-card class="box-card" style="margin-bottom: 18px" shadow="hover" header-style="background-color:#409EFF">
            
            <div slot="header">
                <el-input  v-model='item.value.title' placeholder="输入标题"></el-input>
            </div>

            <div class="text item">
                <el-input
                    v-model="item.value.content"
                    type="textarea"
                    :autosize="{ minRows: 5}"
                    placeholder="请输入内容"
                    @keydown.ctrl.83="save"
                ></el-input>
            </div>
        </el-card>
    </div>
</template>

<style >
    #add-card .el-input__inner{border: 0px ;border-bottom:1px solid #ebeef5;border-radius:0 }
    #add-card .el-textarea__inner{border: 0px;border-bottom:1px solid #ebeef5;border-radius:0}
</style>

<script>

import {LevelDb,MessageBox} from '../assets/js/utils'

var db = LevelDb.getInstance()
var marked = require('marked')
export default {
    name:"addinfo",
    props:['item'],
    methods:{
        save(){
            var title = this.item.value.title
            if(title.match(/^\s+?$/)||title===""){
                this.item.value.title = "我是不是忘了写标题??"
            }
            this.item.value.marked_content = marked(this.item.value.content)
            this.$emit('on-save',this.item)
        }
    }
}

</script>
