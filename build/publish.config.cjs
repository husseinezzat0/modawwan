const pkg = require('../package.json');
const config = structuredClone(pkg.build);
const publisher = process.env.WINDOWS_CERTIFICATE_PUBLISHER;
if (process.env.BUILD_OUTPUT_DIR) config.directories.output = process.env.BUILD_OUTPUT_DIR;
if (Boolean(process.env.CSC_LINK) !== Boolean(publisher)) {
  throw new Error('Set both signing credentials and WINDOWS_CERTIFICATE_PUBLISHER, or leave all signing values unset.');
}
if (publisher) {
  config.win.signtoolOptions = { ...config.win.signtoolOptions, publisherName: [publisher] };
}
module.exports = config;