# KOMICARE

서울을 찾는 외국인 의료 여행자를 위한 피부과·성형외과 매칭 사이트입니다. 정적 페이지(HTML/CSS/JS)와 Vercel Serverless Function(`api/`), Supabase(PostgreSQL)로 구성되어 있습니다.

| 경로 | 내용 |
|---|---|
| `/` (`index.html`) | 메인 페이지 — 피부 타입 진단, 병원 디렉토리, 리뷰, 다국어(en/ko/ja/zh), 라이트·다크 테마 |
| `/clinic` (`clinic.html`) | 파트너 병원 등록 포털 (초대 코드 필요) |
| `/whitepaper` (`whitepaper.html`) | 파트너 의료진용 백서 |
| `api/clinics.js` | 병원 목록 API (파트너 병원 + 공공데이터 병원) |
| `api/submit-clinic.js` | 파트너 병원 등록 API |
| `api/book.js`, `api/subscribe.js` | 예약, 대기자 명단 API |
| `scripts/import-hira.js` | 건강보험심사평가원 공공데이터 가져오기 스크립트 |
| `.github/workflows/import-hira.yml` | 매월 공공데이터 자동 갱신 (GitHub Actions) |
| `data/hira-sync.json` | 마지막 자동 갱신 결과 (자동으로 커밋됨) |
| `supabase_schema.sql` | DB 스키마 |

코드 구조와 변경 내역은 [walkthrough.md](walkthrough.md)에 정리되어 있습니다.

---

## 1. 처음 설정하기

### 1-1. Supabase

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. **SQL Editor** → **New query**에 [supabase_schema.sql](supabase_schema.sql) 전체를 붙여넣고 **Run**을 누릅니다.
3. **Project Settings → API**에서 아래 두 값을 확인합니다.
   - **Project URL** (`https://<project-id>.supabase.co`) → `SUPABASE_URL`
   - **service_role key** (비공개) → `SUPABASE_SERVICE_ROLE_KEY`
     > `anon` 키가 아니라 `service_role` 키여야 서버에서 쓰기가 됩니다. 이 키는 절대 프론트엔드 코드나 채팅에 붙여넣지 마세요.

#### 이미 DB를 만들어 둔 경우 (마이그레이션)

기존 DB에는 최근 추가된 컬럼이 없습니다. SQL Editor에서 [supabase_schema.sql](supabase_schema.sql)의 아래 두 블록만 실행하세요. 여러 번 실행해도 안전합니다.

- **5-1**: 파트너 포털 다국어 표기 저장 (`translations` 컬럼)
- **5-2**: 공공데이터 병원 저장 (`source`, `hira_ykiho`, `address`, `phone` 등 + 파트너 전용 컬럼의 NOT NULL 해제)
- **5-3**: 병원명 UNIQUE 제약 제거. 서울에는 이름이 같은 서로 다른 병원이 있어(예: 갤러리아피부과의원 5곳) 이 제약이 있으면 일부가 저장되지 않습니다

실행하지 않아도 사이트와 병원 등록은 동작하지만, 번역과 공공데이터는 저장되지 않습니다.

### 1-2. Vercel 환경 변수

Vercel 프로젝트 → **Settings → Environment Variables**에 추가합니다.

| 이름 | 필수 | 설명 |
|---|---|---|
| `SUPABASE_URL` | ✓ | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase service_role key |
| `PARTNER_INVITE_CODE` | ✓ | 파트너 포털 초대 코드. 서버에서만 검증되며, 없으면 파트너 등록이 막힙니다 |
| `HIRA_SERVICE_KEY` | 공공데이터 사용 시 | data.go.kr 건강보험심사평가원 병원정보서비스 키 |

Supabase 값이 없으면 API는 샘플 데이터로 동작하는 시뮬레이션 모드가 됩니다(로컬 미리보기용).

### 1-3. 배포

GitHub `main` 브랜치에 푸시하면 Vercel이 자동으로 배포합니다. 로컬에서 API까지 함께 실행하려면:

```bash
vercel env pull .env.local
```

```bash
vercel dev
```

---

## 2. 파트너 포털 사용법 (`/clinic`)

병원 원장님이 직접 병원을 등록하는 페이지입니다.

1. `/clinic`에 접속해 운영자에게 받은 **초대 코드**를 입력합니다. 코드는 서버에서만 확인되며 페이지 소스에는 들어 있지 않습니다.
2. **기본 정보**를 입력합니다. 병원명·위치·소개·직함·소개글은 `English | 한국어` 형식으로 쓰면 한국어 화면에서 한국어 부분이 표시됩니다.
   - 예: `Aura Skin Clinic | 아우라 피부과`
