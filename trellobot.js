const Discord = require('discord.js')
const bot = new Discord.Client()
const fs = require('fs')
const auth = JSON.parse(fs.readFileSync('.auth'))
const conf = JSON.parse(fs.readFileSync('conf.json'))
let latestActivityID = fs.existsSync('.latestActivityID') ? fs.readFileSync('.latestActivityID') : 0

const Trello = require('trello-events')
const events = new Trello({
    pollFrequency: conf.pollInterval, // milliseconds
    minId: latestActivityID, // auto-created and auto-updated
    start: false,
    trello: {
        boards: conf.boardIDs, // array of Trello board IDs 
        key: auth.trelloKey, // your public Trello API key
        token: auth.trelloToken // your private Trello token for Trellobot
    } 
})



/*
** =====================================
** Discord event handlers and functions.
** =====================================
*/

bot.login(auth.discordToken)
bot.on('ready', () => {
    let guild = bot.guilds.get(conf.serverID)
    let channel = bot.channels.get(conf.channelID)
    if (!guild) {
        console.log(`Server with ID "${conf.serverID}" not found! I can't function without a valid server and channel.\nPlease add the correct server ID to your conf file, or if the conf data is correct, ensure I have proper access.\nYou may need to add me to your server using this link:\n    https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=0&scope=bot`)
        process.exit()
    } else if (!channel) {
        console.log(`Channel with ID "${conf.channelID}" not found! I can't function without a valid channel.\nPlease add the correct channel ID to your conf file, or if the conf data is correct, ensure I have proper access.`)
        process.exit()
    } else if (!conf.boardIDs || conf.boardIDs.length < 1) {
        console.log(`No board IDs provided! Please add at least one to your conf file. Check the readme if you need help finding a board ID.`)
    }
    conf.guild = guild
    conf.channel = channel
    /* 
    ** Make contentString a map of event names to their paired strings
    ** like this: {"createCard": "someone created a card", ...}, so you
    ** can, for example, ping specific roles for specific events.
    **
    ** Also add a new conf section for pairing lists within a board to 
    ** contentStrings? That way you can ping one role for new Moderation
    ** cards, and another role for new Event cards, for example.
    */
    if (!conf.contentString) conf.contentString = "" 
    if (!conf.enabledEvents) conf.enabledEvents = []
    if (!conf.userIDs) conf.userIDs = {}
    if (!conf.realNames) conf.realNames = true
    // set default prefix is none provided in conf
    if (!conf.prefix) {
        conf.prefix = "."
        fs.writeFileSync('conf.json', JSON.stringify(conf, null, 4), (err, data) => console.log(`Updated conf file with default prefix ('.')`))
    }
    // logInitializationData()
    console.log(`== Bot logged in as @${bot.user.tag}. Ready for action! ==`)
    events.start()
})

bot.on('message', (msg) => {
    if (msg.channel.type !== "text") return
    if (msg.content.startsWith(`${conf.prefix}ping`)) {
        let now = Date.now()
        msg.channel.send(`Ping!`).then(m => {
            m.edit(`Pong! (took ${Date.now() - now}ms)`)
        })
    }
})



/*
** ====================================
** Trello event handlers and functions.
** ====================================
*/

