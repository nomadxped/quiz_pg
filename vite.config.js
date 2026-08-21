import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/quiz_pg/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
