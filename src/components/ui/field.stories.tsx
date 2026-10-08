import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "./field";
import { Input } from "./input";

const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
};
export default meta;

type Story = StoryObj<typeof Field>;

export const WithDescription: Story = {
  render: () => (
    <FieldGroup className="w-72">
      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" aria-describedby="username-hint" />
        <FieldDescription id="username-hint">
          Shown on your public profile.
        </FieldDescription>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("textbox", { name: "Username" }),
    ).toHaveAccessibleDescription("Shown on your public profile.");
  },
};

export const WithOneError: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="age">Age</FieldLabel>
      <Input id="age" aria-invalid />
      <FieldError errors={[{ message: "Must be a number" }]} />
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Must be a number",
    );
  },
};

export const WithRepeatedErrors: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="code">Code</FieldLabel>
      <Input id="code" aria-invalid />
      <FieldError
        errors={[
          { message: "Too short" },
          { message: "Must start with a letter" },
          { message: "Too short" },
        ]}
      />
    </Field>
  ),
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole("listitem");
    const messages = items.map((item) => item.textContent);

    await expect(new Set(messages).size).toBe(messages.length);
    await expect(messages).toEqual(
      expect.arrayContaining(["Too short", "Must start with a letter"]),
    );
  },
};

export const WithoutErrors: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="city">City</FieldLabel>
      <Input id="city" />
      <FieldError errors={[]} />
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};
