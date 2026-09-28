import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pixelbead.studio',
  appName: '拼豆糕手',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
  },
  server: {
    allowNavigation: [
      '*.upstash.io',
      '*.vercel.app',
      'pindou.danzaii.cn',
    ],
  },
};

export default config;
