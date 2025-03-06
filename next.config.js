/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore source map files
    config.module.rules.push({
      test: /\.map$/,
      loader: 'ignore-loader',
    });

    // Ignore browser imports in Playwright
    config.resolve.alias = {
      ...config.resolve.alias,
      'playwright-core/lib/server': false,
      'playwright-core/lib/grid': false,
      'playwright-core/lib/outofprocess': false,
    };

    return config;
  },
  serverExternalPackages: ['playwright-core'],
};

export default nextConfig;
