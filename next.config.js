import webpack from "webpack";

const mode = process.env.BUILD_MODE ?? "standalone";
console.log("[Next] build mode", mode);

const disableChunk = !!process.env.DISABLE_CHUNK || mode === "export";
console.log("[Next] build with chunk: ", !disableChunk);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (disableChunk) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      );
    }

    config.resolve.fallback = {
      child_process: false,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      "node:fs": false,
      "node:https": false,
      "node:http": false,
      "node:path": false,
      "node:url": false,
      "node:crypto": false,
      "node:util": false,
      "node:stream": false,
      "node:buffer": false,
      "node:events": false,
      "node:string_decoder": false,
      "node:querystring": false,
      "node:zlib": false,
      "node:os": false,
      "node:constants": false,
      "node:timers": false,
      "node:assert": false,
      "node:tty": false,
      "node:readline": false,
      "node:vm": false,
      "node:worker_threads": false,
      "node:child_process": false,
      "node:cluster": false,
      "node:dgram": false,
      "node:dns": false,
      "node:domain": false,
      "node:http2": false,
      "node:inspector": false,
      "node:module": false,
      "node:perf_hooks": false,
      "node:process": false,
      "node:punycode": false,
      "node:repl": false,
      "node:trace_events": false,
      "node:v8": false,
      "node:async_hooks": false,
      "node:diagnostics_channel": false,
    };

    // Add externals for server-side only modules
    config.externals = config.externals || [];
    config.externals.push({
      'pptxgenjs': 'pptxgenjs',
    });

    return config;
  },
  
  output: mode === "export" ? "export" : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: mode === "export" || true,
    domains: ['aowvrhasuregcsqliqnl.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aowvrhasuregcsqliqnl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // 确保 SSR 兼容性
  serverExternalPackages: ['@supabase/supabase-js'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

const CorsHeaders = [
  { key: "Access-Control-Allow-Credentials", value: "true" },
  { key: "Access-Control-Allow-Origin", value: "*" },
  {
    key: "Access-Control-Allow-Methods",
    value: "*",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "*",
  },
  {
    key: "Access-Control-Max-Age",
    value: "86400",
  },
];

if (mode !== "export") {
  // Next.js 15 使用新的 headers API
  nextConfig.headers = async () => {
    return [
      {
        source: "/api/:path*",
        headers: CorsHeaders,
      },
    ];
  };

  // Next.js 15 使用新的 rewrites API
  nextConfig.rewrites = async () => {
    const ret = [
      // adjust for previous version directly using "/api/proxy/" as proxy base route
      // {
      //   source: "/api/proxy/v1/:path*",
      //   destination: "https://api.openai.com/v1/:path*",
      // },
      {
        // https://{resource_name}.openai.azure.com/openai/deployments/{deploy_name}/chat/completions
        source:
          "/api/proxy/azure/:resource_name/deployments/:deploy_name/:path*",
        destination:
          "https://:resource_name.openai.azure.com/openai/deployments/:deploy_name/:path*",
      },
      {
        source: "/api/proxy/google/:path*",
        destination: "https://generativelanguage.googleapis.com/:path*",
      },
      {
        source: "/api/proxy/openai/:path*",
        destination: "https://api.openai.com/:path*",
      },
      {
        source: "/api/proxy/anthropic/:path*",
        destination: "https://api.anthropic.com/:path*",
      },
      {
        source: "/google-fonts/:path*",
        destination: "https://fonts.googleapis.com/:path*",
      },
      {
        source: "/sharegpt",
        destination: "https://sharegpt.com/api/conversations",
      },
      {
        source: "/api/proxy/alibaba/:path*",
        destination: "https://dashscope.aliyuncs.com/api/:path*",
      },
      {
        source: "/api/proxy/siliconflow/:path*",
        destination: "https://api.siliconflow.cn/:path*",
      },
    ];

    return {
      beforeFiles: ret,
    };
  };
}

export default nextConfig;
