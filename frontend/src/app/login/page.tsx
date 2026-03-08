"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi, type AuthUser } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { ApplynLogoOrCustom } from "@/components/brand/ApplynLogoOrCustom";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantName: z.string().min(1, "Enter your organization name"),
});
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  return logoUrl.startsWith("http") ? logoUrl : `${API_BASE}${logoUrl}`;
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", tenantName: "" } });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", tenantName: "" } });
  const { companyName, logoUrl, primaryColor } = useTenantBranding(null);
  const logoSrc = resolveLogoUrl(logoUrl);

  const onLogin = async (data: LoginForm) => {
    setError("");
    try {
      const res = await authApi.login({ email: data.email, password: data.password, tenantName: data.tenantName });
      setAuth(res.token, res.user as AuthUser, res.tenant);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setError("");
    try {
      const res = await authApi.register({ name: data.name, email: data.email, password: data.password, tenantName: data.tenantName });
      setAuth(res.token, res.user as AuthUser, res.tenant);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-3 mb-2">
            {logoSrc ? (
              <Image src={logoSrc} alt={companyName} width={48} height={48} className="object-contain" unoptimized />
            ) : (
              <ApplynLogoOrCustom size={56} showText={true} textSize="lg" />
            )}
            {logoSrc && <CardTitle className="text-xl" style={{ color: primaryColor }}>{companyName}</CardTitle>}
          </div>
          <CardTitle className="text-base font-normal text-muted-foreground">{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          {mode === "login" ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <Label>Organization name</Label>
                <Input {...loginForm.register("tenantName")} placeholder="e.g. Acme Corp, Express Financial" className="mt-1" />
                {loginForm.formState.errors.tenantName && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.tenantName.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...loginForm.register("email")} className="mt-1" />
                {loginForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" {...loginForm.register("password")} className="mt-1" />
                {loginForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full text-white hover:opacity-90" style={{ backgroundColor: primaryColor }}>Sign in</Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <Label>Organization name</Label>
                <Input {...registerForm.register("tenantName")} placeholder="e.g. Acme Corp, Sunnyvale School" className="mt-1" />
                {registerForm.formState.errors.tenantName && <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.tenantName.message}</p>}
              </div>
              <div>
                <Label>Your name</Label>
                <Input {...registerForm.register("name")} className="mt-1" />
                {registerForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...registerForm.register("email")} className="mt-1" />
                {registerForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" {...registerForm.register("password")} className="mt-1" />
                {registerForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full text-white hover:opacity-90" style={{ backgroundColor: primaryColor }}>Create account</Button>
            </form>
          )}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-sm text-muted-foreground mt-4 block w-full text-center hover:underline">
            {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
