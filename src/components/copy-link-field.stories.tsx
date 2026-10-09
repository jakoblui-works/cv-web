import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";

import { CopyLinkField } from "./copy-link-field";

const fakeClipboard = (write: (text: string) => Promise<void>) => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: fn(write) },
    configurable: true,
  });
  return () => {
    Reflect.deleteProperty(navigator, "clipboard");
  };
};

let clipboardText = "";
const workingClipboard = () => {
  clipboardText = "";
  return fakeClipboard(async (text) => {
    clipboardText = text;
  });
};

const selectedText = (input: HTMLElement) => {
  const { value, selectionStart, selectionEnd } = input as HTMLInputElement;
  return value.slice(selectionStart ?? 0, selectionEnd ?? 0);
};

const meta: Meta<typeof CopyLinkField> = {
  title: "Components/CopyLinkField",
  component: CopyLinkField,
  args: { url: "https://cv.example.com/?title=title-a&skills=skill-a1" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CopyLinkField>;

export const ShowsTheLink: Story = {
  play: async ({ args, canvas }) => {
    await expect(
      canvas.getByRole("textbox", { name: "Link to this CV" }),
    ).toHaveValue(args.url);
    await expect(canvas.queryByText("Link copied")).toBeNull();
  },
};

export const CopiesFromTheIcon: Story = {
  beforeEach: workingClipboard,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Copy link" }));

    await waitFor(() =>
      expect(canvas.getByText("Link copied")).toBeInTheDocument(),
    );
    await expect(clipboardText).toBe(args.url);
  },
};

export const CopiesFromTheField: Story = {
  beforeEach: workingClipboard,
  play: async ({ args, canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Link to this CV" });
    await userEvent.click(field);

    await waitFor(() =>
      expect(canvas.getByText("Link copied")).toBeInTheDocument(),
    );
    await expect(clipboardText).toBe(args.url);
    // Selected, so it can still be copied by hand if the clipboard isn't available.
    await expect(selectedText(field)).toBe(args.url);
  },
};

export const CopyFails: Story = {
  beforeEach: () =>
    fakeClipboard(() =>
      Promise.reject(new DOMException("Denied", "NotAllowedError")),
    ),
  play: async ({ args, canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Link to this CV" });
    await userEvent.click(field);

    await expect(navigator.clipboard.writeText).toHaveBeenCalledWith(args.url);
    await expect(canvas.queryByText("Link copied")).toBeNull();
    // The text is still selected, so it can be copied by hand.
    await expect(selectedText(field)).toBe(args.url);
  },
};
