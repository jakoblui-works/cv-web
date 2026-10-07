import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { useMemo } from "react";

import type {
  FormOptionOutput,
  FormOptionsResponseOutput,
} from "@/api/generated/model";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CvSelection = {
  titleId?: string;
  conceptIds: string[];
  skillIds: string[];
};

type CvFormProps = {
  options: FormOptionsResponseOutput;
  value: CvSelection;
  onChange: (value: CvSelection) => void;
};

type OptionGroup = {
  id: string;
  label: string;
  items: FormOptionOutput[];
};

const optionAccessors = {
  getValue: (option: FormOptionOutput) => option.id,
  getLabel: (option: FormOptionOutput) => option.label,
};

export function CvForm({ options, value, onChange }: CvFormProps) {
  const titleLabels = useMemo(
    () => Object.fromEntries(options.titles.map((t) => [t.id, t.label])),
    [options.titles],
  );

  const skillGroups = useMemo<OptionGroup[]>(
    () =>
      options.skill_groups.map((group) => ({
        id: group.id,
        label: group.label,
        items: group.skills,
      })),
    [options.skill_groups],
  );

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="cv-title">Title</FieldLabel>
        <Select
          items={titleLabels}
          value={value.titleId ?? null}
          onValueChange={(titleId: string | null) =>
            onChange({ ...value, titleId: titleId ?? undefined })
          }
        >
          <SelectTrigger id="cv-title" className="w-full">
            <SelectValue placeholder="Choose a title" />
          </SelectTrigger>
          <SelectContent>
            {options.titles.map((title) => (
              <SelectItem key={title.id} value={title.id}>
                {title.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <MultiOptionField
        id="cv-concepts"
        label="Concepts"
        placeholder="Add concepts"
        data={options.concepts}
        value={value.conceptIds}
        onChange={(conceptIds) => onChange({ ...value, conceptIds })}
      />

      <MultiOptionField
        id="cv-skills"
        label="Skills"
        placeholder="Add skills"
        data={skillGroups}
        value={value.skillIds}
        onChange={(skillIds) => onChange({ ...value, skillIds })}
      />
    </FieldGroup>
  );
}

function OptionItem({ option }: { option: FormOptionOutput }) {
  return <ComboboxItem value={option.id}>{option.label}</ComboboxItem>;
}

type MultiOptionFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  data: FormOptionOutput[] | OptionGroup[];
  value: string[];
  onChange: (ids: string[]) => void;
};

function MultiOptionField({
  id,
  label,
  placeholder,
  data,
  value,
  onChange,
}: MultiOptionFieldProps) {
  const anchor = useComboboxAnchor();
  const items = useMemo(
    () => ComboboxPrimitive.createItems(data, optionAccessors),
    [data],
  );
  const labels = useMemo(() => {
    const byId = new Map<string, string>();
    for (const entry of data) {
      for (const option of "items" in entry ? entry.items : [entry]) {
        byId.set(option.id, option.label);
      }
    }
    return byId;
  }, [data]);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        multiple
        items={items}
        value={value}
        onValueChange={onChange}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(ids: string[]) =>
              ids.map((optionId) => (
                <ComboboxChip key={optionId}>
                  {labels.get(optionId) ?? optionId}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput
            id={id}
            placeholder={value.length === 0 ? placeholder : undefined}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList>
            {(entry: FormOptionOutput | OptionGroup) =>
              "items" in entry ? (
                <ComboboxGroup key={entry.id} items={entry.items}>
                  <ComboboxLabel>{entry.label}</ComboboxLabel>
                  <ComboboxCollection>
                    {(option: FormOptionOutput) => (
                      <OptionItem key={option.id} option={option} />
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              ) : (
                <OptionItem key={entry.id} option={entry} />
              )
            }
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
