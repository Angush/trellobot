const Discord = require('discord.js')
const bot = new Discord.Client()
const fs = require('fs')
const auth = JSON.parse(fs.readFileSync('.auth'))
const conf = JSON.parse(fs.readFileSync('conf.json'))
let latestActivityID = fs.existsSync('.latestActivityID') ? fs.readFileSync('.latestActivityID') : 0

bot.on('ready', () => {
    let channel = bot.channels.get(conf.channelID)
    if (!bot.guilds.get(conf.serverID)) {
        console.log(`Server with ID "${conf.serverID}" not found! I can't function without a valid server and channel.\nPlease add the correct server ID to your conf file, or if the conf data is correct, ensure I have proper access.\nYou may need to add me to your server using this link:\n    https://discordapp.com/api/oauth2/authorize?client_id=453077635418030081&permissions=0&scope=bot`)
        process.exit()
    } else if (!channel) {
        console.log(`Channel with ID "${conf.channelID}" not found! I can't function without a valid channel.\nPlease add the correct channel ID to your conf file, or if the conf data is correct, ensure I have proper access.`)
        process.exit()
    }
    conf.channel = channel
    console.log(`== Bot logged in as ${bot.user.tag}. Ready for action, commander! ==`)
    console.log(`Latest Activity ID: ${latestActivityID} (you can ignore this)`)
})
bot.login(auth.discordToken)

const Trello = require('trello-events')
const events = new Trello({
    pollFrequency: conf.pollInterval, // milliseconds
    minId: latestActivityID, // auto-created and auto-updated
    start: true,
    trello: {
        boards: conf.boardIDs, // array of Trello board IDs 
        key: auth.trelloKey, // your public Trello API key
        token: auth.trelloToken // your private Trello token for Trellobot
    } 
})

const send = (content, options = null) => conf.channel.send(content, options).catch(err => console.error(err))

const eventEnabled = (type) => conf.enabledEvents ? conf.enabledEvents.includes(type) : true

events.on('maxId', (id) => {
    latestActivityID = id
    fs.writeFileSync('.latestActivityID', id)
})
