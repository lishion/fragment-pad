<template>
    <el-container>
        <!-- header 包括搜索以及添加按钮 -->
        <el-header id="header" :style="{display:showSearchBar}">
            <el-row type="flex" justify="center">
                <el-col :span="10" style="width:60%">
                    <div class="grid-content" @keydown.enter="search(keywords)">
                        <el-input
                                v-model="keywords"
                                placeholder="输入并回车搜索"
                                :prefix-icon="icon"
                                :disabled="editingNote!=null"
                        ></el-input>
                    </div>
                </el-col>
                <el-col :span="4" :push="3">
                    <div class="grid-content">
                        <el-button
                                slot="reference"
                                icon="el-icon-plus"
                                type="text"
                                @click="editEmptyCard"
                                :disabled="searchMode||editingNote!=null"
                        ></el-button>
                        <el-button
                                slot="reference"
                                icon="el-icon-document-copy"
                                type="text"
                                @click="addFromClipboard"
                                :disabled="searchMode||editingNote!=null"
                        ></el-button>
                    </div>
                </el-col>
            </el-row>
        </el-header>

        <el-main style="margin-top: 60px" id="main">
            <div v-for="note in notes" :key="note.id" class="card">
                <!--如果是编辑模式，则显示编辑界面-->
                <addcard v-if="note.editing" :note="note" @save="save" id="addcard"></addcard>

                <!--否则显示普通界面-->
                <!--searchMode||editingNote 用于控制删除按钮是否可用-->
                <infocard
                        v-else
                        id="infocard"
                        @delete="onDeleteSuccess"
                        @edit="startEditView(note)"
                        @sync="syncToRemote(note)"
                        @select="showPasteIcon"
                        :note="note"
                        :searchMode="searchMode"
                        :editingNote="editingNote"
                        :style="{backgroundColor: `rgba(255, 255, 255,${alpha})`}"
                >
                    <template slot="title">
                        <div v-html="note.rendered_title" v-if="searchMode"></div>
                        <div v-else>{{note.title}}</div>
                    </template>
                    <template slot="content">
                        <div v-html="note.rendered_content"></div>
                    </template>
                </infocard>
            </div>
        </el-main>
        <el-button circle type="plain" size="mini" icon="el-icon-document-copy" :style="pasteIconStyle"
                   @click="copy"></el-button>
        <div v-infinite-scroll="loadMore"></div>
    </el-container>
</template>

<style>
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
    import {MessageBox, UserSetting} from "../assets/js/utils";
    import db from "../assets/js/db.js";
    import Bus from "../assets/js/bus";
    import {Note} from "../assets/js/model"

    let setting = UserSetting.getInstance();
    let ipcRender = require("electron").ipcRenderer;
    export default {
        name: "index",
        components: {infocard, addcard},
        directives: {infiniteScroll},
        latestId: null,
        data: function () {
            return {
                notes: [],
                messageBox: new MessageBox(this),
                keywords: "",
                icon: "el-icon-view",
                editingNote: null,
                searchMode: false,
                alpha: setting.getAlphaOr(50) / 100,
                showSearchBar: true,
                pasteIconStyle: {display: 'none', left: 0, top: 0, position: 'fixed'},
                pasteIconTimer: null
            };
        },
        methods: {
            loadData() {
                db.instance.getLatest(
                    5,
                    this.latestId,
                    note => {
                        this.notes.push(note);
                        this.latestId = note.id;  // 保持 id 为最新
                    },
                    err => this.messageBox.failed(err)
                );
            },
            loadMore() {
                this.searchMode || this.loadData();
            },
            syncToRemote(note) {
                note = Note.clean(note);
                delete note.id; // 本数据库id 与远程数据库 id 不同，因此需要删除
                db.remoteDb.put(
                    note,
                    () => this.messageBox.success("同步成功"),
                    err => this.messageBox.failed(err)
                );
            },
            reload() {
                // 重新加载页面
                this.notes = []; // 清空数据
                this.latestId = null; //从最新开始
                this.loadData();
            },
            startEditView(note) {
                this.editingNote = note;
                note.editing = true;
            },
            endEditView(note) {
                this.editingNote = null;
                note.editing = false;
            },
            exitSearchMode() {
                this.searchMode = false;
                this.messageBox.info("退出搜索模式");
                Bus.$emit("cancel-search");
                this.icon = "el-icon-view";
            },
            editEmptyCard() {
                const note = Note.emptyNote();
                this.notes.unshift(note);
                this.startEditView(note);
            },
            saveToDB(note, callback) {
                db.instance.put(
                    Note.clean(note),
                    insertResultNote => {
                        callback(insertResultNote);
                        this.messageBox.success("成功啦^_^");
                    },
                    err => this.messageBox.showMessage(err)
                );
            },
            save(note) {
                note.id || this.notes.shift();
                this.saveToDB(Note.clean(note), savedNote => note.id || this.notes.unshift(savedNote));
                this.endEditView(note);
            },
            cancel(note = null) {
                if (note !== null) { // 退出编辑模式
                    this.notes[0].id || this.notes.shift();
                    this.endEditView(note);
                } else if (this.pasteIconStyle.display === 'block') { // 隐藏搜索按钮
                    this.pasteIconStyle.display = 'none'
                } else if (this.searchMode) { // 退出搜索模式
                    this.exitSearchMode();
                    this.reload();
                }
            },
            search(keyword) {
                this.searchMode = true;
                this.notes = []; // 清空数据
                db.instance.search(keyword, note => this.notes.push(note));
                this.icon = "el-icon-search";
                Bus.$emit("search");
            },
            onDeleteSuccess(id) {
                db.instance.deleteById(id, err => {
                    this.messageBox.showMessage(err);
                    if (!err) {
                        this.notes = this.notes.filter(note => note.id !== id);
                        if (this.notes.length <= 4) {
                            this.loadData();
                        }
                    }
                });
            },
            addFromClipboard() {
                const copyText = ipcRender.sendSync("get-copy-text");
                if (copyText) {
                    const emptyNote = Note.emptyNote();
                    emptyNote.raw_content = copyText;
                    emptyNote.rendered_content = copyText;
                    emptyNote.editing = false;
                    this.saveToDB(emptyNote, savedNote => this.notes.unshift(savedNote));
                } else {
                    this.messageBox.showMessage("粘贴板为空")
                }
            },
            showPasteIcon(clientPosition) {
                this.pasteIconTimer && clearTimeout(this.pasteIconTimer); // 取消上一次设置的粘贴按钮自动消失
                this.pasteIconStyle.left = clientPosition.clientX + 'px';
                this.pasteIconStyle.top = clientPosition.clientY + 'px';
                this.pasteIconStyle.display = 'block';
                this.pasteIconTimer = setTimeout(() => this.pasteIconStyle.display = 'none', 1500) // 1.5 秒后粘贴按钮自动消失
            },
            copy() {
                const selectedText = window.getSelection().toString();
                ipcRender.send('copy', selectedText);
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
                this.searchMode && this.exitSearchMode();
                this.reload();
            });
            // 滚动时搜索框自动消失
            Bus.$on("scrolly", top => {
                this.showSearchBar = top ? "block" : "none";
            });
            Bus.$on("refersh", () => {
                this.reload();
            });
            ipcRender.on("cancel", () => {
                this.cancel(this.editingNote);
            });
        }
    };
</script>