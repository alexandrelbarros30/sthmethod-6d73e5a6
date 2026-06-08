-- Revogar execução pública de funções SECURITY DEFINER para melhorar segurança
REVOKE EXECUTE ON FUNCTION public.is_consultant_of FROM public;
REVOKE EXECUTE ON FUNCTION public.notify_payment_change FROM public;
REVOKE EXECUTE ON FUNCTION public.notify_photo_upload FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM public;
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_payments FROM public;
REVOKE EXECUTE ON FUNCTION public.create_protocol_continuity_decision FROM public;
REVOKE EXECUTE ON FUNCTION public.create_flow_status_on_new_user FROM public;
REVOKE EXECUTE ON FUNCTION public.has_admin_view FROM public;
REVOKE EXECUTE ON FUNCTION public.notify_evolution_update FROM public;
REVOKE EXECUTE ON FUNCTION public.is_crm_staff FROM public;
REVOKE EXECUTE ON FUNCTION public.crm_update_conversation_on_message FROM public;
REVOKE EXECUTE ON FUNCTION public.is_phone_opted_out FROM public;
REVOKE EXECUTE ON FUNCTION public.crm_expire_idle_conversations FROM public;

-- Garantir que usuários autenticados ainda possam usá-las (se necessário)
GRANT EXECUTE ON FUNCTION public.is_consultant_of TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_crm_staff TO authenticated;
-- Outras funções geralmente são chamadas via triggers/service_role, então não precisam de GRANT para authenticated necessariamente.
