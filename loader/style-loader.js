
/**
 *
 *  ${JOSN.stringify(source)}主要处理代码换行的情况
 *  返回的是一个可执行的代码脚本，到时候 eval执行该脚本
 * */

function loader(source) {
   let style = `
        let style = document.create.Element('style');
        style.innerHTML = ${JOSN.stringify(source)}     
        document.head.appendChild(style);
   `;
    return style
}

module.exports = loader();
