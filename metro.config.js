const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

// Polyfill Node.js built-in modules for @smithy packages
config.resolver.extraNodeModules = {
  buffer: path.resolve(__dirname, "node_modules/buffer"),
  util: path.resolve(__dirname, "node_modules/util"),
  stream: path.resolve(__dirname, "node_modules/stream-browserify"),
};

module.exports = config;
