import { useEffect, useState } from "react";
import {
  type AppEnvironment,
  detectAppEnvironment,
} from "../constants/env";

const bannerHeight = 36;

type BannerEnvironment = Extract<AppEnvironment, "local" | "development">;

const ENVIRONMENT_STYLES: Record<
  BannerEnvironment,
  { label: string; background: string; color: string }
> = {
  local: {
    label: "로컬 환경",
    background: "#111827",
    color: "#F3F4F6",
  },
  development: {
    label: "개발 환경",
    background: "#0F766E",
    color: "#ECFDF5",
  },
};

export const EnvironmentBanner = () => {
  const [env, setEnv] = useState<AppEnvironment | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setEnv(detectAppEnvironment(window.location));
  }, []);

  if (env !== "local" && env !== "development") {
    return null;
  }

  const { label, background, color } = ENVIRONMENT_STYLES[env];

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: bannerHeight,
          background,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: 14,
          zIndex: 1000,
        }}
      >
        {label}
      </div>
      <div style={{ height: bannerHeight }} />
    </>
  );
};
