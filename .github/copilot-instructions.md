# Repo-specific instructions for AI coding agents

This file gives concise, actionable guidance for AI agents working on this Expo React Native app (TypeScript + a few legacy .js screens).

1. Big picture
- Entry: `App.tsx` — wraps `AuthProvider` and `DrawNavigation` inside `NavigationContainer`.
- Navigation stack: `DrawNavigation` -> `RootNavigation` -> `BottomTabNavigation` -> feature stacks (`ConnectNavigation`, `ChatNavigation`, `FriendNavigation`).
- Auth flow: `src/components/auth/AuthProvider.tsx` manages tokens in `AsyncStorage` and uses `axios` to call `/api/auth/*` endpoints.

2. Dev / run workflow
- Start (web dev server): `npm start` (runs `expo start --web --port 8082`).
- Mobile emulators: `npm run android` / `npm run ios` (via Expo). Use the Expo dev tools QR for physical devices.
- API base URL: controlled via `app.config.js` extra `API_BASE_URL`. Default for dev: `http://localhost:8889`.
- Web proxy: `webpack.config.js` proxies `/api` -> `http://localhost:8889` and `/ws-chat` -> `ws://localhost:8889` for web dev.

3. Important project conventions
- Path alias: `@/*` is configured in `tsconfig.json`; imports use `@/` (e.g. `import AuthContext from "@/components/auth/AuthContext"`).
- Mixed TSX and JS: some chat screens are plain `.js` (see `src/screens/chatScreen/*.js`) and are explicitly included in `tsconfig.json`.
- Commit/branch conventions: see `README.md` (emoji-based commit messages and branch naming like `feat/#12/post-detail`).

4. API & auth patterns to follow
- Use the shared axios instance in `src/utils/api.ts` which reads `API_BASE_URL` from Expo constants.
- `AuthProvider` stores `accessToken` and `refreshToken` in `AsyncStorage`. Calls to protected endpoints add `Authorization: Bearer <token>` header.
- Token refresh logic: `AuthProvider` attempts refresh on 400/expired token and will `signout()` on failure — follow same pattern when adding new secured calls.

5. Chat / websocket specifics
- Websocket endpoint: `SOCKET_URL` is `${API_BASE_URL}/ws-chat`. The app uses `@stomp/stompjs` + `sockjs-client` (see `src/screens/chatScreen/ChatRoomListScreen.js`).
- `src/utils/chat.ts` implements resilient behavior: if tokens or server endpoints are missing it falls back to local room creation (returns local room object). Reuse this pattern when adding offline-friendly features.

6. Files to inspect for context/examples
- `App.tsx`, `app.config.js`, `webpack.config.js`
- `src/components/auth/AuthProvider.tsx`, `src/components/auth/AuthContext.tsx`
- `src/utils/api.ts`, `src/utils/chat.ts`
- `src/screens/chatScreen/ChatRoomListScreen.js`, `src/screens/chatScreen/EnterChatRoom.js`
- `src/navigation/*` (DrawNavigation, RootNavigation, BottomTabNavigation, ChatNavigation)

7. Helpful implementation notes for PRs
- Respect the token refresh flow: prefer to use `AsyncStorage` keys `accessToken` / `refreshToken`. Avoid bypassing `AuthProvider`'s lifecycle unless intentionally creating offline fallbacks.
- For web development, rely on `webpack.config.js` proxy rather than hardcoding dev URLs in code.
- When adding new top-level routes, update `src/types.ts` navigation types.

8. What I (the agent) should NOT assume
- Do not assume a production API URL — use `Constants.expoConfig.extra.API_BASE_URL` and respect `EXPO_ENV` (see `app.config.js`).
- Do not assume module-resolver babel plugin is active; use the `@/*` alias as configured by `tsconfig.json`.

If any of these points are unclear or you want examples expanded (e.g., token refresh flow or websocket lifecycle), tell me which area to expand and I will iterate.
