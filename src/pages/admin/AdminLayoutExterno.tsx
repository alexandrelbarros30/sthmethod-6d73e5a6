import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  useLandingSettings, useUpdateLandingSetting,
  useLandingSteps, useUpsertLandingStep, useDeleteLandingStep,
  useLandingTestimonials, useUpsertTestimonial, useDeleteTestimonial,
  useLandingEvolutions, useUpsertEvolution, useDeleteEvolution,
  useLandingSections, useUpdateLandingSection,
  uploadLandingAsset,
  type LandingStep, type LandingTestimonial, type LandingEvolution,
} from "@/hooks/useLandingData";
import {
  Save, Upload, Trash2, Plus, Image, Type, Layout, MessageCircle,
  GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, ImagePlus, Palette,
} from "lucide-react";
import ColorEditor from "@/components/admin/ColorEditor";

// ─── Helper: setting value from loaded data ───
const getSetting = (data: any[] | undefined, key: string, fallback = "") =>
  data?.find((s: any) => s.key === key)?.value ?? fallback;

const AdminLayoutExterno = () => {
  const { data: settings, isLoading: loadingSettings } = useLandingSettings();
  const updateSetting = useUpdateLandingSetting();
  const { data: steps } = useLandingSteps();
  const upsertStep = useUpsertLandingStep();
  const deleteStep = useDeleteLandingStep();
  const { data: testimonials } = useLandingTestimonials();
  const upsertTestimonial = useUpsertTestimonial();
  const deleteTestimonial = useDeleteTestimonial();
  const { data: evolutions } = useLandingEvolutions();
  const upsertEvolution = useUpsertEvolution();
  const deleteEvolution = useDeleteEvolution();
  const { data: sections } = useLandingSections();
  const updateSection = useUpdateLandingSection();

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  const val = (key: string, fallback = "") => localSettings[key] ?? getSetting(settings, key, fallback);

  const setVal = (key: string, value: string) => setLocalSettings((p) => ({ ...p, [key]: value }));

  const saveSetting = async (key: string) => {
    try {
      await updateSetting.mutateAsync({ key, value: val(key) });
      toast({ title: "Salvo!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleImageUpload = async (file: File, settingKey: string, folder: string) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}.${ext}`;
      const url = await uploadLandingAsset(file, path);
      await updateSetting.mutateAsync({ key: settingKey, value: url });
      setLocalSettings((p) => ({ ...p, [settingKey]: url }));
      toast({ title: "Imagem atualizada!" });
    } catch {
      toast({ title: "Erro no upload", variant: "destructive" });
    }
  };

  const handleEvolutionUpload = async (file: File) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `evolutions/${Date.now()}.${ext}`;
      const url = await uploadLandingAsset(file, path);
      const nextOrder = (evolutions?.length ?? 0);
      await upsertEvolution.mutateAsync({ image_url: url, caption: "", sort_order: nextOrder });
      toast({ title: "Imagem adicionada!" });
    } catch {
      toast({ title: "Erro no upload", variant: "destructive" });
    }
  };

  const moveItem = async <T extends { id: string; sort_order: number }>(
    items: T[],
    index: number,
    direction: "up" | "down",
    upsertFn: any
  ) => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    await upsertFn.mutateAsync({ id: items[index].id, sort_order: items[swapIdx].sort_order });
    await upsertFn.mutateAsync({ id: items[swapIdx].id, sort_order: items[index].sort_order });
  };

  if (loadingSettings) return <DashboardLayout role="admin" title="Layout Externo"><p className="text-muted-foreground">Carregando...</p></DashboardLayout>;

  return (
    <DashboardLayout role="admin" title="Layout Externo">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Layout Externo</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie logo, imagens, textos, seções e CTAs do site público.</p>
        </div>

        <Tabs defaultValue="brand">
          <TabsList className="bg-muted flex-wrap h-auto gap-1">
            <TabsTrigger value="brand" className="gap-1.5"><Image className="w-4 h-4" />Marca</TabsTrigger>
            <TabsTrigger value="hero" className="gap-1.5"><Type className="w-4 h-4" />Hero</TabsTrigger>
            <TabsTrigger value="steps" className="gap-1.5"><Layout className="w-4 h-4" />Etapas</TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-1.5"><MessageCircle className="w-4 h-4" />Depoimentos</TabsTrigger>
            <TabsTrigger value="evolutions" className="gap-1.5"><ImagePlus className="w-4 h-4" />Evoluções</TabsTrigger>
            <TabsTrigger value="sections" className="gap-1.5"><GripVertical className="w-4 h-4" />Seções</TabsTrigger>
            <TabsTrigger value="cta" className="gap-1.5"><Type className="w-4 h-4" />CTA Final</TabsTrigger>
            <TabsTrigger value="cores" className="gap-1.5"><Palette className="w-4 h-4" />Cores</TabsTrigger>
          </TabsList>

          {/* ─── MARCA (Logo + Background) ─── */}
          <TabsContent value="brand" className="space-y-4 mt-4">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm">Logo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {val("logo_url") && (
                  <img src={val("logo_url")} alt="Logo" className="h-16 object-contain rounded bg-muted p-2" />
                )}
                <input ref={logoRef} type="file" accept="image/png,image/jpg,image/jpeg,image/svg+xml" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo_url", "logo")} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => logoRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />Upload Logo
                  </Button>
                  {val("logo_url") && (
                    <Button size="sm" variant="destructive" onClick={() => { updateSetting.mutateAsync({ key: "logo_url", value: "" }); setVal("logo_url", ""); }}>
                      <Trash2 className="w-4 h-4 mr-1" />Remover
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm">Imagem de Fundo (Background)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {val("bg_image_url") && (
                  <img src={val("bg_image_url")} alt="Background" className="w-full h-40 object-cover rounded" />
                )}
                <input ref={bgRef} type="file" accept="image/png,image/jpg,image/jpeg" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "bg_image_url", "background")} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => bgRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />Upload Background
                  </Button>
                  {val("bg_image_url") && (
                    <Button size="sm" variant="destructive" onClick={() => { updateSetting.mutateAsync({ key: "bg_image_url", value: "" }); setVal("bg_image_url", ""); }}>
                      <Trash2 className="w-4 h-4 mr-1" />Remover
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Label>Background ativo</Label>
                  <Switch checked={val("bg_enabled", "true") === "true"}
                    onCheckedChange={(c) => { setVal("bg_enabled", c ? "true" : "false"); updateSetting.mutateAsync({ key: "bg_enabled", value: c ? "true" : "false" }); }} />
                </div>
                <div className="space-y-2">
                  <Label>Opacidade do overlay: {Math.round(parseFloat(val("bg_opacity", "0.25")) * 100)}%</Label>
                  <Slider
                    value={[parseFloat(val("bg_opacity", "0.25")) * 100]}
                    min={10} max={90} step={5}
                    onValueChange={([v]) => setVal("bg_opacity", String(v / 100))}
                    onValueCommit={([v]) => updateSetting.mutateAsync({ key: "bg_opacity", value: String(v / 100) })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── HERO ─── */}
          <TabsContent value="hero" className="space-y-4 mt-4">
            {[
              { key: "hero_title", label: "Título Principal", multi: false },
              { key: "hero_subtitle", label: "Subtítulo", multi: true },
              { key: "hero_cta_text", label: "Texto CTA 1" },
              { key: "hero_cta_link", label: "Link CTA 1" },
              { key: "hero_cta2_text", label: "Texto CTA 2" },
              { key: "hero_cta2_link", label: "Link CTA 2" },
              { key: "hero_stat1_value", label: "Estatística 1 – Valor" },
              { key: "hero_stat1_label", label: "Estatística 1 – Label" },
              { key: "hero_stat2_value", label: "Estatística 2 – Valor" },
              { key: "hero_stat2_label", label: "Estatística 2 – Label" },
              { key: "hero_stat3_value", label: "Estatística 3 – Valor" },
              { key: "hero_stat3_label", label: "Estatística 3 – Label" },
            ].map((f) => (
              <Card key={f.key} className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      {f.multi ? (
                        <Textarea value={val(f.key)} onChange={(e) => setVal(f.key, e.target.value)} rows={2} className="bg-background" />
                      ) : (
                        <Input value={val(f.key)} onChange={(e) => setVal(f.key, e.target.value)} className="bg-background" />
                      )}
                    </div>
                    <Button size="sm" onClick={() => saveSetting(f.key)} className="gradient-bg shrink-0">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ─── ETAPAS ─── */}
          <TabsContent value="steps" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Gerencie os cards "Como Funciona". Altere título, itens, rodapé, ícone e ordem.</p>
            {steps?.map((step, i) => (
              <StepEditor key={step.id} step={step} index={i} total={steps.length}
                onSave={(s) => upsertStep.mutateAsync(s)}
                onDelete={() => deleteStep.mutateAsync(step.id)}
                onMove={(dir) => moveItem(steps, i, dir, upsertStep)} />
            ))}
            <Button variant="outline" className="w-full" onClick={() => upsertStep.mutateAsync({ title: "Nova Etapa", items: [], footer: "", sort_order: steps?.length ?? 0 })}>
              <Plus className="w-4 h-4 mr-1" />Adicionar Etapa
            </Button>
          </TabsContent>

          {/* ─── DEPOIMENTOS ─── */}
          <TabsContent value="testimonials" className="space-y-4 mt-4">
            {testimonials?.map((t, i) => (
              <TestimonialEditor key={t.id} item={t} index={i} total={testimonials.length}
                onSave={(s) => upsertTestimonial.mutateAsync(s)}
                onDelete={() => deleteTestimonial.mutateAsync(t.id)}
                onMove={(dir) => moveItem(testimonials, i, dir, upsertTestimonial)} />
            ))}
            <Button variant="outline" className="w-full" onClick={() => upsertTestimonial.mutateAsync({ name: "Novo Aluno", text: "", tag: "", sort_order: testimonials?.length ?? 0 })}>
              <Plus className="w-4 h-4 mr-1" />Adicionar Depoimento
            </Button>
          </TabsContent>

          {/* ─── EVOLUÇÕES ─── */}
          <TabsContent value="evolutions" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Adicione imagens de evolução real (antes/depois). Até 20 imagens no carrossel.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evolutions?.map((ev, i) => (
                <div key={ev.id} className="relative group rounded-lg overflow-hidden border border-border">
                  <img src={ev.image_url} alt={ev.caption} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" disabled={i === 0} onClick={() => moveItem(evolutions, i, "up", upsertEvolution)}>
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" disabled={i === evolutions.length - 1} onClick={() => moveItem(evolutions, i, "down", upsertEvolution)}>
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => upsertEvolution.mutateAsync({ id: ev.id, active: !ev.active })}>
                        {ev.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteEvolution.mutateAsync(ev.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">Posição {i + 1}</span>
                  </div>
                  {!ev.active && <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded">Oculto</div>}
                </div>
              ))}
            </div>
            {(evolutions?.length ?? 0) < 20 && (
              <div>
                <input type="file" accept="image/png,image/jpg,image/jpeg" className="hidden" id="evo-upload"
                  onChange={(e) => e.target.files?.[0] && handleEvolutionUpload(e.target.files[0])} />
                <Button variant="outline" onClick={() => document.getElementById("evo-upload")?.click()}>
                  <Plus className="w-4 h-4 mr-1" />Adicionar Imagem
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ─── SEÇÕES ─── */}
          <TabsContent value="sections" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Ative, desative e reordene as seções do site público.</p>
            {sections?.map((sec, i) => (
              <Card key={sec.id} className="bg-card border-border">
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => moveItem(sections, i, "up", updateSection)}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled={i === sections.length - 1} onClick={() => moveItem(sections, i, "down", updateSection)}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{sec.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{sec.key}</p>
                  </div>
                  <Switch checked={sec.active}
                    onCheckedChange={(c) => updateSection.mutateAsync({ id: sec.id, active: c })} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ─── CTA FINAL ─── */}
          <TabsContent value="cta" className="space-y-4 mt-4">
            {[
              { key: "cta_final_title", label: "Título CTA Final" },
              { key: "cta_final_subtitle", label: "Subtítulo CTA Final" },
              { key: "cta_final_btn1_text", label: "Botão 1 – Texto" },
              { key: "cta_final_btn1_link", label: "Botão 1 – Link" },
              { key: "cta_final_btn2_text", label: "Botão 2 – Texto" },
              { key: "cta_final_btn2_link", label: "Botão 2 – Link" },
            ].map((f) => (
              <Card key={f.key} className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      <Input value={val(f.key)} onChange={(e) => setVal(f.key, e.target.value)} className="bg-background" />
                    </div>
                    <Button size="sm" onClick={() => saveSetting(f.key)} className="gradient-bg shrink-0">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ─── CORES ─── */}
          <TabsContent value="cores" className="space-y-4 mt-4">
            <ColorEditor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// ─── Step Editor sub-component ───
const StepEditor = ({ step, index, total, onSave, onDelete, onMove }: {
  step: LandingStep; index: number; total: number;
  onSave: (s: Partial<LandingStep> & { id: string }) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
}) => {
  const [title, setTitle] = useState(step.title);
  const [footer, setFooter] = useState(step.footer);
  const [items, setItems] = useState(step.items.join("\n"));
  const [icon, setIcon] = useState(step.icon);

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => onMove("up")}><ArrowUp className="w-3 h-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === total - 1} onClick={() => onMove("down")}><ArrowDown className="w-3 h-3" /></Button>
          </div>
          <span className="text-xs font-semibold text-primary">Etapa {String(index + 1).padStart(2, "0")}</span>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-32 bg-background text-xs" placeholder="Ícone (ex: Brain)" />
          <div className="flex-1">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" placeholder="Título" />
          </div>
          <Switch checked={step.active} onCheckedChange={(c) => onSave({ id: step.id, active: c })} />
        </div>
        <Textarea value={items} onChange={(e) => setItems(e.target.value)} rows={3} className="bg-background text-sm" placeholder="Um item por linha" />
        <Input value={footer} onChange={(e) => setFooter(e.target.value)} className="bg-background text-sm" placeholder="Texto de rodapé (itálico)" />
        <div className="flex justify-between">
          <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
          <Button size="sm" className="gradient-bg" onClick={() => onSave({ id: step.id, title, footer, items: items.split("\n").filter(Boolean), icon })}>
            <Save className="w-4 h-4 mr-1" />Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Testimonial Editor sub-component ───
const TestimonialEditor = ({ item, index, total, onSave, onDelete, onMove }: {
  item: LandingTestimonial; index: number; total: number;
  onSave: (t: Partial<LandingTestimonial> & { id: string }) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
}) => {
  const [name, setName] = useState(item.name);
  const [text, setText] = useState(item.text);
  const [tag, setTag] = useState(item.tag);

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => onMove("up")}><ArrowUp className="w-3 h-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === total - 1} onClick={() => onMove("down")}><ArrowDown className="w-3 h-3" /></Button>
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background w-40" placeholder="Nome" />
          <Input value={tag} onChange={(e) => setTag(e.target.value)} className="bg-background w-32" placeholder="Tag" />
          <Switch checked={item.active} onCheckedChange={(c) => onSave({ id: item.id, active: c })} />
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="bg-background" placeholder="Depoimento" />
        <div className="flex justify-between">
          <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
          <Button size="sm" className="gradient-bg" onClick={() => onSave({ id: item.id, name, text, tag })}>
            <Save className="w-4 h-4 mr-1" />Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminLayoutExterno;
