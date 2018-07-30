<template>
    <el-card class="box-card" style="margin-bottom: 18px;border:0px" shadow="hover" header-style="background-color:#409EFF" >
        <div slot="header">
            <el-row :gutter="20" type="flex" justify="space-between">
                <el-col :span="16">
                    <slot name="title"></slot>
                </el-col>
                <el-col :span="4">
                    <el-button style="padding: 3px 0" type="text" icon="el-icon-close" @click="$emit('on-delete',itemKey)" :disabled="searchMode||(editingItemKey!=null)"></el-button>
                </el-col>
            </el-row>
        </div>
        <div class="text item" @dblclick="$emit('on-modify')">
            <slot name="content"></slot>
        </div>
    </el-card>
</template>


<script>
export default {
    name:"infocard",
    props:['itemKey','searchMode','editingItemKey']
}
</script>
