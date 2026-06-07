import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyUrlButton } from "../src/components/CopyUrlButton.js";

describe("CopyUrlButton", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("copies the url to the clipboard and shows confirmation", async () => {
    render(<CopyUrlButton url="https://example.com/a.png" />);

    const button = screen.getByRole("button", { name: /copy/i });
    expect(button).toHaveTextContent("Copy URL");

    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com/a.png");
    await waitFor(() => expect(button).toHaveTextContent("Copied!"));
  });
});
