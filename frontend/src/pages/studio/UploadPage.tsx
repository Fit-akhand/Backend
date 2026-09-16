import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePublishVideo } from "@/features/videos/hooks";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { toUserMessage } from "@/lib/apiError";
import { useToast } from "@/components/ui/useToast";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_VIDEO = 100 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

export const UploadPage = () => {
  const publish = usePublishVideo();
  const navigate = useNavigate();
  const toast = useToast();
  const submitting = useRef(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!title.trim()) return "Title is required.";
    if (title.trim().length > 200) return "Title must be 200 characters or fewer.";
    if (!description.trim()) return "Description is required.";
    if (description.trim().length > 5000) return "Description is too long.";
    if (!videoFile) return "A video file is required.";
    if (!VIDEO_TYPES.includes(videoFile.type)) {
      return "Video must be MP4, WebM, or QuickTime.";
    }
    if (videoFile.size > MAX_VIDEO) return "Video must be 100MB or smaller.";
    if (!thumbnail) return "A thumbnail image is required.";
    if (!IMAGE_TYPES.includes(thumbnail.type)) {
      return "Thumbnail must be jpeg, png, webp, or gif.";
    }
    if (thumbnail.size > MAX_IMAGE) return "Thumbnail must be 5MB or smaller.";
    return null;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || publish.isPending) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    submitting.current = true;
    const form = new FormData();
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("videoFile", videoFile!);
    form.append("thumbnail", thumbnail!);
    try {
      const video = await publish.mutateAsync(form);
      toast.push("Video published.");
      navigate(`/watch/${video._id}`);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      submitting.current = false;
    }
  };

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="font-display text-3xl">Upload</h1>
        <p className="mt-1 text-muted">
          Vidzora requires a video file, thumbnail, title, and description. New uploads
          are published immediately by the API.
        </p>
      </div>
      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Input
            label="Title"
            name="title"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            name="description"
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <Input
            label="Video file"
            name="videoFile"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
          <Input
            label="Thumbnail"
            name="thumbnail"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
          />
          {videoFile ? (
            <p className="text-sm text-muted">
              Selected video: {videoFile.name} ({Math.round(videoFile.size / 1024)} KB)
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={publish.isPending}>
              {publish.isPending ? "Uploading…" : "Publish video"}
            </Button>
            {error && !publish.isPending ? (
              <Button type="submit" variant="secondary">
                Retry
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
};
