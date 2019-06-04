const postcss = require("postcss");
const syntax = require("postcss-less");
const Tokenizer = require("css-selector-tokenizer");
const genericNames = require("generic-names");
const getLocalIdentName = require("./getLocalIdentName");
const uniqBy = require("lodash.uniqby");
const fileNameList = [];
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const LocalIdentNameplugin = postcss.plugin("LocalIdentNameplugin", options => {
  return (less, result) => {
    function handle(less) {
      const rootNodes = less.nodes;
      for (let root_index = 0;root_index < rootNodes.length;root_index++) {
        const rootNode = rootNodes[root_index];
        const nodes = rootNode.nodes;
        if (rootNode.type === 'decl') {
          const propValue = rootNode.value;
          if (propValue.indexOf('@') === -1) {
            rootNode.remove();
            root_index--;
          }
        } else if (rootNode.type === 'rule') {
          for (let i = 0;i < nodes.length;i++) {
            const node = nodes[i];
            if (node.type === 'decl') {
              const propValue = node.value;
              if (propValue.indexOf('@') === -1) {
                node.remove();
                i--;
              }
            } else if (node.type === 'rule') {
              handle(node);
              if (node.nodes.length === 0) {
                node.remove();
                i--;
              }
            } else if (node.type == 'comment') {
              node.remove();
              i--;
            }
          }
        } else if (rootNode.type == 'comment') {
          rootNode.remove();
          root_index--;
        }
        if (nodes && nodes.length === 0) {
          rootNode.remove();
          root_index--;
        }
      }
    }
    handle(less);
    less.walkAtRules(atRule => {

    });
  };
});

const AddlocalIdentName = (lessPath, lessText) => {
  return postcss([
    LocalIdentNameplugin()
  ])
    .process(lessText, {
      from: lessPath,
      syntax
    })
    .then(result => {
      result.messages = uniqBy(fileNameList);
      return result;
    });
};

const loopAllLess = async () => {
  const promiseList = [];

  promiseList.push(
    AddlocalIdentName(path.join(__dirname, 'test.less'), fs.readFileSync(path.join(__dirname, 'test.less'))).then(
      result => {
        return result.content.toString();
      },
      err => err
    )
  );
  const lessContentArray = await Promise.all(promiseList);
  const content = lessContentArray.join("\n \n");

  return Promise.resolve(
    prettier.format(content, {
      parser: "less"
    })
  );
};
loopAllLess().then(
  content => {
    fs.writeFileSync('./out.less', content.replace(/background.*?url(.*)(.|\s)*?(?<=;)/igm, '').replace(/:global\((.*?)\)/igm, '$1'));
  },
  () => {
    console.log('error')
  }
);
