import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TenantContext = createContext(null);

export function useTenant() {
  return useContext(TenantContext);
}

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectTenant();
  }, []);

  const detectTenant = async () => {
    try {
      const hostname = window.location.hostname;
      
      // Check if it's a subdomain (e.g., "escuelax.cursosia.com")
      const parts = hostname.split(".");
      let slug = null;
      
      if (parts.length >= 3 && parts[0] !== "www" && parts[0] !== "cursosia") {
        slug = parts[0]; // e.g., "escuelax"
      }

      // Also check for custom domains
      if (slug) {
        const { data } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .single();
        
        if (data) {
          setTenant(data);
          applyBranding(data);
        }
      } else {
        // Check by full domain
        const { data } = await supabase
          .from("tenants")
          .select("*")
          .eq("domain", hostname)
          .single();
        
        if (data) {
          setTenant(data);
          applyBranding(data);
        }
      }
    } catch (err) {
      // No tenant found = default branding
      console.log("Using default branding");
    } finally {
      setLoading(false);
    }
  };

  const applyBranding = (t) => {
    if (!t) return;
    const root = document.documentElement;
    if (t.primary_color) root.style.setProperty("--primary", t.primary_color);
    if (t.secondary_color) root.style.setProperty("--accent", t.secondary_color);
    if (t.accent_color) root.style.setProperty("--accent-light", t.accent_color);
  };

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
