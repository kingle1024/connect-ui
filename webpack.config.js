const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // 개발 서버에만 적용되는 프록시 설정
  config.mode = 'dev';
  if (config.mode === 'dev') {
    config.devServer = {
      ...config.devServer,
      proxy: {
        '/api': {
          target: 'http://localhost:8888',
          changeOrigin: true,
          secure: false,
          // pathRewrite: { '^/api': '' }, // 필요한 경우, '/api' 경로 접두사를 제거합니다.
        },
        // 웹소켓 프록시 설정 (웹소켓 연결에도 CORS가 필요할 경우)
        '/ws-chat': {
          target: 'ws://localhost:8888', // 백엔드 웹소켓 서버 주소
          ws: true, // 웹소켓 프록시를 활성화합니다.
          changeOrigin: true,
          secure: false,
        },
      },
    };
  }

  return config;
};
