import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Loader2, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CouponInputProps {
  planId: string;
  originalPrice: number;
  onCouponApplied: (coupon: { id: string; code: string; discount_type: string; discount_value: number; discountAmount: number } | null) => void;
}

const CouponInput = ({ planId, originalPrice, onCouponApplied }: CouponInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discountAmount: number } | null>(null);

  const validateCoupon = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("active", true)
        .single();

      if (error || !coupon) {
        toast.error("Cupom inválido ou inexistente.");
        onCouponApplied(null);
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("Este cupom já expirou.");
        onCouponApplied(null);
        return;
      }

      // Check uses
      if (coupon.current_uses >= coupon.max_uses) {
        toast.error("Este cupom já atingiu o limite de usos.");
        onCouponApplied(null);
        return;
      }

      // Check plan restriction
      if (coupon.plan_id && coupon.plan_id !== planId) {
        toast.error("Este cupom não é válido para o plano selecionado.");
        onCouponApplied(null);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = originalPrice * (Number(coupon.discount_value) / 100);
      } else {
        discountAmount = Math.min(Number(coupon.discount_value), originalPrice);
      }
      discountAmount = Math.round(discountAmount * 100) / 100;

      setApplied({ code: coupon.code, discountAmount });
      onCouponApplied({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discountAmount,
      });
      toast.success(`Cupom aplicado! Desconto de R$ ${discountAmount.toFixed(2)}`);
    } catch {
      toast.error("Erro ao validar cupom.");
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCode("");
    onCouponApplied(null);
  };

  if (applied) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono font-medium text-foreground">{applied.code}</span>
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              -R$ {applied.discountAmount.toFixed(2)}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={removeCoupon} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground px-1">
          * Desconto válido apenas para pagamento via PIX. Cartão de crédito e débito mantêm o valor cheio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Cupom de desconto (somente PIX)"
            className="pl-9 font-mono"
            onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
          />
        </div>
        <Button variant="outline" size="sm" onClick={validateCoupon} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground px-1">
        * Cupons concedem desconto apenas no pagamento via PIX.
      </p>
    </div>
  );
};

export default CouponInput;
