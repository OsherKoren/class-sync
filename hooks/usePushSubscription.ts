"use client";

import { useState, useEffect } from "react";

export function usePushSubscription() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSupported(true);
        setSubscribed(!!sub);
      })
      .catch(() => null);
  }, []);

  async function subscribe() {
    if (!supported || subscribed || loading) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setSubscribed(true);
    } catch (err) {
      console.error("[push] subscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!supported || !subscribed || loading) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[push] unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return { subscribed, loading, supported, subscribe, unsubscribe };
}
