import { CheckIcon, CopyIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

const COPIED_FOR_MS = 2000;

type CopyLinkFieldProps = {
  url: string;
  className?: string;
};

export const CopyLinkField = ({ url, className }: CopyLinkFieldProps) => {
  const { copied, copy } = useCopyToClipboard(COPIED_FOR_MS);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        readOnly
        value={url}
        aria-label="Link to this CV"
        onClick={(event) => {
          event.currentTarget.select();
          void copy(url);
        }}
        className="cursor-pointer text-muted-foreground"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label="Copy link"
          onClick={() => void copy(url)}
        >
          {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        </InputGroupButton>
      </InputGroupAddon>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </InputGroup>
  );
};
