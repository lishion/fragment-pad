<template>
  <div>
    <el-card
      class="box-card"
      style="margin-bottom: 18px"
      shadow="hover"
      header-style="background-color:#409EFF"
    >
      <div slot="header">
        <el-input v-model="item.value.title" placeholder="输入标题"></el-input>
      </div>

      <div class="text item"  ref="editor">
        <mavon-editor
          :subfield="false"
          :toolbarsFlag="false"
          :ishljs="true"
          v-model="item.value.content"
          placeholder="..."
          @save="save"
        ></mavon-editor>
      </div>
    </el-card>
  </div>
</template>

<style>
  .auto-textarea-wrapper .auto-textarea-input{
      font-family: Consola
  }
</style>


<script>
import {MessageBox,setLinkRule } from "../assets/js/utils";
import { mavonEditor } from "mavon-editor";
import "mavon-editor/dist/css/index.css";
let mdInstance = mavonEditor.getMarkdownIt()
setLinkRule(mdInstance) // 给渲染的连接加上点击事件，传递打开链接的消息
export default {
  name: "addinfo",
  props: ["item"],
  components: {
    mavonEditor
  },
  methods: {
    save(raw_text,mark_text){
        let title = this.item.value.title;
        if (title.match(/^\s+?$/) || title === "") {
            this.item.value.title = "";
        }
        this.item.value.marked_content = mark_text
        this.item.value.content = raw_text
        this.$emit("on-save", this.item)
    }
  },
  mounted(){
    // 将编辑器字体设置为 Consola
    const textareas = this.$refs.editor.getElementsByTagName("textarea")
    Array.from(textareas).forEach(element => element.style.setProperty('font-family', 'Consola', 'important'))
  }
};
</script>
