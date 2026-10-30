const path = require('node:path');
const pkg = require('../package.json');

module.exports = {
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: {
        ios: null,
        android: {},
      },
    },
  },
};
