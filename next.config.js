/** @type {import('next').NextConfig} */

const nextConfig = {
    //trailingSlash : true,
    reactStrictMode: true,
    experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};



module.exports = nextConfig
