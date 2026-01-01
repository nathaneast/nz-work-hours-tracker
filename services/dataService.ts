import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Job, WorkLog, WorkLogEntry, Region } from '../types';
import { NZ_REGIONS } from '../constants';

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
};

type JobRow = {
  id: string;
  user_id: string;
  name: string;
  pay_rate: number;
  color: string;
  include_holiday_pay?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

type WorkLogRow = {
  id: string;
  user_id: string;
  job_id: string;
  date: string;
  hours: number;
  created_at?: string;
  updated_at?: string;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  default_region?: string | null;
  week_start_day?: number | null;
};

const DEFAULT_REGION: Region = 'None';

const normalizeRegion = (value?: string | null): Region => {
  if (!value) {
    return DEFAULT_REGION;
  }
  const match = NZ_REGIONS.find((region) => region === value);
  return match ?? DEFAULT_REGION;
};

const mapJobRowToJob = (row: JobRow): Job => ({
  id: row.id,
  name: row.name,
  payRate: row.pay_rate,
  color: row.color,
  includeHolidayPay: row.include_holiday_pay ?? false,
});

export const fetchUserJobs = async (userId: string): Promise<Job[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('jobs')
    .select<JobRow>('id, user_id, name, pay_rate, color, include_holiday_pay')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapJobRowToJob);
};

export const upsertJob = async (userId: string, job: Job): Promise<Job> => {
  ensureSupabase();
  const payload = {
    id: job.id,
    user_id: userId,
    name: job.name,
    pay_rate: job.payRate,
    color: job.color,
    include_holiday_pay: job.includeHolidayPay,
  };

  const { data, error } = await supabase
    .from('jobs')
    .upsert<JobRow>(payload, { onConflict: 'id' })
    .select('id, user_id, name, pay_rate, color, include_holiday_pay')
    .single();

  if (error) {
    throw error;
  }

  return mapJobRowToJob(data);
};

export const deleteJob = async (userId: string, jobId: string) => {
  ensureSupabase();
  const { error } = await supabase.from('jobs').delete().eq('user_id', userId).eq('id', jobId);

  if (error) {
    throw error;
  }
};

const mapRowsToWorkLog = (rows: WorkLogRow[]): WorkLog => {
  const workLog: WorkLog = {};
  rows.forEach(row => {
    if (!workLog[row.date]) {
      workLog[row.date] = [];
    }
    workLog[row.date].push({
      jobId: row.job_id,
      hours: row.hours,
    });
  });
  return workLog;
};

export const fetchWorkLogs = async (userId: string): Promise<WorkLog> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('work_logs')
    .select<WorkLogRow>('id, user_id, job_id, date, hours')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return mapRowsToWorkLog(data ?? []);
};

export const saveWorkLogForDate = async (
  userId: string,
  date: string,
  entries: WorkLogEntry[],
): Promise<void> => {
  ensureSupabase();

  const { error: deleteError } = await supabase
    .from('work_logs')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);

  if (deleteError) {
    throw deleteError;
  }

  if (entries.length === 0) {
    return;
  }

  const rows = entries.map(entry => ({
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined,
    user_id: userId,
    job_id: entry.jobId,
    date,
    hours: entry.hours,
  }));

  const { error: insertError } = await supabase.from('work_logs').insert(rows);

  if (insertError) {
    throw insertError;
  }
};

export const deleteWorkLogsForJob = async (userId: string, jobId: string) => {
  ensureSupabase();

  const { error } = await supabase
    .from('work_logs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (error) {
    throw error;
  }
};

export const ensureProfile = async (userId: string, email?: string | null) => {
  ensureSupabase();
  const payload = {
    id: userId,
    email,
  };

  const result: PostgrestSingleResponse<{ id: string }> = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();

  if (result.error) {
    throw result.error;
  }
};

export const fetchProfileRegion = async (userId: string): Promise<Region> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select<ProfileRow>('default_region')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return normalizeRegion(data?.default_region ?? null);
};

export const saveProfileRegion = async (userId: string, region: Region): Promise<void> => {
  ensureSupabase();
  const payload = {
    id: userId,
    default_region: region,
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

  if (error) {
    throw error;
  }
};

export const fetchProfileWeekStartDay = async (userId: string): Promise<number> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select<ProfileRow>('week_start_day')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Return default value (1 = Monday) if not set or invalid
  const weekStartDay = data?.week_start_day;
  if (typeof weekStartDay === 'number' && weekStartDay >= 0 && weekStartDay <= 6) {
    return weekStartDay;
  }
  return 1; // Default to Monday
};

export const saveProfileWeekStartDay = async (userId: string, weekStartDay: number): Promise<void> => {
  ensureSupabase();
  const payload = {
    id: userId,
    week_start_day: weekStartDay,
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

  if (error) {
    throw error;
  }
};
