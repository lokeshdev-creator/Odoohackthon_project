"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// Browser-specific event type not in TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextValue {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  install: async () => "unavailable",
});

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(ios);

    // Detect already-installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true);
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Capture the install prompt as early as possible.
    // This runs in the root layout so it's always mounted before any page.
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // prevent the mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Mark as installed when user completes install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Also register the Service Worker here (at root level, not inside load event)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[TransitOps PWA] SW registered:", reg.scope);
          // Check for updates every minute
          const id = setInterval(() => reg.update(), 60_000);
          return () => clearInterval(id);
        })
        .catch((err) =>
          console.warn("[TransitOps PWA] SW registration failed:", err)
        );
    }
  }, []);

  const install = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    return outcome;
  }, [deferredPrompt]);

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable: !!deferredPrompt,
        isInstalled,
        isIOS,
        install,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  return useContext(PWAInstallContext);
}
