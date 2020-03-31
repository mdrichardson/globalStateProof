/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const assert = require('assert');

const { ActivityTypes } = require('botbuilder-core');
const mlog = require('mocha-logger');

/**
 * Log a transcript of messages from a dialog to the console, along with additional diagnostic information.
 * For use with the `DialogTestClient` class.
 *
 * Example:
 * ```javascript
 * let client = new DialogTestClient(DIALOG, OPTIONS, [new DialogTestLogger()]);
 * ```
 */
class CustomDialogTestLogger {
    constructor(logger = mlog) {
        this._logger = logger;
    }

    async onTurn(context, next) {
        // log incoming
        if (context.activity.type === ActivityTypes.Message) {
            this._logger.log(`[User: ${ context.activity.from.name }]: ${ context.activity.text }`);
        } else {
            this._logger.log(`[User: ${ context.activity.from.name }]: Activity: ${ context.activity.type }`);
            JSON.stringify(context.activity, null, 2).split(/\n/).forEach((line) => { this._logger.log(line); });
        }

        context.onSendActivities(async (context, activities, next) => {
            // log outgoing
            activities.forEach((activity) => {
                if (activity.type === ActivityTypes.Message) {
                    this._logger.log(`[Bot]: ${ activity.text }`);
                } else {
                    this._logger.log(`[Bot]: Activity: ${ activity.type }`);
                    JSON.stringify(activity, null, 2).split(/\n/).forEach((line) => { this._logger.log(line); });
                }
            });

            return next();
        });
        await next();
    }
}

async function sendAlfredActivity(client, text) {
    return await client.sendActivity({
        text,
        from: { id: 'alfred', name: 'Alfred' },
        conversation: { id: 'alfredConversation' }
    });
}

function assertReplyForAlfred(reply) {
    assert.strictEqual(reply.recipient.id, 'alfred');
    assert.strictEqual(reply.recipient.name, 'Alfred');
    assert.strictEqual(reply.conversation.id, 'alfredConversation');
}

module.exports = {
    CustomDialogTestLogger,
    sendAlfredActivity,
    assertReplyForAlfred
};
