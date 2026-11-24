import React, { useEffect, useState } from 'react';
import { registerRootComponent } from 'expo';
import { loadThemeOverride } from '@/modules/themeOverride';

// 백오피스에서 바꾼 제품 색을 먼저 theme 에 반영한 뒤 App 을 불러온다.
// (화면 스타일이 모듈 로드 시점에 theme 값을 읽으므로 App 은 반드시 그 뒤에 require 해야 한다)
function Root() {
  const [App, setApp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    loadThemeOverride()
      .catch(() => {})
      .finally(() => setApp(() => require('./App').default));
  }, []);

  return App ? <App /> : null;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
