
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2a6b959646ff4fec92897d531151a4ff',
  appName: 'tripd',
  webDir: 'dist',
  server: {
    url: 'https://2a6b9596-46ff-4fec-9289-7d531151a4ff.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  ios: {
    contentInset: "always"
  },
  android: {
    backgroundColor: "#FFFFFF"
  }
};

export default config;
