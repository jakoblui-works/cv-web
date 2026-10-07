import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { THEME_STORAGE_KEY, ThemeToggle } from "./theme-toggle";

const root = document.documentElement;

function setStartingTheme(dark: boolean) {
  const hadDark = root.classList.contains("dark");
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  root.classList.toggle("dark", dark);

  return () => {
    root.classList.toggle("dark", hadDark);
    if (stored === null) localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, stored);
  };
}

const meta: Meta<typeof ThemeToggle> = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const StartsLight: Story = {
  beforeEach: () => setStartingTheme(false),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Dark theme" });
    await expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);

    await waitFor(() => expect(root).toHaveClass("dark"));
    await expect(toggle).toBeChecked();
    await expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  },
};

export const StartsDark: Story = {
  beforeEach: () => setStartingTheme(true),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Dark theme" });
    await expect(toggle).toBeChecked();

    await userEvent.click(toggle);

    await waitFor(() => expect(root).not.toHaveClass("dark"));
    await expect(toggle).not.toBeChecked();
    await expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  },
};

export const TogglesBack: Story = {
  beforeEach: () => setStartingTheme(false),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Dark theme" });

    await userEvent.click(toggle);
    await waitFor(() => expect(root).toHaveClass("dark"));
    await userEvent.click(toggle);

    await waitFor(() => expect(root).not.toHaveClass("dark"));
    await expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  },
};

export const KeyboardToggle: Story = {
  beforeEach: () => setStartingTheme(false),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Dark theme" });

    toggle.focus();
    await userEvent.keyboard(" ");

    await waitFor(() => expect(root).toHaveClass("dark"));
  },
};
