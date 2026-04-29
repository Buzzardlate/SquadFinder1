import { useState, useRef, KeyboardEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Check, X, Plus } from "lucide-react";

interface Profile {
  name: string;
  profileType: "empresa" | "estudante";
  habilidades?: string[];
}

interface ProfileEditorProps {
  userId: string;
  profile: Profile;
  onSave: (updated: Profile) => void;
}

const STORAGE_KEY = "squadfinder_users";

const ProfileEditor = ({ userId, profile, onSave }: ProfileEditorProps) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [habilidades, setHabilidades] = useState<string[]>(profile.habilidades || []);
  const [novaHabilidade, setNovaHabilidade] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const adicionarHabilidade = () => {
    const trimmed = novaHabilidade.trim();
    if (!trimmed) return;
    if (habilidades.includes(trimmed)) {
      toast.error("Esta habilidade já foi adicionada.");
      return;
    }
    setHabilidades((prev) => [...prev, trimmed]);
    setNovaHabilidade("");
    inputRef.current?.focus();
  };

  const removerHabilidade = (hab: string) => {
    setHabilidades((prev) => prev.filter((h) => h !== hab));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarHabilidade();
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].name = name.trim();
        users[userIndex].habilidades = habilidades;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        
        if (user) {
          localStorage.setItem("squadfinder_session", JSON.stringify({
            ...user,
            name: name.trim(),
            habilidades,
          }));
        }
      }

      toast.success("Perfil atualizado com sucesso!");
      onSave({ ...profile, name: name.trim(), habilidades });
      setEditing(false);
    } catch (err) {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(profile.name);
    setHabilidades(profile.habilidades || []);
    setNovaHabilidade("");
    setErrors({});
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            Meu Perfil
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Nome</p>
            <p className="text-foreground font-medium">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Habilidades {habilidades.length > 0 && <span className="normal-case">({habilidades.length})</span>}
            </p>
            {habilidades.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhuma habilidade adicionada ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {habilidades.map((hab) => (
                  <Badge key={hab} variant="secondary" className="text-sm">
                    {hab}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
          Editando Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">Nome</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? "border-destructive" : ""}
            placeholder="Seu nome completo"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label>Habilidades</Label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={novaHabilidade}
              onChange={(e) => setNovaHabilidade(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Ex: React, Python, UX Design..."
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={adicionarHabilidade} title="Adicionar habilidade">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Pressione Enter ou clique em + para adicionar</p>

          {habilidades.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {habilidades.map((hab) => (
                <Badge key={hab} variant="secondary" className="gap-1.5 pr-1.5 text-sm">
                  {hab}
                  <button
                    type="button"
                    onClick={() => removerHabilidade(hab)}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                    title={`Remover ${hab}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={saving} className="flex-1">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;