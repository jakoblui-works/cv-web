import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import type { FormOptionsResponseOutput } from "@/api/generated/model";

import { CvForm, type CvSelection } from "./cv-form";

const options: FormOptionsResponseOutput = {
  titles: [
    { id: "title-a", label: "Title A" },
    { id: "title-b", label: "Title B" },
  ],
  concepts: [
    { id: "concept-a", label: "Concept A" },
    { id: "concept-b", label: "Concept B" },
    { id: "concept-c", label: "Concept C" },
  ],
  skill_groups: [
    {
      id: "group-a",
      label: "Group A",
      skills: [
        { id: "skill-a1", label: "Skill A1" },
        { id: "skill-a2", label: "Skill A2" },
      ],
    },
    {
      id: "group-b",
      label: "Group B",
      skills: [{ id: "skill-b1", label: "Skill B1" }],
    },
  ],
};

const empty: CvSelection = { conceptIds: [], skillIds: [] };

type Args = React.ComponentProps<typeof CvForm>;

/** Keeps the selection in local state, like the route will, and reports every change. */
function Controlled({ options, value, onChange }: Args) {
  const [selection, setSelection] = useState(value);
  return (
    <div className="w-96">
      <CvForm
        options={options}
        value={selection}
        onChange={(next) => {
          setSelection(next);
          onChange(next);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof CvForm> = {
  title: "CV/CvForm",
  component: CvForm,
  args: { options, value: empty, onChange: fn() },
  render: (args) => <Controlled {...args} />,
};
export default meta;

type Story = StoryObj<typeof CvForm>;

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Title" })).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Concepts" }),
    ).toBeVisible();
    await expect(canvas.getByRole("combobox", { name: "Skills" })).toBeVisible();
  },
};

export const ChooseTitle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const [, title] = options.titles;
    const trigger = canvas.getByRole("combobox", { name: "Title" });

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: title.label }));

    await expect(args.onChange).toHaveBeenLastCalledWith({
      ...empty,
      titleId: title.id,
    });
    await waitFor(() => expect(trigger).toHaveTextContent(title.label));
  },
};

export const ChooseConcepts: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const [first, , third] = options.concepts;

    await userEvent.click(canvas.getByRole("combobox", { name: "Concepts" }));
    await userEvent.click(await screen.findByRole("option", { name: first.label }));
    await userEvent.click(await screen.findByRole("option", { name: third.label }));

    await expect(args.onChange).toHaveBeenLastCalledWith({
      ...empty,
      conceptIds: [first.id, third.id],
    });
    await expect(canvas.getByText(first.label)).toBeVisible();
    await expect(canvas.getByText(third.label)).toBeVisible();
  },
};

export const SkillsAreGrouped: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Skills" }));
    const listbox = await screen.findByRole("listbox");

    for (const group of options.skill_groups) {
      const section = within(listbox).getByRole("group", { name: group.label });
      const shown = within(section)
        .getAllByRole("option")
        .map((o) => o.textContent);
      await expect(shown).toEqual(group.skills.map((s) => s.label));
    }
  },
};

export const ChooseSkills: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const skill = options.skill_groups.at(-1)!.skills[0];

    await userEvent.type(
      canvas.getByRole("combobox", { name: "Skills" }),
      skill.label,
    );
    await userEvent.click(await screen.findByRole("option", { name: skill.label }));

    await expect(args.onChange).toHaveBeenLastCalledWith({
      ...empty,
      skillIds: [skill.id],
    });
  },
};

export const FilterSkillsByLabel: Story = {
  play: async ({ canvas, userEvent }) => {
    const [kept, hidden] = options.skill_groups;
    const skill = kept.skills[0];

    await userEvent.type(
      canvas.getByRole("combobox", { name: "Skills" }),
      skill.label,
    );
    const listbox = await screen.findByRole("listbox");

    await waitFor(() =>
      expect(
        within(listbox).queryByRole("group", { name: hidden.label }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      within(listbox).getByRole("option", { name: skill.label }),
    ).toBeVisible();
  },
};

const prefilled: CvSelection = {
  titleId: options.titles[0].id,
  conceptIds: [options.concepts[1].id],
  skillIds: [options.skill_groups[0].skills[1].id],
};

export const Prefilled: Story = {
  args: { value: prefilled },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("combobox", { name: "Title" }),
    ).toHaveTextContent(options.titles[0].label);
    await expect(canvas.getByText(options.concepts[1].label)).toBeVisible();
    await expect(
      canvas.getByText(options.skill_groups[0].skills[1].label),
    ).toBeVisible();
  },
};

export const KeepsOtherFieldsWhenOneChanges: Story = {
  args: { value: prefilled },
  play: async ({ args, canvas, userEvent }) => {
    const extra = options.concepts[0];

    await userEvent.click(canvas.getByRole("combobox", { name: "Concepts" }));
    await userEvent.click(await screen.findByRole("option", { name: extra.label }));

    await expect(args.onChange).toHaveBeenLastCalledWith({
      ...prefilled,
      conceptIds: [...prefilled.conceptIds, extra.id],
    });
  },
};

export const UnknownIdsShowAsIds: Story = {
  args: { value: { ...empty, skillIds: ["removed-skill"] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("removed-skill")).toBeVisible();
  },
};
