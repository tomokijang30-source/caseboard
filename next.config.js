/** @type {import('next').NextConfig} */
const nextConfig = {};

// Only wrap with Sentry if the DSN is configured. Otherwise the build does
// not pull in the Sentry build plugin and emits no Sentry-specific output.
module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? require("@sentry/nextjs").withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Source-map upload is skipped if SENTRY_AUTH_TOKEN is not set.
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : nextConfig;
