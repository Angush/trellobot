# Trellobot
A simple Discord bot to log and report events from your Trello boards in your Discord server.

![Image example of Trellobot alert](https://raw.githubusercontent.com/Angush/trellobot/master/example-alert.png "Image example of Trellobot alert")

## Setup
1. Clone repository.
2. Run `npm install`.
3. Configure `conf.json` file as desired ([see below](#confjson)).
4. Generate tokens and set up `.auth` file ([see below](#auth)).
5. All done. Run Trellobot with `node trellobot.js`.

## conf.json
There are several important values in here which inform Trellobot's operation. Here's what they're all for, and how to set them.

*(optional properties marked with * asterisks)*

Property         | Explanation
---------------- | -----------
`boardIDs`       | An array of board IDs (strings) determining on which boards Trellobot reports. IDs can be extracted from the URLs of your Trello boards. (eg. the board ID for [https://trello.com/b/**HF8XAoZd**/welcome-board](https://trello.com/b/HF8XAoZd/welcome-board) is `HF8XAoZd`).
`serverID`       | An ID string determining which Discord server Trellobot uses. Enable developer mode in Discord and right click a server icon to copy its ID.
`channelID`      | An ID string determining which channel on your Discord server Trellobot uses to post reports. Enable developer mode in Discord and right click a channel to copy its ID.
`pollInterval`   | An integer determining how often (in milliseconds) Trellobot polls your boards for activity. 
`prefix`*        | A string determining the prefix for Trellobot commands in Discord. Currently unused. Defaults to `.` (period).
`contentString`* | A string included posted alongside all embeds. If you'd like to ping a certain role every time the bot posts, for example, you would put that string here.
`enabledEvents`* | An array of event names (strings) determining which events can be reported. If empty, all events are enabled. Event names can be found [in the Trello documenation](https://developers.trello.com/v1.0/reference#action-types).
`userIDs`*       | An object mapping Discord IDs to Trello usernames, like so: `userIDs: {"TrelloUser": "1395184357104955", ...}`, so Trellobot can pull relevant user data from Discord.

You can refer to the `conf.json` included in the repository for an example.

## .auth
The `.auth` file is included as a template to save you time, but you will need to create the keys and tokens yourself to run Trellobot. Here's how:

Property       | How to get the value
-------------- | ----------------------
`discordToken` | Create an app for Trellobot to work through on [Discord's developer site](https://discordapp.com/developers/applications/me/create), then create a bot user (below app description/icon) and copy the token.
`trelloKey`    | Visit [this page](https://trello.com/1/appKey/generate) to generate your public Trello API key.
`trelloToken`  | Visit `https://trello.com/1/connect?name=Trellobot&response_type=token&expiration=never&key=YOURPUBLICKEY` (replacing `YOURPUBLICKEY` with the appropriate key) to generate a token that does not expire. Remove `&expiration=never` from the URL if you'd prefer a temporary token.

That's all for now.

*i know the name is lame*