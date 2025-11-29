export const DEV_HOST = "nz-work-hours-tracker-dev.netlify.app";
export const PROD_HOST = "nz-work-hours-tracker-prod.netlify.app";

const DefaultRedirectUrl = `https://${PROD_HOST}/home`;

type LocationLike = Pick<Location, "protocol" | "hostname" | "port" | "origin">;

const isLocalHostname = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname.endsWith(".local");

export const resolveHomeRedirectUrl = (
  location?: LocationLike
): string => {
  if (!location) {
    return DefaultRedirectUrl;
  }

  const { protocol, hostname, port, origin } = location;

  if (isLocalHostname(hostname)) {
    const portSuffix = port ? `:${port}` : "";
    return `${protocol}//${hostname}${portSuffix}/home`;
  }

  if (hostname === DEV_HOST) {
    return `https://${DEV_HOST}/home`;
  }

  if (hostname === PROD_HOST) {
    return `https://${PROD_HOST}/home`;
  }

  return `${origin}/home`;
};

export type AppEnvironment = "local" | "development" | "production" | "custom";

export const detectAppEnvironment = (
  location?: LocationLike
): AppEnvironment => {
  if (!location) {
    return "custom";
  }

  const { hostname } = location;

  if (isLocalHostname(hostname)) {
    return "local";
  }
  if (hostname === DEV_HOST) {
    return "development";
  }
  if (hostname === PROD_HOST) {
    return "production";
  }
  return "custom";
};
