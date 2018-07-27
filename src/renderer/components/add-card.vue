<template>
    <div  @keydown.ctrl.83="save">
        <el-input  v-model='item.value.title' placeholder="输入标题"></el-input>
        <el-input
                v-model="item.value.content"
                type="textarea"
                :autosize="{ minRows: 5}"
                placeholder="请输入内容"
                @keydown.ctrl.83="save"
        ></el-input>
    </div>
</template>


<script>

import {LevelDb,MessageBox} from '../assets/js/utils'

var db = LevelDb.getInstance()
var marked = require('marked')
export default {
    name:"addinfo",
    props:['item'],
    methods:{
        save(){
            if(this.item.value.title.match(/\s+/)){
                this.item.value.title = "我是不是忘了写标题??"
            }
            this.item.value.marked_content = marked(this.item.value.content)
            this.$emit('on-save',this.item)
        }
    }
}

</script>
