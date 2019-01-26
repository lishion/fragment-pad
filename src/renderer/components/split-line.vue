<template>
  <div
    class="split-line"
    :style="{backgroundColor:color,height:height,marginTop:top,marginBottom:bottom}"
  ></div>
</template>


<script>
export default {
    name : "splitline",
    props:{"color":{
        type:String,
        default:"rgb(200, 200, 159)"
    },
    "top":{
        default:"12px"
    },
    "bottom":{
        default:"12px"
    },"height":{
        default:"1.5px"
    }}
}
</script>

