import { Client, GatewayIntentBits } from 'discord.js';
import { logger, startupLog, shutdownLog } from './utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد عميل البوت مع الصلاحيات اللازمة
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// تحميل الأجهزة أو الأحداث (Events) تلقائياً إذا كانت موجودة
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    import(filePath).then((event) => {
      const eventModule = event.default;
      if (eventModule.once) {
        client.once(eventModule.name, (...args) => eventModule.execute(...args, client));
      } else {
        client.on(eventModule.name, (...args) => eventModule.execute(...args, client));
      }
    }).catch(err => {
      logger.error(`Failed to load event file ${file}:`, err);
    });
  }
}

client.once('ready', () => {
  startupLog(`Logged in as ${client.user.tag}!`);
});

// تسجيل الدخول باستخدام التوكن من ملف .env
client.login(process.env.TOKEN);

// التعامل مع الإغلاق بشكل آمن
process.on('SIGINT', () => {
  shutdownLog('Bot is shutting down...');
  client.destroy();
  process.exit(0);
});
export default TitanBot;
