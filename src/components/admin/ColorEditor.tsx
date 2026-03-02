import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Save, RotateCcw, Palette } from "lucide-react";
import { useLandingSettings, useUpdateLandingSetting } from "@/hooks/useLandingData";

const getSetting = (data: any[] | undefined, key: string, fallback = "") =>
  data?.find((s: any) => s.key === key)?.value ?? fallback;

interface ColorGroup {
  label: string;
  description: string;
  hKey: string;
  sKey: string;
  lKey: string;
  defaultH: string;
  defaultS: string;
  defaultL: string;
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: "Cor Primária",
    description: "Botões, destaques, gradientes e links principais",
    hKey: "color_primary_h", sKey: "color_primary_s", lKey: "color_primary_l",
    defaultH: "160", defaultS: "84", defaultL: "39",
  },
  {
    label: "Cor de Destaque (Accent)",
    description: "Ícones, badges, bordas de seções",
    hKey: "color_accent_h", sKey: "color_accent_s", lKey: "color_accent_l",
    defaultH: "160", defaultS: "60", defaultL: "30",
  },
  {
    label: "Cor de Fundo",
    description: "Background geral do site",
    hKey: "color_background_h", sKey: "color_background_s", lKey: "color_background_l",
    defaultH: "200", defaultS: "20", defaultL: "5",
  },
];

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string): [number, number, number] => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const ColorEditor = () => {
  const { data: settings } = useLandingSettings();
  const updateSetting = useUpdateLandingSetting();
  const [local, setLocal] = useState<Record<string, string>>({});

  const val = (key: string, fallback: string) => local[key] ?? getSetting(settings, key, fallback);
  const setVal = (key: string, value: string) => setLocal((p) => ({ ...p, [key]: value }));

  const saveColor = async (group: ColorGroup) => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: group.hKey, value: val(group.hKey, group.defaultH) }),
        updateSetting.mutateAsync({ key: group.sKey, value: val(group.sKey, group.defaultS) }),
        updateSetting.mutateAsync({ key: group.lKey, value: val(group.lKey, group.defaultL) }),
      ]);
      toast({ title: `${group.label} salva!` });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const resetColor = (group: ColorGroup) => {
    setVal(group.hKey, group.defaultH);
    setVal(group.sKey, group.defaultS);
    setVal(group.lKey, group.defaultL);
  };

  const handleHexChange = (group: ColorGroup, hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const [h, s, l] = hexToHsl(hex);
    setVal(group.hKey, String(h));
    setVal(group.sKey, String(s));
    setVal(group.lKey, String(l));
  };

  // Logo size
  const logoSize = val("logo_size", "48");

  const saveLogoSize = async () => {
    try {
      await updateSetting.mutateAsync({ key: "logo_size", value: logoSize });
      toast({ title: "Tamanho do logo salvo!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Personalize as cores do site público. As alterações são aplicadas em tempo real após salvar.
      </p>

      {COLOR_GROUPS.map((group) => {
        const h = parseInt(val(group.hKey, group.defaultH));
        const s = parseInt(val(group.sKey, group.defaultS));
        const l = parseInt(val(group.lKey, group.defaultL));
        const hex = hslToHex(h, s, l);
        const previewStyle = { backgroundColor: `hsl(${h}, ${s}%, ${l}%)` };

        return (
          <Card key={group.hKey} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-border shadow-inner" style={previewStyle} />
                <div>
                  <CardTitle className="text-sm">{group.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Matiz (H): {h}°</Label>
                  <Slider value={[h]} min={0} max={360} step={1}
                    onValueChange={([v]) => setVal(group.hKey, String(v))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Saturação (S): {s}%</Label>
                  <Slider value={[s]} min={0} max={100} step={1}
                    onValueChange={([v]) => setVal(group.sKey, String(v))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Luminosidade (L): {l}%</Label>
                  <Slider value={[l]} min={0} max={100} step={1}
                    onValueChange={([v]) => setVal(group.lKey, String(v))} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs shrink-0">Hex:</Label>
                <Input value={hex} className="bg-background w-32 font-mono text-sm"
                  onChange={(e) => handleHexChange(group, e.target.value)} />
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => resetColor(group)}>
                    <RotateCcw className="w-4 h-4 mr-1" />Padrão
                  </Button>
                  <Button size="sm" className="gradient-bg" onClick={() => saveColor(group)}>
                    <Save className="w-4 h-4 mr-1" />Salvar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Logo Size */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Tamanho do Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Altura do logo na navbar: {logoSize}px</Label>
            <Slider value={[parseInt(logoSize)]} min={24} max={96} step={4}
              onValueChange={([v]) => setVal("logo_size", String(v))} />
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="gradient-bg" onClick={saveLogoSize}>
              <Save className="w-4 h-4 mr-1" />Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorEditor;
