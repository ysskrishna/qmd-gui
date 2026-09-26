import type { JobKind } from "./types.js";

export type CollectionSettingsDraft = {
  name: string;
  include: boolean;
  wasIncluded: boolean;
  path: string;
  pattern: string;
  ignore: string[];
  updateCmd: string;
  previousUpdateCmd: string;
  original: {
    path: string;
    pattern: string;
    ignore: string[];
  };
};

export type SettingsPlanStep =
  | {
      type: "yaml";
      label: string;
      patch: { path?: string; pattern?: string; ignore?: string[] };
    }
  | {
      type: "job";
      label: string;
      kind: JobKind;
      opts: Record<string, unknown>;
    };

export function planSettings(draft: CollectionSettingsDraft): SettingsPlanStep[] {
  const steps: SettingsPlanStep[] = [];

  const yamlPatch: { path?: string; pattern?: string; ignore?: string[] } = {};
  if (draft.path !== draft.original.path) yamlPatch.path = draft.path;
  if (draft.pattern !== draft.original.pattern) yamlPatch.pattern = draft.pattern;
  const ignoreChanged =
    draft.ignore.join("\n") !== draft.original.ignore.join("\n");
  if (ignoreChanged) yamlPatch.ignore = draft.ignore;

  const yamlDirty = Object.keys(yamlPatch).length > 0;
  if (yamlDirty) {
    steps.push({
      type: "yaml",
      label: "Write index.yml (path / pattern / ignore)",
      patch: yamlPatch,
    });
  }

  if (draft.include !== draft.wasIncluded) {
    steps.push({
      type: "job",
      label: draft.include ? "qmd collection include" : "qmd collection exclude",
      kind: draft.include ? "collection.include" : "collection.exclude",
      opts: { name: draft.name },
    });
  }

  if (draft.updateCmd !== draft.previousUpdateCmd) {
    steps.push({
      type: "job",
      label: "qmd collection update-cmd",
      kind: "collection.updateCmd",
      opts: { name: draft.name, cmd: draft.updateCmd },
    });
  }

  if (yamlDirty || draft.updateCmd !== draft.previousUpdateCmd) {
    steps.push({
      type: "job",
      label: "qmd update",
      kind: "update",
      opts: {},
    });
  }

  return steps;
}
