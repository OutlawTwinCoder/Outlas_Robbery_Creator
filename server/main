local Spots = {}        -- [id] = row
local nextId = 1

local function storage_mode()
  return Config.Storage or 'kvp'
end

local function round3(n) n = tonumber(n) or 0.0; return math.floor(n*1000+0.5)/1000 end

-- ===== Persistence: JSON / KVP ============================================
local function save_json()
  local path = Config.JsonPath or 'data/robbery_spots.json'
  local arr = {}
  for _, r in pairs(Spots) do arr[#arr+1] = r end
  table.sort(arr, function(a,b) return (a.id or 0) < (b.id or 0) end)
  SaveResourceFile(GetCurrentResourceName(), path, json.encode(arr, {indent=true}), -1)
end

local function load_json()
  local path = Config.JsonPath or 'data/robbery_spots.json'
  local content = LoadResourceFile(GetCurrentResourceName(), path)
  if not content or content == '' then SaveResourceFile(GetCurrentResourceName(), path, '[]', -1); content = '[]' end
  local arr = json.decode(content) or {}
  for _, r in ipairs(arr) do Spots[r.id] = r; if r.id and r.id >= nextId then nextId = r.id + 1 end end
end

local function save_kvp()
  local arr = {}
  for _, r in pairs(Spots) do arr[#arr+1] = r end
  table.sort(arr, function(a,b) return (a.id or 0) < (b.id or 0) end)
  SetResourceKvp(Config.KvpKey or 'orc_spots', json.encode(arr))
end

local function load_kvp()
  local raw = GetResourceKvpString(Config.KvpKey or 'orc_spots')
  local arr = json.decode(raw or '[]') or {}
  for _, r in ipairs(arr) do Spots[r.id] = r; if r.id and r.id >= nextId then nextId = r.id + 1 end end
end

local function persist()
  local mode = storage_mode()
  if mode == 'json' then save_json() else save_kvp() end
end

-- ===== Init ================================================================
CreateThread(function()
  local mode = storage_mode()
  if mode == 'json' then load_json() else load_kvp() end
  print(('[%s] storage=%s, loaded %d spots'):format(GetCurrentResourceName(), mode, (function() local c=0 for _ in pairs(Spots) do c=c+1 end return c end)()))
end)

-- ===== Permission ==========================================================
local function ensure_perm(src)
  if not IsPlayerAceAllowed(src, Config.CreatorAce or 'outlaw.robbery') then
    TriggerClientEvent('orc:echo', src, { kind='error', data=('No permission (%s)'):format(Config.CreatorAce) })
    return false
  end
  return true
end

-- ===== API (callbacks) =====================================================
lib.callback.register('orc:list', function(src)
  if not ensure_perm(src) then return { error='no_perm' } end
  local list = {}
  for _, r in pairs(Spots) do list[#list+1] = r end
  table.sort(list, function(a,b) return a.id < b.id end)
  return { list = list, types = Config.Types or {}, defaults = Config.Defaults or {} }
end)

-- ===== Sanitize ============================================================
local function sanitize_row(row)
  local t = {
    label = tostring(row.label or 'Spot'),
    type  = tostring(row.type or 'register'),
    x = round3(row.x), y = round3(row.y), z = round3(row.z), h = round3(row.h),
    radius = tonumber(row.radius) or (Config.Defaults and Config.Defaults.radius or 2.0),
    reward_min = math.floor(tonumber(row.reward_min) or (Config.Defaults and Config.Defaults.reward_min or 0)),
    reward_max = math.floor(tonumber(row.reward_max) or (Config.Defaults and Config.Defaults.reward_max or 0)),
    cooldown   = math.floor(tonumber(row.cooldown)   or (Config.Defaults and Config.Defaults.cooldown   or 0)),
    min_police = math.floor(tonumber(row.min_police) or (Config.Defaults and Config.Defaults.min_police or 0)),
  }
  if t.reward_max < t.reward_min then t.reward_max = t.reward_min end
  if t.radius < 0.5 then t.radius = 0.5 end
  if t.cooldown < 0 then t.cooldown = 0 end
  if t.min_police < 0 then t.min_police = 0 end
  return t
end

-- ===== CRUD ================================================================

-- ===== Robbery state =======================================================
local lastRob = {}   -- [spotId] = os.time() when last robbed

-- ESX bridge
local ESX
CreateThread(function()
  if not ESX then
    pcall(function() ESX = exports['es_extended']:getSharedObject() end)
    if not ESX then
      TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
    end
  end
end)

local function isPoliceJob(name)
  if not name then return false end
  local map = Config.Robbery and Config.Robbery.PoliceJobs or { police=true }
  return map[name] == true
end

local function countPolice()
  if not ESX or not ESX.GetExtendedPlayers then return 0 end
  local c = 0
  local players = ESX.GetExtendedPlayers()
  for _, xP in pairs(players) do
    local job = xP.job and xP.job.name
    if isPoliceJob(job) then c = c + 1 end
  end
  return c
end

local function playerJobName(src)
  if not ESX or not ESX.GetPlayerFromId then return nil end
  local xP = ESX.GetPlayerFromId(src)
  return xP and xP.job and xP.job.name or nil
end

-- Validate before starting a robbery
lib.callback.register('orc:rob:begin', function(src, spotId)
  if not ensure_perm(src) then return { ok=false, reason='no_perm' } end
  spotId = tonumber(spotId or 0); if not spotId then return {ok=false, reason='bad_id'} end
  local s = Spots[spotId]; if not s then return {ok=false, reason='not_found'} end

  -- prevent police jobs from robbing (optional)
  if (Config.Robbery and Config.Robbery.PreventPoliceRob) then
    local job = playerJobName(src)
    if isPoliceJob(job) then
      return { ok=false, reason='police_block' }
    end
  end

  -- min police online
  local need = tonumber(s.min_police or 0) or 0
  if need > 0 then
    local have = countPolice()
    if have < need then
      return { ok=false, reason='cops', have=have, need=need }
    end
  end

  -- cooldown
  local last = lastRob[spotId] or 0
  local now = os.time()
  local cd = tonumber(s.cooldown or 0) or 0
  local remain = (last + cd) - now
  if remain and remain > 0 then
    return { ok=false, reason='cooldown', remain=remain }
  end

  -- lockpick check (server-side optional)
  if Config.Robbery and Config.Robbery.RequireLockpick and ESX then
    local xP = ESX.GetPlayerFromId(src)
    if xP and xP.getInventoryItem then
      local item = xP.getInventoryItem(Config.Robbery.LockpickItem or 'lockpick')
      if not item or (item.count or item.amount or 0) <= 0 then
        return { ok=false, reason='nolockpick' }
      end
    end
  end

  return { ok=true, spot = s, duration = (Config.Robbery and Config.Robbery.Duration) or 8000 }
end)

-- Finish robbery, pay out and set cooldown
RegisterNetEvent('orc:rob:finish', function(spotId)
  local src = source
  spotId = tonumber(spotId or 0); if not spotId then return end
  local s = Spots[spotId]; if not s then return end

  -- Cooldown validation again
  local last = lastRob[spotId] or 0
  local now = os.time()
  local cd = tonumber(s.cooldown or 0) or 0
  if last + cd > now then return end

  -- Remove lockpick if required
  if Config.Robbery and Config.Robbery.RequireLockpick and Config.Robbery.RemoveOnUse and ESX then
    local xP = ESX.GetPlayerFromId(src)
    if xP and xP.removeInventoryItem then
      xP.removeInventoryItem(Config.Robbery.LockpickItem or 'lockpick', 1)
    end
  end

  -- Reward
  local reward = math.random(tonumber(s.reward_min or 0), tonumber(s.reward_max or 0))
  if ESX and ESX.GetPlayerFromId then
    local xP = ESX.GetPlayerFromId(src)
    if xP and xP.addAccountMoney then
      xP.addAccountMoney((Config.Robbery and Config.Robbery.RewardAccount) or 'money', reward)
    elseif xP and xP.addMoney then
      xP.addMoney(reward)
    end
  end

  lastRob[spotId] = os.time()
  TriggerClientEvent('orc:echo', src, { kind='info', data=('Gagné $%d'):format(reward) })
end)
RegisterNetEvent('orc:create', function(data)
  local src = source
  if not ensure_perm(src) then return end
  local row = sanitize_row(data or {})

  -- Merge si coords déjà existantes (évite doublons)
  for id, r in pairs(Spots) do
    if r.x == row.x and r.y == row.y and r.z == row.z then
      row.id = id
      Spots[id] = row
      persist()
      TriggerClientEvent('orc:echo', src, { kind='updated', data=row })
      return
    end
  end

  row.id = nextId; nextId = nextId + 1
  Spots[row.id] = row
  persist()
  TriggerClientEvent('orc:echo', src, { kind='created', data=row })
end)

RegisterNetEvent('orc:update', function(data)
  local src = source
  if not ensure_perm(src) then return end
  local id = tonumber(data and data.id); if not id then return end
  if not Spots[id] then return end
  local row = sanitize_row(data or {})

  -- Collision: si tu déplaces sur un autre spot, on met à jour l'autre
  for oid, r in pairs(Spots) do
    if oid ~= id and r.x == row.x and r.y == row.y and r.z == row.z then
      row.id = oid
      Spots[oid] = row
      Spots[id] = nil
      persist()
      TriggerClientEvent('orc:echo', src, { kind='updated', data=row })
      return
    end
  end

  row.id = id
  Spots[id] = row
  persist()
  TriggerClientEvent('orc:echo', src, { kind='updated', data=row })
end)

RegisterNetEvent('orc:delete', function(id)
  local src = source
  if not ensure_perm(src) then return end
  id = tonumber(id); if not id then return end
  Spots[id] = nil
  persist()
  TriggerClientEvent('orc:echo', src, { kind='deleted', data=id })
end)
