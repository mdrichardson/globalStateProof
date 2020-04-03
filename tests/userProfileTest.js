/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-env node, mocha */
const { DialogTestClient } = require('botbuilder-testing');
const assert = require('assert');
const { CustomDialogTestLogger, assertReplyForAlfred, sendAlfredActivity, assertReplyForBernard, sendBernardActivity } = require('./testUtils');

/**
 * This is a generic test used by all of the UserProfileDialog*'s to show definitively that a dialog with properly stored state (UserProfileDialogNormal)
 * works with concurrent users, whereas dialogs with improperly stored state (UserProfileDialogGlobal, UserProfileDialogProperty)
 * fail the exact same tests.
 */

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const borderString = '****************************************************************';

async function runTest(dialogTest) {
    /**
     * Test the dialog with a single user. All the dialogs will pass, showing why this can be difficult to catch in testing.
     */
    describe(`${ dialogTest.name } UserProfile Dialog - Single User`, () => {
        before(async function() {
            this.timeout(10000);
            console.log(borderString);
            console.log(dialogTest.startMessageSingle);
            console.log(borderString);

            await timeout(5000);
        });

        const client = new DialogTestClient('test', dialogTest.dialog, undefined, [new CustomDialogTestLogger()]);

        // Start of Alfred Conversation.
        it('Should proceed through the transport step', async () => {
            const reply = await sendAlfredActivity(client, 'hello');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please enter your mode of transport. (1) Car, (2) Bus, or (3) Bicycle');
        });
        it('Should proceed through the name step', async () => {
            const reply = await sendAlfredActivity(client, 'Car');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please enter your name.');
        });
        it('Should proceed through the name confirm step', async () => {
            let reply = await sendAlfredActivity(client, 'Alfred');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Thanks Alfred.');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Do you want to give your age? (1) Yes or (2) No');
        });
        it('Should proceed through the age step', async () => {
            const reply = await sendAlfredActivity(client, 'Yes');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please enter your age.');
        });
        it('Should proceed through the picture step', async () => {
            let reply = await sendAlfredActivity(client, '42');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'I have your age as 42.');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please attach a profile picture (or type any message to skip).');
        });
        it('Should proceed through the confirm step', async () => {
            let reply = await sendAlfredActivity(client, 'no picture');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'No attachments received. Proceeding without a profile picture...');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'I have your mode of transport as Car and your name as Alfred and your age as 42.');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Would you like me to save this information? (1) Yes or (2) No');
        });
        it('Should proceed through the save step', async () => {
            const reply = await sendAlfredActivity(client, 'Yes');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'User Profile Saved.');
        });
    });

    /**
     * Test the dialog with concurrent users. Dialogs with improper state will fail.
     */
    describe(`${ dialogTest.name } UserProfile Dialog - Two Concurrent Users`, () => {
        before(async function() {
            this.timeout(11000);
            console.log(borderString);
            console.log(dialogTest.startMessageMultiple);
            console.log(borderString);

            await timeout(10000);
        });

        const client = new DialogTestClient('test', dialogTest.dialog, undefined, [new CustomDialogTestLogger()]);

        // Start of Alfred Conversation.
        it('ALFRED Should proceed through the transport step', async () => {
            const reply = await sendAlfredActivity(client, 'hello');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please enter your mode of transport. (1) Car, (2) Bus, or (3) Bicycle');
        });
        it('ALFRED Should proceed through the name step', async () => {
            const reply = await sendAlfredActivity(client, 'Car');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please enter your name.');
        });
        it('ALFRED Should proceed through the name confirm step', async () => {
            let reply = await sendAlfredActivity(client, 'Alfred');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Thanks Alfred.');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Do you want to give your age? (1) Yes or (2) No');
        });

        // Start of Bernard Conversation.
        it('BERNARD Should proceed through the transport step', async () => {
            const reply = await sendBernardActivity(client, 'hi');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Please enter your mode of transport. (1) Car, (2) Bus, or (3) Bicycle');
        });
        it('BERNARD Should proceed through the name step', async () => {
            const reply = await sendBernardActivity(client, 'Bus');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Please enter your name.');
        });
        it('BERNARD Should proceed through the name confirm step', async () => {
            let reply = await sendBernardActivity(client, 'Bernard');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Thanks Bernard.');

            reply = client.getNextReply();
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Do you want to give your age? (1) Yes or (2) No');
        });

        // Continuation of Alfred Conversation.
        it('ALFRED Should proceed through the age step', async () => {
            const reply = await sendAlfredActivity(client, 'Yes');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please enter your age.');
        });
        it('ALFRED Should proceed through the picture step', async () => {
            let reply = await sendAlfredActivity(client, '42');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'I have your age as 42.');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Please attach a profile picture (or type any message to skip).');
        });
        it('ALFRED Should proceed through the confirm step', async () => {
            let reply = await sendAlfredActivity(client, 'no picture');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'No attachments received. Proceeding without a profile picture...');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'I have your mode of transport as Car and your name as Alfred and your age as 42.');

            reply = client.getNextReply();
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'Would you like me to save this information? (1) Yes or (2) No');
        });
        it('ALFRED Should proceed through the save step', async () => {
            const reply = await sendAlfredActivity(client, 'Yes');
            assertReplyForAlfred(reply);
            assert.strictEqual(reply.text, 'User Profile Saved.');
        });

        // Continuation of Bernard Conversation.
        it('BERNARD Should proceed through the age step', async () => {
            const reply = await sendBernardActivity(client, 'Yes');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Please enter your age.');
        });
        it('BERNARD Should proceed through the picture step', async () => {
            let reply = await sendBernardActivity(client, '11');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'I have your age as 11.');

            reply = client.getNextReply();
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Please attach a profile picture (or type any message to skip).');
        });
        it('BERNARD Should proceed through the confirm step', async () => {
            let reply = await sendBernardActivity(client, 'no picture');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'No attachments received. Proceeding without a profile picture...');

            reply = client.getNextReply();
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'I have your mode of transport as Bus and your name as Bernard and your age as 11.');

            reply = client.getNextReply();
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'Would you like me to save this information? (1) Yes or (2) No');
        });
        it('BERNARD Should proceed through the save step', async () => {
            const reply = await sendBernardActivity(client, 'Yes');
            assertReplyForBernard(reply);
            assert.strictEqual(reply.text, 'User Profile Saved.');
        });
    });
}

module.exports.runTest = runTest;
