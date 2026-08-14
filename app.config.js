// app.config.js (프로젝트 루트에 생성)

module.exports = ({ config }) => {
  // 기본 설정
  const defaultConfig = {
    ...config, // 기존 app.json의 내용들을 여기에 합쳐도 됨
    name: "같이타",
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
        // Android 13+ 테마 아이콘. 시스템이 알파만 뽑아 단색으로 틴트하므로
        // 전경 레이어와 같은 파일(투명 배경 + 흰 실루엣)을 그대로 쓴다.
        monochromeImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FF5A2F",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
      lang: "ko",
      description: "같이 탈 사람을 찾고 채팅으로 바로 연결되는 카풀 서비스",
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

  // 빌드 환경에서 EXPO_ENV 를 넘겨주면 그 값을 쓰고, 없으면 로컬 개발로 본다.
  // (예전에는 무조건 'dev' 로 덮어써서 production 분기가 절대 실행되지 않았다)
  process.env.EXPO_ENV = process.env.EXPO_ENV || 'dev';
  // EXPO_ENV 환경 변수에 따라 다른 설정을 로드 (빌드 시 사용)
  if (process.env.EXPO_ENV === "production") {
    defaultConfig.extra.API_BASE_URL = "https://port-0-connect-service-mahm3yer16ed563d.sel4.cloudtype.app";
    defaultConfig.extra.ANOTHER_SECRET_KEY = "prod_super_secret_key";
    defaultConfig.android.package = "com.yourcompany.app.prod"; // 패키지명 변경
    defaultConfig.ios.bundleIdentifier = "com.yourcompany.app.prod"; // 번들 ID 변경
  } else if (process.env.EXPO_ENV === "staging") {
    defaultConfig.extra.API_BASE_URL = "https://api.staging.test.com";
    defaultConfig.extra.ANOTHER_SECRET_KEY = "staging_secret_key";
    defaultConfig.android.package = "com.yourcompany.app.staging";
    defaultConfig.ios.bundleIdentifier = "com.yourcompany.app.staging";
  } else if (process.env.EXPO_ENV === "dev") {
    // EXPO_PUBLIC_API_BASE_URL로 백엔드 주소를 바꿔 띄울 수 있게 한다 (기본 8888)
    defaultConfig.extra.API_BASE_URL =
      process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8888";
    defaultConfig.extra.ANOTHER_SECRET_KEY = "prod_super_secret_key";
    defaultConfig.android.package = "com.yourcompany.app.prod"; // 패키지명 변경
    defaultConfig.ios.bundleIdentifier = "com.yourcompany.app.prod"; // 번들 ID 변경
  }

  return defaultConfig;
};
