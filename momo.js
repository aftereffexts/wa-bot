const { Client, LocalAuth, MessageMedia} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const colors = require('colors');
const fs = require('fs');
const ytdl = require('ytdl-core')
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
const axios = require("axios");
const https = require('https')
const cheerio = require("cheerio");

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    },
    ffmpeg: '$ffmpeg',
    authStrategy: new LocalAuth({ clientId: "client" })
});

const client2 = new Client({
    authStrategy: new LocalAuth({clientId: 'client2'})
})
const configs = require('./configs/configs.json');
const config = require('./src/config/config.json');

client.on('qr', (qr) => {
    console.log(`[${moment().tz(configs.timezone).format('HH:mm:ss')}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.clear();
    const consoleText = './configs/console.txt';
    fs.readFile(consoleText, 'utf-8', (err, data) => { 
        if (err) {
            console.log(`[${moment().tz(configs.timezone).format('HH:mm:ss')}] Console Text not found!`.yellow);
            console.log(`[${moment().tz(configs.timezone).format('HH:mm:ss')}] ${configs.name} is Already!`.green);
        } else {
            console.log(data.green);
            console.log(`[${moment().tz(configs.timezone).format('HH:mm:ss')}] ${configs.name} is Already!`.green);
        }
    });
});

client.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(after); // message after it was deleted.
    if (before) {
        console.log(before); // message before it was deleted.
    }
});

client.on('message', async (message) => {
    const isGroups = message.from.endsWith('@g.us') ? true : false;
    const chat = await message.getChat();
    const contact = await message.getContact();
    let url = message.body.split(' ')[1];
    
 

    /*if (message.body.startsWith('!tiktok')) {
        const url = message.body.split(' ')[1];
        const video = await downloadVideo(url);
        await message.reply(video);
    }*/

    async function detailYouTube(url) {
        client.sendMessage(message.from, 'Ein Moment...');
        try {
            let info = await ytdl.getInfo(url);
            let data = {
                "channel": {
                    "name": info.videoDetails.author.name,
                    "user": info.videoDetails.author.user,
                    "channelUrl": info.videoDetails.author.channel_url,
                    "userUrl": info.videoDetails.author.user_url,
                    "verified": info.videoDetails.author.verified,
                    "subscriber": info.videoDetails.author.subscriber_count
                },
                "video": {
                    "title": info.videoDetails.title,
                    "description": info.videoDetails.description,
                    "lengthSeconds": info.videoDetails.lengthSeconds,
                    "videoUrl": info.videoDetails.video_url,
                    "publishDate": info.videoDetails.publishDate,
                    "viewCount": info.videoDetails.viewCount
                }
            }
            client.sendMessage(message.from, `*CHANNEL DETAILS*\n• Name : *${data.channel.name}*\n• User : *${data.channel.user}*\n• Verified : *${data.channel.verified}*\n• Channel : *${data.channel.channelUrl}*\n• Subscriber : *${data.channel.subscriber}*`);
            client.sendMessage(message.from, `*VIDEO DETAILS*\n• Title : *${data.video.title}*\n• Seconds : *${data.video.lengthSeconds}*\n• VideoURL : *${data.video.videoUrl}*\n• Publish : *${data.video.publishDate}*\n• Viewers : *${data.video.viewCount}*`)
            client.sendMessage(message.from, 'Erfolgreich');
        } catch (err) {
            console.log(err);
            client.sendMessage(message.from, '*Fehler');
        }
    }

    async function downloadYouTube(url, format, filter) {
        client.sendMessage(message.from, 'Ein Moment...');
        let timeStart = Date.now();
        try {
            let info = await ytdl.getInfo(url);
            let data = {
                "channel": {
                    "name": info.videoDetails.author.name,
                    "user": info.videoDetails.author.user,
                    "channelUrl": info.videoDetails.author.channel_url,
                    "userUrl": info.videoDetails.author.user_url,
                    "verified": info.videoDetails.author.verified,
                    "subscriber": info.videoDetails.author.subscriber_count
                },
                "video": {
                    "title": info.videoDetails.title,
                    "description": info.videoDetails.description,
                    "lengthSeconds": info.videoDetails.lengthSeconds,
                    "videoUrl": info.videoDetails.video_url,
                    "publishDate": info.videoDetails.publishDate,
                    "viewCount": info.videoDetails.viewCount
                }
            }
            ytdl(url, { filter: filter, format: format, quality: 'highest' }).pipe(fs.createWriteStream(`./src/database/download.${format}`)).on('finish', async () => {
                const media = await MessageMedia.fromFilePath(`./src/database/download.${format}`);
                let timestamp = Date.now() - timeStart;
                media.filename = `${config.filename.mp3}.${format}`;
                await client.sendMessage(message.from, media, { sendMediaAsDocument: true });
                client.sendMessage(message.from, `• Title : *${data.video.title}*\n• Channel : *${data.channel.user}*\n• View Count : *${data.video.viewCount}*\n• TimeStamp : *${timestamp}*`);
                client.sendMessage(message.from, 'Erfolgreich');
            });
        } catch (err) {
            console.log(err);
            client.sendMessage(message.from, '*[❎]* Failed!');
        }
    }
    if (message.body == `${config.prefix}help-yt`) return client.sendMessage(message.from, `*${config.name}*\n\n[🎥] : *${config.prefix}video <youtube-url>*\n[🎧] : *${config.prefix}audio <youtube-url>*\n\n*Example :*\n${config.prefix}audio https://youtu.be/abcdefghij`)
    if (message.body.startsWith(`${config.prefix}audio`)) {
        downloadYouTube(url, 'mp3', 'audioonly');
    } else if (message.body.startsWith(`${config.prefix}video`)) {
        downloadYouTube(url, 'mp4', 'audioandvideo');
    } else if (message.body.startsWith(`${config.prefix}detail`)) {
        detailYouTube(url);
    };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           


    if ((isGroups && configs.groups) || !isGroups) {

        //slm
        switch(message.body){
            case 'slm':
                client.sendMessage(message.from, 'aleykumselam')
                break;
            case 'selam':
                client.sendMessage(message.from, 'aleykumselam')
                break;
            case 'selamunaleykum':
                client.sendMessage(message.from, 'aleykumselam')
                break;
            case 'selamaleyküm':
                client.sendMessage(message.from, 'aleykumselam')
                break;
        }
        //og

    switch(message.body){
            case '!help':
                client.sendMessage(message.from, ' Commands:\n\n !sticker\n !image\n !ping\n !botinfo\n !chats\n !info\n \n*Gruppencommands:*\n \nAdmins:\n !delete\n !everyone\n --- \n \nCommands:\n \n!whoisadmin\n!groupinfo\n\n *YouTube-Wrapper*: \n File size: max. 16mb\n !help-yt\n !audio <yt-url>\n !video <yt-url>')
                break;
            case '!copy':
                client.sendMessage(message.from, 'babam')
                break;
            case '!yessa':
                client.sendMessage(message.from, 'babam')        
                break;
            case '!botinfo':
                client.sendMessage(message.from, 'Owner: y.bahadir61')
		break;
           case '!ping':
                client.sendMessage(message.from, 'pong')
                break; 
            
        }
        

    //chat info/ Gruppeninfo
    if (message.body === '!chats') {
        const chats = await client.getChats();
        client.sendMessage(message.from, `Kanabot hat ${chats.length} Chats offen.`);
    }

    if (message.body === '!info') {
        let info = client.info;
        client.sendMessage(message.from, `
            *Info*
            Username: ${info.pushname}
            Tel: ${info.wid.user}
            Plattform: ${info.platform}
        `);
    }

    


    /*if (message.body === '!mute') {
        const chat = await message.getChat();
        // mute the chat for 20 seconds
        const unmuteDate = new Date();
        unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
        await chat.mute(unmuteDate);
    }*/

    if (message.body === '!groupinfo') {
        let chat = await message.getChat();
        if (chat.isGroup) {
            message.reply(`
                *Gruppe*
                Name: ${chat.name}
                Erstellt am: ${chat.createdAt.toString()}
                Erstellt von: ${chat.owner.user}
                Mitglieder: ${chat.participants.length}
            `);
        } else {
            message.reply('Dieser Command kann nur in Gruppen ausgefuehrt werden');
        }
    }

    if (message.body === '!whoisadmin') {
        let chat = await message.getChat();
        if (chat.isGroup) {
            let participants = await chat.participants;
            let admins = participants.filter(participant => participant.isAdmin).map(admin => admin.id.user);

            if (admins.length > 0) {
                message.reply(`
                    *Admins in der Gruppe*
                    ${admins.join('\n')}
                `);
            } else {
                message.reply('Es gibt keine Admins in dieser Gruppe.');
            }
        } else {
            message.reply('Dieser Command kann nur in Gruppen ausgeführt werden');
        }}

        let chat = await message.getChat();
        const authorId = message.author;


        switch (message.body) {
            case '!everyone':
                handleEveryoneCommand();
                break;
            case '!delete':
                handleDeleteCommand();
                break;
        
        }

        async function handleEveryoneCommand() {
            
            if(chat.isGroup){
                // Check if the sender is an admin
            const isAdmin = chat.participants.find(participant => participant.id._serialized === authorId && participant.isAdmin);        
                if (isAdmin) {
                    let text = "";
                    let mentions = [];
            
                    for (let participant of chat.participants) {
                        const contact = await client.getContactById(participant.id._serialized);
                        mentions.push(contact);
                        text += `@${participant.id.user} `;
                    }
            
                    await chat.sendMessage(text, { mentions });
                } else {
                    message.reply('Nur Gruppenadmins können diesen Befehl verwenden.');
                    }
                }else{message.reply('Dieser Command kann nur in Gruppen ausgefuehrt werden.')}
            }
        
        async function handleDeleteCommand() {
            // Check if the sender is an admin
            if(chat.isGroup){
                const isAdmin = chat.participants.find(participant => participant.id._serialized === authorId && participant.isAdmin);
                if (isAdmin) {
                        if (message.hasQuotedMsg) {
                            const quotedMsg = await message.getQuotedMessage();
                            if (quotedMsg.from) {
                                quotedMsg.delete(true);
                            } 
                        } 
                    }else {
                message.reply('Nur Gruppenadmins koennen diesen Befehl verwenden.')
                }
            }else{message.reply('Dieser Command kann nur in Gruppen ausgefuehrt werden.')}
           
         }

        
      

        // Image to Sticker (With Reply Image)
          if (message.body == `${configs.prefix}sticker`) {
            const quotedMsg = await message.getQuotedMessage(); 
            if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                client.sendMessage(message.from, "Ein Moment...");
                try {
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true,
                        stickerName: configs.name, // Sticker Name = Edit in 'config/config.json'
                        stickerAuthor: configs.author // Sticker Author = Edit in 'config/config.json'
                    }).then(() => {
                        client.sendMessage(message.from, "");
                    });
                } catch {
                    client.sendMessage(message.from, "Fehlgeschlagen");
                }
            } else {
                client.sendMessage(message.from, "Markier das Bild und antworte mit !sticker");
            }
        }
        if (message.body == `${configs.prefix}image`) {
            const quotedMsg = await message.getQuotedMessage(); 
            if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                client.sendMessage(message.from, "Ein Moment...");
                try {
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media).then(() => {
                        client.sendMessage(message.from, "");
                    });
                } catch {
                    client.sendMessage(message.from, "Fehlgeschlagen");
                }
            } else {
                client.sendMessage(message.from, "Markier das Bild und antworte mit !image");
            }

        // Claim or change sticker name and sticker author
        } 
        
        
         
        // Sticker to Image (With Reply Sticker)
     }
    }
);

client.initialize();