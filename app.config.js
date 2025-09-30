// app.config.js (프로젝트 루트에 생성)

module.exports = ({ config }) => {
  // 기본 설정
  const defaultConfig = {
    ...config, // 기존 app.json의 내용들을 여기에 합쳐도 됨
    name: "MyExpoApp",
    slug: "myexpoapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      // 개발 환경 기본값 (아래 EXPO_ENV 환경 변수로 오버라이드될 수 있음)
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      ANOTHER_SECRET_KEY: "dev_secret_key_123",
      eas: {
        // EAS 빌드를 위한 설정
        projectId: "YOUR_EAS_PROJECT_ID", // EAS에 등록된 프로젝트 ID
      },
    },
  };

  // EXPO_ENV 환경 변수에 따라 다른 설정을 로드 (빌드 시 사용)
  if (process.env.EXPO_ENV === "production") {
    defaultConfig.extra.API_BASE_URL =
      "https://port-0-connect-service-mahm3yer16ed563d.sel4.cloudtype.app";
    defaultConfig.extra.ANOTHER_SECRET_KEY = "prod_super_secret_key";
    defaultConfig.android.package = "com.yourcompany.app.prod"; // 패키지명 변경
    defaultConfig.ios.bundleIdentifier = "com.yourcompany.app.prod"; // 번들 ID 변경
  } else if (process.env.EXPO_ENV === "staging") {
    defaultConfig.extra.API_BASE_URL = "https://api.staging.test.com";
    defaultConfig.extra.ANOTHER_SECRET_KEY = "staging_secret_key";
    defaultConfig.android.package = "com.yourcompany.app.staging";
    defaultConfig.ios.bundleIdentifier = "com.yourcompany.app.staging";
  }

  return defaultConfig;
};
