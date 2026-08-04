import { createFileRoute } from "@tanstack/react-router";
import { ShopExplorer } from "@/components/ShopExplorer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "중랑구 나눔가게 지도 — 우리동네 나눔가게" },
      {
        name: "description",
        content:
          "서울 중랑구의 나눔가게를 식품·생활·의류·보건의료로 살펴보고, 가게를 누르면 구글지도로 위치를 확인할 수 있는 모바일 친화 지도 앱.",
      },
      { property: "og:title", content: "중랑구 나눔가게 지도 — 우리동네 나눔가게" },
      {
        property: "og:description",
        content:
          "서울 중랑구의 나눔가게를 식품·생활·의류·보건의료로 살펴보고, 가게를 누르면 구글지도로 위치를 확인할 수 있는 모바일 친화 지도 앱.",
      },
    ],
  }),
  component: Index,
});

// 공개 링크: 읽기 전용 (수정·삭제·추가는 /admin 에서만)
function Index() {
  return <ShopExplorer />;
}
