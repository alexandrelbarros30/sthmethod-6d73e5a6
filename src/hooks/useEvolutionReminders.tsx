import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendSystemTemplate } from "@/lib/system-templates";

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

      // Fetch active subscriptions with 90+ day plans
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, user_id, start_date, plans(name, duration_days)")
        .eq("status", "active")
        .gte("end_date", today);

      if (!subs || subs.length === 0) return;

      // Filter only 90 and 180 day plans
      const longSubs = subs.filter((s: any) => {
        const days = s.plans?.duration_days;
        return days === 90 || days === 180;
      });

      if (longSubs.length === 0) return;

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

      // Auto-dispatch WhatsApp for any reminder that hasn't been auto-sent yet (incl. legacy).
      const { data: pending } = await supabase
        .from("evolution_reminders")
        .select("id, student_user_id, student_name")
        .is("auto_sent_at", null)
        .lte("due_date", today)
        .limit(50);

      if (pending && pending.length > 0) {
        const ids = pending.map((p: any) => p.student_user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, email")
          .in("user_id", ids);
        const pmap: Record<string, any> = {};
        (profs || []).forEach((p: any) => { pmap[p.user_id] = p; });

        for (const r of pending) {
          const prof = pmap[r.student_user_id];
          if (!prof?.phone) continue;
          try {
            const result = await sendSystemTemplate(
              "evolution_update_reminder",
              {
                full_name: prof.full_name,
                phone: prof.phone,
                email: prof.email,
                user_id: r.student_user_id,
              },
              { logHistory: true, mode: "auto" },
            );
            if (result.ok) {
              await supabase
                .from("evolution_reminders")
                .update({ auto_sent_at: new Date().toISOString(), seen: true })
                .eq("id", r.id);
            }
          } catch (err) {
            console.warn("[evolution-auto-dispatch] failed", err);
          }
        }
      }
    };

    generate();
  }, [user, role]);
};
