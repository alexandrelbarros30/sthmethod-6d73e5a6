import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CoachMemberRole = "owner" | "professor";

export interface CoachTenant {
  id: string;
  owner_id: string;
  business_name: string;
  legal_name: string | null;
  tax_id: string | null;
  cref: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  plan: string;
  student_limit: number;
  active: boolean;
}

export interface CoachMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: CoachMemberRole;
  full_name: string | null;
  email: string | null;
  active: boolean;
}

export interface CoachStudentLink {
  id: string;
  tenant_id: string;
  full_name: string;
  status: string;
  onboarding_completed_at: string | null;
}

/**
 * Resolve o contexto COACH do usuário logado:
 * - membership (owner/professor) + tenant, ou
 * - vínculo como aluno de um tenant.
 */
export const useCoachContext = () => {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["coach-context", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [memberRes, studentRes] = await Promise.all([
        supabase
          .from("coach_members")
          .select("id, tenant_id, user_id, role, full_name, email, active")
          .eq("user_id", user!.id)
          .eq("active", true)
          .maybeSingle(),
        supabase
          .from("coach_students")
          .select("id, tenant_id, full_name, status, onboarding_completed_at")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);

      const member = (memberRes.data as CoachMember | null) ?? null;
      const student = (studentRes.data as CoachStudentLink | null) ?? null;
      const tenantId = member?.tenant_id ?? student?.tenant_id ?? null;

      let tenant: CoachTenant | null = null;
      if (tenantId) {
        const { data } = await supabase
          .from("coach_tenants")
          .select("*")
          .eq("id", tenantId)
          .maybeSingle();
        tenant = (data as CoachTenant | null) ?? null;
      }

      return { member, student, tenant };
    },
  });

  return {
    ...query,
    loading: authLoading || query.isLoading,
    member: query.data?.member ?? null,
    student: query.data?.student ?? null,
    tenant: query.data?.tenant ?? null,
    isOwner: query.data?.member?.role === "owner",
    isProfessional: !!query.data?.member,
    isCoachStudent: !!query.data?.student && !query.data?.member,
  };
};