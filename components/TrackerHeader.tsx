import React from "react";
import type { User } from "@supabase/supabase-js";

type TrackerHeaderProps = {
  user: User | null;
  isSupabaseConfigured: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  showDemoBanner: boolean;
};

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  user,
  isSupabaseConfigured,
  isAuthLoading,
  authError,
  onSignIn,
  onSignOut,
  showDemoBanner,
}) => {
  return (
    <header className="text-center mb-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
        NZ Work Hours Tracker
      </h1>
      <p className="text-secondary mt-2">
        Track your hours, estimate your weekly pay in New Zealand.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2">
        {isSupabaseConfigured ? (
          user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600">{user.email}</span>
              <button
                onClick={onSignOut}
                className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          )
        ) : (
          <span className="text-sm text-red-600">
            Supabase 환경변수가 설정되지 않아 로그인과 동기화가 비활성화
            상태입니다.
          </span>
        )}
        {authError && (
          <span className="text-sm text-red-600">{authError}</span>
        )}
      </div>
      {showDemoBanner && (
        <div className="mt-6 w-full max-w-2xl mx-auto bg-yellow-100 border border-yellow-300 text-yellow-900 px-5 py-4 rounded-lg text-left sm:text-center">
          <p className="text-base font-semibold">You are viewing the demo.</p>
          <p className="mt-2 text-sm sm:text-base text-yellow-800">
            Entries stay only in this browser and disappear when you refresh or
            leave. Sign in with Google to sync everything safely to Database.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
            <button
              onClick={onSignIn}
              disabled={!isSupabaseConfigured || isAuthLoading}
              className="inline-flex items-center justify-center px-5 py-2 bg-secondary text-white font-medium rounded-md shadow-sm hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAuthLoading ? "Preparing sign-in…" : "Sign in with Google"}
            </button>
            <span className="text-xs sm:text-sm text-yellow-700">
              After signing in, jobs and work logs sync automatically.
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