// Fired when a card is created
events.on('createCard', (event, board) => {
    if (!eventEnabled(`cardCreated`)) return
    let embed = getEmbedBase(event)
        .setTitle(`New card created under __${event.data.list.name}__!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card created under __${event.data.list.name}__ by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when a card is updated (description, due date, position, associated list, name, and archive status)
events.on('updateCard', (event, board) => {
    let embed = getEmbedBase(event)
    if (event.data.old.hasOwnProperty("desc")) {
        if (!eventEnabled(`cardDescriptionChanged`)) return
        embed
            .setTitle(`Card description changed!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card description changed (see below) by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            .addField(`New Description`, typeof event.data.card.desc === "string" && event.data.card.desc.trim().length > 0 ? (event.data.card.desc.length > 1024 ? `${event.data.card.desc.trim().slice(0, 1020)}...` : event.data.card.desc) : `*[No description]*`)
            .addField(`Old Description`, typeof event.data.old.desc === "string" && event.data.old.desc.trim().length > 0 ? (event.data.old.desc.length > 1024 ? `${event.data.old.desc.trim().slice(0, 1020)}...` : event.data.old.desc) : `*[No description]*`)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("due")) {
        if (!eventEnabled(`cardDueDateChanged`)) return
        embed
            .setTitle(`Card due date changed!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card due date changed to __${event.data.card.due ? new Date(event.data.card.due).toUTCString() : `[No due date]`}__ from __${event.data.old.due ? new Date(event.data.old.due).toUTCString() : `[No due date]`}__ by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("pos")) {
        if (!eventEnabled(`cardPositionChanged`)) return
        embed
            .setTitle(`Card position changed!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card position in list __${event.data.list.name}__ changed by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("idList")) {
        if (!eventEnabled(`cardListChanged`)) return
        embed
            .setTitle(`Card list changed!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card moved to list __${event.data.listAfter.name}__ from list __${event.data.listBefore.name}__ by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("name")) {
        if (!eventEnabled(`cardNameChanged`)) return
        embed
            .setTitle(`Card name changed!`)
            .setDescription(`**CARD:** *[See below for card name]* — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card name changed (see below) by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            .addField(`New Name`, event.data.card.name)
            .addField(`Old Name`, event.data.old.name)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("closed")) {
        if (event.data.old.closed) {
            if (!eventEnabled(`cardUnarchived`)) return
            embed
                .setTitle(`Card unarchived!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card unarchived and returned to list __${event.data.list.name}__ by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(addDiscordUserData(embed, event.memberCreator))
        } else {
            if (!eventEnabled(`cardArchived`)) return
            embed
                .setTitle(`Card archived!`)
                .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card under list __${event.data.list.name}__ archived by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(addDiscordUserData(embed, event.memberCreator))
        }
    }
})

// Fired when a card is deleted
events.on('deleteCard', (event, board) => {
    if (!eventEnabled(`cardDeleted`)) return
    let embed = getEmbedBase(event)
        .setTitle(`Card deleted!`)
        .setDescription(`**EVENT:** Card deleted from list __${event.data.list.name}__ by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when a comment is posted, or edited
events.on('commentCard', (event, board) => {
    let embed = getEmbedBase(event)
    if (event.data.hasOwnProperty("textData")) {
        if (!eventEnabled(`commentEdited`)) return
        embed
            .setTitle(`Comment edited on card!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card comment edited (see below for comment text) by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            .addField(`Comment Text`, event.data.text.length > 1024 ? `${event.data.text.trim().slice(0, 1020)}...` : event.data.text)
            .setTimestamp(event.data.dateLastEdited)
        send(addDiscordUserData(embed, event.memberCreator))
    } else {
        if (!eventEnabled(`commentAdded`)) return
        embed
            .setTitle(`Comment added to card!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Card comment added (see below for comment text) by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            .addField(`Comment Text`, event.data.text.length > 1024 ? `${event.data.text.trim().slice(0, 1020)}...` : event.data.text)
        send(addDiscordUserData(embed, event.memberCreator))
    }
})

// Fired when a member is added to a card
events.on('addMemberToCard', (event, board) => {
    let embed = getEmbedBase(event)
        .setTitle(`Member added to card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Member **[${conf.realNames ? event.member.fullName : event.member.username}](https://trello.com/${event.member.username})**`)
    let editedEmbed = addDiscordUserData(embed, event.member)

    if (event.member.id === event.memberCreator.id) {
        if (!eventEnabled(`memberAddedToCardBySelf`)) return
        editedEmbed.setDescription(editedEmbed.description + ` added themselves to card.`)
        send(editedEmbed)
    } else {
        if (!eventEnabled(`memberAddedToCard`)) return
        editedEmbed.setDescription(editedEmbed.description + ` added to card by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(editedEmbed, event.memberCreator))
    }
})

// Fired when a member is removed from a card
events.on('removeMemberFromCard', (event, board) => {
    let embed = getEmbedBase(event)
        .setTitle(`Member removed from card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Member **[${conf.realNames ? event.member.fullName : event.member.username}](https://trello.com/${event.member.username})**`)
    let editedEmbed = addDiscordUserData(embed, event.member)

    if (event.member.id === event.memberCreator.id) {
        if (!eventEnabled(`memberRemovedFromCardBySelf`)) return
        editedEmbed.setDescription(editedEmbed.description + ` removed themselves from card.`)
        send(editedEmbed)
    } else {
        if (!eventEnabled(`memberRemovedFromCard`)) return
        editedEmbed.setDescription(editedEmbed.description + ` removed from card by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(editedEmbed, event.memberCreator))
    }
})

// Fired when a list is created
events.on('createList', (event, board) => {
    if (!eventEnabled(`listCreated`)) return
    let embed = getEmbedBase(event)
        .setTitle(`New list created!`)
        .setDescription(`**EVENT:** List __${event.data.list.name}__ created by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when a list is renamed, moved, archived, or unarchived
events.on('updateList', (event, board) => {
    let embed = getEmbedBase(event)
    if (event.data.old.hasOwnProperty("name")) {
        if (!eventEnabled(`listNameChanged`)) return
        embed
            .setTitle(`List name changed!`)
            .setDescription(`**EVENT:** List renamed to __${event.data.list.name}__ from __${event.data.old.name}__ by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("pos")) {
        if (!eventEnabled(`listPositionChanged`)) return
        embed
            .setTitle(`List position changed!`)
            .setDescription(`**EVENT:** List __${event.data.list.name}__ position changed by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.old.hasOwnProperty("closed")) {
        if (event.data.old.closed) {
            if (!eventEnabled(`listUnarchived`)) return
            embed
                .setTitle(`List unarchived!`)
                .setDescription(`**EVENT:** List __${event.data.list.name}__ unarchived by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(addDiscordUserData(embed, event.memberCreator))
        } else {
            if (!eventEnabled(`listArchived`)) return
            embed
                .setTitle(`List archived!`)
                .setDescription(`**EVENT:** List __${event.data.list.name}__ archived by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            send(addDiscordUserData(embed, event.memberCreator))
        }
    }
})

// Fired when an attachment is added to a card
events.on('addAttachmentToCard', (event, board) => {
    if (!eventEnabled(`attachmentAddedToCard`)) return
    let embed = getEmbedBase(event)
        .setTitle(`Attachment added to card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Attachment named \`${event.data.attachment.name}\` added to card by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when an attachment is removed from a card
events.on('deleteAttachmentFromCard', (event, board) => {
    if (!eventEnabled(`attachmentRemovedFromCard`)) return
    let embed = getEmbedBase(event)
        .setTitle(`Attachment removed from card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Attachment named \`${event.data.attachment.name}\` removed from card by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when a checklist is added to a card (same thing as created)
events.on('addChecklistToCard', (event, board) => {
    if (!eventEnabled(`checklistAddedToCard`)) return
    let embed = getEmbedBase(event)
        .setTitle(`Checklist added to card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist named \`${event.data.checklist.name}\` added to card by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when a checklist is removed from a card (same thing as deleted)
events.on('removeChecklistFromCard', (event, board) => {
    if (!eventEnabled(`checklistRemovedFromCard`)) return
    let embed = getEmbedBase(event)
        .setTitle(`Checklist removed from card!`)
        .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist named \`${event.data.checklist.name}\` removed from card by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event.memberCreator))
})

// Fired when a checklist item's completion status is toggled
events.on('updateCheckItemStateOnCard', (event, board) => {
    if (event.data.checkItem.state === "complete") {
        if (!eventEnabled(`checklistItemMarkedComplete`)) return
        let embed = getEmbedBase(event)
            .setTitle(`Checklist item marked complete!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist item under checklist \`${event.data.checklist.name}\` marked complete by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            .addField(`Checklist Item Name`, event.data.checkItem.name.length > 1024 ? `${event.data.checkItem.name.trim().slice(0, 1020)}...` : event.data.checkItem.name)
        send(addDiscordUserData(embed, event.memberCreator))
    } else if (event.data.checkItem.state === "incomplete") {
        if (!eventEnabled(`checklistItemMarkedIncomplete`)) return
        let embed = getEmbedBase(event)
            .setTitle(`Checklist item marked incomplete!`)
            .setDescription(`**CARD:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**EVENT:** Checklist item under checklist \`${event.data.checklist.name}\` marked incomplete by **[${conf.realNames ? event.memberCreator.fullName : event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
            .addField(`Checklist Item Name`, event.data.checkItem.name.length > 1024 ? `${event.data.checkItem.name.trim().slice(0, 1020)}...` : event.data.checkItem.name)
        send(addDiscordUserData(embed, event.memberCreator))
    }
})



/*
** =======================
** Miscellaneous functions
** =======================
*/
events.on('maxId', (id) => {
    if (latestActivityID == id) return
    latestActivityID = id
    fs.writeFileSync('.latestActivityID', id + "")
})

const send = (embed, content = ``) => conf.channel.send(`${content} ${conf.contentString}`, {embed:embed}).catch(err => console.error(err))

const eventEnabled = (type) => conf.enabledEvents.length > 0 ? conf.enabledEvents.includes(type) : true

const logEventFire = (event) => console.log(`${new Date(event.date).toUTCString()} - ${event.type} fired`)

const getEmbedBase = (event) => new Discord.RichEmbed()
        .setFooter(`${conf.guild.members.get(bot.user.id).displayName} • ${event.data.board.name} [${event.data.board.shortLink}]`, bot.user.displayAvatarURL)
        .setTimestamp(event.hasOwnProperty(`date`) ? event.date : Date.now())
        .setColor("#127ABD")

//  Converts Trello @username mentions in titles to Discord mentions, finds channel and role mentions, and mirros Discord user mentions outside the embed
const convertMentions = (embed, event) => {
    
}
        
// adds thumbanil and appends user mention to the end of the description, if possible
const addDiscordUserData = (embed, member) => {
    if (conf.userIDs[member.username]) {
        let discordUser = conf.guild.members.get(conf.userIDs[member.username])
        if (discordUser) embed
            .setThumbnail(discordUser.user.displayAvatarURL)
            .setDescription(`${embed.description} / ${discordUser.toString()}`)
    }
    return embed
}

// logs initialization data (stuff loaded from conf.json) - mostly for debugging purposes
const logInitializationData = () => console.log(`== INITIALIZING WITH:
    latestActivityID - ${latestActivityID}
    boardIDs --------- ${conf.boardIDs.length + " [" + conf.boardIDs.join(", ") + "]"}
    serverID --------- ${conf.serverID} (${conf.guild.name})
    channelID -------- ${conf.channelID} (#${conf.channel.name})
    pollInterval ----- ${conf.pollInterval} ms (${conf.pollInterval / 1000} seconds)
    prefix ----------- "${conf.prefix}"${conf.prefix === "." ? " (default)" : ""}
    contentString ---- ${conf.contentString !== "" ? "\"" + conf.contentString + "\"" : "none"}
    enabledEvents ---- ${conf.enabledEvents.length > 0 ? conf.enabledEvents.length + " [" + conf.enabledEvents.join(", ") + "]" : "all"}
    userIDs ---------- ${Object.getOwnPropertyNames(conf.userIDs).length}`)
