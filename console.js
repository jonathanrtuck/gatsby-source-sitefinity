/**
 * @constant
 * @function
 * @param {string} str
 */
exports.error = (str) => {
  console.error('\x1b[31m%s\x1b[0m', '\nerror', str);
};

/**
 * @constant
 * @function
 * @param {string} str
 */
exports.success = (str) => {
  console.log('\x1b[32m%s\x1b[0m', '\nsuccess', str);
};
