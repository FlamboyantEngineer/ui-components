function formatList(names) {
    return names.join(', ');
}
export const editingStrings = {
    columnMapping: 'Column mapping',
    sourceColumn: 'Column',
    sampleValues: 'Sample values',
    importAs: 'Import as',
    importColumnAs: (column) => `Import ${column} as`,
    doNotImport: 'Don’t import',
    requiredTarget: 'Required',
    suggestedTarget: 'Suggested',
    mappedColumns: (mapped, total) => total === 1 ? `${mapped} of 1 column mapped` : `${mapped} of ${total} columns mapped`,
    skippedColumns: (count) => `${count} not imported`,
    unmappedRequiredTargets: (targets) => `Required fields not mapped: ${formatList(targets)}.`,
    duplicateTarget: (target, columns) => `${target} is also mapped from ${formatList(columns)}.`,
    stepLabel: (number) => `Step ${number}`,
    stepActions: (number) => `Actions for step ${number}`,
    moveStep: (number) => `Move step ${number}`,
    addStep: 'Add step',
    insertStepAbove: 'Insert step above',
    insertStepBelow: 'Insert step below',
    noSteps: 'No steps yet.',
};
//# sourceMappingURL=editing-strings.js.map