3. **Specialties**에서 시술을 선택하고, 의사 자격·경력·진료시간·안전 항목을 체크합니다.
4. **지도(선택)**: Google 지도 → 공유 → 지도 퍼가기의 `src` 주소(`https://www.google.com/maps/embed?...`)만 붙여넣습니다. 다른 주소는 거부됩니다.
5. **🌐 Translations (다국어 표기)**: 한국어 / 日本語 / 中文 탭에서 병원명, 위치, 소개, 의사 이름·직함·소개, 진료시간을 각 언어로 입력합니다.
   - 탭에 `2/4`처럼 채운 개수가, 다 채우면 `✓`가 표시됩니다.
   - 아래 경고 상자에 **비어 있어서 영어로 표시될 수 있는 항목**이 언어별로 나옵니다.
   - 빈 항목이 있는 채로 등록하면 확인 창이 뜹니다. 취소하면 비어 있는 언어 탭으로 이동합니다.
   - 비워 둔 항목은 사이트의 자동 번역 사전에 있는 단어로만 이루어진 경우 자동 번역되고, 그렇지 않으면 영어 원문 그대로 표시됩니다(언어가 섞여 나오지 않습니다).
6. 오른쪽 **Real-time Preview**로 카드 모양을 확인한 뒤 **Submit Registration**을 누릅니다.

DB에 마이그레이션 5-1이 적용되지 않았다면 등록은 되지만 "번역이 저장되지 않았다"는 안내가 뜹니다.

등록 직후에는 평점이 없으므로 카드에 별점 대신 **"신규"**가, 상세 화면에 "아직 리뷰가 없습니다"가 표시됩니다. 평점과 13개 항목 점수는 실제 방문 인증 리뷰가 쌓인 뒤에만 나타납니다.

---

## 3. 공공데이터로 실제 병원 정보 가져오기

