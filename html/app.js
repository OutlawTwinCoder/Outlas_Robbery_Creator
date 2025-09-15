(() => {
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');

  const state = { list: [], types: [], defaults: {}, currentId: null };

  const els = {
    list:   document.getElementById('list'),
    status: document.getElementById('status'),
    label:  document.getElementById('f-label'),
    type:   document.getElementById('f-type'),
    radius: document.getElementById('f-radius'),
    cd:     document.getElementById('f-cd'),
    rmin:   document.getElementById('f-rmin'),
    rmax:   document.getElementById('f-rmax'),
    cops:   document.getElementById('f-cops'),
    x:      document.getElementById('f-x'),
    y:      document.getElementById('f-y'),
    z:      document.getElementById('f-z'),
    h:      document.getElementById('f-h'),
  };

  const show = (msg) => {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(()=> toast.style.display='none', 1600);
  };

  const numberOrEmpty = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : '';
  };

  const setForm = (r) => {
    state.currentId = r?.id ?? null;
    els.label.value = r?.label || '';
    els.type.value  = r?.type || (state.defaults?.type || 'register');
    els.radius.value= r?.radius ?? (state.defaults?.radius ?? 2.0);
    els.cd.value    = r?.cooldown ?? (state.defaults?.cooldown ?? 1800);
    els.rmin.value  = r?.reward_min ?? (state.defaults?.reward_min ?? 2500);
    els.rmax.value  = r?.reward_max ?? (state.defaults?.reward_max ?? 5500);
    els.cops.value  = r?.min_police ?? (state.defaults?.min_police ?? 0);

    els.x.value = numberOrEmpty(r?.x);
    els.y.value = numberOrEmpty(r?.y);
    els.z.value = numberOrEmpty(r?.z);
    els.h.value = numberOrEmpty(r?.h);
    renderList();
  };

  const renderList = () => {
    els.list.innerHTML = '';
    state.list.forEach((r) => {
      const li = document.createElement('li');
      li.className = 'item' + (state.currentId === r.id ? ' active' : '');
      li.innerHTML = `<div>
        <div><b>#${r.id}</b> ${r.label}</div>
        <div class="meta">${r.type} • (${(r.x??0).toFixed ? r.x.toFixed(2) : r.x}, ${(r.y??0).toFixed ? r.y.toFixed(2) : r.y}, ${(r.z??0).toFixed ? r.z.toFixed(2) : r.z})</div>
      </div>`;
      li.onclick = () => setForm(r);
      els.list.appendChild(li);
    });
    els.status.textContent = state.list.length ? `${state.list.length} spot(s)` : 'No spots yet';
  };

  const open = (payload) => {
    state.list = payload.list || [];
    state.types = payload.types || [];
    state.defaults = payload.defaults || {};

    // fill type options
    els.type.innerHTML = '';
    state.types.forEach(t => {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.label;
      els.type.appendChild(o);
    });

    setForm(null);
    app.style.display = 'flex';
  };

  const post = (name, data) => fetch(`https://${GetParentResourceName()}/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data || {})
  });

  // Buttons
  document.getElementById('btn-close').onclick = () => post('close');
  document.getElementById('btn-coords').onclick = async () => {
    const r = await (await post('coords')).json();
    els.x.value = r.x?.toFixed ? r.x.toFixed(2) : r.x;
    els.y.value = r.y?.toFixed ? r.y.toFixed(2) : r.y;
    els.z.value = r.z?.toFixed ? r.z.toFixed(2) : r.z;
    els.h.value = r.h?.toFixed ? r.h.toFixed(2) : r.h;
  };

  const readForm = () => ({
    id: state.currentId,
    label: els.label.value.trim(),
    type: els.type.value,
    radius: Number(els.radius.value) || 2.0,
    cooldown: Number(els.cd.value) || 0,
    reward_min: Number(els.rmin.value) || 0,
    reward_max: Number(els.rmax.value) || 0,
    min_police: Number(els.cops.value) || 0,
    x: Number(els.x.value) || 0, y: Number(els.y.value) || 0, z: Number(els.z.value) || 0,
    h: Number(els.h.value) || 0,
  });

  document.getElementById('btn-save').onclick = () => {
    const data = readForm();
    if (!data.label) { show('Label required'); return; }
    if (state.currentId) post('update', data); else post('create', data);
  };

  document.getElementById('btn-delete').onclick = () => {
    if (!state.currentId) { show('Nothing selected'); return; }
    post('delete', { id: state.currentId });
  };

  // NUI message handling
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || !msg.action) return;
    if (msg.action === 'open') {
      open(msg.payload || {});
    } else if (msg.action === 'close') {
      app.style.display = 'none';
    } else if (msg.action === 'echo') {
      const k = msg.payload?.kind;
      if (k === 'error') { show(msg.payload.data || 'Error'); return; }
      if (k === 'created') {
        state.list.push(msg.payload.data);
        setForm(msg.payload.data);
        show('Saved');
      } else if (k === 'updated') {
        const r = msg.payload.data;
        const i = state.list.findIndex(s => s.id === r.id);
        if (i >= 0) state.list[i] = r;
        setForm(r);
        show('Updated');
      } else if (k === 'deleted') {
        const id = msg.payload.data;
        state.list = state.list.filter(s => s.id !== id);
        setForm(null);
        show('Deleted');
      }
    }
  });
})();
