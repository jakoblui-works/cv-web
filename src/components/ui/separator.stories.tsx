import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  decorators: [
    (Story) => (
      <div className="flex h-12 w-48 items-center gap-2">
        <span>Left</span>
        <Story />
        <span>Right</span>
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  },
};
