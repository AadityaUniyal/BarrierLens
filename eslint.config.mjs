import nextConfig from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextConfig,
  {
    ignores: ['.next/**', 'node_modules/**', 'scratch/**', '.agents/**', 'test-results/**'],
  },
];

export default config;
