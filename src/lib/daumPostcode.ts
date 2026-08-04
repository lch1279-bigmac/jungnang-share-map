// 다음(카카오) 우편번호 서비스 로더. API 키 불필요, 무료.
// 버튼 클릭 시 한 번만 스크립트를 로드하고 이후 재사용한다.

export interface DaumPostcodeData {
  /** 도로명 주소 */
  roadAddress: string;
  /** 지번 주소 */
  jibunAddress: string;
  /** 사용자가 고른 주소 유형: R=도로명, J=지번 */
  userSelectedType: "R" | "J";
  /** 우편번호(5자리) */
  zonecode: string;
  /** 건물명 */
  buildingName: string;
  [key: string]: unknown;
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose?: (state: string) => void;
  onresize?: (size: { width: number; height: number }) => void;
  width?: string | number;
  height?: string | number;
}

interface DaumPostcodeInstance {
  open: () => void;
  embed: (el: HTMLElement) => void;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance;
    };
  }
}

const SCRIPT_SRC =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let loadPromise: Promise<void> | null = null;

export function loadDaumPostcode(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경이 아닙니다."));
  }
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // 실패 시 다음 클릭에 재시도 가능
      reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
