import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { ApiError } from "@/api/fetcher";

import { OptionsLoadError } from "./options-load-error";

const meta: Meta<typeof OptionsLoadError> = {
  title: "CV/OptionsLoadError",
  component: OptionsLoadError,
};
export default meta;

type Story = StoryObj<typeof OptionsLoadError>;

export const NotPublishedYet: Story = {
  args: { error: new ApiError(503, { detail: "CV options are not published yet" }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(/aren’t available yet/i);
  },
};

export const ServerError: Story = {
  args: { error: new ApiError(500, "Internal Server Error") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(/couldn’t load/i);
  },
};

export const NetworkError: Story = {
  args: { error: new TypeError("Failed to fetch") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(/couldn’t load/i);
  },
};
