"use client";

const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

export function withBasePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!configuredBasePath) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return configuredBasePath;
  }

  return normalizedPath.startsWith(configuredBasePath)
    ? normalizedPath
    : `${configuredBasePath}${normalizedPath}`;
}

export function navigateToAppPath(path: string) {
  window.location.href = withBasePath(path);
}

export function fetchAppPath(input: string, init?: RequestInit) {
  return fetch(withBasePath(input), init);
}
