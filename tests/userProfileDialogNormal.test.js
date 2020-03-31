/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-env node, mocha */
const { MemoryStorage, UserState } = require('botbuilder');
const { DialogTestClient } = require('botbuilder-testing');
const { UserProfileDialogNormal } = require('../dialogs/userProfileDialogNormal');
const assert = require('assert');

const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);

const { CustomDialogTestLogger, assertReplyForAlfred, sendAlfredActivity } = require('./testUtils');
const dialog = new UserProfileDialogNormal(userState);
const client = new DialogTestClient('test', dialog, undefined, [new CustomDialogTestLogger()]);

describe('NORMAL UserProfile Dialog', () => {
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
