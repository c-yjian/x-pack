let less = require('less');
function loader(source) {
    let css = '';
    less.render(source, function (err, c) {
        css = c.css
    });
    //处理转义字符串 \n -> \\n 第一个表转义
    css.replace(/\n/g, '\\n');
    return css
}

module.exports = loader();
