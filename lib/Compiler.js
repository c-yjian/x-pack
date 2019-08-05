let fs = require('fs');
let path = require('path');

// babylon 主要将源码转化为AST
// @babel/traverse 遍历到对应的节点
// @babel/types 遍历好的节点替换
// @babel/generator 替换好的结果再生成

let babylon = require('babylon');
let traverse = require('@babel/traverse').default;
let t = require('@babel/types');
let generator = require('@babel/generator').default;
let ejs = require('ejs');

class Compiler {
    constructor(config){
        // entry output
        this.config = config
        // 保存入口文件的路径
        // 保存所有的模块依赖

        this.entryId;
        this.modules = {};
        this.entry = config.entry;
        // 运行 npx x-pack 的工程路径 /Users/yangjian/my/myGitLab/webpackGroup/text-pack
        this.root = process.cwd();
    }

    // 通过路径，读取该路径对应文件的源码
    getSource(modulePath){

        // 获取配置中的规则
        let rules = this.config.module.rules;
        let content = fs.readFileSync(modulePath, 'utf8');

        // 获取每一个规则，分别取处理
        for (let i =0; i < rules.length; i ++) {
            let rule = rules[i];
            let { test, use } = rule;
            let len = use.length - 1;
            // 读取的文件和配置规则能匹配上，则用对应的loader去处理该文件
            if(test.test(modulePath)){
                 const normalLoader = ()=> {
                    // 先获取对应的最后一个 loader函数
                    let loader = require(use[len--]);
                    content = loader(content)
                    if(len >= 0){
                        normalLoader();
                    }
                }
                normalLoader();
            }
        }
        return content
    }

     /**
      * 解析源码
      * AST 解析语法树
      *
     */
    parse(source, parentPath){
        // 将文件内容解析为 AST
        let ast = babylon.parse(source);
        // 依赖的数组
        let dependencies = [];

        // 遍历 AST 语法树
        traverse(ast, {
            // 调用表达式 a(), require(),都是调用表达式
            // 只需要处理 require()这个调用表达式
            CallExpression(p){
                let node = p.node;
                if(node.callee.name === 'require'){
                    node.callee.name = '__xpack_require__';
                    // 取到模块的引用其他模块名字;
                    // 即 AST 解析 A文件源码，A文件require了B文件，得到B文件相对路径文件名
                    let moduleName = node.arguments[0].value;
                    // 得到类似 ./a.js
                    moduleName = moduleName + (path.extname(moduleName) ? '' : 'js');
                    // 得到类似 ./src/a.js;
                    moduleName = './' + path.join(parentPath, moduleName);
                    // A 文件依赖其他模块的依赖数组
                    dependencies.push(moduleName);
                    node.arguments = [t.stringLiteral(moduleName)];
                }
            }
        });

        let sourceCode = generator(ast).code;
        return { sourceCode, dependencies}
    }

    /**
     *  modulePath： 类比webpack 中配置的打包入口文件
     *  isEntry：是否是打包入口文件
     */
    buildModule(modulePath, isEntry){

        // 拿到模块的内容
        let source = this.getSource(modulePath);
        // 模块 id modulePath(总路径) - this.root(工作路径) = 文件的相对路径
        // get path like ./src/index.js
        let moduleName = './' + path.relative(this.root, modulePath);
        if(isEntry ){
            this.entryId = moduleName; // 保存入口的名字
        }
        // 需要把 source 源码进行改造，并返回一个依赖列表 params2: .src
        let { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName));
        // 路径名和文件内容对应起来
        // 得到类似 './src/a.js': 模块内容 的映射关系
        this.modules[moduleName] = sourceCode;

        // 解析 A 文件 A文件可能又会引入 B文件，所以需要递归一下
        // 附模块的加载 递归加载
        dependencies.forEach(dep => {
            this.buildModule(path.join(this.root, dep), false);
        })
    }

    /**
     *  发射文件
     *  用数据渲染我们的模板
     * */
    emitFile(){
        // 拿到输出到那个目录下
        let main = path.join(this.config.output.path, this.config.output.filename);
        // 根据模板的路径得到模板的内容
        let templateStr = this.getSource(path.join(__dirname, 'main.ejs'));
        // 模板字符串通过ejs模板渲染之后就是一个代码块
        let code = ejs.render(templateStr, {
            entryId:this.entryId,
            modules:this.modules
        });
        this.assets = {};
        // 资源中，路径对应的代码
        this.assets[main] = code;
        fs.writeFileSync(main, code);
    }

    run(){

        // 执行，并创建模块间的依赖关系
        this.buildModule(path.resolve(this.root, this.entry), true);

        // 发射一个文件，打包后的文件
        this.emitFile()

    }
}

module.exports = Compiler;
