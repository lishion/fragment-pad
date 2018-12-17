<template>
    <div>
        <el-select v-model="value" placeholder="请选择壁纸" @change="onBackgroundChange">
            <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value">
            </el-option>

        </el-select>
        <div class="block">
            <el-slider v-model="initValue" :min="0" :max="100" @change="onTransparencyChange"></el-slider>
        </div>
       
    </div>
</template>

<script>
import Bus from '../assets/js/bus'
import {UserSetting} from '../assets/js/utils'
var setting = UserSetting.getInstance()
const ipc = require('electron').ipcRenderer
var path = require("path")
export default {
    data() {
      return {
        options: [{
          value: 'poetry.jpg',
          label: '诗和远方'
        }, {
          value: 'sleep.jpeg',
          label: '大懒猫'
        }, {
          value: 'summer.jpg',
          label: '夏天的回忆'
        }, {
          value: 'watermelon.jpg',
          label: '西瓜西瓜'
        },{
            value:'__user__',
            label:'自定义',
            user:true
        }
        ],
        value: setting.getBackgroundImageOr("watermelon.jpg"),
        initValue:setting.getAlphaOr(0.5)
      }
    },
    methods:{
        onBackgroundChange(value){
            if (value==="__user__"){
                ipc.send('open-file-dialog')
            }else{
                this.$emit("on-bg-change",value)
            }
        },
        onTransparencyChange(value){
            Bus.$emit("on-tp-change",value)
        }
    },
    mounted(){
        ipc.on('selected-directory', function (event, p) {
            //alert(`你选择了${path}`)
            Bus.$emit("on-bg-set",path.basename(p))
        })
    }
  }
</script>

