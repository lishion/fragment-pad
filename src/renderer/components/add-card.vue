<template>
    <div>
        <el-card
                class="box-card"
                style="margin-bottom: 18px"
                shadow="hover"
                header-style="background-color:#409EFF"
        >
            <div slot="header">
                <el-input v-model="note.title" placeholder="输入标题"></el-input>
            </div>

            <div class="text item" ref="editor">
                <mavon-editor
                        :subfield="false"
                        :toolbarsFlag="false"
                        :ishljs="true"
                        v-model="note.raw_content"
                        placeholder="..."
                        @save="save"
                ></mavon-editor>
            </div>
        </el-card>
    </div>
</template>

<style>
    .auto-textarea-wrapper .auto-textarea-input {
        font-family: Consola
    }
</style>


<script>
    import {MessageBox, setLinkRule} from "../assets/js/utils";
    import {mavonEditor} from "mavon-editor";
    import "mavon-editor/dist/css/index.css";

    let mdInstance = mavonEditor.getMarkdownIt();
    setLinkRule(mdInstance); // 给渲染的连接加上点击事件，传递打开链接的消息
    export default {
        name: "addinfo",
        props: ["note"],
        components: {
            mavonEditor
        },
        methods: {
            save(raw_content, rendered_content) {
                let title = this.note.title;
                if (title.match(/^\s+?$/) || title === "") {
                    this.note.title = "";
                }
                this.note.raw_content = raw_content;
                this.note.rendered_content = rendered_content;
                this.$emit("save", this.note)
            }
        },
        mounted() {
            // 将编辑器字体设置为 Consola
            const textAreas = this.$refs.editor.getElementsByTagName("textarea");
            Array.from(textAreas).forEach(element => element.style.setProperty('font-family', 'Consola', 'important'))
        }
    };
</script>
