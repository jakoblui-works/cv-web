import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
};
export default meta;

type Story = StoryObj<typeof Label>;

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    await userEvent.click(canvas.getByText("Email"));

    await expect(input).toHaveFocus();
  },
};
