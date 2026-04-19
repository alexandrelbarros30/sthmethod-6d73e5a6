import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the effective user ID to use for student dashboard data fetching.
 * If `?preview_as={uuid}` is in the URL AND the logged user is admin/consultor,
 * it overrides the current user.id, allowing staff to see the student's exact view.
 */
export function usePreviewAs() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const previewParam = searchParams.get("preview_as");
  const canPreview = role === "admin" || role === "consultor";
  const isPreviewing = !!previewParam && canPreview;

  useEffect(() => {
    if (!isPreviewing) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    // For consultor, we trust RLS to gate the actual data queries.
    setAllowed(true);
    setLoading(false);
  }, [isPreviewing]);

  return {
    isPreviewing: isPreviewing && allowed,
    previewUserId: isPreviewing && allowed ? previewParam : null,
    effectiveUserId: isPreviewing && allowed ? previewParam : user?.id ?? null,
    loading,
  };
}
