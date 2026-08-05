import { supabase } from "@/integrations/supabase/client";

export const signInWithGoogleNative = async (next: string = "/ai/app") => {
  // We use the raw Supabase client to avoid the custom redirect logic of the Lovable wrapper
  // which might be causing issues in some WebView/APK environments (like deep linking or state preservation).
  
  // Store next path in local storage (sessionStorage might not persist well across native intents)
  localStorage.setItem("sthai_oauth_next", next);
  
  // Log audit info for native debugging if needed
  console.log("[AuthAudit] Initiating Native Google OAuth", { origin: window.location.origin, next });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // In mobile apps/webviews, we point back to login to handle the session extraction
      redirectTo: `${window.location.origin}/ai/login`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account', // changed from 'consent' to allow easier account switching
      },
    },
  });
  
  if (error) {
    console.error("[AuthAudit] Native OAuth Error:", error);
    throw error;
  }
  
  // If we get a URL, redirect manually. 
  // In many browser environments, Supabase handles this automatically, 
  // but in some WebView setups, having the URL returned is more resilient.
  if (data?.url) {
    window.location.assign(data.url);
  }

  return data;
};
