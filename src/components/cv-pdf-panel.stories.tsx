import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { getCvGetPdfUrl } from "@/api/generated/cv/cv";

import { CvPdfPanel } from "./cv-pdf-panel";

const meta: Meta<typeof CvPdfPanel> = {
  title: "CV/CvPdfPanel",
  component: CvPdfPanel,
  args: { fileName: "cv.pdf", inline: true },
  decorators: [
    // Inline, the panel fills its container's height, like the desktop result layout.
    (Story, { args }) => (
      <div className={args.inline ? "h-160 w-lg" : "w-80"}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CvPdfPanel>;

const done = { status: "done", digest: "example-digest" } as const;

export const Processing: Story = {
  args: { generation: { status: "processing" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toBeVisible();
    await expect(canvas.queryByRole("link")).toBeNull();
    await expect(canvas.queryByTitle("Generated CV")).toBeNull();
  },
};

export const Done: Story = {
  args: { generation: done },
  play: async ({ args, canvas }) => {
    const pdfUrl = getCvGetPdfUrl(done.digest);

    const open = canvas.getByRole("link", { name: "Open PDF" });
    await expect(open).toHaveAttribute("href", pdfUrl);
    await expect(open).toHaveAttribute("target", "_blank");

    const download = canvas.getByRole("link", { name: "Download PDF" });
    await expect(download).toHaveAttribute("href", pdfUrl);
    await expect(download).toHaveAttribute("download", args.fileName);

    const frame = canvas.getByTitle("Generated CV");
    await expect(frame).toBeVisible();
    const [frameUrl, viewerParams] = (frame.getAttribute("src") ?? "").split(
      "#",
    );
    await expect(frameUrl).toBe(pdfUrl);
    await expect(new URLSearchParams(viewerParams).get("navpanes")).toBe("0");
  },
};

export const Failed: Story = {
  args: { generation: { status: "failed" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(canvas.queryByRole("link")).toBeNull();
    await expect(canvas.queryByTitle("Generated CV")).toBeNull();
  },
};

export const Idle: Story = {
  args: { generation: { status: "idle" } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe("");
  },
};

export const ProcessingOnPhone: Story = {
  ...Processing,
  args: { ...Processing.args, inline: false },
};

export const DoneOnPhone: Story = {
  args: { generation: done, inline: false },
  play: async ({ args, canvas }) => {
    const pdfUrl = getCvGetPdfUrl(done.digest);

    await expect(
      canvas.getByRole("link", { name: "Open PDF" }),
    ).toHaveAttribute("href", pdfUrl);
    await expect(
      canvas.getByRole("link", { name: "Download PDF" }),
    ).toHaveAttribute("download", args.fileName);
    await expect(canvas.queryByTitle("Generated CV")).toBeNull();
  },
};

export const FailedOnPhone: Story = {
  ...Failed,
  args: { ...Failed.args, inline: false },
};
