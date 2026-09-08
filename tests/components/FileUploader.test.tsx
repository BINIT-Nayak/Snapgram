import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FileUploader from "@/components/shared/FileUploader";

describe("FileUploader", () => {
  it("shows an empty upload prompt", () => {
    render(<FileUploader fieldChange={vi.fn()} mediaUrl="" />);

    expect(screen.getByText("Drag photo here")).toBeInTheDocument();
    expect(screen.getByText("Select from computer")).toBeInTheDocument();
  });

  it("passes accepted files back and renders a preview", async () => {
    const user = userEvent.setup();
    const fieldChange = vi.fn();
    const file = new File(["image"], "post.png", { type: "image/png" });

    render(<FileUploader fieldChange={fieldChange} mediaUrl="" />);

    await user.upload(document.querySelector("input") as HTMLInputElement, file);

    expect(fieldChange).toHaveBeenCalledWith([file]);
    expect(screen.getByAltText("image")).toHaveAttribute(
      "src",
      "blob:snapgram-test-preview"
    );
  });
});
