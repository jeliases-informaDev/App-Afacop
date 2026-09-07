const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite a Expo empaquetar los archivos WebAssembly de expo-sqlite para la web
config.resolver.assetExts.push('wasm');

module.exports = config;