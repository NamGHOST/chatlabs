const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const nrExternals = require("newrelic/load-externals");

const withPWA = require("next-pwa")({
  dest: "public"
});

const { withSentryConfig } = require("@sentry/nextjs");

const newrelicConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp", "onnxruntime-node", "newrelic"]
  },
  webpack: config => {
    nrExternals(config);
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  }
};

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1"
      },
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "https",
        hostname: "replicate.delivery"
      },
      {
        protocol: "https",
        hostname: "*.replicate.delivery"
      }
    ]
  }
};

const config = withBundleAnalyzer(
  process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig
);

module.exports = withSentryConfig(config, {
  org: "nam1st-app",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true
  },
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
