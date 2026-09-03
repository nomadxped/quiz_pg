import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/quiz_pg/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        chat: resolve(__dirname, 'chat.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
