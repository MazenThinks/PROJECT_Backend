const fs = require('fs');
const path = require('path');

module.exports = function loadModels(modelsPath) {
  fs.readdirSync(modelsPath).forEach(file => {
    if (file.endsWith('.js')) {
      require(path.join(modelsPath, file));
    }
  });
};
