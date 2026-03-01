import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteContentItem {
  id: string;
  key: string;
  category: string;
  label: string;
  content: string;
  updated_at: string;
}

export const useSiteContent = () => {
  return useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as SiteContentItem[];
    },
  });
};

export const useSiteText = (key: string, fallback = "") => {
  const { data } = useSiteContent();
  const item = data?.find((i) => i.key === key);
  return item?.content ?? fallback;
};

export const useUpdateSiteContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from("site_content")
        .update({ content })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-content"] }),
  });
};
