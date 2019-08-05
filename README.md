
# x-pack
模仿webpack 开发自定义打包工具 

## 全局 link
cd 到项目根路径执行下面命令,将 x-pack 命令link到全局

```
 npm link
```

## unlink
cd 到项目根路径执行下面命令,将 x-pack 命令从全局unlink

```
 npm unlink
```


## 工程结构说明

```
|--bin              x-pack 自定义打包工具入口文件
|   |
|   |- pack.js      x-pack 入口执行文件，只要是读取打包工程中的xpack.config.js配置文件以及开始运行打包脚本
|
|--lib              x-pack打包脚本文件夹
|   |
|   |- Compiler.js  将项目中的源码打包
|   |- main.ejs     项目中打包生成文件的模板
|
|--node_modules     项目依赖
|
|--package.json     项目依赖配置
|
|--readME.md        项目说明文件
|

```

