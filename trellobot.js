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
        console.log(`Server with ID "${conf.serverID}" not found! I can't function without a valid server and channel.\nPlease add the correct server ID to your conf file, or if the conf data is correct, ensure I have proper access.\nYou may need to add me to your server using this link:\n    https://discordapp.com/api/oauth2/authorize?client_id=453077635418030081&permissions=0&scope=bot`)
        process.exit()
    } else if (!channel) {
        console.log(`Channel with ID "${conf.channelID}" not found! I can't function without a valid channel.\nPlease add the correct channel ID to your conf file, or if the conf data is correct, ensure I have proper access.`)
        process.exit()
    } else if (!conf.boardIDs || conf.boardIDs.length < 1) {
        console.log(`No board IDs provided! Please add at least one to your conf file. Check the readme if you need help finding a board ID.`)
    }
    conf.guild = guild
    conf.channel = channel
    if (!conf.contentString) conf.contentString = ""
    if (!conf.enabledEvents) conf.enabledEvents = []
    if (!conf.userIDs) conf.userIDs = {}
    // set default prefix is none provided in conf
    if (!conf.prefix) {
        conf.prefix = "."
        fs.writeFileSync('conf.json', JSON.stringify(conf, null, 4), (err, data) => console.log(`Updated conf file with default prefix ('.')`))
    }
    logInitializationData()
    console.log(`== Bot logged in as @${bot.user.tag}. Ready for action! ==`)
    events.start()
})

bot.on('message', (msg) => {
    if (msg.channel.type !== "text") return 
    if (msg.content.startsWith('.ping')) send({embed:getEmbedBase()})
})

/*
** ====================================
** Trello event handlers and functions.
** ====================================
*/

// Fired when a card is created
events.on('createCard', (event, board) => {
    if (!eventEnabled(event.type)) return
    logEventFire(event)
    let embed = getEmbedBase(event)
    .setTitle(`New card created under __${event.data.list.name}__!`)
    .setDescription(`**TITLE:** ${event.data.card.name} — **[CARD LINK](https://trello.com/c/${event.data.card.shortLink})**\n\n**CREATED BY:** **[${event.memberCreator.username}](https://trello.com/${event.memberCreator.username})**`)
    send(addDiscordUserData(embed, event))
}) 




/*
** =======================
** Miscellaneous functions
** =======================
*/
events.on('maxId', (id) => {
    if (latestActivityID == id) return
    latestActivityID = id
    fs.writeFileSync('.latestActivityID', id)
})

const send = (options) => conf.channel.send(conf.contentString, options).catch(err => console.error(err))

const eventEnabled = (type) => conf.enabledEvents ? conf.enabledEvents.includes(type) : true

const logEventFire = (event) => console.log(`${new Date(event.date).toUTCString()} - ${event.type} fired`)

const getEmbedBase = (event) => new Discord.RichEmbed()
        .setFooter(conf.guild.members.get(bot.user.id).displayName, bot.user.displayAvatarURL)
        .setColor("#127ABD")
        .setTimestamp(event.date ? event.date : Date.now())

// adds thumbanil and appends user mention to the end of the description, if possible
const addDiscordUserData = (embed, event) => {
    if (conf.userIDs[event.memberCreator.username]) {
        let discordUser = conf.guild.members.get(conf.userIDs[event.memberCreator.username])
        if (discordUser) {
            embed.setThumbnail(discordUser.user.displayAvatarURL)
            embed.setDescription(`${embed.description} / ${discordUser.toString()}`)
        }
    }
    return {embed} 
}

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
