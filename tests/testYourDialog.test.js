/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-env node, mocha */
const assert = require('assert');
const { DialogTestClient } = require('botbuilder-testing');
const { MemoryStorage, UserState } = require('botbuilder');
const { CustomDialogTestLogger } = require('./testUtils');

/**
 * This test allows you to easily test your own dialogs with concurrent users.
 * Just edit all of the TODO: items.
 */

// TODO: Replace this with your dialog. Leave the ": DialogToTest" part; this makes it so you don't need to rename other variables.
// However, you may need to pass in additional arguments to the `const dialog = new DialogToTest()` call, below.
const { UserProfileDialogNormal: DialogToTest } = require('../dialogs/userProfileDialogNormal');

// Comment the previous line and uncomment this one to show that a dialog that saves state improperly fails this test.
// const { UserProfileDialogGlobal: DialogToTest } = require('../dialogs/userProfileDialogGlobal');

const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);

const dialog = new DialogToTest(userState);

// TODO: Replace this with the users you'd like to use in your test.
// DO NOT remove the bot key.
const USERS = {
    bot: { id: 'bot', name: 'bot' },
    alfred: { id: 'alfred', name: 'Alfred' },
    bernard: { id: 'bernard', name: 'Bernard' }
};

// TODO: Replace this with a "transcript" of your dialog. Ensure they have unique ids.
// Assume that after a user response, the next activity will ALWAYS be the bot responding to that user.
// Most activities will be text, but the test will assert-check all keys except the 'from' key.
// The user MUST start the conversation with the bot, although it doesn't matter what text they send.
// The test will only work with multiple users concurrently having conversations with the bot.
const activities = [
    // Start of Alfred Conversation.
    { text: 'start dialog', from: USERS.alfred },
    { text: 'Please enter your mode of transport. (1) Car, (2) Bus, or (3) Bicycle', from: USERS.bot },
    { text: 'Car', from: USERS.alfred },
    { text: 'Please enter your name.', from: USERS.bot },
    // Start of Bernard Conversation.
    { text: 'start dialog', from: USERS.bernard },
    { text: 'Please enter your mode of transport. (1) Car, (2) Bus, or (3) Bicycle', from: USERS.bot },
    { text: 'Bus', from: USERS.bernard },
    { text: 'Please enter your name.', from: USERS.bot },
    // Continue Alfred Conversation.
    { text: USERS.alfred.name, from: USERS.alfred },
    { text: 'Thanks Alfred.', from: USERS.bot },
    { text: 'Do you want to give your age? (1) Yes or (2) No', from: USERS.bot },
    // Continue Bernard Conversation.
    { text: USERS.bernard.name, from: USERS.bernard },
    { text: 'Thanks Bernard.', from: USERS.bot },
    { text: 'Do you want to give your age? (1) Yes or (2) No', from: USERS.bot },
    // Continue Alfred Conversation.
    { text: 'Yes', from: USERS.alfred },
    { text: 'Please enter your age.', from: USERS.bot },
    { text: '42', from: USERS.alfred },
    { text: 'I have your age as 42.', from: USERS.bot },
    { text: 'Please attach a profile picture (or type any message to skip).', from: USERS.bot },
    // Continue Bernard Conversation.
    { text: 'Yes', from: USERS.bernard },
    { text: 'Please enter your age.', from: USERS.bot },
    { text: '11', from: USERS.bernard },
    { text: 'I have your age as 11.', from: USERS.bot },
    { text: 'Please attach a profile picture (or type any message to skip).', from: USERS.bot },
    // Continue Alfred Conversation.
    { text: 'no picture', from: USERS.alfred },
    { text: 'No attachments received. Proceeding without a profile picture...', from: USERS.bot },
    { text: 'I have your mode of transport as Car and your name as Alfred and your age as 42.', from: USERS.bot },
    { text: 'Would you like me to save this information? (1) Yes or (2) No', from: USERS.bot },
    { text: 'Yes', from: USERS.alfred },
    { text: 'User Profile Saved.', from: USERS.bot },
    // Continue Bernard Conversation.
    { text: 'no picture', from: USERS.bernard },
    { text: 'No attachments received. Proceeding without a profile picture...', from: USERS.bot },
    { text: 'I have your mode of transport as Bus and your name as Bernard and your age as 11.', from: USERS.bot },
    { text: 'Would you like me to save this information? (1) Yes or (2) No', from: USERS.bot },
    { text: 'Yes', from: USERS.bernard },
    { text: 'User Profile Saved.', from: USERS.bot }
];

// No need to change anything below this line
describe(`${ dialog.constructor.name } Test Concurrent Users`, async () => {
    if (!USERS.bot) throw new Error('bot key is required in USERS variable');
    if (activities[0].from.id === USERS.bot.id) throw new Error('User MUST go first');

    const client = new DialogTestClient('test', dialog, undefined, [new CustomDialogTestLogger()]);

    // Assert each key matches expected result
    function assertReplyMatchesActivity(reply, activity) {
        for (const key of Object.keys(activity)) {
            // Don't check the from key
            if (key !== 'from') {
                assert.strictEqual(reply[key], activity[key]);
            }
        }
    }

    // Iterate over all activities
    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        // Always start turn with the user.
        if (activity.from.id !== USERS.bot.id) {
            it(`Should proceed through turn starting with index: ${ i }.`, async function() {
                // Ensure we're using the correct conversation
                const message = {
                    ...activity,
                    conversation: { id: `${ activity.from.id }-conversation` }
                };
                let reply = await client.sendActivity(message);
                let nextReplyIndex = i + 1;
                assertReplyMatchesActivity(reply, activities[nextReplyIndex]);

                // Check follow-up bot responses
                reply = client.getNextReply();
                while (reply) {
                    nextReplyIndex++;
                    assertReplyMatchesActivity(reply, activities[nextReplyIndex]);
                    reply = client.getNextReply();
                }
            });
        }
    }
});
