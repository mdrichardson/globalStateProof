// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { UserProfileDialogNormal } = require('./userProfileDialogNormal');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const MAIN_WATERFALL_DIALOG = 'MAIN_WATERFALL_DIALOG';

/**
 * This dialog lets the user select which UserProfileDialog to run.
 */
class MainDialog extends ComponentDialog {
    constructor(userState) {
        super('MainDialog');

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new UserProfileDialogNormal(userState));

        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.selectStep.bind(this),
            this.finalStep.bind(this),
        ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty || results.status === DialogTurnStatus.complete) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async selectStep(step) {
        const choices = [
            { value: 'Normal (State Properly Stored)', synonyms: ['normal'] },
            { value: 'State Stored Globally', synonyms: ['global', 'globally'] },
            { value: 'State Stored in Properties', synonyms: ['property', 'properties', 'singleton'] }
        ]
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please select which dialog you would like to run.',
            choices
        });
    }

    async finalStep(step) {
        switch (step.result.value) {
            case 'Normal (State Properly Stored)':
                return await step.beginDialog('userProfileDialogNormal');
            default:
                await step.context.sendActivity('Invalid response');
                return await step.replaceDialog('MainDialog');
        }
    }
}

module.exports.MainDialog = MainDialog;
