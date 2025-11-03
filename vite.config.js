import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: {
      allow: ['..', '/Users/dmitrijsamohvalov/Documents/manticon']
    }
  }
})