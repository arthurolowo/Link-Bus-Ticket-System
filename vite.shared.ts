// Shared Vite config for both vite.config.ts and server/vite.ts
import react from '@vitejs/plugin-react';

const sharedConfig = {
  plugins: [react()],
  server: {
    port: 5173, // you can change this if needed
  },
};

export default sharedConfig;