건강보험심사평가원 **병원정보서비스** 공공데이터([data.go.kr](https://www.data.go.kr)에서 "건강보험심사평가원_병원정보서비스" 검색)로 서울의 **피부과·성형외과** 병원 기본정보를 가져옵니다.

### 가져오는 것 / 가져오지 않는 것

| 가져오는 정보 | 표시하지 않는 정보 |
|---|---|
| 병원명, 주소, 전화번호, 홈페이지, 진료과목, 종별(의원/병원), 의사 수·전문의 수, 좌표(지도) | 평점, 리뷰, 의사 이름·프로필, 수면마취·외국인 보험·애프터케어 등 안전 배지, 예약 |

공공데이터에는 의사 이름이 없으므로, 공공데이터 병원은 병원명·지역·주소·진료과목으로만 검색됩니다(원장 이름으로 찾게 하려면 해당 병원이 포털로 파트너 등록을 해야 합니다). 공공데이터 병원은 코미케어가 검증한 곳이 아니므로 사이트에 **"미인증 · 공공데이터"** 배지와 출처를 함께 표시하고, 파트너 병원 뒤에 나열합니다. 평점·리뷰 필터를 켜면 공공데이터 병원은 제외됩니다. 실제 리뷰나 파트너 등록 없이 평점·의사 정보를 붙이지 마세요(사실과 다른 광고가 될 수 있습니다).

### 실행 방법

1. [data.go.kr](https://www.data.go.kr)에서 **"건강보험심사평가원_병원정보서비스"** 활용 신청 → 승인 후 마이페이지에서 서비스 키를 확인합니다. (Encoding / Decoding 키 중 아무거나 사용 가능)
2. Vercel 환경 변수에 `HIRA_SERVICE_KEY`를 추가합니다.
3. DB에 마이그레이션 **5-2**를 적용합니다.
4. 로컬에 환경 변수를 받습니다.
   ```bash
   vercel env pull .env.local
   ```
5. 먼저 저장 없이 확인합니다. 결과는 `scripts/hira-preview.json`에 저장됩니다.
   ```bash
   node scripts/import-hira.js --dry-run
   ```
6. 문제가 없으면 Supabase에 저장합니다. 같은 병원은 `hira_ykiho`(심평원 고유 ID) 기준으로 갱신되므로 여러 번 실행해도 중복되지 않습니다.
   ```bash
   node scripts/import-hira.js
   ```

옵션:

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `--sido=110000` | 서울 | 시도 코드 (예: 경기 `310000`, 부산 `210000`) |
| `--depts=14,08` | 피부과, 성형외과 | 진료과목 코드 |
| `--limit=50` | 전체 | 가져올 최대 병원 수 (테스트용) |
| `--scope=…` | `aesthetic` | 가져올 범위. `aesthetic`(기본, 서울 약 3,490곳): ① 이름에 피부과·성형외과가 있는 병원, ② 피부과·성형외과를 진료과목으로 둔 의원 중 이름에 다른 진료과(내과·가정의학과·이비인후과 등)가 없는 곳 — 전문의 없이 "OO의원"으로 운영하는 미용 의원 포함, ③ 성형외과가 있거나 이름이 미용 병원인 '병원'급(예: 아이디병원, 365mc병원), ④ 진료과목 등록 없이 이름으로 미용 의원임을 알 수 있는 곳(모발이식·헤어라인 의원 등). `specialist`: 이름에 피부과·성형외과가 있는 병원만(약 1,330곳). `all`: 해당 진료과목을 개설한 모든 병원(약 5,500곳, 내과·종합병원 포함) |
| `--no-name-scan` | — | ④번 이름 검사를 건너뜀 (API 호출 약 110회 절약) |
| `--dry-run` | — | 저장하지 않고 미리보기 파일만 생성 |
| `--deactivate-missing` | — | 이번에 가져오지 못한 공공데이터 병원을 숨김 처리 (`--limit`과 함께 쓸 수 없음) |
| `--summary=파일` | — | 실행 결과를 JSON으로 저장 |

### 매월 자동 갱신 (GitHub Actions)

[.github/workflows/import-hira.yml](.github/workflows/import-hira.yml)이 **매월 1일 오전 9시(KST)**에 자동으로 가져오기를 실행합니다. GitHub 공개 저장소라 무료입니다.

- 새로 생긴 병원은 추가되고, 바뀐 정보(전화번호·주소·의사 수 등)는 갱신됩니다.
- 이번 공공데이터에 없는 병원(폐업 등)은 삭제하지 않고 숨김(`active = false`) 처리합니다. 다시 나타나면 자동으로 다시 표시됩니다.
- 한 번에 절반 넘게 사라지는 경우는 폐업이 아니라 API 오류일 가능성이 높으므로, 숨김 처리를 건너뜁니다.
- 실행 결과는 [data/hira-sync.json](data/hira-sync.json)에 커밋됩니다(가져온 수, 활성 병원 수, 숨긴 수). 이 커밋 덕분에 GitHub가 60일 동안 활동이 없는 저장소의 예약 실행을 멈추는 일도 막습니다.

필요한 GitHub 저장소 Secrets (Settings → Secrets and variables → Actions): `HIRA_SERVICE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

바로 한 번 실행하려면 GitHub 저장소 → **Actions → Import HIRA clinics → Run workflow**를 누르거나:

```bash
gh workflow run import-hira.yml -R yinamsu/Komi
```

로컬에서 같은 작업을 하려면:

```bash
node scripts/import-hira.js --deactivate-missing --summary=data/hira-sync.json
```

### 샘플 데이터 (삭제 완료)

MVP 단계라 실제 파트너 병원은 아직 없습니다. 2026-10-22에 아래 샘플(가상) 데이터를 모두 삭제했습니다.

- Supabase `clinics` 테이블의 샘플 병원 120곳 (삭제 전 로컬 `backups/clinics-samples-2026-10-22.json`에 백업, git에는 올라가지 않음)
- `supabase_schema.sql`의 샘플 병원 INSERT
- 코드 속 샘플 병원 목록, 500곳 자동 생성 코드, 샘플 리뷰 32개
- 리뷰가 없는 병원에 붙이던 고정 점수·임의 경력 연수, 신규 등록 시 자동으로 붙던 5.0 평점

이제 디렉토리에는 **포털로 등록한 실제 파트너**와 **공공데이터 병원**만 나타나며, 둘 다 없으면 "병원 정보를 준비하고 있습니다"가 표시됩니다. 리뷰는 실제 리뷰가 생길 때까지 빈 안내가 표시됩니다.

---

## 4. 다국어와 테마

- 언어: 영어·한국어·일본어·중국어. 화면 문구는 [i18n.js](i18n.js)의 `translations`에 있습니다.
- 병원명·의사명·위치·직함·진료시간은 영어로 저장된 값을 [i18n.js](i18n.js)의 사전(`entityParts`, `titleSegments`)으로 조합해 번역합니다. 모르는 단어가 하나라도 있으면 해당 항목은 영어 원문 그대로 표시됩니다. 새 병원의 단어가 영어로 남으면 사전에 단어를 추가하거나 포털에서 다국어 표기를 채우세요.
- 공공데이터 병원명은 한국어 원문 그대로 표시됩니다.
- 테마: 기본은 라이트(포슬린 로즈). 헤더에서 다크·시스템 설정을 고를 수 있고, 선택은 백서와 포털에도 적용됩니다.

---

## 5. 동작 확인

- 메인 페이지에서 피부 타입 진단을 마치고 이메일을 제출한 뒤 Supabase **Table Editor → `leads`**에 저장됐는지 확인합니다.
- `/clinic`에서 테스트 병원을 등록한 뒤 메인 페이지 디렉토리에 나타나는지 확인합니다.
- 공공데이터를 가져온 뒤 디렉토리에 "미인증 · 공공데이터" 카드가 보이는지, 카드를 누르면 주소·전화·출처가 나오는지 확인합니다.
- 리뷰 섹션은 실제 리뷰가 없으면 "아직 등록된 리뷰가 없습니다"와 `0 / – / –` 통계가 보이는 것이 정상입니다.
