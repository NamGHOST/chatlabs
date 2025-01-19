const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const nrExternals = require("newrelic/load-externals");

const withPWA = require("next-pwa")({
  dest: "public"
});

const { withSentryConfig } = require("@sentry/nextjs");

// Base Next.js config
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**"
      },
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ["sharp", "onnxruntime-node", "newrelic"]
  },
  webpack: (config) => {
    nrExternals(config);
    return config;
  }
};

// Combine configurations
let config = withBundleAnalyzer(
  process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig
);

// Sentry configuration
const sentryConfig = {
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
};

// Export the final configuration
module.exports = withSentryConfig(config, sentryConfig);
