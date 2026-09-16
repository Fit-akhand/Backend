import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { toUserMessage } from "@/lib/apiError";
import { useState } from "react";

const schema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const identifier = values.identifier.trim();
    try {
      await login(
        identifier.includes("@")
          ? { email: identifier, password: values.password }
          : { username: identifier, password: values.password }
      );
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (error) {
      setFormError(toUserMessage(error));
    }
  });

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Input
          label="Email or username"
          autoComplete="username"
          error={form.formState.errors.identifier?.message}
          {...form.register("identifier")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        New here?{" "}
        <Link className="text-accent underline" to="/register">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};
