import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  args: { onValueChange: fn() },
  render: (args) => (
    <Select items={fruits} {...args}>
      <SelectTrigger aria-label="Fruit" className="w-48">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {fruits.map((fruit) => (
            <SelectItem key={fruit.value} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const [, choice] = fruits;
    const trigger = canvas.getByRole("combobox", { name: "Fruit" });
    await expect(trigger).toHaveTextContent("Pick a fruit");

    await userEvent.click(trigger);
    await userEvent.click(
      await screen.findByRole("option", { name: choice.label }),
    );

    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      choice.value,
      expect.anything(),
    );
    await waitFor(() => expect(trigger).toHaveTextContent(choice.label));
  },
};

export const WithInitialValue: Story = {
  args: { defaultValue: fruits[2].value },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("combobox", { name: "Fruit" }),
    ).toHaveTextContent(fruits[2].label);
  },
};
