/* DAG UI v3 — lapisan interaksi di atas app (tanpa mengubah logika data)
   Tema dark/light, hero dashboard + deadline 7 hari, angka beranimasi,
   tooltip Gantt, drag kartu Kanban, ring owner. */
(function(){
  const $id = id => document.getElementById(id);
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MON=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'], DOW=['MIN','SEN','SEL','RAB','KAM','JUM','SAB'];

  /* ---- Tema ---- */
  const root = document.documentElement;
  const KEY = 'dag-theme';
  function applyTheme(t){ root.dataset.theme = t; document.querySelectorAll('.dag-theme-btn .lbl').forEach(l => l.textContent = t==='dark' ? 'Mode gelap' : 'Mode terang'); document.querySelector('meta[name=theme-color]')?.setAttribute('content', t==='dark' ? '#0A0A0B' : '#F2F2F1'); }
  function makeThemeBtn(){ const b=document.createElement('button'); b.className='dag-theme-btn'; b.type='button'; b.title='Ganti mode gelap/terang'; b.innerHTML='<span class="lbl">Mode gelap</span><i></i>'; b.onclick=()=>{ const t = root.dataset.theme==='dark' ? 'light' : 'dark'; try{ localStorage.setItem(KEY,t);}catch(e){} applyTheme(t); }; return b; }
  let saved='dark'; try{ saved = localStorage.getItem(KEY) || 'dark'; }catch(e){}
  const foot = document.querySelector('.sidebar-foot'); if(foot) foot.insertBefore(makeThemeBtn(), foot.firstChild);
  const mtb = document.querySelector('.mobile-topbar'); if(mtb) mtb.appendChild(makeThemeBtn());
  applyTheme(saved);

  /* ---- Angka beranimasi (stat card) ---- */
  const ease = t => 1 - Math.pow(1-t, 3);
  function countUp(el){
    const m = el.textContent.match(/^\s*(\d+)/); if(!m) return; const target = +m[1]; if(!target) return;
    const rest = el.innerHTML.replace(/^\s*\d+/, ''); const t0 = performance.now(), dur = 900;
    (function step(now){ const p = Math.min(1,(now-t0)/dur); el.innerHTML = Math.round(target*ease(p)) + rest; if(p<1) requestAnimationFrame(step); })(t0);
  }
  ['db-stats','pf-stats','dl-stats'].forEach(id => { const box=$id(id); if(!box) return; new MutationObserver(()=>box.querySelectorAll('.stat-card .value').forEach(countUp)).observe(box,{childList:true}); });

  /* ---- Dashboard hero + deadline 7 hari ---- */
  function fmtD(iso){ const d=new Date(iso+'T00:00:00'); return `${d.getDate()} ${MON[d.getMonth()]}`; }
  function renderHero(){
    if(typeof projects==='undefined' || typeof tasks==='undefined') return;
    const stats = $id('db-stats'); if(!stats) return;
    let hero = $id('db-hero'); if(!hero){ hero=document.createElement('div'); hero.id='db-hero'; hero.className='db-hero'; stats.parentNode.insertBefore(hero, stats); }
    const now = (typeof todayISO==='function') ? todayISO() : new Date().toISOString().slice(0,10);
    const wk = new Date(now+'T00:00:00'); wk.setDate(wk.getDate()+7); const wkISO = wk.toISOString().slice(0,10);
    const active = projects.filter(p=>p.status==='Berjalan'||p.status==='Perencanaan');
    const prog = active.length ? Math.round(active.reduce((a,p)=>a+(typeof projectProgress==='function'?projectProgress(p):(p.progress||0)),0)/active.length) : 0;
    const running = tasks.filter(t=>{ const p=projects.find(x=>x.id===t.projectId); return p && !['Selesai','Batal'].includes(p.status) && !['Selesai','Belum Mulai'].includes(t.status); });
    const late = tasks.filter(t=>t.status!=='Selesai' && t.end && t.end<now && (()=>{const p=projects.find(x=>x.id===t.projectId); return p && !['Selesai','Batal'].includes(p.status);})());
    const dayDiff = iso => Math.round((new Date(iso+'T00:00:00') - new Date(now+'T00:00:00'))/86400000);
    const items = [
      ...tasks.filter(t=>t.status!=='Selesai' && t.end && t.end>=now && t.end<=wkISO).map(t=>{ const p=projects.find(x=>x.id===t.projectId)||{}; return { d:t.end, title:t.name, code:p.code||'', meta:`${p.name||'—'} · ${t.pic||'—'}`, tag:'DEADLINE', hot:true, go:()=>{ if(typeof gotoGantt==='function' && p.id) gotoGantt(p.id); } }; }),
      ...(typeof schedule!=='undefined' ? schedule : []).filter(s=>s.date>=now && s.date<=wkISO && s.status!=='Batal' && s.status!=='Selesai').map(s=>({ d:s.date, title:s.title, code:s.time||'', meta:`${s.type||'Agenda'} · ${s.pic||'—'}`, tag:(s.type||'AGENDA').toUpperCase().split(' ')[0], hot:false, go:()=>{ if(typeof switchTab==='function') switchTab('schedule'); } }))
    ].sort((a,b)=>a.d.localeCompare(b.d));
    const C = 2*Math.PI*56;
    hero.innerHTML = `
      <div class="db-overall">
        <div class="db-donut"><svg viewBox="0 0 132 132" width="132" height="132"><circle cx="66" cy="66" r="56" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-width="10"></circle><circle class="arc" cx="66" cy="66" r="56" fill="none" stroke="var(--acc)" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 ${C}"></circle></svg>
          <div class="db-donut-label"><b><span class="n">0</span><small>%</small></b><span>Studio</span></div></div>
        <div class="db-o-body">
          <div class="db-o-title">Progres rata-rata proyek aktif</div>
          <div class="db-o-sub">${active.length} proyek desain berjalan · ${running.length} tahapan aktif · ${late.length} terlambat</div>
          <div class="db-o-stats"><div class="db-o-stat"><b>${active.length}</b><span>Proyek</span></div><div class="db-o-stat"><b>${running.length}</b><span>Tahapan</span></div><div class="db-o-stat"><b>${late.length}</b><span>Terlambat</span></div></div>
        </div>
      </div>
      <div class="db-week">
        <div class="db-week-head"><h3>Deadline 7 Hari ke Depan</h3><span>${fmtD(now).toUpperCase()} – ${fmtD(wkISO).toUpperCase()}</span></div>
        <p>Tahapan &amp; agenda yang jatuh tempo minggu ini, urut tanggal.</p>
        ${items.length ? items.slice(0,6).map((u,i)=>{ const d=new Date(u.d+'T00:00:00'); const hot=dayDiff(u.d)<=2; return `<div class="db-week-row" data-i="${i}"><div class="db-w-day"><b class="${hot?'hot':''}">${String(d.getDate()).padStart(2,'0')}</b><span>${DOW[d.getDay()]}</span></div><div style="min-width:0"><div class="db-w-title">${esc(u.title)}</div><div class="db-w-meta"><em>${esc(u.code)}</em> · ${esc(u.meta)}</div></div><span class="db-w-tag ${u.hot?'hot':''}">${esc(u.tag)}</span></div>`; }).join('') : `<div class="db-week-empty">Tidak ada deadline dalam 7 hari ke depan.</div>`}
      </div>`;
    hero.querySelectorAll('.db-week-row').forEach(r => r.onclick = () => items[+r.dataset.i].go());
    const arc = hero.querySelector('.arc'), n = hero.querySelector('.n'); const t0=performance.now();
    requestAnimationFrame(function step(now){ const p=ease(Math.min(1,(now-t0)/1000)); n.textContent=Math.round(prog*p); arc.setAttribute('stroke-dasharray', `${(prog*p/100*C).toFixed(1)} ${C}`); if(p<1) requestAnimationFrame(step); });
  }
  if(typeof renderDashboard==='function'){ const _rd = renderDashboard; renderDashboard = function(){ _rd.apply(this, arguments); renderHero(); }; }

  /* ---- Tooltip Gantt ---- */
  let tip;
  document.addEventListener('mouseover', e => {
    const bar = e.target.closest('.gantt-bar'); if(!bar) return;
    const row = bar.closest('.gantt-row'); const label = row?.querySelector('.gantt-task-label');
    const name = label?.querySelector('.name')?.textContent || ''; const title = bar.getAttribute('title')||''; const dates = title.split(': ')[1] || '';
    const prog = (bar.querySelector('span')?.textContent.match(/(\d+)%\s*$/)||[])[1] || '0';
    const status = label?.querySelector('.badge')?.textContent || '';
    const pills = [...(label?.querySelectorAll('.checklist-count-pill, .dep-note, .delay-badge')||[])].map(p=>p.textContent).join(' · ');
    bar.dataset.title = title; bar.removeAttribute('title');
    tip = tip || document.body.appendChild(Object.assign(document.createElement('div'),{className:'dag-tip'}));
    tip.innerHTML = `<b>${esc(name)}</b><div class="d">${esc(dates)}</div><div class="g"><div><small>PROGRES</small><strong>${esc(prog)}%</strong></div><div><small>STATUS</small><em>${esc(status)}</em></div></div>${pills?`<div class="d" style="margin-top:8px;opacity:.85">${esc(pills)}</div>`:''}`;
    tip.style.display='block'; move(e);
  });
  function move(e){ if(!tip||tip.style.display==='none') return; const w=250,h=tip.offsetHeight||120; let x=e.clientX+14, y=e.clientY+16; if(x+w>innerWidth) x=e.clientX-w-10; if(y+h>innerHeight) y=e.clientY-h-10; tip.style.left=x+'px'; tip.style.top=y+'px'; }
  document.addEventListener('mousemove', e => { if(e.target.closest('.gantt-bar')) move(e); });
  document.addEventListener('mouseout', e => { const bar=e.target.closest('.gantt-bar'); if(bar && !bar.contains(e.relatedTarget)){ if(bar.dataset.title) bar.setAttribute('title', bar.dataset.title); if(tip) tip.style.display='none'; } });

  /* ---- Kanban: seret kartu antar kolom → ubah status tahapan ---- */
  const COLS = ['blocked','ready','berjalan','review','revisi','selesai'];
  const DROP = { ready:'Belum Mulai', berjalan:'Berjalan', review:'Perlu Review Leader', selesai:'Selesai' };
  if(typeof kanbanCard==='function'){ const _kc = kanbanCard; kanbanCard = function(t){ return _kc(t).replace('class="kanban-card', `draggable="true" data-task-id="${t.id}" class="kanban-card`); }; }
  if(typeof renderKanban==='function'){ const _rk = renderKanban; renderKanban = function(){ _rk.apply(this, arguments); document.querySelectorAll('#kb-board .kanban-col').forEach((c,i)=>{ c.dataset.col = COLS[i]; if(DROP[COLS[i]] && !c.querySelector('.dag-drop-hint')) c.insertAdjacentHTML('beforeend','<div class="dag-drop-hint">Lepas kartu di sini → '+DROP[COLS[i]]+'</div>'); }); }; }
  let dragId=null;
  document.addEventListener('dragstart', e => { const c=e.target.closest?.('.kanban-card'); if(!c) return; dragId=c.dataset.taskId; e.dataTransfer.effectAllowed='move'; setTimeout(()=>c.classList.add('dag-dragging'),0); });
  document.addEventListener('dragend', e => { dragId=null; document.querySelectorAll('.dag-dragging,.dag-over').forEach(x=>x.classList.remove('dag-dragging','dag-over')); });
  document.addEventListener('dragover', e => { const col=e.target.closest?.('.kanban-col'); if(!col||!dragId||!DROP[col.dataset.col]) return; e.preventDefault(); document.querySelectorAll('.dag-over').forEach(x=>x.classList.remove('dag-over')); col.classList.add('dag-over'); });
  document.addEventListener('drop', async e => {
    const col=e.target.closest?.('.kanban-col'); if(!col||!dragId) return; e.preventDefault();
    const st = DROP[col.dataset.col]; const t = (typeof tasks!=='undefined') && tasks.find(x=>x.id===dragId); dragId=null;
    if(!st||!t||t.status===st) return;
    if(t.checklist && t.checklist.length && st!=='Selesai' && typeof deriveTaskStatus==='function'){ const derived = deriveTaskStatus(Object.assign({},t,{status:st})); if(derived!==st){ if(typeof showToast==='function') showToast('Status tahap ini mengikuti checklist gambar — ubah lewat checklist di Gantt.'); return; } }
    const proj = (typeof projects!=='undefined') && projects.find(p=>p.id===t.projectId);
    const warn = st==='Selesai' ? '<div class="dag-cf-warn">Menandai Selesai akan otomatis membuat permintaan <b>Approval Owner</b> ke klien dan menutup agenda Jadwal terkait.</div>' : (st==='Belum Mulai' ? '<div class="dag-cf-warn">Tahap ini akan hilang dari Rencana Harian saat dimuat ulang dari Gantt.</div>' : '');
    const ok = await confirmBox(`<b>${esc(t.name)}</b><div class="d">${esc(proj?proj.name:'')} · ${esc(t.pic||'—')}</div><div class="dag-cf-move"><span>${esc(t.status)}</span><i>→</i><span class="to">${esc(st)}</span></div>${warn}`, st==='Selesai' ? 'Ya, tandai Selesai' : 'Ubah status');
    if(!ok) return;
    await applyStatus(t, st);
    undoToast(`"${t.name}" → ${st}`, async () => { await applyStatus(t, prevOf(t)); });
  });
  const prevMap = new Map();
  function prevOf(t){ return prevMap.get(t.id) || 'Belum Mulai'; }
  async function applyStatus(t, st){
    prevMap.set(t.id, t.status); t.status = st;
    if(typeof saveTasks==='function') await saveTasks();
    if(typeof syncScheduleWithGantt==='function' && syncScheduleWithGantt() && typeof saveSchedule==='function') await saveSchedule();
    renderKanban();
  }
  /* dialog konfirmasi */
  function confirmBox(html, okLabel){
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className='overlay open dag-cf';
      ov.innerHTML = `<div class="modal dag-cf-modal"><div class="modal-head"><h3>Ubah status tahapan?</h3><button class="close">✕</button></div><div class="dag-cf-body">${html}</div><div class="modal-foot"><button class="btn btn-ghost" data-r="0">Batal</button><button class="btn ${okLabel.includes('Selesai')?'btn-gold':'btn-primary'}" data-r="1">${okLabel}</button></div></div>`;
      const done = v => { ov.remove(); document.removeEventListener('keydown', esc_); res(v); };
      const esc_ = e => { if(e.key==='Escape') done(false); };
      ov.addEventListener('click', e => { if(e.target===ov || e.target.closest('.close')) done(false); const b=e.target.closest('[data-r]'); if(b) done(b.dataset.r==='1'); });
      document.addEventListener('keydown', esc_); document.body.appendChild(ov); ov.querySelector('[data-r="1"]').focus();
    });
  }
  /* toast dengan tombol Urungkan (8 detik) */
  let undoTimer;
  function undoToast(msg, onUndo){
    const t = $id('toast'); if(!t){ return; }
    clearTimeout(undoTimer); t.innerHTML = `<span>${esc(msg)}</span><button class="dag-undo">Urungkan</button>`; t.classList.add('show','dag-toast-undo');
    t.querySelector('.dag-undo').onclick = async () => { clearTimeout(undoTimer); t.classList.remove('show','dag-toast-undo'); await onUndo(); if(typeof showToast==='function') showToast('Perubahan diurungkan.'); };
    undoTimer = setTimeout(()=>{ t.classList.remove('show','dag-toast-undo'); }, 8000);
  }

  /* ---- Owner ring mengikuti tema ---- */
  if(typeof renderOwnerView==='function'){ const _ro = renderOwnerView; renderOwnerView = function(){ _ro.apply(this, arguments); const r=document.querySelector('#ov-body .ov-ring'); if(!r) return; const n=parseInt(r.querySelector('.num')?.textContent)||0; r.style.background=`conic-gradient(var(--acc) ${n*3.6}deg, var(--s3) 0deg)`; }; }

  /* ---- Transisi antar tab ---- */
  if(typeof switchTab==='function'){ const _st = switchTab; switchTab = function(tab){ _st.apply(this, arguments); const v=$id('view-'+tab); if(v){ v.style.animation='none'; void v.offsetWidth; v.style.animation=''; } }; }
})();
