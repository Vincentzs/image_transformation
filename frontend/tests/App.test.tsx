import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../src/api.js", () => ({
  listImages: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

import App from "../src/App.js";
import * as api from "../src/api.js";

const listImages = api.listImages as ReturnType<typeof vi.fn>;
const uploadImage = api.uploadImage as ReturnType<typeof vi.fn>;

describe("App", () => {
  beforeEach(() => {
    listImages.mockReset();
    uploadImage.mockReset();
  });

  it("uploads a file, shows the result, and refreshes the gallery", async () => {
    listImages
      .mockResolvedValueOnce([]) // initial load
      .mockResolvedValueOnce([
        { id: "image-transform/abc", url: "https://x/abc.png", createdAt: "2026-06-06T00:00:00Z" },
      ]); // after upload
    uploadImage.mockResolvedValue({
      id: "image-transform/abc",
      url: "https://x/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });

    render(<App />);

    await screen.findByText(/nothing here yet/i);

    const file = new File(["x"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file));
    expect(await screen.findByText(/ta-da/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole("img").some((img) => img.getAttribute("src") === "https://x/abc.png")).toBe(true),
    );
  });
});
