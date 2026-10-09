import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/fetcher";
import { cvGenerate, cvGenerateStatus } from "@/api/generated/cv/cv";
import type { GenerateStatusResponseOutput } from "@/api/generated/model";
import {
  canonicalSelection,
  isValidSelection,
  toCvSearch,
  type CvSelection,
} from "@/lib/cv-search";

const MAX_STATUS_RETRIES = 2;

export type CvGeneration =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "done"; digest: string }
  | { status: "failed"; reason: CvFailureReason };

export type CvFailureReason = "rate-limited" | "invalid-selection" | "error";

export const failureReason = (error: unknown): CvFailureReason => {
  if (!(error instanceof ApiError)) return "error";
  if (error.status === 429) return "rate-limited";
  if (error.status === 422) return "invalid-selection";
  return "error";
};

const generateTaskKey = (selection: CvSelection) =>
  ["cvGenerate", toCvSearch(canonicalSelection(selection))] as const;

const generationStatusKey = (taskId: string | undefined) =>
  ["cvGenerateStatus", taskId] as const;

export const useCvGenerateTask = (selection: CvSelection) => {
  const canonical = canonicalSelection(selection);

  return useQuery({
    queryKey: generateTaskKey(canonical),
    queryFn: isValidSelection(canonical)
      ? async () => {
          const res = await cvGenerate({
            title_id: canonical.titleId,
            concept_ids: canonical.conceptIds,
            skill_ids: canonical.skillIds,
          });
          return res.data.task_id;
        }
      : skipToken,
    staleTime: Infinity,
    retry: false,
  });
};

export const useCvGenerationStatus = (taskId: string | undefined) => {
  return useQuery({
    queryKey: generationStatusKey(taskId),
    queryFn: taskId
      ? async () => {
          const res = await cvGenerateStatus(taskId);
          return res.data;
        }
      : skipToken,
    refetchInterval: (query) =>
      query.state.data?.state === "pending" ? 1000 : false,
    staleTime: Infinity,
    retry: (failureCount: number, error: Error) => {
      const requestError =
        error instanceof ApiError && error.status > 399 && error.status < 500;
      return !requestError && failureCount < MAX_STATUS_RETRIES;
    },
  });
};

export const useCvGeneration = (
  selection: CvSelection,
): { generation: CvGeneration; retry: () => void } => {
  const queryClient = useQueryClient();
  const startQuery = useCvGenerateTask(selection);
  const statusQuery = useCvGenerationStatus(startQuery.data);

  const retry = () => {
    void queryClient.resetQueries({
      queryKey: generationStatusKey(startQuery.data),
      exact: true,
    });
    void queryClient.resetQueries({
      queryKey: generateTaskKey(selection),
      exact: true,
    });
  };

  return {
    generation: toGeneration(
      selection,
      startQuery.error,
      statusQuery.error,
      statusQuery.data,
    ),
    retry,
  };
};

const toGeneration = (
  selection: CvSelection,
  startError: Error | null,
  generationError: Error | null,
  data: GenerateStatusResponseOutput | undefined,
): CvGeneration => {
  if (!isValidSelection(selection)) return { status: "idle" };

  if (startError) {
    return { status: "failed", reason: failureReason(startError) };
  }

  if (generationError) {
    return { status: "failed", reason: failureReason(generationError) };
  }

  const endedWithNoDigest = data?.state === "done" && !data.digest;
  if (data?.state === "failed" || endedWithNoDigest)
    return { status: "failed", reason: "error" };

  if (data?.state === "done" && data?.digest)
    return { status: "done", digest: data.digest };

  return { status: "processing" };
};
