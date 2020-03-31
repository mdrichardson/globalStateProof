// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Channels, MessageFactory } = require('botbuilder');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { UserProfile } = require('../userProfile');

const ATTACHMENT_PROMPT = 'ATTACHMENT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

var globalUserProfile = new UserProfile();

/**
 * This is a dialog in which userData in improperly stored in a global variable, globalUserProfile.
 * It does not pass any data through step.values.
 *
 * Storing user data this way is improper because the userProfileDialogGlobal.js file is shared between users.
 * When one user starts this dialog, it may overwrite the global variable, globalUserProfile.
 *
 * For the most part, this works fine for a single user or multiple users non-concurrently using this dialog,
 * which makes this difficult to catch.
 */
class UserProfileDialogGlobal extends ComponentDialog {
    constructor() {
        super('userProfileDialogGlobal');

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.agePromptValidator));
        this.addDialog(new AttachmentPrompt(ATTACHMENT_PROMPT, this.picturePromptValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.transportStep.bind(this),
            this.nameStep.bind(this),
            this.nameConfirmStep.bind(this),
            this.ageStep.bind(this),
            this.pictureStep.bind(this),
            this.confirmStep.bind(this),
            this.saveStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
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
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async transportStep(step) {
        // Here, we improperly create a userProfile for the user starting this dialog.
        // This is improper because this will reset the userProfile for ALL other users because
        // it's being stored globally in this file.
        globalUserProfile = new UserProfile();
        // Skip this step if we already have the user's transport.
        if (globalUserProfile.transport) {
            // ChoicePrompt results will show in the next step with step.result.value.
            // Since we don't need to prompt, we can pass the ChoicePrompt result manually.
            return await step.next({ value: globalUserProfile.transport });
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please enter your mode of transport.',
            choices: ChoiceFactory.toChoices(['Car', 'Bus', 'Bicycle'])
        });
    }

    async nameStep(step) {
        // Set the transport property of the userProfile.
        globalUserProfile.transport = step.result.value;

        // Skip the prompt if we already have the user's name.
        if (globalUserProfile.name) {
            // We pass in a skipped bool so we know whether or not to send messages in the next step.
            return await step.next({ value: globalUserProfile.name, skipped: true });
        }

        return await step.prompt(NAME_PROMPT, 'Please enter your name.');
    }

    async nameConfirmStep(step) {
        // If userState is working correctly, we'll have userProfile.transport from the previous step.
        if (!globalUserProfile || !globalUserProfile.transport) {
            throw new Error(`transport property does not exist in userProfile.\nuserProfile:\n ${ JSON.stringify(globalUserProfile) }`);
        }
        // Text prompt results normally end up in step.result, but if we skipped the prompt, it will be in step.result.value.
        globalUserProfile.name = step.result.value || step.result;

        // We can send messages to the user at any point in the WaterfallStep. Only do this if we didn't skip the prompt.
        if (!step.result.skipped) {
            await step.context.sendActivity(`Thanks ${ step.result }.`);
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Skip the prompt if we already have the user's age.
        if (globalUserProfile.age) {
            return await step.next('yes');
        }
        return await step.prompt(CONFIRM_PROMPT, 'Do you want to give your age?', ['yes', 'no']);
    }

    async ageStep(step) {
        // If userState is working correctly, we'll have userProfile.name from the previous step.
        if (!globalUserProfile || !globalUserProfile.name) {
            throw new Error(`name property does not exist in userProfile.\nuserProfile:\n ${ JSON.stringify(globalUserProfile) }`);
        }

        // Skip the prompt if we already have the user's age.
        if (globalUserProfile.age) {
            // We pass in a skipped bool so we know whether or not to send messages in the next step.
            return await step.next({ value: globalUserProfile.age, skipped: true });
        }

        if (step.result) {
            // User said "yes" so we will be prompting for the age.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            const promptOptions = { prompt: 'Please enter your age.', retryPrompt: 'The value entered must be greater than 0 and less than 150.' };

            return await step.prompt(NUMBER_PROMPT, promptOptions);
        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.next(-1);
        }
    }

    async pictureStep(step) {
        // Confirm prompt results normally end up in step.result, but if we skipped the prompt, it will be in step.result.value.
        globalUserProfile.age = step.result.value || step.result;

        if (!step.result.skipped) {
            const msg = globalUserProfile.age === -1 ? 'No age given.' : `I have your age as ${ globalUserProfile.age }.`;

            // We can send messages to the user at any point in the WaterfallStep. Only send it if we didn't skip the prompt.
            await step.context.sendActivity(msg);
        }

        // Skip the prompt if we already have the user's picture.
        if (globalUserProfile.picture) {
            return await step.next(globalUserProfile.picture);
        }

        if (step.context.activity.channelId === Channels.msteams) {
            // This attachment prompt example is not designed to work for Teams attachments, so skip it in this case
            await step.context.sendActivity('Skipping attachment prompt in Teams channel...');
            return await step.next(undefined);
        } else {
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            var promptOptions = {
                prompt: 'Please attach a profile picture (or type any message to skip).',
                retryPrompt: 'The attachment must be a jpeg/png image file.'
            };

            return await step.prompt(ATTACHMENT_PROMPT, promptOptions);
        }
    }

    async confirmStep(step) {
        // If userState is working correctly, we'll have userProfile.age from the previous step.
        if (!globalUserProfile || !globalUserProfile.age) {
            throw new Error(`age property does not exist in userProfile.\nuserProfile:\n ${ JSON.stringify(globalUserProfile) }`);
        }
        globalUserProfile.picture = (step.result && typeof step.result === 'object' && step.result[0]) || 'no picture provided';

        let msg = `I have your mode of transport as ${ globalUserProfile.transport } and your name as ${ globalUserProfile.name }`;
        if (globalUserProfile.age !== -1) {
            msg += ` and your age as ${ globalUserProfile.age }`;
        }

        msg += '.';
        await step.context.sendActivity(msg);
        if (globalUserProfile.picture && globalUserProfile.picture !== 'no picture provided') {
            try {
                await step.context.sendActivity(MessageFactory.attachment(globalUserProfile.picture, 'This is your profile picture.'));
            } catch (err) {
                await step.context.sendActivity('A profile picture was saved but could not be displayed here.');
            }
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CONFIRM_PROMPT, { prompt: 'Would you like me to save this information?' });
    }

    async saveStep(step) {
        if (step.result) {
            await step.context.sendActivity('User Profile Saved.');
        } else {
            // Ensure the userProfile is cleared
            globalUserProfile = new UserProfile();
            await step.context.sendActivity('Thanks. Your profile will not be kept.');
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await step.endDialog();
    }

    async agePromptValidator(promptContext) {
        // This condition is our validation rule. You can also change the value at this point.
        return promptContext.recognized.succeeded && promptContext.recognized.value > 0 && promptContext.recognized.value < 150;
    }

    async picturePromptValidator(promptContext) {
        if (promptContext.recognized.succeeded) {
            var attachments = promptContext.recognized.value;
            var validImages = [];

            attachments.forEach(attachment => {
                if (attachment.contentType === 'image/jpeg' || attachment.contentType === 'image/png') {
                    validImages.push(attachment);
                }
            });

            promptContext.recognized.value = validImages;

            // If none of the attachments are valid images, the retry prompt should be sent.
            return !!validImages.length;
        } else {
            await promptContext.context.sendActivity('No attachments received. Proceeding without a profile picture...');

            // We can return true from a validator function even if Recognized.Succeeded is false.
            return true;
        }
    }
}

module.exports.UserProfileDialogGlobal = UserProfileDialogGlobal;
