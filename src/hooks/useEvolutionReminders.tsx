import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CYCLE_DAYS = 29;

/**
 * For admin users, checks active subscriptions on 90/180-day plans
 * and generates evolution_reminders at every 29-day cycle.
 */
export const useEvolutionReminders = () => {
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user || role !== "admin") return;

    const generate = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Fetch all active subscriptions started from 2026-03-01
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, user_id, start_date, plans(name, duration_days)")
        .eq("status", "active")
        .gte("end_date", today)
        .gte("start_date", "2026-03-01");

      if (!subs || subs.length === 0) return;

      const longSubs = subs;

      // Fetch existing reminders to avoid duplicates
      const subIds = longSubs.map((s: any) => s.id);
      const { data: existing } = await supabase
        .from("evolution_reminders")
        .select("subscription_id, cycle_number")
        .in("subscription_id", subIds);

      const existingSet = new Set(
        (existing || []).map((e: any) => `${e.subscription_id}_${e.cycle_number}`)
      );

      // Fetch profiles for student names
      const userIds = [...new Set(longSubs.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => {
        nameMap[p.user_id] = p.full_name || "Aluno";
      });

      const toInsert: any[] = [];
      const now = new Date();

      for (const sub of longSubs) {
        const startDate = new Date(sub.start_date + "T00:00:00");
        const durationDays = (sub as any).plans?.duration_days || 90;
        const maxCycles = Math.floor(durationDays / CYCLE_DAYS);

        for (let cycle = 1; cycle <= maxCycles; cycle++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + CYCLE_DAYS * cycle);

          // Only create if due date has passed or is today
          if (dueDate > now) continue;

          const key = `${sub.id}_${cycle}`;
          if (existingSet.has(key)) continue;

          toInsert.push({
            student_user_id: sub.user_id,
            student_name: nameMap[sub.user_id] || "Aluno",
            subscription_id: sub.id,
            cycle_number: cycle,
            due_date: dueDate.toISOString().split("T")[0],
          });
        }
      }

      if (toInsert.length > 0) {
        await supabase.from("evolution_reminders").insert(toInsert);
      }
    };

    generate();
  }, [user, role]);
};
