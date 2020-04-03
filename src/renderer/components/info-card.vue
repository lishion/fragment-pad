<template>
    <el-card class="box-card" style="margin-bottom: 18px;border:0px" shadow="hover"
             header-style="background-color:#409EFF">
        <div :slot="displayTitle">
            <el-row :gutter="20" type="flex" justify="space-between">
                <el-col :span="16">
                    <slot name="title" v-if="note.title"></slot>
                </el-col>
                <el-col :span="4">
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-close" @click="$emit('delete',note.id)"
                               :disabled="searchMode||(editingNote!=null)"></el-button>
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-refresh" @click="$emit('sync',note.id)"
                               v-if="!remoteModel" :disabled="searchMode"></el-button>
                </el-col>
            </el-row>
        </div>
        <div class="text item" @dblclick="editingNote||$emit('edit')" @mousedown="mousedown" @mouseup="mouseup">
            <slot name="content"></slot>
        </div>
    </el-card>
</template>

<style>
    blockquote {
        margin-top: 1em;
        margin-bottom: 1em;
        margin-left: 2em;
        padding: 1em;
        border-left: 2px dashed whitesmoke;
    }

    .box-card {
        font-family: Consola, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
</style>


<script>
    let ipcRender = require('electron').ipcRenderer;
    import {remote} from 'electron';

    export default {
        name: "infocard",
        props: ['note', 'searchMode', 'editingNote'],
        data: function () {
            return {
                dialogTableVisible: false,
                mousedownPosition: {clientX: 0, clientY: 0},
                displayTitle: this.note.title ? "header" : null // 当标题存在时，displayTitle 为 header，显示header及分割线。
                // 只显示简单删除按钮，不显示分割线
            }
        },
        computed: {
            remoteModel() {
                return this.$store.state.Fragment.remoteModel
            }
        },
        methods: {
            mousedown(e) {
                this.mousedownPosition.clientX = e.clientX;
                this.mousedownPosition.clientY = e.clientY
            },
            mouseup(e) {
                // 鼠标按钮松开时，如果鼠标存在移动距离，则认为鼠标存在选则文本的操作
                const isMousePositionMoved = (start, end) => Math.abs(end - start) > 0;
                const isMouseXAxisMoved = isMousePositionMoved(e.clientX, this.mousedownPosition.clientX);
                const isMouseYAxisMoved = isMousePositionMoved(e.clientY, this.mousedownPosition.clientY);
                const isMouseMoved = isMouseXAxisMoved && isMouseYAxisMoved;
                if (isMouseMoved) {
                    this.$emit("select", {clientX: e.x, clientY: e.y}) // 传递鼠标移动时间到父组件
                }
            }
        },
        mounted() {
            var doms = document.getElementsByClassName('content-url');
            for (var i = 0; i < doms.length; i++) {
                var dom = doms[i];
                doms[i].onmousedown = (value) => {
                    var target = dom.getAttribute("my-target");
                    ipcRender.send('click-content-url', target) // 主动发送点击事件到主线程，使其打开浏览器
                }
            }
        }
    }
</script>
