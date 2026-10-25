/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    // CI passes the deploy build time; locally this is when the dev server started
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  },
};

module.exports = nextConfig;
