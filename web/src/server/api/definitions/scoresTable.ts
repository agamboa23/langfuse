import {
  type OptionsDefinition,
  type ColumnDefinition,
} from "@/src/server/api/interfaces/tableDefinition";

export const scoresTableCols: ColumnDefinition[] = [
  {
    name: "Trace ID",
    id: "traceId",
    type: "string",
    internal: 's."trace_id"',
  },
  {
    name: "Observation ID",
    id: "observationId",
    type: "string",
    internal: 's."observation_id"',
  },
  {
    name: "Timestamp",
    id: "timestamp",
    type: "datetime",
    internal: 's."timestamp"',
  },
  {
    name: "Name",
    id: "name",
    type: "stringOptions",
    internal: 's."name"',
    options: [], // to be added at runtime
  },
  { name: "Value", id: "value", type: "number", internal: 's."value"' },
  { name: "Comment", id: "comment", type: "string", internal: 's."comment"' },
  { name: "User ID", id: "userId", type: "string", internal: 't."user_id"' },
];

export type ScoreOptions = {
  name: Array<OptionsDefinition>;
};

export function scoresTableColsWithOptions(
  options?: ScoreOptions,
): ColumnDefinition[] {
  return scoresTableCols.map((col) => {
    if (col.id === "name") {
      return { ...col, options: options?.name ?? [] };
    }
    return col;
  });
}
