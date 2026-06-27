import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {};

export default withSerwist(withNextIntl(nextConfig));
