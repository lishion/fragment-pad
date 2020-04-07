# fragment-pad

fragment-pad 是一款为整理碎片知识而开发的 APP，基于 Electron 编写，支持 linux,win,macOS. 

## 应用定位
1. 用于整理小而常用的知识点，这些知识点太小，以至于不便于记录在笔记中
2. 用于查找常用知识点

## 应用功能
1. 采用 markdown 编辑器，简洁高效
2. 全局搜索，方便快捷

## 编译&运行
1. git clone `git@git.dev.tencent.com:lin3x/fragment-pad.git`
2. cd `fragment-pad`
3. npm install
4. npm run build: linux|windows

或者直接下载 release 版本:
[fragment-pad-release](https://github.com/lishion/fragment-pad/releases)

## 使用方法
1. 点击 + 新增
2. 点击 x 删除
3. ctrl + s 保存
4. esc 取消编辑
5. 输入内容回车进行搜索, esc 退出搜索界面

## demo
演示地址 https://s1.ax1x.com/2020/04/07/G2dVaV.gif

## 感谢
* 输入，渲染部分采用了@hinesboy的[mavonEditor](https://github.com/hinesboy/mavonEditor#readme)