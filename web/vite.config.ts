import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// 前端启动日志插件
function frontendBannerPlugin() {
  return {
    name: 'frontend-banner',
    configureServer(server: any) {
      server.httpServer?.once('listening', () => {
        const colors = {
          reset: '\x1b[0m',
          bright: '\x1b[1m',
          green: '\x1b[32m',
          yellow: '\x1b[33m',
          blue: '\x1b[34m',
          magenta: '\x1b[35m',
          cyan: '\x1b[36m',
          white: '\x1b[37m',
        };

        console.log('');
        console.log(`${colors.bright}${colors.blue}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}║${colors.reset}  ${colors.bright}${colors.cyan}🌸 局域网文件中心${colors.white} - 前端服务${colors.reset} ${colors.bright}${colors.blue}║${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}╠════════════════════════════════════════════════════════════════╣${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}║${colors.reset}  ${colors.green}✓${colors.reset} 前端已启动${colors.white} ${colors.bright}${colors.blue}║${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}║${colors.reset}  ${colors.cyan}→${colors.reset} 访问地址: ${colors.yellow}http://localhost:5173${colors.reset} ${colors.bright}${colors.blue}║${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}║${colors.reset}  ${colors.cyan}→${colors.reset} API 代理: ${colors.yellow}/api → http://localhost:9000${colors.reset} ${colors.bright}${colors.blue}║${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════════════════════╝${colors.reset}`);
        console.log('');
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), frontendBannerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'naive-ui': ['naive-ui'],
        },
      },
    },
  },
});
