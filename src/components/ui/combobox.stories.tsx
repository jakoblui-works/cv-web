import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "./combobox";

const languages = ["TypeScript", "Python", "Rust", "Go"];

const groups = [
  { label: "Frontend", items: ["React", "Vue"] },
  { label: "Backend", items: ["FastAPI", "Django"] },
];

const meta: Meta<typeof Combobox> = {
  title: "UI/Combobox",
  component: Combobox,
  args: { onValueChange: fn() },
};
export default meta;

type Story = StoryObj<typeof Combobox>;

export const Single: Story = {
  render: (args) => (
    <Combobox items={languages} {...args}>
      <ComboboxInput aria-label="Language" placeholder="Pick a language" />
      <ComboboxContent>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const [target] = languages.filter((l) => l.length > 2);
    const input = canvas.getByRole("combobox", { name: "Language" });

    await userEvent.type(input, target.slice(0, 3));
    const listbox = await screen.findByRole("listbox");
    const shown = within(listbox)
      .getAllByRole("option")
      .map((o) => o.textContent);
    await expect(shown).toContain(target);
    await expect(
      shown.every((s) =>
        s?.toLowerCase().includes(target.slice(0, 3).toLowerCase()),
      ),
    ).toBe(true);

    await userEvent.click(within(listbox).getByRole("option", { name: target }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      target,
      expect.anything(),
    );
    await expect(input).toHaveValue(target);
  },
};

export const NoMatches: Story = {
  render: Single.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("combobox", { name: "Language" }),
      "zzzz-no-such-language",
    );

    await expect(await screen.findByText("No matches.")).toBeVisible();
    await expect(screen.queryAllByRole("option")).toHaveLength(0);
  },
};

const MultipleWithChips = (args: Story["args"]) => {
  const anchor = useComboboxAnchor();
  return (
    <Combobox multiple items={languages} {...args}>
      <ComboboxChips ref={anchor} className="w-72">
        <ComboboxValue>
          {(values: string[]) =>
            values.map((value) => (
              <ComboboxChip key={value}>{value}</ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput aria-label="Languages" />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export const Multiple: Story = {
  render: (args) => <MultipleWithChips {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const [first, second] = languages;
    const input = canvas.getByRole("combobox", { name: "Languages" });

    await userEvent.click(input);
    await userEvent.click(await screen.findByRole("option", { name: first }));
    await userEvent.click(await screen.findByRole("option", { name: second }));

    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      [first, second],
      expect.anything(),
    );
    await expect(canvas.getByText(first)).toBeVisible();
    await expect(canvas.getByText(second)).toBeVisible();
  },
};

export const MultipleDeselect: Story = {
  args: { defaultValue: [languages[0], languages[1]] },
  render: (args) => <MultipleWithChips {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const [first, second] = languages;

    await userEvent.click(canvas.getByRole("combobox", { name: "Languages" }));
    await userEvent.click(await screen.findByRole("option", { name: first }));

    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      [second],
      expect.anything(),
    );
  },
};

export const Grouped: Story = {
  render: (args) => (
    <Combobox items={groups} {...args}>
      <ComboboxInput aria-label="Framework" placeholder="Pick a framework" />
      <ComboboxContent>
        <ComboboxList>
          {(group: (typeof groups)[number]) => (
            <ComboboxGroup key={group.label} items={group.items}>
              <ComboboxLabel>{group.label}</ComboboxLabel>
              <ComboboxCollection>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Framework" }));
    const listbox = await screen.findByRole("listbox");

    for (const group of groups) {
      const section = within(listbox).getByRole("group", { name: group.label });
      const options = within(section)
        .getAllByRole("option")
        .map((o) => o.textContent);
      await expect(options).toEqual(group.items);
    }
  },
};

export const GroupedFiltering: Story = {
  render: Grouped.render,
  play: async ({ canvas, userEvent }) => {
    const [kept, hidden] = groups;
    const target = kept.items[0];

    await userEvent.type(
      canvas.getByRole("combobox", { name: "Framework" }),
      target,
    );
    const listbox = await screen.findByRole("listbox");

    await waitFor(() =>
      expect(
        within(listbox).queryByRole("group", { name: hidden.label }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      within(listbox).getByRole("option", { name: target }),
    ).toBeVisible();
  },
};
