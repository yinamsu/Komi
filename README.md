# 🚀 KOMICARE 배포 및 데이터베이스 연동 가이드

본 프로젝트는 Vercel Serverless Function(백엔드)과 Supabase(데이터베이스)를 연동하여 안전하고 은밀하게 유저의 이메일과 피부 타입 정보를 수집합니다. 아래 실무 가이드를 순서대로 실행해 주세요.

---

## 1. Supabase 데이터베이스 설정

1. [Supabase 공식 홈페이지](https://supabase.com)에 로그인하고 새 프로젝트(New Project)를 생성합니다.
2. 프로젝트 대시보드 왼쪽 메뉴의 **SQL Editor**로 이동합니다.
3. **New query**를 클릭하고, 본 프로젝트 루트에 생성된 [supabase_schema.sql](file:///e:/Komi/supabase_schema.sql) 파일의 내용을 전체 복사하여 붙여넣습니다.
4. 오른쪽 하단의 **Run** 버튼을 클릭하여 `leads` 테이블과 개인 정보 보호를 위한 RLS(Row Level Security) 정책을 적용합니다.

---

## 2. API 인증 키 확인

Supabase 프로젝트 대시보드 왼쪽 하단의 **Project Settings (톱니바퀴 아이콘)** > **API** 메뉴로 이동합니다.
아래 두 가지 키를 복사하여 안전한 곳에 기록해 둡니다:
* **Project URL**: `https://<your-project-id>.supabase.co` 형태의 주소 (Vercel 환경 변수 `SUPABASE_URL`로 사용)
* **service_role API Key** (secret): 테이블 쓰기 권한을 가진 비공개 키 (Vercel 환경 변수 `SUPABASE_SERVICE_ROLE_KEY`로 사용)
  > ⚠️ **주의**: `anon (public)` 키가 아닌, **`service_role` 키**를 사용해야 RLS 보안 규칙을 통과하여 백엔드 쓰기가 가능합니다.

---

## 3. GitHub 리포지토리 생성 및 푸시

터미널을 열고 프로젝트 루트(`e:\Komi`) 경로에서 아래 깃 명령어를 차례로 입력합니다:

```bash
# 1. 깃 저장소 초기화
git init

# 2. 로컬 코드 스테이징 및 커밋
git add .
git commit -m "feat: KOMICARE V2 Refined with Supabase Integration"

# 3. 깃허브 원격 저장소 추가 (GitHub에서 생성한 새 리포지토리 주소를 입력하세요)
git branch -M main
git remote add origin https://github.com/사용자이름/저장소이름.git

# 4. 원격 저장소로 코드 푸시
git push -u origin main
```

---

## 4. Vercel 배포 및 환경 변수 연동

1. [Vercel 대시보드](https://vercel.com)에 로그인하고 **Add New...** > **Project**를 클릭합니다.
2. 방금 푸시한 GitHub 리포지토리를 가져옵니다(Import).
3. **Environment Variables (환경 변수)** 탭을 펼친 후 아래 두 가지 항목을 추가합니다:
   * **Key**: `SUPABASE_URL` / **Value**: *복사해둔 Supabase Project URL*
   * **Key**: `SUPABASE_SERVICE_ROLE_KEY` / **Value**: *복사해둔 Supabase service_role Key*
4. **Deploy** 버튼을 눌러 배포를 완료합니다.

---

## 5. 배포 완료 및 동작 검증

* 배포가 완료되면 Vercel이 생성해 준 고유 라이브 URL로 접속합니다.
* 피츠패트릭 진단 퀴즈를 풀고 이메일을 입력한 후 제출해 보세요.
* Supabase 대시보드의 **Table Editor** > `leads` 테이블을 조회하여 수집된 데이터가 올바르게 저장되었는지 확인합니다.
