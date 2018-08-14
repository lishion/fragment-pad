var myMarked = require('marked');
var highlight = require('highlight.js')
var myRender = new myMarked.Renderer()

// highlight.configure({
//       tabReplace: '    ', // 4 spaces
//       useBR:true           
// })

myRender.link = (href,titie,text)=>{
      console.info(href)
      return ` <a href="javacript:void(0)" my-target="${href}" class="content-url">${text}</a> `  
}

myRender.hr = ()=>{
      return '<div class="line"></div>'
}

// myRender.code = (code,language,escaped)=>{
//       var fixSpace = myFixMarkup(code)
//       var fixed = highlight.fixMarkup(highlight.highlight(language,fixSpace).value)
       
//       return fixed
// }

// // 支持代码高亮
myMarked.setOptions({
      renderer: myRender,
      highlight: function(code) {
            return highlight.highlightAuto(code).value;
          }
 });

export default myMarked