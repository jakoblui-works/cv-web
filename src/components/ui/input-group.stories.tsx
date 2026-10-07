import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon, XIcon } from "lucide-react";
import { expect, fn } from "storybook/test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

const meta: Meta<typeof InputGroup> = {
  title: "UI/InputGroup",
  component: InputGroup,
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof InputGroup>;

const onClear = fn();

export const WithAddons: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search" placeholder="Search" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Clear" onClick={onClear}>
          <XIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Search" });
    await userEvent.type(input, "react");
    await expect(input).toHaveValue("react");

    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(onClear).toHaveBeenCalledOnce();
  },
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup>
      <InputGroupTextarea aria-label="Message" placeholder="Message" />
      <InputGroupAddon align="block-end">
        <InputGroupText>Markdown supported</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.type(textarea, "Hello");

    await expect(textarea).toHaveValue("Hello");
    await expect(canvas.getByText("Markdown supported")).toBeVisible();
  },
};
