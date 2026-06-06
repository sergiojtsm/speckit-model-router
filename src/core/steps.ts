// Pure data: the spec-kit SDD steps that can be assigned a model.
// The `key` matches the opencode command name (no leading slash), e.g. "speckit.plan".

export interface SddStep {
  key: string;
  label: string;
  desc: string;
}

export const SDD_STEPS: readonly SddStep[] = [
  { key: "speckit.constitution", label: "/speckit.constitution", desc: "Establish project principles" },
  { key: "speckit.specify",      label: "/speckit.specify",      desc: "Create baseline specification" },
  { key: "speckit.clarify",      label: "/speckit.clarify",      desc: "Clarify ambiguous requirements" },
  { key: "speckit.plan",         label: "/speckit.plan",         desc: "Create implementation plan" },
  { key: "speckit.tasks",        label: "/speckit.tasks",        desc: "Generate actionable tasks" },
  { key: "speckit.analyze",      label: "/speckit.analyze",      desc: "Cross-artifact consistency report" },
  { key: "speckit.checklist",    label: "/speckit.checklist",    desc: "Generate quality checklists" },
  { key: "speckit.implement",    label: "/speckit.implement",    desc: "Execute implementation" },
];
