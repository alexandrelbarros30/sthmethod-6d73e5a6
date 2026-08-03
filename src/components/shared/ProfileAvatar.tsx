import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { processAndUpload, validateImageFile } from "@/lib/image-upload";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface ProfileAvatarProps {
  /** Diameter in px */
  size?: number;
  /** Shows the camera button to change the photo */
  editable?: boolean;
  className?: string;
  onClick?: () => void;
  onUpdated?: (url: string) => void;
}

/**
 * Foto de perfil (rosto) do aluno — compartilhada entre STH METHOD e STH AI.
 * Lê e grava em `profiles.avatar_url`, garantindo a mesma imagem nos dois apps.
 */
const ProfileAvatar = ({ size = 48, editable = false, className = "", onClick, onUpdated }: ProfileAvatarProps) => {
  const { user, profile } = useAuth();
  // Clicar na própria foto abre o seletor quando o avatar é editável
  // e nenhuma ação de clique customizada foi definida.
  const [url, setUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // O bucket "body-images" é privado: a URL pública não renderiza.
  // Resolvemos uma signed URL a partir do caminho contido na URL salva.
  const { url: signedUrl } = useSignedUrl("body-images", null, url || null);
  const displaySrc = signedUrl || "";

  useEffect(() => {
    if (profile?.avatar_url) setUrl(profile.avatar_url);
  }, [profile?.avatar_url]);

  useEffect(() => {
    let active = true;
    if (!user?.id || profile?.avatar_url) return;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.avatar_url) setUrl(data.avatar_url);
      });
    return () => { active = false; };
  }, [user?.id, profile?.avatar_url]);

  const initial = (profile?.full_name || user?.email || "A").trim().charAt(0).toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }

    setUploading(true);
    try {
      const path = `${user.id}/avatar_${Date.now()}.jpg`;
      const publicUrl = await processAndUpload(file, "body-images", path);

      const { data: updated, error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id)
        .select("user_id");
      if (error) throw error;

      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: user.id,
          email: user.email ?? "",
          full_name: profile?.full_name ?? user.email ?? "",
          avatar_url: publicUrl,
        });
        if (insertError) throw insertError;
      }

      setUrl(publicUrl);
      onUpdated?.(publicUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (e: any) {
      console.error("[profile-avatar] upload error", e);
      toast.error(e?.message || "Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Avatar
        className="h-full w-full border border-border/60"
        onClick={onClick ?? (editable && !uploading ? () => inputRef.current?.click() : undefined)}
        role={onClick || editable ? "button" : undefined}
        aria-label={!onClick && editable ? "Alterar foto de perfil" : undefined}
        style={onClick || editable ? { cursor: "pointer" } : undefined}
      >
        <AvatarImage src={displaySrc} alt="Foto de perfil" className="object-cover" />
        <AvatarFallback className="bg-muted font-semibold text-foreground" style={{ fontSize: size / 2.6 }}>
          {initial}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Alterar foto de perfil"
            className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-colors hover:bg-foreground/90 disabled:opacity-70"
            style={{ width: Math.max(26, size / 3.2), height: Math.max(26, size / 3.2) }}
          >
            {uploading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
};

export default ProfileAvatar;