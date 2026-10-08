import { skipToken, useQuery } from "@tanstack/react-query";

import { cvGenerate, cvGenerateStatus } from "@/api/generated/cv/cv";
import {
  canonicalSelection,
  isValidSelection,
  toCvSearch,
  type CvSelection,
} from "@/lib/cv-search";

export type CvGeneration =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "done"; digest: string }
  | { status: "failed" };

export const useCvGenerateTask = (selection: CvSelection) => {
  const canonical = canonicalSelection(selection);

  return useQuery({
    queryKey: ["cvGenerate", toCvSearch(canonical)],
    queryFn: isValidSelection(canonical)
      ? async () => {
          const res = await cvGenerate({
            title_id: canonical.titleId,
            concept_ids: canonical.conceptIds,
            skill_ids: canonical.skillIds,
          });
          if (res.status !== 202)
            throw new Error(`failed to start cv generation: ${res.status}`);
          return res.data.task_id;
        }
      : skipToken,
    staleTime: Infinity,
    retry: false,
  });
};

export const useCvGenerationStatus = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ["cvGenerateStatus", taskId],
    queryFn: taskId
      ? async () => {
          const res = await cvGenerateStatus(taskId);
          if (res.status !== 200)
            throw new Error(
              `failed to get status for taskId ${taskId}: ${res.status}`,
            );
          return res.data;
        }
      : skipToken,
    refetchInterval: (query) =>
      query.state.data?.state === "pending" ? 1000 : false,
    staleTime: Infinity,
  });
};

export const useCvGeneration = (selection: CvSelection): CvGeneration => {
  const { isError: startFailed, data: taskId } = useCvGenerateTask(selection);
  const { isError: generationFailed, data } = useCvGenerationStatus(taskId);

  if (!isValidSelection(selection)) return { status: "idle" };

  const endedWithNoDigest = data?.state === "done" && !data.digest;
  if (
    data?.state === "failed" ||
    generationFailed ||
    endedWithNoDigest ||
    startFailed
  )
    return { status: "failed" };

  if (data?.state === "done" && data?.digest)
    return { status: "done", digest: data.digest };

  return { status: "processing" };
};
