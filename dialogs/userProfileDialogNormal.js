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
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

/**
 * This is a "normal" dialog, where userState is stored properly using the accessor, this.userProfile.
 * In this dialog example, we create the userProfile using the accessor in the first step, transportStep.
 * We then pass prompt results through the remaining steps using step.values.
 * In the final step, summaryStep, we save the userProfile using the accessor.
 */
class UserProfileDialogNormal extends ComponentDialog {
    constructor(userState) {
        super('userProfileDialogNormal');

        this.userProfileAccessor = userState.createProperty(USER_PROFILE);

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
        // Get the userProfile if it exists, or create a new one if it doesn't.
        const userProfile = await this.userProfileAccessor.get(step.context, new UserProfile());

        // Pass the userProfile through step.values.
        // This makes it so we don't have to call this.userProfileAccessor.get() in every step.
        step.values.userProfile = userProfile;

        // Skip this step if we already have the user's transport.
        if (userProfile.transport) {
            // ChoicePrompt results will show in the next step with step.result.value.
            // Since we don't need to prompt, we can pass the ChoicePrompt result manually.
            return await step.next({ value: userProfile.transport });
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please enter your mode of transport.',
            choices: ChoiceFactory.toChoices(['Car', 'Bus', 'Bicycle'])
        });
    }

    async nameStep(step) {
        // Retrieve the userProfile from step.values.
        const userProfile = step.values.userProfile;
        // Set the transport property of the userProfile.
        userProfile.transport = step.result.value;

        // Pass the userProfile through step.values.
        // This makes it so we don't have to call this.userProfileAccessor.get() in every step.
        step.values.userProfile = userProfile;

        // Skip the prompt if we already have the user's name.
        if (userProfile.name) {
            // We pass in a skipped bool so we know whether or not to send messages in the next step.
            return await step.next({ value: userProfile.name, skipped: true });
        }

        return await step.prompt(NAME_PROMPT, 'Please enter your name.');
    }

    async nameConfirmStep(step) {
        // Retrieve the userProfile from step.values and set the name property
        const userProfile = step.values.userProfile;

        // If userState is working correctly, we'll have userProfile.transport from the previous step.
        if (!userProfile || !userProfile.transport) {
            throw new Error(`transport property does not exist in userProfile.\nuserProfile:\n ${ JSON.stringify(userProfile) }`);
        }
        // Text prompt results normally end up in step.result, but if we skipped the prompt, it will be in step.result.value.
        userProfile.name = step.result.value || step.result;
        // step.values.userProfile.name is already set by reference, so there's no need to set it again to pass it to the next step.

        // We can send messages to the user at any point in the WaterfallStep. Only do this if we didn't skip the prompt.
        if (!step.result.skipped) {
            await step.context.sendActivity(`Thanks ${ step.result }.`);
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Skip the prompt if we already have the user's age.
        if (userProfile.age) {
            return await step.next('yes');
        }
        return await step.prompt(CONFIRM_PROMPT, 'Do you want to give your age?', ['yes', 'no']);
    }

    async ageStep(step) {
        // Retrieve the userProfile from step.values
        const userProfile = step.values.userProfile;

        // If userState is working correctly, we'll have userProfile.name from the previous step.
        if (!userProfile || !userProfile.name) {
            throw new Error(`name property does not exist in userProfile.\nuserProfile:\n ${ JSON.stringify(userProfile) }`);
        }

        // Skip the prompt if we already have the user's age.
        if (userProfile.age) {
            // We pass in a skipped bool so we know whether or not to send messages in the next step.
            return await step.next({ value: userProfile.age, skipped: true });
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
        // Retrieve the userProfile from step.values and set the age property
        const userProfile = step.values.userProfile;
        // We didn't set any additional properties on userProfile in the previous step, so no need to check for them here.

        // Confirm prompt results normally end up in step.result, but if we skipped the prompt, it will be in step.result.value.
        userProfile.age = step.result.value || step.result;
        // step.values.userProfile.age is already set by reference, so there's no need to set it again to pass it to the next step.

        if (!step.result.skipped) {
            const msg = userProfile.age === -1 ? 'No age given.' : `I have your age as ${ userProfile.age }.`;

            // We can send messages to the user at any point in the WaterfallStep. Only send it if we didn't skip the prompt.
            await step.context.sendActivity(msg);
        }

        // Skip the prompt if we already have the user's picture.
        if (userProfile.picture) {
            return await step.next(userProfile.picture);
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
        // Retrieve the userProfile from step.values and set the picture property
        const userProfile = step.values.userProfile;
        // If userState is working correctly, we'll have userProfile.age from the previous step.
        if (!userProfile || !userProfile.age) {
            throw new Error(`age property does not exist in userProfile.\nuserProfile:\n ${ JSON.stringify(userProfile) }`);
        }
        userProfile.picture = (step.result && typeof step.result === 'object' && step.result[0]) || 'no picture provided';
        // step.values.userProfile.picture is already set by reference, so there's no need to set it again to pass it to the next step.

        let msg = `I have your mode of transport as ${ userProfile.transport } and your name as ${ userProfile.name }`;
        if (userProfile.age !== -1) {
            msg += ` and your age as ${ userProfile.age }`;
        }

        msg += '.';
        await step.context.sendActivity(msg);
        if (userProfile.picture && userProfile.picture !== 'no picture provided') {
            try {
                await step.context.sendActivity(MessageFactory.attachment(userProfile.picture, 'This is your profile picture.'));
            } catch (err) {
                await step.context.sendActivity('A profile picture was saved but could not be displayed here.');
            }
        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CONFIRM_PROMPT, { prompt: 'Would you like me to save this information?' });
    }

    async saveStep(step) {
        if (step.result) {
            // Get the current profile object from user state.
            const userProfile = step.values.userProfile;

            // Save the userProfile to userState.
            await this.userProfileAccessor.set(step.context, userProfile);

            await step.context.sendActivity('User Profile Saved.');
        } else {
            // Ensure the userProfile is cleared
            await this.userProfileAccessor.set(step.context, {});
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
        }
        else {
            await promptContext.context.sendActivity('No attachments received. Proceeding without a profile picture...');

            // We can return true from a validator function even if Recognized.Succeeded is false.
            return true;
        }
    }
}

module.exports.UserProfileDialogNormal = UserProfileDialogNormal;
