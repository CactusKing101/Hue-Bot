const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();
const config = require('./general/config.json');
const tokens = require('./general/tokens.json');
const prefix = config.prefix;
var lights = [];

client.once('ready', () => {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  request(`https://${config.local_ip}/api/BeXx8aeVKTUav4esGvogyP4xDZntKbqKjx-2r1XM/lights`, { json: true }, (err, res, body) => {
    if (err) return console.log(err);
    for (let i = 0; i < 10; ++i) {
      if (body[i] != null) {
        lights.push(i);
      }
    }
  });
  console.log(`Logged into ${client.user.tag}`);
});

function light(msg, on, bulb, hue = 0, bri = 255, sat = 255) {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  const https = require("https");
  if (lights[bulb - 1] == null) return;
  bulb = lights[bulb - 1];
  const options = {
    hostname: config.local_ip,
    path: `/api/${tokens.hue}/lights/${bulb}/state`,
    method: 'PUT'
  };

  const req = https.request(options, response => {
    console.log(`statusCode: ${response.statusCode}`);
    if (response.statusCode != 200) msg.channel.send('ERROR');
  });

  if (sat != 255 || bri != 255 || hue != 0) req.write(`{"on":${on}, "sat":${sat}, "bri":${bri},"hue":${hue}}`);
  else req.write(`{"on":${on}}`);
  req.end();
  msg.channel.send('Done');

  req.on('error', error => {
    console.error(error);
  });
};

function group(msg, on, hue = 0, bri = 255, sat = 255) {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  const https = require("https");
  const options = {
    hostname: config.local_ip,
    path: `/api/${tokens.hue}/groups/1/action`,
    method: 'PUT'
  };

  const req = https.request(options, response => {
    console.log(`statusCode: ${response.statusCode}`);
    if (response.statusCode != 200) msg.channel.send('ERROR');
  });

  if (sat != 255 || bri != 255 || hue != 0) req.write(`{"on":${on}, "sat":${sat}, "bri":${bri},"hue":${hue}}`);
  else req.write(`{"on":${on}}`);
  req.end();
  msg.channel.send('Done');

  req.on('error', error => {
    console.error(error);
  });
};


client.on('message', async msg => {
  if (!msg.content.startsWith(prefix) || msg.channel.type === 'dm') return;
  const args = msg.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command == 'on') {
    if (msg.member.roles.cache.get(config.role_id)) {
      if (args[0] == 'all') {
        group(msg, true);
        return;
      } else {
        if (isNaN(args[0])) return msg.channel.send(`Invalid arguments\n${prefix}on bulb(1-4 \|\| all)\n\`${prefix}on <1-4 \|\| all>\``);
        if (args[0] >= 0 && args[0] <= 4) {
          light(msg, true, Math.floor(args[0]));
        } else return msg.channel.send(`Invalid arguments\n${prefix}on bulb(1-4 \|\| all)\n\`${prefix}on <1-4 \|\| all>\``);
      }
    } else return msg.channel.send(`You need the \`${config.role_name}\` role to use this`);
  } else if (command == 'off') {
    if (msg.member.roles.cache.get(config.role_id)) {
      if (args[0] == 'all') {
        group(msg, false);
        return
      } else {
        if (isNaN(args[0])) return msg.channel.send(`Invalid arguments\n${prefix}off bulb(1-4 \|\| all)\n\`${prefix}off <1-4 \|\| all>\``);
        if (args[0] >= 0 && args[0] <= 4) {
          light(msg, false, Math.floor(args[0]));
        } else return msg.channel.send(`Invalid arguments\n${prefix}off bulb(1-4 \|\| all)\n\`${prefix}off <1-4 \|\| all>\``);
      }
    } else return msg.channel.send(`You need the \`${config.role_name}\` role to use this`);
  } else if (command == 'color') {
    if (msg.member.roles.cache.get(config.role_id)) {
      if (args[0] == 'all') {
        if (args.length == 2 && args[1] >= 0 && args[1] <= 65536) {
          group(msg, true, args[1]);
        } else if (args.length == 3 && args[1] >= 0 && args[1] <= 65536 && args[2] >= 0 && args[2] <= 255) {
          group(msg, true, args[1], args[2]);
        } else if (args.length == 4 && args[1] >= 0 && args[1] <= 65536 && args[2] >= 0 && args[2] <= 255 && args[3] >= 0 && args[3] <= 255) {
          group(msg, true, args[1], args[2], args[3]);
        } else msg.channel.send(`Invalid arguments\n${prefix}color all hue(1-65535) brightness(0-255) saturation(0-255)\n\`${prefix}color all <1-65535> [0-255] [0-255]\``);
        return
      } else {
        if (isNaN(args[0])) return msg.channel.send(`Invalid arguments\n${prefix}color bulb(all \|\| 1-4) hue(1-65535) brightness(0-255) saturation(0-255)\n\`${prefix}color <all \|\| 1-4> <1-65535> [0-255] [0-255]\``);
        if (args.length == 2 && args[1] >= 0 && args[1] <= 65536) {
          light(msg, true, Math.floor(args[0]), args[1]);
        } else if (args.length == 3 && args[1] >= 0 && args[1] <= 65536 && args[2] >= 0 && args[2] <= 255) {
          light(msg, true, Math.floor(args[0]), args[1], args[2]);
        } else if (args.length == 4 && args[1] >= 0 && args[1] <= 65536 && args[2] >= 0 && args[2] <= 255 && args[3] >= 0 && args[3] <= 255) {
          light(msg, true, Math.floor(args[0]), args[1], args[2], args[3]);
        } else msg.channel.send(`Invalid arguments\n${prefix}color bulb(1-4) hue(1-65535) brightness(0-255) saturation(0-255)\n\`${prefix}color <1-4> <1-65535> [0-255] [0-255]\``);
      }
    } else return msg.channel.send(`You need the \`${config.role_name}\` role to use this`);
  } else if (command == 'hue') {
    msg.channel.send(`The commands are:\n${prefix}color\n${prefix}on\n${prefix}off`)
  }
});

client.login(tokens.discord);