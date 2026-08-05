import { supabase } from "@/integrations/supabase/client";

export const signInWithGoogleNative = async (next: string = "/ai/app") => {
  // We use the raw Supabase client to avoid the custom redirect logic of the Lovable wrapper
  // which might be causing issues in some WebView/APK environments.
  
  // Store next path in local storage (sessionStorage might not persist well across native intents)
  localStorage.setItem("sthai_oauth_next", next);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/ai/login`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) throw error;
  return data;
};
