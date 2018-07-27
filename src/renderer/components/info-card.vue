<template>
    <el-card class="box-card" style="margin-bottom: 18px" shadow="hover" header-style="background-color:#409EFF">
        <div slot="header" class="clearfix" @dblclick="$emit('on-modify')" >
            <el-row :gutter="20" type="flex" justify="space-between">
                <el-col :span="16">
                    {{item.value.title}}
                </el-col>
                <el-col :span="4">
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-close" @click="deleteItem(item.key)"></el-button>
                </el-col>
            </el-row>
        </div>
        <div class="text item" @dblclick="$emit('on-modify')">
            <slot name="content"></slot>
        </div>
    </el-card>
</template>

<script>
import {LevelDb,MessageBox} from '../assets/js/utils'
import addcard from './add-card'
import { constants } from 'http2';
var levelDb = LevelDb.getInstance()
export default {
    name:"infocard",
    props:['item'],
    components:{addcard},
    data:function(){
        return {
            messageBex:new MessageBox(this)
        }
    },
    methods:{
        deleteItem(id){
            levelDb.deleteById(id,(err)=>{
                this.messageBex.showMessage(err)
                if(!err){
                    this.$emit('on-success')
                }
            })
        }
    }
}
</script>
