fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'outlaw_robbery_creator'
author 'Outlaw Scripts'
description 'Outlaw Robbery Creator (KVP + ox_target preview points)'
version '1.2.0'

ui_page 'html/index.html'

files {
  'html/index.html',
  'html/style.css',
  'html/app.js',
  'html/icon.svg'
}

shared_scripts {
  '@ox_lib/init.lua',
  'config.lua'
}

client_scripts {
  'client/main.lua'
}

server_scripts {
  'server/main.lua'
}
