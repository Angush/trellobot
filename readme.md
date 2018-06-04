# Trellobot
### *A simple Discord bot to log and report events in your Trello boards.*

## Setup
1. Clone repository.
2. Run `npm install`.
3. Configure `conf.json` file as desired ([see below](#conf.json)).
4. Generate tokens and set up `.auth` file ([see below](#.auth)).
5. All done. Run Trellobot with `node trellobot.js`.

## conf.json
There are several important values in here which inform Trellobot's operation. Here's what they're all for, and how to set them:

Key           | Explanation
------------- | -----------
boardIDs      | An array of board IDs (strings) determining on which boards Trellobot reports. IDs can be extracted from the URLs of your Trello boards. (eg. the board ID for [https://trello.com/b/**HF8XAoZd**/welcome-board](https://trello.com/b/HF8XAoZd/welcome-board) is `HF8XAoZd`).
serverID      | An ID string determining which Discord server Trellobot uses. Enable developer mode in Discord and right click a server icon to copy its ID.
channelID     | An ID string determining which channel on your Discord server Trellobot uses to post reports. Enable developer mode in Discord and right click a channel to copy its ID.
pollInterval  | An integer determining how often (in milliseconds) Trellobot polls your boards for activity. 
prefix        | A string determining the prefix for Trellobot commands in Discord. Currently unused.
enabledEvents | An array of event names (strings) determining which events can be reported. If empty, all events are enabled. Event names can be found [in the Trello documenation](https://developers.trello.com/v1.0/reference#action-types).

You can refer to the `conf.json` included in the repository for an example.

## .auth
The `.auth-template` file is included to save you time, but you will need to create the keys and tokens yourself to run Trellobot. Here's how:

Key          | Where to get it
------------ | ---------------
discordToken | Create an app for Trellobot to work through on [Discord's developer site](https://discordapp.com/developers/applications/me/create), then create a bot user (below app description/icon) and copy the token.
trelloKey    | Visit [this page](https://trello.com/1/appKey/generate) to generate your public Trello API key.
trelloToken  | Visit `https://trello.com/1/connect?name=trello-events&response_type=token&expiration=never&key=YOURPUBLICKEY` (replacing `YOURPUBLICKEY` with the appropriate key) to generate a token that does not expire. Remove `&expiration=never` from the URL if you'd prefer a temporary token.

That's all.

*i know the name is lame*