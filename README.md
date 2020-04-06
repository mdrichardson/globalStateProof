# Common Mistakes Sample

Bot Framework v4 Common Mistakes Bot Sample

This bot has been created using [Bot Framework](https://dev.botframework.com), it shows a few common mistakes that node developers, in particular, may run into. Currently, it features:

* A sample of dialogs that show how to both properly and improperly store user state data.
  * See [userProfileDialogNormal](./dialogs/userProfileDialogNormal.js) for a dialog with properly stored state.
  * See [userProfileDialogGlobal](./dialogs/userProfileDialogGlobal.js) for a dialog with state improperly stored in a global variable.
    * This is improper because the userProfileDialogGlobal.js file is shared between users. When one user starts this dialog, it may overwrite the global variable, `globalUserProfile`.
  * See [userProfileDialogProperty](./dialogs/userProfileDialogProperty.js) for a dialog with state improperly stored as a property in the instance of a Dialog.
    * This is improper because Dialogs are singletons, so all Dialog properties are shared between users. When one user starts this dialog, it may overwrite the the shared property, `this.propertyUserProfile`.
  * You may run these dialogs by following the prompts after initiating conversation with the bot. Both of the dialogs with improperly stored state will work fine with one user. To reproduce an error that demonstrates the improperly stored state:
    1. Begin a dialog with improperly stored state.
    2. Answer a few questions, but don't end the conversation.
    3. Open a new tab in Emulator or Web Chat and start a conversation using a new user ID.
    4. Again, answer a few questions but don't end it.
    5. Go back to the first user's tab and try to continue the conversation. It will not work because the second user's data overwrote the first.
* A sample of tests that test the dialogs above using the error reproduction steps listed above. See [the tests README](./tests/README.md) for more information.

## Prerequisites

- [Node.js](https://nodejs.org) version 10.14 or higher

    ```bash
    # determine node version
    node --version
    ```

## To try this sample

<!-- 
TODO: Update all steps after figuring out repo address
-->

- Clone the repository

    ```bash
    git clone <address of the repo>
    ```

- In a terminal, navigate to `<name of the repo>`

    ```bash
    cd <name of the repo>
    ```

- Install modules

    ```bash
    npm install
    ```

- Start the bot

    ```bash
    npm start
    ```

## Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.3.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

### Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`

## Further reading

- [Bot Framework Documentation](https://docs.botframework.com)
- [Bot State](https://docs.microsoft.com/azure/bot-service/bot-builder-storage-concept)
- [Managing conversation and user state](https://docs.microsoft.com/azure/bot-service/bot-builder-howto-v4-state?tabs=js)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Restify](https://www.npmjs.com/package/restify)
- [dotenv](https://www.npmjs.com/package/dotenv)
