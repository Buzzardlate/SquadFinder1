import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, GraduationCap, LogOut, Loader2 } from "lucide-react";

interface Profile {
  name: string;
  profile_type: "empresa" | "estudante";
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, profile_type")
        .eq("user_id", user.id)
        .single();
      setProfile(data as Profile | null);
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  if (authLoading || loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isEmpresa = profile?.profile_type === "empresa";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Painel
          </h1>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              {isEmpresa ? (
                <Building2 className="h-8 w-8 text-accent-foreground" />
              ) : (
                <GraduationCap className="h-8 w-8 text-accent-foreground" />
              )}
            </div>
            <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              Bem-vindo, {profile?.name || "Usuário"}!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground">
              Perfil: <span className="font-medium text-foreground capitalize">{profile?.profile_type}</span>
            </p>
            <p className="text-muted-foreground">
              E-mail: <span className="font-medium text-foreground">{user.email}</span>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
