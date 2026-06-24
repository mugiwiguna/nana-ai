module.exports = {
  apps: [
    {
      name: "nanaAI",
      cwd: "/home/ubuntu/nanaai",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        AUTH_TRUST_HOST: "true",
        NEXTAUTH_URL: "https://nana.mwcs.dev",
        AUTH_URL: "https://nana.mwcs.dev",
        AUTH_SECRET: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/home/ubuntu/nanaai/logs/error.log",
      out_file: "/home/ubuntu/nanaai/logs/out.log",
      merge_logs: true,
      max_memory_restart: "500M",
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
