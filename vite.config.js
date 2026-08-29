import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 비용 최소화: 별도 서버/백엔드 없이 정적 빌드만 사용
export default defineConfig({
  plugins: [react()],
});
