"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AlertChannel = "browser" | "email" | "telegram" | "whatsapp";
type AlertStrength = "High" | "Medium" | "Low";

type SavedAlerts = {
  enabled: boolean;
  channels: AlertChannel[];
  minConfidence: AlertStrength;
};

const defaultAlerts: SavedAlerts = {
  enabled: false,
  channels: ["browser"],
  minConfidence: "High",
};

function getStrengthLabel(value: AlertStrength) {
  switch (value) {
    case "High":
      return "Strong";
    case "Medium":
      return "Good";
    case "Low":
      return "Weak";
    default:
      return value;
  }
}

export default function AlertsPanel() {
  const supabase = createClient();

  const [alerts, setAlerts] = useState<SavedAlerts>(defaultAlerts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("alert_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setAlerts({
          enabled: data.enabled,
          channels: data.channels,
          minConfidence: data.min_confidence,
        });
      }

      setLoading(false);
    }

    loadAlerts();
  }, [supabase]);

  async function saveAlerts(next: SavedAlerts) {
    setAlerts(next);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("alert_preferences").upsert({
      user_id: user.id,
      enabled: next.enabled,
      channels: next.channels,
      min_confidence: next.minConfidence,
    });
  }

  function toggleChannel(channel: AlertChannel) {
    const nextChannels = alerts.channels.includes(channel)
      ? alerts.channels.filter((item) => item !== channel)
      : [...alerts.channels, channel];

    saveAlerts({
      ...alerts,
      channels: nextChannels,
    });
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      saveAlerts({ ...alerts, enabled: true });
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      saveAlerts({ ...alerts, enabled: true });
    }
  }

  return (
    <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Alerts Engine
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Never miss a strong setup.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
            Alert settings now save to your TradeRadar account.
          </p>
        </div>

        <button
          onClick={enableBrowserNotifications}
          className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Enable Browser Alerts
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Alerts Status
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {loading ? "Loading..." : alerts.enabled ? "Enabled" : "Disabled"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Minimum Strength
          </p>

          <select
            value={alerts.minConfidence}
            onChange={(event) =>
              saveAlerts({
                ...alerts,
                minConfidence: event.target.value as AlertStrength,
              })
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            <option value="High">{getStrengthLabel("High")}</option>
            <option value="Medium">{getStrengthLabel("Medium")}</option>
            <option value="Low">{getStrengthLabel("Low")}</option>
          </select>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Channels
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(["browser", "email", "telegram", "whatsapp"] as AlertChannel[]).map(
              (channel) => {
                const active = alerts.channels.includes(channel);

                return (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase ${
                      active
                        ? "bg-emerald-400 text-black"
                        : "border border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {channel}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </section>
  );
}