import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// 웹(모바일 브라우저·홈 화면에 추가한 앱)에서 휴대폰 뒤로가기로 모달을 닫기 위한 스택.
//
// 모달이 열리면 history 에 표시용 항목을 하나 깔고 닫는 함수를 스택에 올린다.
// 휴대폰 뒤로가기가 그 항목을 꺼내면(popstate) 화면 이동 대신 맨 위 모달만 닫는다.
// 모달이 버튼 등으로 스스로 닫히면 깔아 둔 항목을 history.back() 으로 걷어내고, 그때 오는 popstate 는 무시한다.
// (그 사이 화면 이동으로 다른 항목이 위에 쌓였으면 걷어내지 않고 둔다. 이후 뒤로가기 한 번이 평소처럼 화면 이동으로 처리된다.)
const OVERLAY_KEY = "__connectOverlay";

type Entry = { id: number; close: () => void };
const stack: Entry[] = [];
let seq = 0;
let ignorePops = 0;

const isWeb = () => Platform.OS === "web" && typeof window !== "undefined";

/** 모달이 열릴 때 부른다. 돌려받은 함수는 모달이 닫힐 때(어떤 이유로든) 부른다. */
export function registerBackClose(close: () => void): () => void {
  if (!isWeb()) return () => {};
  const id = ++seq;
  stack.push({ id, close });  window.history.pushState({ [OVERLAY_KEY]: id }, "");

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    const index = stack.findIndex((e) => e.id === id);
    if (index < 0) return; // 뒤로가기로 이미 닫혔다 (항목도 이미 꺼내졌다)
    stack.splice(index, 1);
    if (window.history.state?.[OVERLAY_KEY] === id) {
      ignorePops++;
      window.history.back();
    }
  };
}

/** popstate 를 모달 쪽에서 처리했으면 true. 이때 화면 뒤로가기는 하지 않는다. */
export function handleOverlayPopState(): boolean {
  if (ignorePops > 0) {
    ignorePops--;
    return true;
  }
  const top = stack.pop();
  if (!top) return false;
  top.close();
  return true;
}

/** visible 인 동안 휴대폰 뒤로가기가 onClose 를 부르게 한다. RN Modal·시트 등에 쓴다. */
export function useBackClose(visible: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!visible) return;
    return registerBackClose(() => onCloseRef.current());
  }, [visible]);
}

/**
 * Alert(@blazejkustra/react-native-alert) 는 웹에서 <dialog> 를 body 에 직접 붙였다 뗀다.
 * 호출하는 곳이 많아 일일이 감싸지 않고, 붙는 dialog 를 지켜보다가 스택에 올린다.
 * 뒤로가기로 닫으면 안드로이드 기본 Alert 처럼 버튼 콜백 없이 그냥 닫힌다.
 */
export function watchDialogsForBackClose(): () => void {
  if (!isWeb() || typeof MutationObserver === "undefined") return () => {};
  // 닫힘은 close 이벤트에만 기대지 않는다 (브라우저에 따라 안 오는 경우가 있다).
  // open 속성이 빠지거나 dialog 가 DOM 에서 빠지면 닫힌 것으로 본다.
  const disposers = new Map<HTMLDialogElement, () => void>();
  const disposeOf = (dialog: HTMLDialogElement) => {
    const dispose = disposers.get(dialog);
    if (!dispose) return;
    disposers.delete(dialog);
    dispose();
  };
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.target instanceof HTMLDialogElement) {
        if (!m.target.open) {
          disposeOf(m.target);
          m.target.remove(); // 닫힌 dialog 는 치운다 (라이브러리 정리가 close 이벤트에 기대기 때문)
        }
        continue;
      }
      m.removedNodes.forEach((node) => {
        if (node instanceof HTMLDialogElement) disposeOf(node);
      });
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLDialogElement) || disposers.has(node)) return;
        disposers.set(
          node,
          registerBackClose(() => {
            if (node.open) node.close();
            // close 이벤트가 안 와서 라이브러리가 못 치우는 경우를 대비해 직접 뗀다
            node.remove();
          })
        );
        node.addEventListener("close", () => disposeOf(node), { once: true });
        observer.observe(node, { attributes: true, attributeFilter: ["open"] });
      });
    }
  });
  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}
