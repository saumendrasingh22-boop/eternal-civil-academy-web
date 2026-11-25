/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "eternal-civil-academy-webs.vercel.app" }],
        destination: "https://www.eternalcivilacademy.com/:path*",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
