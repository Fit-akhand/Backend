type Props = {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" };

export const Avatar = ({ src, alt, size = "md" }: Props) => (
  <img
    src={src || "/favicon.svg"}
    alt={alt}
    className={`${sizes[size]} rounded-full object-cover bg-line`}
  />
);
