const path = require('path');

module.exports = (pathstr, excludeIdent) => {
  const antdProPath = pathstr.match(/src(.*)/)[1].replace('.less', '');
  const arr = antdProPath
    .split('/')
    .map(a => a.replace(/([A-Z])/g, '-$1'))
    .map(a => a.toLowerCase());
  if (path.resolve(pathstr) === path.resolve(excludeIdent)) {
    return '';
  }
  return `tg${arr.join('-')}-`.replace(/--/g, '-');
};
