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

      <div class="text item">
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



<script>
import { LevelDb, MessageBox,setLinkRule } from "../assets/js/utils";
import { mavonEditor } from "mavon-editor";
import "mavon-editor/dist/css/index.css";
let mdInstance = mavonEditor.getMarkdownIt()
setLinkRule(mdInstance)
export default {
  name: "addinfo",
  props: ["item"],
  components: {
    mavonEditor
  },
  methods: {
    save(raw_text,mark_text){
        var title = this.item.value.title;
        if (title.match(/^\s+?$/) || title === "") {
            this.item.value.title = "我是不是忘了写标题??";
        }
        this.item.value.marked_content = mark_text
        this.item.value.content = raw_text
        this.$emit("on-save", this.item);
    }
  }
};
</script>
