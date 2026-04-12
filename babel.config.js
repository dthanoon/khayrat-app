module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@utils': './src/utils',
            '@constants': './src/constants',
          },
        },
      ],
      // react-native-reanimated MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
