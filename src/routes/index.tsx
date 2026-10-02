import { createFileRoute } from "@tanstack/react-router";

import {
  getCvPingStatusQueryKey,
  useCvPing,
  useCvPingStatus,
} from "@/api/generated/cv/cv";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const MAX_POLLS = 30;

function PingStatus({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const queryResult = useCvPingStatus(taskId, {
    query: {
      refetchInterval: (query) => {
        const state =
          query.state.data?.status === 200
            ? query.state.data?.data.state
            : undefined;
        if (state === "pending" && query.state.dataUpdateCount < MAX_POLLS)
          return 1000;
        return false;
      },
    },
  });

  const status =
    queryResult.data?.status === 200 ? queryResult.data.data : undefined;
  const updates =
    queryClient.getQueryState(getCvPingStatusQueryKey(taskId))
      ?.dataUpdateCount ?? 0;

  return (
    <div
      className={clsx({
        "text-red":
          status === undefined ||
          status?.state === "failed" ||
          (status?.state === "pending" && !(updates < MAX_POLLS)),
      })}
    >
      {(status?.state === "pending" || queryResult.isPending) &&
        (updates < MAX_POLLS
          ? "Waiting for worker..."
          : "No answer from the worker.")}
      {status?.state === "failed" && "The worker reported a failure."}
      {status?.state === "done" && status.result}
      {status === undefined &&
        !queryResult.isPending &&
        "Could not get task status."}
    </div>
  );
}

function HomeComponent() {
  const start = useCvPing();
  const startFailed =
    start.isError || (start.data !== undefined && start.data.status !== 202);

  const taskId =
    start.data?.status === 202 ? start.data.data.task_id : undefined;

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <Button
          size="lg"
          onClick={() => {
            start.mutate({ data: { message: "hello" } });
          }}
          disabled={start.isPending}
        >
          Ping worker
        </Button>
        {startFailed && (
          <div className="text-red">Could not reach the API.</div>
        )}
        {taskId !== undefined && <PingStatus taskId={taskId} key={taskId} />}
      </div>
    </div>
  );
}
