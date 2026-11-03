# 우리동네 나눔가게 및 아름다운 이웃 지도

서울 중랑구의 나눔가게를 **식품 · 생활·의류 · 보건의료**로 나누어 살펴보고, 가게를 누르면 지도로 위치를 확인할 수 있는 지역 주민 홍보용 모바일 친화 웹앱입니다.

- 배포: Vercel (`https://jungnang-share-map.vercel.app`)
- 주민 화면: `/` (누구나 열람)
- 관리자 화면: `/admin` (허용된 관리자만 수정 가능)

## 주요 기능

**주민**
- 카테고리·동네(면목동, 상봉동, 중화동 …)별로 나눔가게 목록 보기와 검색
- 가게 상세: 소개, 주소, 비고, 전화 걸기(번호가 있을 때)
- 네이버 지도 · 카카오맵 · 구글 지도로 위치 열기
- 의견·수정요청 보내기 (익명 가능, 연락처는 선택)

**관리자**
- 가게 추가 · 수정 · 삭제 (삭제는 휴지통으로 이동, 복원 또는 영구삭제 가능)
- 주소 입력 시 다음(카카오) 우편번호 검색, 동네(법정동) 자동 판정
- 주민 의견함 확인 · 처리 완료 표시 · 삭제
- 비밀번호 설정 페이지 (`/admin/reset-password`)

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | TanStack Start (React 19, SSR) + TanStack Router / Query |
| 빌드 | Vite 8, Nitro (Vercel 프리셋) |
| 스타일 | Tailwind CSS v4, Radix UI 기반 컴포넌트 |
| 데이터 · 인증 | Supabase (Postgres + Auth + RLS) |
| 배포 | Vercel |
| 패키지 매니저 | Bun |

## 폴더 구조

```
src/
  routes/          페이지 (index, admin, admin.reset-password)
  components/      ShopExplorer, ShopFormModal, MapPanel, FeedbackModal, FeedbackInbox, TrashModal …
  data/            Supabase 조회·변경 훅 (shopsStore, feedbackStore), 가게 타입과 동네 판정(shops.ts)
  integrations/    Supabase 클라이언트, 서버 인증 미들웨어
  lib/api/         서버 함수 (geocode.functions.ts: 주소 → 법정동 변환)
supabase/
  migrations/      DB 스키마와 RLS 정책 (번호 순서대로 실행)
.github/workflows/ keepalive.yml (Supabase 자동 정지 방지)
```

## 동작 구조

- 가게 목록과 의견 제출은 브라우저에서 Supabase로 직접 요청하며, 접근 권한은 **DB의 행 수준 보안(RLS)** 이 결정합니다.
- 서버 함수는 `resolveRegion`(카카오 로컬 API로 주소의 법정동 조회) 하나이며, 로그인 토큰을 서버에서 검증한 뒤에만 동작합니다. `KAKAO_REST_API_KEY`가 없으면 동네를 수동으로 입력하는 방식으로 대체됩니다.

## 시작하기

[Bun](https://bun.sh)이 필요합니다.

```sh
git clone https://github.com/lch1279-bigmac/jungnang-share-map.git
cd jungnang-share-map
bun install
cp .env.example .env   # 값을 채운 뒤 실행
bun run dev            # http://localhost:8080
```

| 스크립트 | 설명 |
|---|---|
| `bun run dev` | 개발 서버 |
| `bun run build` | 프로덕션 빌드 (Vercel 출력 생성) |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |

### 환경변수

| 이름 | 용도 |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | 서버용 Supabase 접속 정보 |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | 브라우저용 (공개 키) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용, RLS 우회. **절대 커밋·노출 금지** |
| `KAKAO_REST_API_KEY` | (선택) 주소 → 법정동 변환 |

Vercel에도 같은 값을 Environment Variables로 등록해야 합니다.

## 데이터베이스와 관리자 권한

1. `supabase/migrations/`의 SQL을 번호 순서대로 Supabase SQL Editor에서 실행합니다.
2. **관리자는 `admins` 테이블에 등록된 사용자만** 가게를 수정하거나 휴지통·의견함을 볼 수 있습니다. 가게 정보는 누구나 읽을 수 있습니다.
3. 새 관리자 추가 순서:
   - Supabase → Authentication → Users → Add user로 계정을 만듭니다.
   - SQL Editor에서 아래를 실행합니다.

```sql
insert into public.admins (user_id)
select id from auth.users where email = '추가할@이메일'
on conflict do nothing;
```

4. 권장 설정: Supabase의 Authentication → Providers → Email에서 **Allow new users to sign up**을 꺼서 외부인의 계정 생성을 막습니다.

## 자동 정지 방지 (keep-alive)

Supabase 무료 플랜은 일정 기간 요청이 없으면 프로젝트가 일시정지됩니다. `.github/workflows/keepalive.yml`이 매일 한 번 `shops`를 조회해 이를 방지합니다.

- GitHub 저장소 Settings → Secrets and variables → Actions에 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`를 등록해야 합니다 (공개용 키만 사용, 서비스 키 금지).
- Actions 탭에서 수동 실행해 성공 여부를 확인할 수 있고, 실패하면 GitHub 알림이 옵니다.
- 저장소에 오래 활동이 없으면 GitHub이 예약 실행을 멈출 수 있으니, 알림이 오면 Actions 탭에서 다시 켜 주세요.

## 운영 메모

- 링크 미리보기용 `og:url` · `og:image`는 `src/routes/__root.tsx`에 도메인이 고정되어 있습니다. 도메인을 바꾸면 함께 수정하세요.
- 의존성 업데이트 시 TanStack Start의 서버 함수 API가 바뀔 수 있으므로, 빌드 통과만 보지 말고 `/`와 `/admin`이 실제로 열리는지 확인하세요. (v1.169부터 `.inputValidator()`가 `.validator()`로 바뀌었고 vite 8 이상이 필요합니다.)
- 이 PC의 git 기본 계정이 팀 계정과 다르면 Vercel이 배포를 막을 수 있습니다. 커밋 작성자가 Vercel 팀 멤버인지 확인하세요.
