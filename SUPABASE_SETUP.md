# Supabase 테이블 설정 가이드

## jobs 테이블

기존 `jobs` 테이블에 `include_holiday_pay` 컬럼을 추가해야 합니다.

### 컬럼 추가 방법

1. Supabase Dashboard에 로그인
2. SQL Editor로 이동
3. 다음 SQL을 실행:

```sql
-- jobs 테이블에 include_holiday_pay 컬럼 추가
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS include_holiday_pay BOOLEAN;

-- 기본값 설정 (false)
ALTER TABLE jobs 
ALTER COLUMN include_holiday_pay SET DEFAULT false;

-- 컬럼에 대한 코멘트 추가 (선택사항)
COMMENT ON COLUMN jobs.include_holiday_pay IS 'Whether to include holiday pay (1.5x multiplier) for this job on public holidays';
```

### jobs 테이블 전체 구조 (참고용)

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pay_rate DECIMAL(10, 2) NOT NULL,
  color TEXT NOT NULL,
  include_holiday_pay BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

-- RLS (Row Level Security) 정책
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 사용자는 자신의 jobs만 조회 가능
CREATE POLICY "Users can view own jobs"
ON jobs FOR SELECT
USING (auth.uid() = user_id);

-- INSERT 정책: 사용자는 자신의 jobs만 생성 가능
CREATE POLICY "Users can insert own jobs"
ON jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책: 사용자는 자신의 jobs만 수정 가능
CREATE POLICY "Users can update own jobs"
ON jobs FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE 정책: 사용자는 자신의 jobs만 삭제 가능
CREATE POLICY "Users can delete own jobs"
ON jobs FOR DELETE
USING (auth.uid() = user_id);
```

### 기존 jobs 테이블이 있는 경우

기존 `jobs` 테이블이 이미 있는 경우, 위의 ALTER TABLE 문만 실행하면 됩니다.

### 확인 방법

컬럼이 제대로 추가되었는지 확인하려면 다음 SQL을 실행하세요:

```sql
-- jobs 테이블 구조 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;
```

### 주의사항

- `include_holiday_pay`가 `false`인 경우, 공휴일에도 일반 시급(1x)으로 계산됩니다.
- `include_holiday_pay`가 `true`인 경우, 공휴일에 1.5배 시급으로 계산됩니다.
- 기본값은 `false`입니다.




