module.exports = function(api) {
  const isProduction = api.env('production');

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove console.log in production builds only (per D-07)
      ...(isProduction
        ? [
            [
              'babel-plugin-remove-console',
              {
                exclude: ['error', 'warn'], // Keep console.error and console.warn in production
              },
            ],
          ]
        : []),
    ],
  };
};
