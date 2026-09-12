import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import useDebounce from "@/hooks/useDebounce";
import { checkIsLiked, cn, multiFormatDateString } from "@/lib/utils";

const DebouncedValue = ({ value }: { value: string }) => {
  const debounced = useDebounce(value, 500);

  return <div>{debounced}</div>;
};

describe("shared utilities", () => {
  it("merges conditional class names", () => {
    expect(cn("base", false && "hidden", "active")).toBe("base active");
  });

  it("detects whether the current user liked a post", () => {
    expect(checkIsLiked(["user-1", "user-2"], "user-2")).toBe(true);
    expect(checkIsLiked(["user-1"], "user-3")).toBe(false);
  });

  it("formats very recent timestamps as just now", () => {
    expect(multiFormatDateString(new Date().toISOString())).toBe("Just now");
  });

  it("debounces changing values", () => {
    vi.useFakeTimers();
    const { rerender } = render(<DebouncedValue value="first" />);

    expect(screen.getByText("first")).toBeInTheDocument();

    rerender(<DebouncedValue value="second" />);
    expect(screen.queryByText("second")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("second")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
