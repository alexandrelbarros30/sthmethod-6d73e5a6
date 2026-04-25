import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ServiceQueue from "@/components/admin/ServiceQueue";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AdminQueue = () => {
  const { user, role } = useAuth();
  const isConsultor = role === "consultor";
  const [linkedIds, setLinkedIds] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    if (!isConsultor || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("consultant_students")
        .select("student_id")
        .eq("consultant_id", user.id);
      setLinkedIds((data || []).map((d: any) => d.student_id));
    })();
  }, [isConsultor, user?.id]);

  const basePath = isConsultor ? "/consultor/students" : "/admin/students";

  return (
    <DashboardLayout
      role={(role as any) || "admin"}
      title="Fila de Atendimento"
      subtitle="Lista numerada por prioridade. Atenda do topo para a base."
    >
      <ServiceQueue
        manageBasePath={basePath}
        allowedUserIds={isConsultor ? linkedIds : undefined}
      />
    </DashboardLayout>
  );
};

export default AdminQueue;