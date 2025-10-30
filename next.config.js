/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegurar que no hay conflicto con Pages Router
  experimental: {
    // Desactivar cualquier experimental que pueda causar problemas
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;