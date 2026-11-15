import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{proxy:{'/api':{target:'https://firststep-india-jobs.wigglyfern512.chatgpt.site',changeOrigin:true}}}});
