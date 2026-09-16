import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  useChangePassword,
  useUpdateAccount,
  useUpdateAvatar,
  useUpdateCover,
} from "@/features/account/hooks";
import { toUserMessage } from "@/lib/apiError";
import { useToast } from "@/components/ui/useToast";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const updateAccount = useUpdateAccount();
  const updateAvatar = useUpdateAvatar();
  const updateCover = useUpdateCover();
  const changePassword = useChangePassword();
  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const onAccount = async (event: FormEvent) => {
    event.preventDefault();
    setAccountError(null);
    try {
      await updateAccount.mutateAsync({
        fullname: fullname.trim(),
        email: email.trim(),
      });
      toast.push("Account updated.");
    } catch (err) {
      setAccountError(toUserMessage(err));
    }
  };

  const onImage = async (
    file: File | undefined,
    kind: "avatar" | "cover"
  ) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.push("Use a jpeg, png, webp, or gif image up to 5MB.");
      return;
    }
    const form = new FormData();
    try {
      if (kind === "avatar") {
        form.append("avatar", file);
        await updateAvatar.mutateAsync(form);
        toast.push("Avatar updated.");
      } else {
        form.append("coverImage", file);
        await updateCover.mutateAsync(form);
        toast.push("Cover image updated.");
      }
    } catch (err) {
      toast.push(toUserMessage(err));
    }
  };

  const onPassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      toast.push("Password changed. Sign in again if your session ends.");
    } catch (err) {
      setPasswordError(toUserMessage(err));
    }
  };

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <h1 className="font-display text-3xl">Account</h1>
        <p className="text-muted">
          Changes apply only to your signed-in user. There is no channel description
          field on the API.
        </p>
      </div>

      <Card className="overflow-hidden">
        {user.coverImage ? (
          <img src={user.coverImage} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-32 bg-line" />
        )}
        <div className="flex items-center gap-4 p-5">
          <Avatar src={user.avatar} alt={user.fullname} size="lg" />
          <div>
            <p className="text-lg font-medium">{user.fullname}</p>
            <p className="text-muted">@{user.username}</p>
            <Link
              className="text-sm text-accent underline"
              to={`/channel/${encodeURIComponent(user.username)}`}
            >
              View public channel
            </Link>
          </div>
        </div>
      </Card>

      <Card className="grid gap-3 p-5">
        <h2 className="font-display text-xl">Profile photos</h2>
        <Input
          label="Avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => void onImage(e.target.files?.[0], "avatar")}
        />
        <Input
          label="Cover image"
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => void onImage(e.target.files?.[0], "cover")}
        />
      </Card>

      <Card className="p-5">
        <form className="grid gap-3" onSubmit={(e) => void onAccount(e)}>
          <h2 className="font-display text-xl">Name and email</h2>
          <Input
            label="Full name"
            name="fullname"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {accountError ? (
            <p className="text-sm text-danger" role="alert">
              {accountError}
            </p>
          ) : null}
          <Button type="submit" disabled={updateAccount.isPending}>
            {updateAccount.isPending ? "Saving…" : "Save account"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <form className="grid gap-3" onSubmit={(e) => void onPassword(e)}>
          <h2 className="font-display text-xl">Password</h2>
          <Input
            label="Current password"
            name="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {passwordError ? (
            <p className="text-sm text-danger" role="alert">
              {passwordError}
            </p>
          ) : null}
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? "Updating…" : "Change password"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
