"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Separator } from "@/app/components/ui/separator";
import { MessageCircle, Sparkles, Languages, Globe, User, UserCheck, Info } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { GradualSlider } from "@/app/components/ui/gradual-slider";
import { SegmentedControl } from "@/app/components/ui/segmented-control";
import { ChipInput } from "@/app/components/ui/chip-input";

interface ResponseSettingsFormProps {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}

export function ResponseSettingsForm({ settings, onUpdate }: ResponseSettingsFormProps) {
  const toneOptions = [
    { value: 0, label: "Sereno",      emoji: "😌" },
    { value: 1, label: "Neutral",     emoji: "😐" },
    { value: 2, label: "Profesional", emoji: "🧐" },
    { value: 3, label: "Cercano",     emoji: "😊" },
    { value: 4, label: "Amable",      emoji: "🙂" },
    { value: 5, label: "Entusiasta",  emoji: "🤩" }
  ];

  const emojiIntensityOptions = [
    { value: 0, label: "Sin emojis", emoji: "🚫" },
    { value: 1, label: "Pocos",      emoji: "🙂" },
    { value: 2, label: "Moderado",   emoji: "😄" },
    { value: 3, label: "Muchos",     emoji: "🎉" }
  ];

  const lengthOptions = [
    { value: 0, label: "Breve",     emoji: "📝" },
    { value: 1, label: "Media",     emoji: "📄" },
    { value: 2, label: "Detallada", emoji: "📚" }
  ];

  const creativityOptions = [
    { value: 0,   label: "Conservadora",  emoji: "💼" },
    { value: 0.3, label: "Equilibrada",   emoji: "⚖️" },
    { value: 0.6, label: "Creativa",      emoji: "💡" },
    { value: 0.9, label: "Muy creativa",  emoji: "✨" }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 1. Identidad y voz de marca */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Identidad y voz de marca
            </CardTitle>
            <CardDescription>Define cómo se presenta tu negocio en las respuestas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input id="businessName" value={settings.businessName} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={settings.sector}
                  onChange={(e) => onUpdate({ sector: e.target.value })}
                  placeholder="ej. Restauración, Belleza, Retail..."
                />
                <p className="text-xs text-muted-foreground">Ayuda a la IA a entender tu contexto</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tratamiento</Label>
                <SegmentedControl
                  options={[
                    { value: "tu", label: "Tú", icon: "👋" },
                    { value: "usted", label: "Usted", icon: "🧍" }
                  ]}
                  value={settings.treatment}
                  onChange={(value) => onUpdate({ treatment: value as "tu" | "usted" })}
                />
              </div>

              <div className="space-y-3">
                <Label>Tono de comunicación</Label>
                <GradualSlider
                  value={settings.tone}
                  onChange={(value) => onUpdate({ tone: value })}
                  options={toneOptions}
                  gradient="from-blue-400 to-orange-400"
                />
              </div>

              <div className="space-y-3">
                <Label>Intensidad de emojis</Label>
                <GradualSlider
                  value={settings.emojiIntensity}
                  onChange={(value) => onUpdate({ emojiIntensity: value })}
                  options={emojiIntensityOptions}
                  gradient="from-gray-400 to-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">Firma estándar</Label>
                <Input
                  id="signature"
                  value={settings.standardSignature}
                  onChange={(e) => onUpdate({ standardSignature: e.target.value })}
                  placeholder="— Equipo {businessName}"
                />
                <p className="text-xs text-muted-foreground">{"{businessName}"} se reemplazará automáticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Idioma */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              Idioma
            </CardTitle>
            <CardDescription>Configuración de idiomas para las respuestas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Idioma por defecto</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => onUpdate({ language: value as "es" | "pt" | "en" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="pt">🇵🇹 Português</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autodetectar idioma</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.autoDetectLanguage}
                    onCheckedChange={(checked) => onUpdate({ autoDetectLanguage: checked })}
                  />
                  <span className="text-sm text-muted-foreground">Responder en el idioma de la reseña</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Reglas por estrellas */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Reglas por estrellas
            </CardTitle>
            <CardDescription>Personaliza el enfoque según la puntuación recibida</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="1-2" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1-2">1–2★</TabsTrigger>
                <TabsTrigger value="3">3★</TabsTrigger>
                <TabsTrigger value="4-5">4–5★</TabsTrigger>
              </TabsList>

              {Object.entries(settings.starSettings).map(([key, config]) => (
                <TabsContent key={key} value={key} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Objetivo principal</Label>
                      <Select
                        value={config.objective}
                        onValueChange={(value) =>
                          onUpdate({
                            starSettings: {
                              ...settings.starSettings,
                              [key]: { ...config, objective: value as any }
                            }
                          })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {key === "1-2" && <SelectItem value="apology">🙇 Disculpa/solución</SelectItem>}
                          {key === "3" && <SelectItem value="neutral">🧭 Neutral/explicación</SelectItem>}
                          {key === "4-5" && <SelectItem value="thanks">🎁 Agradecimiento/fidelización</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Longitud de respuesta</Label>
                      <GradualSlider
                        value={config.length}
                        onChange={(value) =>
                          onUpdate({
                            starSettings: {
                              ...settings.starSettings,
                              [key]: { ...config, length: value }
                            }
                          })
                        }
                        options={lengthOptions}
                        gradient="from-purple-400 to-pink-400"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <Label htmlFor={`limit-${key}`}>Límite duro (caracteres)</Label>
                        <Input
                          id={`limit-${key}`}
                          type="number"
                          value={settings.maxCharacters}
                          onChange={(e) => onUpdate({ maxCharacters: parseInt(e.target.value) })}
                          className="w-20 h-8"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.enableCTA}
                        onCheckedChange={(checked) =>
                          onUpdate({
                            starSettings: {
                              ...settings.starSettings,
                              [key]: { ...config, enableCTA: checked }
                            }
                          })
                        }
                      />
                      <Label>Incluir CTA público</Label>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* 4. Canales y CTA */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Canales y CTA
            </CardTitle>
            <CardDescription>Configura llamadas a la acción y canales preferidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal preferido</Label>
                <Select
                  value={settings.preferredChannel}
                  onValueChange={(value) => onUpdate({ preferredChannel: value as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    <SelectItem value="phone">📞 Teléfono</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="web">🌐 Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cuándo mostrar CTA</Label>
                <SegmentedControl
                  options={[
                    { value: "always", label: "Siempre" },
                    { value: "below3", label: "<3★" },
                    { value: "above4", label: "≥4★" },
                    { value: "never", label: "Nunca" }
                  ]}
                  value={settings.showCTAWhen}
                  onChange={(value) => onUpdate({ showCTAWhen: value as any })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctaText">Texto de CTA</Label>
              <Textarea
                id="ctaText"
                value={settings.ctaText}
                onChange={(e) => onUpdate({ ctaText: e.target.value })}
                placeholder="ej. ¡Nos vemos pronto!"
                rows={2}
              />
              <div className="text-xs text-muted-foreground">{settings.ctaText.length}/100 caracteres</div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch checked={settings.addUTM} onCheckedChange={(checked) => onUpdate({ addUTM: checked })} />
              <Label>Añadir parámetros UTM a enlaces</Label>
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p>Para rastrear el origen del tráfico en Analytics</p></TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* 5. Políticas y guardarraíles */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Políticas y guardarraíles
            </CardTitle>
            <CardDescription>Protección y cumplimiento normativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Frases prohibidas</Label>
              <ChipInput
                value={settings.bannedPhrases}
                onChange={(phrases) => onUpdate({ bannedPhrases: phrases })}
                placeholder="Añadir frase prohibida..."
              />
              <p className="text-xs text-muted-foreground">La IA evitará usar estas frases en las respuestas</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.noPublicCompensation}
                  onCheckedChange={(checked) => onUpdate({ noPublicCompensation: checked })}
                />
                <Label>No prometer compensaciones públicas</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.avoidPersonalData}
                  onCheckedChange={(checked) => onUpdate({ avoidPersonalData: checked })}
                />
                <Label>Evitar solicitar datos personales (RGPD)</Label>
                <Tooltip>
                  <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p>Cumplimiento del Reglamento General de Protección de Datos</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Publicación y control */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Publicación y control
            </CardTitle>
            <CardDescription>Cómo y cuándo se publican las respuestas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modo de publicación</Label>
              <SegmentedControl
                options={[
                  { value: "draft", label: "Borrador" },
                  { value: "auto", label: "Auto-publicar" }
                ]}
                value={settings.publishMode}
                onChange={(value) => onUpdate({ publishMode: value as "draft" | "auto" })}
              />
            </div>

            {settings.publishMode === "auto" && (
              <div className="space-y-2">
                <Label>Umbral auto-publicación</Label>
                <Select
                  value={settings.autoPublishThreshold}
                  onValueChange={(value) => onUpdate({ autoPublishThreshold: value as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3stars">≥3★</SelectItem>
                    <SelectItem value="4stars">≥4★</SelectItem>
                    <SelectItem value="5stars">≥5★</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Variantes a generar</Label>
                <Select
                  value={settings.variantsToGenerate.toString()}
                  onValueChange={(value) => onUpdate({ variantsToGenerate: parseInt(value) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 variante</SelectItem>
                    <SelectItem value="2">2 variantes</SelectItem>
                    <SelectItem value="3">3 variantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Selección</Label>
                <Select
                  value={settings.selectionMode}
                  onValueChange={(value) => onUpdate({ selectionMode: value as "auto" | "manual" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automática (mejor de N)</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Modelo y creatividad (IA) */}
        <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Modelo y creatividad (IA)
            </CardTitle>
            <CardDescription>Configuración técnica del modelo de IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                value={settings.model}
                onValueChange={(value) => onUpdate({ model: value as "gpt-4o" | "gpt-4o-mini" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Más rápido)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Creatividad/Temperatura</Label>
              <GradualSlider
                value={settings.creativity}
                onChange={(value) => onUpdate({ creativity: value })}
                options={creativityOptions}
                gradient="from-slate-400 to-violet-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxChars">Máximo de caracteres</Label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  id="maxChars"
                  min={100}
                  max={1000}
                  step={50}
                  value={settings.maxCharacters}
                  onChange={(e) => onUpdate({ maxCharacters: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <Badge variant="outline" className="min-w-20 justify-center">
                  {settings.maxCharacters}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
