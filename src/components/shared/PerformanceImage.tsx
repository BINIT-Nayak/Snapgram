import { useState } from "react";

import { cn } from "@/lib/utils";

type ImageFetchPriority = "high" | "low" | "auto";

type PerformanceImageProps = {
  src?: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  eager?: boolean;
};

const PerformanceImage = ({
  src,
  alt,
  className,
  wrapperClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px",
  eager = false,
}: PerformanceImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageSrc = src || "/assets/icons/profile-placeholder.svg";
  const priorityProps = {
    fetchpriority: eager ? "high" : "auto",
  } as { fetchpriority: ImageFetchPriority };

  return (
    <span
      className={cn("performance-image_frame", wrapperClassName)}
      style={{ backgroundImage: `url(${imageSrc})` }}>
      {!isLoaded && <span className="performance-image_skeleton" />}
      <img
        src={imageSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        {...priorityProps}
        className={cn(
          "performance-image",
          isLoaded ? "performance-image_loaded" : "performance-image_loading",
          className
        )}
      />
    </span>
  );
};

export default PerformanceImage;
