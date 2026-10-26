/** `A`, `A and B`, `A, B and C`. */
function joinAnswers(answers) {
    if (answers.length < 2)
        return answers.join('');
    return `${answers.slice(0, -1).join(', ')} and ${answers.at(-1)}`;
}
export const chatQuestionStrings = {
    questionSubmit: 'Submit',
    questionOther: 'Other',
    questionOtherAnswer: 'Other answer',
    questionAnswerPlaceholder: 'Type your answer',
    questionRecommended: 'Recommended',
    questionSteps: 'Questions',
    questionStep: (position) => `Question ${position}`,
    questionProgress: (position, count) => `Question ${position} of ${count}`,
    questionCounter: (position, count) => `${position}/${count}`,
    questionAnsweredTab: 'Answered',
    questionAnswerToContinue: 'Answer this question to continue.',
    questionAnswerAllToSubmit: 'Answer every question to submit.',
    questionSubmitFailed: 'The answers could not be sent. Try again.',
    questionPreview: (label) => `Preview of ${label}`,
    questionAsked: (question, count) => count === 1 ? `Question: ${question}` : `${count} questions: ${question}`,
    questionChose: (answers) => `You chose ${joinAnswers(answers)}`,
    questionAnsweredText: (text) => `You answered: ${text}`,
    questionNoAnswer: 'No answer',
    questionDismissed: 'Dismissed',
};
//# sourceMappingURL=chat-question-strings.js.map