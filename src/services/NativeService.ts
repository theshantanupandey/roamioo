
import { Capacitor } from '@capacitor/core';

class NativeService {
  isNative = Capacitor.isNativePlatform();
  platform = Capacitor.getPlatform();

  /**
   * Check if the app is running as a native app
   */
  isNativeApp(): boolean {
    return this.isNative;
  }

  /**
   * Get the current platform (ios, android, web)
   */
  getPlatform(): 'ios' | 'android' | 'web' {
    return this.platform as 'ios' | 'android' | 'web';
  }

  /**
   * Check if the app is running on iOS
   */
  isIOS(): boolean {
    return this.platform === 'ios';
  }

  /**
   * Check if the app is running on Android
   */
  isAndroid(): boolean {
    return this.platform === 'android';
  }

  /**
   * Get safe area insets for edge-to-edge experiences
   * Can be used to adjust UI for notches, home indicators, etc.
   */
  getSafeAreaClasses(): { top: string; bottom: string; left: string; right: string } {
    if (!this.isNative) {
      return { top: '', bottom: '', left: '', right: '' };
    }
    return {
      top: 'safe-top',
      bottom: 'safe-bottom',
      left: 'safe-left',
      right: 'safe-right'
    };
  }
}

// Export as a singleton
export const nativeService = new NativeService();
