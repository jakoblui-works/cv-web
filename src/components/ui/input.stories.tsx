import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: { "aria-label": "Name", placeholder: "Your name", onChange: fn() },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Ada");

    await expect(input).toHaveValue("Ada");
    await expect(args.onChange).toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Ada");

    await expect(input).toBeDisabled();
    await expect(input).toHaveValue("");
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
