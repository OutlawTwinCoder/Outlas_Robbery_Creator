Config = {}

-- Permission ACE (tu as demandé 'outlaw.robbery')
Config.CreatorAce = 'outlaw.robbery'

-- Stockage par défaut: KVP pour éviter tout problème SQL de suite
-- Options supportées dans ce build: 'kvp' (recommandé) | 'json'
Config.Storage = 'kvp'
Config.JsonPath = 'data/robbery_spots.json'
Config.KvpKey   = 'orc_spots'

-- Aperçu/interaction en jeu: ox_target crée un point (sphere) cliquable
Config.UseOxTarget = true
Config.Target = {
  Radius = 2.0,
  Icon   = 'fa-solid fa-sack-dollar',
  Label  = 'Inspecter le spot'
}

-- Valeurs par défaut pour le formulaire
Config.Defaults = {
  type = 'register',
  radius = 2.0,
  cooldown = 1800,
  reward_min = 2500,
  reward_max = 5500,
  min_police = 2
}

-- Types
Config.Types = {
  { id = 'register', label = 'Cash Register' },
  { id = 'safe',     label = 'Small Safe' },
  { id = 'vault',    label = 'Bank Vault' }
}


-- Robbery gameplay
Config.Robbery = {
  RequireLockpick = true,           -- require a lockpick item
  LockpickItem    = 'lockpick',     -- item name (ox_inventory/ESX item)
  RemoveOnUse     = false,          -- remove lockpick on success
  Duration        = 8000,           -- milliseconds to loot after unlock
  Skillcheck      = { 'easy', 'medium', 'easy' }, -- ox_lib skillcheck steps
  FreezePlayer    = true,           -- disable movement/controls during loot
  RewardAccount   = 'money',        -- ESX account: 'money' or 'black_money'
  PoliceJobs      = { police=true, sheriff=true, lspd=true }, -- counted for min_police
  PreventPoliceRob = true           -- disallow if player's job is a police job
}
