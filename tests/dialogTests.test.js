const { MemoryStorage, UserState } = require('botbuilder');
const { runTest } = require('./genericDialogTest');
const { UserProfileDialogNormal } = require('../dialogs/userProfileDialogNormal');
const { UserProfileDialogGlobal } = require('../dialogs/userProfileDialogGlobal');
const { UserProfileDialogProperty } = require('../dialogs/userProfileDialogProperty');

const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);

const dialogs = [
    {
        dialog: new UserProfileDialogNormal(userState),
        name: 'NORMAL',
        startMessageSingle: 'This dialog test will pass because state is saved correctly.',
        startMessageMultiple: 'This dialog test will pass because state is saved correctly.'
    },
    {
        dialog: new UserProfileDialogGlobal(userState),
        name: 'GLOBAL',
        startMessageSingle: 'This dialog test will pass because storing state in global variables works fine with a single user.',
        startMessageMultiple: 'This dialog test will fail because a user joins in the middle of another user\'s conversation and their state overlaps due to it being stored in global variables.'
    },
    {
        dialog: new UserProfileDialogProperty(userState),
        name: 'PROPERTY',
        startMessageSingle: 'This dialog test will pass because storing state in a dialog\'s properties variables works fine with a single user.',
        startMessageMultiple: 'This dialog test will fail because a user joins in the middle of another user\'s conversation and their state overlaps due to it being stored in the dialog\'s properties.'
    }
];

for (const dialogTest of dialogs) {
    runTest(dialogTest);
}
