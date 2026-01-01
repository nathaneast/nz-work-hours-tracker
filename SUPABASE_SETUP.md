# Supabase 테이블 설정 가이드

## profiles 테이블

기존 `profiles` 테이블에 `week_start_day` 컬럼을 추가해야 합니다.

### 컬럼 추가 방법

1. Supabase Dashboard에 로그인
2. SQL Editor로 이동
3. 다음 SQL을 실행:

```sql
-- profiles 테이블에 week_start_day 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS week_start_day INTEGER;

-- 기본값 설정 (1 = Monday)
ALTER TABLE profiles 
ALTER COLUMN week_start_day SET DEFAULT 1;

-- 체크 제약 조건 추가 (0-6 사이의 값만 허용)
-- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 
-- 4 = Thursday, 5 = Friday, 6 = Saturday
ALTER TABLE profiles 
ADD CONSTRAINT week_start_day_check 
CHECK (week_start_day >= 0 AND week_start_day <= 6);

-- 컬럼에 대한 코멘트 추가 (선택사항)
COMMENT ON COLUMN profiles.week_start_day IS 'Week start day: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
```

### profiles 테이블 전체 구조 (참고용)

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  default_region TEXT,
  week_start_day INTEGER DEFAULT 1 CHECK (week_start_day >= 0 AND week_start_day <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 정책이 있다면:
-- profiles 테이블에 대한 SELECT, UPDATE 권한이 사용자 자신의 행에만 허용되어야 합니다.
```

### 기존 profiles 테이블이 있는 경우

기존 `profiles` 테이블이 이미 있는 경우, 위의 ALTER TABLE 문만 실행하면 됩니다.

### RLS (Row Level Security) 확인

profiles 테이블에 RLS가 활성화되어 있다면, 사용자가 자신의 프로필을 읽고 쓸 수 있는 정책이 있어야 합니다:

```sql
-- SELECT 정책 (이미 있다면 수정 불필요)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- UPDATE 정책 (이미 있다면 수정 불필요)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- INSERT 정책 (이미 있다면 수정 불필요)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

