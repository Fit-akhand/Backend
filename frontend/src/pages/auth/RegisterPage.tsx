import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { toUserMessage } from "@/lib/apiError";

const schema = z.object({
  fullname: z.string().min(1, "Full name is required").max(80),
  username: z.string().min(3, "Username must be at least 3 characters").max(32),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  avatar: z
    .custom<FileList>((value) => value instanceof FileList && value.length === 1, {
      message: "Avatar image is required",
    }),
});

type FormValues = z.infer<typeof schema>;

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const RegisterPage = () => {
  const registerUser = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const avatar = values.avatar[0];
    if (!allowedTypes.includes(avatar.type)) {
      setFormError("Avatar must be a jpeg, png, webp, or gif image.");
      return;
    }
    if (avatar.size > 5 * 1024 * 1024) {
      setFormError("Avatar must be 5MB or smaller.");
      return;
    }

    const body = new FormData();
    body.append("fullname", values.fullname.trim());
    body.append("username", values.username.trim());
    body.append("email", values.email.trim());
    body.append("password", values.password);
    body.append("avatar", avatar);

    try {
      await registerUser(body);
      await login({ email: values.email.trim(), password: values.password });
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(toUserMessage(error));
    }
  });

  return (
    <AuthLayout title="Create account">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Input
          label="Full name"
          autoComplete="name"
          error={form.formState.errors.fullname?.message}
          {...form.register("fullname")}
        />
        <Input
          label="Username"
          autoComplete="username"
          error={form.formState.errors.username?.message}
          {...form.register("username")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Input
          label="Avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          error={form.formState.errors.avatar?.message}
          {...form.register("avatar")}
        />
        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link className="text-accent underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
