import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PerformanceImage from "@/components/shared/PerformanceImage";

describe("PerformanceImage", () => {
  it("lazy loads non-priority images", () => {
    render(<PerformanceImage src="/post.jpg" alt="Post" />);

    const image = screen.getByAltText("Post");

    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image).toHaveAttribute("fetchPriority", "auto");
  });

  it("marks priority images eager with high fetch priority", () => {
    render(<PerformanceImage src="/post.jpg" alt="Post" eager />);

    const image = screen.getByAltText("Post");

    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchPriority", "high");
  });

  it("renders a skeleton until the image loads", () => {
    const { container } = render(<PerformanceImage src="/post.jpg" alt="Post" />);

    expect(container.querySelector(".performance-image_skeleton")).toBeTruthy();

    fireEvent.load(screen.getByAltText("Post"));

    expect(container.querySelector(".performance-image_skeleton")).toBeNull();
  });
});
