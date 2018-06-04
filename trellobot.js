const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs')
fs.readFile('.token', (err, data) => client.login(`${data}`))

client.on('ready', () => console.log(`Bot logged in as ${client.user.tag}. Ready for action, commander.`))