import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  args: { "aria-label": "Notes", placeholder: "Notes", onChange: fn() },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const textarea = canvas.getByRole("textbox", { name: "Notes" });
    await userEvent.type(textarea, "first line{Enter}second line");

    await expect(textarea).toHaveValue("first line\nsecond line");
    await expect(args.onChange).toHaveBeenCalled();
  },
};
