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

    // Ignore puppeteer/lib imports in chrome-aws-lambda
    config.resolve.alias = {
      ...config.resolve.alias,
      'puppeteer/lib/cjs/puppeteer/common/Browser': false,
      'puppeteer/lib/cjs/puppeteer/common/FrameManager': false,
      'puppeteer/lib/cjs/puppeteer/common/Page': false,
    };

    return config;
  },
};

export default nextConfig;
