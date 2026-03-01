import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Settings ───
export interface LandingSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export const useLandingSettings = () =>
  useQuery({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_settings").select("*");
      if (error) throw error;
      return data as LandingSetting[];
    },
  });

export const useLandingSetting = (key: string, fallback = "") => {
  const { data } = useLandingSettings();
  return data?.find((s) => s.key === key)?.value ?? fallback;
};

export const useUpdateLandingSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("landing_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-settings"] }),
  });
};

// ─── Steps ───
export interface LandingStep {
  id: string;
  icon: string;
  title: string;
  items: string[];
  footer: string;
  is_optional: boolean;
  active: boolean;
  sort_order: number;
}

export const useLandingSteps = () =>
  useQuery({
    queryKey: ["landing-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_steps")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as LandingStep[];
    },
  });

export const useUpsertLandingStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (step: Partial<LandingStep> & { id?: string }) => {
      if (step.id) {
        const { error } = await supabase.from("landing_steps").update(step).eq("id", step.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("landing_steps").insert(step as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-steps"] }),
  });
};

export const useDeleteLandingStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-steps"] }),
  });
};

// ─── Testimonials ───
export interface LandingTestimonial {
  id: string;
  name: string;
  text: string;
  tag: string;
  active: boolean;
  sort_order: number;
}

export const useLandingTestimonials = () =>
  useQuery({
    queryKey: ["landing-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_testimonials")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as LandingTestimonial[];
    },
  });

export const useUpsertTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<LandingTestimonial> & { id?: string }) => {
      if (t.id) {
        const { error } = await supabase.from("landing_testimonials").update(t).eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("landing_testimonials").insert(t as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-testimonials"] }),
  });
};

export const useDeleteTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-testimonials"] }),
  });
};

// ─── Evolutions ───
export interface LandingEvolution {
  id: string;
  image_url: string;
  caption: string;
  active: boolean;
  sort_order: number;
}

export const useLandingEvolutions = () =>
  useQuery({
    queryKey: ["landing-evolutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_evolutions")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as LandingEvolution[];
    },
  });

export const useUpsertEvolution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Partial<LandingEvolution> & { id?: string }) => {
      if (e.id) {
        const { error } = await supabase.from("landing_evolutions").update(e).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("landing_evolutions").insert(e as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-evolutions"] }),
  });
};

export const useDeleteEvolution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_evolutions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-evolutions"] }),
  });
};

// ─── Sections ───
export interface LandingSection {
  id: string;
  key: string;
  label: string;
  active: boolean;
  sort_order: number;
}

export const useLandingSections = () =>
  useQuery({
    queryKey: ["landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as LandingSection[];
    },
  });

export const useUpdateLandingSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<LandingSection> & { id: string }) => {
      const { error } = await supabase.from("landing_sections").update(s).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-sections"] }),
  });
};

// ─── File upload helper ───
export const uploadLandingAsset = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from("landing-assets")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(data.path);
  return urlData.publicUrl;
};

export const deleteLandingAsset = async (path: string) => {
  const { error } = await supabase.storage.from("landing-assets").remove([path]);
  if (error) throw error;
};
