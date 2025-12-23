module.exports = {
  apps: [
    {
      name: 'file-center',
      script: 'server/dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
      },
    },
  ],
};
