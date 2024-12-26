const axios = require('axios');
const cookie = require('cookie');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

const client = new Client({ authStrategy: new LocalAuth() });

const apiUrl = process.env.API_URL;
const apiBodyTemplate = JSON.parse(process.env.API_BODY);
const cookies = process.env.COOKIES;

const parsedCookies = cookie.parse(cookies);
const cookieString = Object.entries(parsedCookies)
  .map(([key, value]) => `${key}=${value}`)
  .join('; ');

const userStates = {}; // Object to track states for each user or group participant

async function fetchVehicleDetails(vehicleNumber) {
  try {
    const apiBody = { ...apiBodyTemplate, Props: [vehicleNumber] };

    const response = await axios.post(apiUrl, apiBody, {
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      },
    });

    // Remove unnecessary fields
    delete response.data.transKey;
    delete response.data.message;
    delete response.data.description;
    delete response.data.response.transKey;
    delete response.data.response.statusDesc;
    delete response.data.response.dataStatus;
    delete response.data.response.eDate;
    delete response.data.response.lmDate;
    delete response.data.response.manufacturerMonthYear;
    delete response.data.response.manufacturerYear;
    delete response.data.response.vehicleAge;
    delete response.data.response.puccNumber;
    delete response.data.response.puccValidUpto;
    delete response.data.response.presentAddress;
    delete response.data.response.insuranceExpired;
    delete response.data.response.status;

    return response.data;
  } catch (error) {
    console.error('Error making the API request:', error.message);
    throw error;
  }
}

function logToFile(user, command, response) {
  const logEntry = `${new Date().toISOString()} - User: ${user}, Command: ${command}, Response: ${JSON.stringify(response, null, 2)}\n`;
  fs.appendFileSync('bot_logs.txt', logEntry, 'utf8');
}

client.on('qr', qr => {
  console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
  console.log('CLIENT IS READY');
});

client.on('message', async message => {
  const lowercasedMessage = message.body.toLowerCase();
  const chatId = message.from; // Unique ID for the chat (group or private)
  const userId = message.author || message.from; // User ID (author for group, from for private)
  const uniqueId = `${chatId}:${userId}`; // Unique identifier for each user in groups or private chats

  if (userStates[uniqueId] && userStates[uniqueId].awaitingVehicleNumber) {
    // If user is waiting for a vehicle number
    const vehicleNumber = message.body.trim();
    try {
      const vehicleDetails = await fetchVehicleDetails(vehicleNumber);
      userStates[uniqueId].awaitingVehicleNumber = false; // Reset user state
      await message.reply(`Vehicle Details:\n${JSON.stringify(vehicleDetails, null, 2)}`);
      logToFile(uniqueId, vehicleNumber, vehicleDetails);
    } catch (error) {
      userStates[uniqueId].awaitingVehicleNumber = false; // Reset user state even on error
      await message.reply('Oops, we don\'t have data.');
      logToFile(uniqueId, vehicleNumber, { error: error.message });
    }
  } if (lowercasedMessage.includes('hello')) {
    await message.reply('Hello! How can I help you today? Type help for more info And Join: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO');
  } else if (lowercasedMessage.includes('bye')) {
    await message.reply('Goodbye! Have a great day!');
  } else if (lowercasedMessage.includes('help')) {
    await message.reply("Join: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO \n\n Type: 'Search Vehicle' OR 'search vehicle' To Search , 'help' for help , 'telegram' for telegram 'report' to report something ");
  } else if (lowercasedMessage.includes('start')) {
    await message.reply('Type "help" for more info\n Join: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO');
  } else if (lowercasedMessage.includes('link')) {
    await message.reply('WhatsApp Channel: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO');
  } else if (lowercasedMessage.includes('group')) {
    await message.reply('Join: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO \n ');
  } else if (lowercasedMessage.includes('report')) {
    await message.reply('Please Type Your Report Here. Owner Will Respond You Soon');
  } else if (lowercasedMessage.includes('hi')) {
    await message.reply('Hello! How can I help you today? Type help for more info And Join: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO');
  } else if (lowercasedMessage.includes('search vehicle')) {
    userStates[uniqueId] = { awaitingVehicleNumber: true }; // Set user-specific state
    await message.reply('Please enter the vehicle registration number.');
  } else if (lowercasedMessage.includes('Search Vehicle')) {
    userStates[uniqueId] = { awaitingVehicleNumber: true }; // Set user-specific state
    await message.reply('Please enter the vehicle registration number.');
  } else {
    await message.reply('Invalid Command Please Type "help" To See My Commands \n\n Join: https://chat.whatsapp.com/FHZrqOrSNaD7LSQGCOzUuO');
  }
});

client.initialize();