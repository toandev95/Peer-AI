import { env } from './src/lib/env.mjs';

/** @type {import('next').NextConfig} */
const config = {
  output: env.NEXT_PUBLIC_APP_URL ? 'export' : 'standalone',
  reactStrictMode: true,
  eslint: { dirs: ['.'] },
  images: {
    unoptimized: !!env.NEXT_PUBLIC_APP_URL,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
  },
};

if (!env.NEXT_PUBLIC_APP_URL) {
  config.headers = () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  };
}

export default config;
