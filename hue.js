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
  client.user.setActivity(`${prefix}hue`);
  client.api.applications(client.user.id).guilds(config.guild_id).commands.post({data: {
    name: 'on',
    description: 'Turns on the inputted lights',
    options: [
      {
        name: 'bulb',
        type: 3,
        description: 'Number or all',
        required: true,
      },
    ],
  }});
  client.api.applications(client.user.id).guilds(config.guild_id).commands.post({data: {
    name: 'off',
    description: 'Turns off the inputted lights',
    options: [
      {
        name: 'bulb',
        type: 3,
        description: 'Number or all',
        required: true,
      },
    ],
  }});
  client.api.applications(client.user.id).guilds(config.guild_id).commands.post({data: {
    name: 'color',
    description: 'Changes the color of the lights inputted',
    options: [
      {
        name: 'bulb',
        type: 3,
        description: 'Number or all',
        required: true,
      },
      {
        name: 'hue',
        type: 4,
        description: '1 - 65535',
        required: true,
      },
      {
        name: 'brightness',
        type: 4,
        description: '0 - 255',
        required: false,
      },
      {
        name: 'saturation',
        type: 4,
        description: '0 - 255',
        required: false,
      },
    ],
  }});
  console.log(`Logged into ${client.user.tag}`);
});

function reply(id, token, cont) {
  client.api.interactions(id, token).callback.post({data: {
    type: 4,
    data: {
      content: cont,
    }
  }});
};

function eReply(id, token, cont) {
  client.api.interactions(id, token).callback.post({data: {
    type: 4,
    data: {
      content: cont,
      flags: 1 << 6,
    }
  }});
};

function light(iId, iToken, on, bulb, hue = 0, bri = 255, sat = 255) {
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
  });

  req.on('error', error => {
    console.error(error);
  });

  if (sat != 255 || bri != 255 || hue != 0) req.write(`{"on":${on}, "sat":${sat}, "bri":${bri},"hue":${hue}}`);
  else req.write(`{"on":${on}}`);
  req.end();
  reply(iId, iToken, 'Done');
};

function group(iId, iToken, on, hue = 0, bri = 255, sat = 255) {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  const https = require("https");
  const options = {
    hostname: config.local_ip,
    path: `/api/${tokens.hue}/groups/1/action`,
    method: 'PUT'
  };

  const req = https.request(options, response => {
    console.log(`statusCode: ${response.statusCode}`);
  });

  req.on('error', error => {
    console.error(error);
  });

  if (sat != 255 || bri != 255 || hue != 0) req.write(`{"on":${on}, "sat":${sat}, "bri":${bri},"hue":${hue}}`);
  else req.write(`{"on":${on}}`);
  req.end();
  reply(iId, iToken, 'Done');
};

client.ws.on('INTERACTION_CREATE', interaction => {
  console.log(interaction.member.roles);
  try {
    if (interaction.data.name == 'on') {
      if (interaction.member.roles.cache.has(config.role_id)) {
        if (interaction.data.options[0].value == 'all') {
          group(interaction.id, interaction.token, true);
          return;
        } else {
          if (isNaN(interaction.data.options[0].value)) return reply(interaction.id, interaction.token, `Invalid arguments`);
          if (interaction.data.options[0].value >= 0 && interaction.data.options[0].value <= 4) {
            light(interaction.id, interaction.token, true, Math.floor(interaction.data.options[1].value));
          } else return reply(interaction.id, interaction.token, `Invalid arguments`);
        }
      } else return eReply(interaction.id, interaction.token, `You need the \`${config.role_name}\` role to use this`);
    } else if (interaction.data.name == 'off') {
      if (interaction.member.roles.has(config.role_id)) {
        if (interaction.data.options[0].value == 'all') {
          group(interaction.id, interaction.token, false);
          return;
        } else {
          if (isNaN(interaction.data.options[0].value)) return reply(interaction.id, interaction.token, `Invalid arguments`);
          if (interaction.data.options[0].value >= 0 && interaction.data.options[0].value <= 4) {
            light(interaction.id, interaction.token, false, Math.floor(interaction.data.options[0].value));
          } else return reply(interaction.id, interaction.token, `Invalid arguments`);
        }
      } else return eReply(interaction.id, interaction.token, `You need the \`${config.role_name}\` role to use this`);
    } else if (interaction.data.name == 'color') {
      if (interaction.member.roles.has(config.role_id)) {
        if (interaction.data.options[0].value == 'all') {
          if (interaction.data.options.length == 2 && interaction.data.options[1].value >= 0 && interaction.data.options[1].value <= 65536) {
            group(interaction.id, interaction.token, true, interaction.data.options[1].value);
          } else if (interaction.data.options.length == 3 && interaction.data.options[1].value >= 0 && interaction.data.options[1].value <= 65536 && interaction.data.options[2].value >= 0 && interaction.data.options[2].value <= 255) {
            group(interaction.id, interaction.token, true, interaction.data.options[1].value, interaction.data.options[2].value);
          } else if (interaction.data.options.length == 4 && interaction.data.options[1].value >= 0 && interaction.data.options[1].value <= 65536 && interaction.data.options[2].value >= 0 && interaction.data.options[2].value <= 255 && interaction.data.options[3].value >= 0 && interaction.data.options[3].value <= 255) {
            group(interaction.id, interaction.token, true, interaction.data.options[1].value, interaction.data.options[2].value, interaction.data.options[3].value);
          } else reply(interaction.id, interaction.token, `Invalid arguments`);
          return;
        } else {
          if (isNaN(interaction.data.options[0].value)) return reply(interaction.id, interaction.token, `Invalid arguments`);
          if (interaction.data.options.length == 2 && interaction.data.options[1].value >= 0 && interaction.data.options[1].value <= 65536) {
            light(interaction.id, interaction.token, true, Math.floor(interaction.data.options[0].value), interaction.data.options[1].value);
          } else if (interaction.data.options.length == 3 && interaction.data.options[1].value >= 0 && interaction.data.options[1].value <= 65536 && interaction.data.options[2].value >= 0 && interaction.data.options[2].value <= 255) {
            light(interaction.id, interaction.token, true, Math.floor(interaction.data.options[0].value), interaction.data.options[1].value, interaction.data.options[2].value);
          } else if (interaction.data.options.length == 4 && interaction.data.options[1].value >= 0 && interaction.data.options[1].value <= 65536 && interaction.data.options[2].value >= 0 && interaction.data.options[2].value <= 255 && interaction.data.options[3].value >= 0 && interaction.data.options[3].value <= 255) {
            light(interaction.id, interaction.token, true, Math.floor(interaction.data.options[0].value), interaction.data.options[1].value, interaction.data.options[2].value, interaction.data.options[3].value);
          } else reply(interaction.id, interaction.token, `Invalid arguments`);
        }
      } else return eReply(interaction.id, interaction.token, `You need the \`${config.role_name}\` role to use this`);
    }
  } catch (err) {
    console.warn(err);
  }
});

client.login(tokens.discord);