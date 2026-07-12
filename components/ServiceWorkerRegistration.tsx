"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[TransitOps PWA] Service Worker registered:", registration.scope);

            // Check for updates every 60 seconds
            setInterval(() => {
              registration.update();
            }, 60 * 1000);

            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (!newWorker) return;

              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // A new version is available. In production, prompt user to refresh.
                  console.log("[TransitOps PWA] New content available – please refresh.");
                }
              });
            });
          })
          .catch((err) => {
            console.error("[TransitOps PWA] Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
