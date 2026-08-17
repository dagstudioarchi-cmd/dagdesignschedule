/* =====================================================================
   DAG STUDIO — dag-nav.js  ·  Tombol BACK Android/HP & tombol Beranda
   - Setiap pindah tab = 1 langkah riwayat → tombol Back HP kembali ke tab
     sebelumnya, BUKAN keluar aplikasi.
   - Modal/overlay yang terbuka = 1 langkah riwayat → Back menutup modal dulu.
   - Di langkah paling awal, Back keluar seperti biasa (ke hub / halaman sebelumnya).
   - Menyisipkan tombol "Beranda" (hub) ke bottom-nav & sidebar bila ada.
   Cara pakai: <script src="assets/dag-nav.js" data-hub="https://dagconst-promanagement.netlify.app/" data-switch="switchTab" data-overlay=".overlay,.drawer-overlay,.ov" data-open="open"></script>
   ===================================================================== */
(function(){
  var me=document.currentScript||{};
  var HUB=(me.dataset&&me.dataset.hub)||'https://dagconst-promanagement.netlify.app/';
  var SW=(me.dataset&&me.dataset.switch)||'switchTab';
  var OVSEL=(me.dataset&&me.dataset.overlay)||'.overlay';
  var OPENCLS=((me.dataset&&me.dataset.open)||'open').split(',');
  var ignorePop=false, curTab=null;

  function isOpen(el){return OPENCLS.some(function(c){return el.classList.contains(c);});}
  function openOverlays(){return Array.prototype.filter.call(document.querySelectorAll(OVSEL),function(el){return isOpen(el)&&el.offsetParent!==null||isOpen(el)&&getComputedStyle(el).display!=='none';});}
  function closeEl(el){OPENCLS.forEach(function(c){el.classList.remove(c);});}

  function install(){
    var orig=window[SW]; if(typeof orig!=='function'){setTimeout(install,300);return;}
    if(orig.__dagWrapped)return;
    var wrapped=function(tab,fromPop){
      var r=orig.apply(this,arguments);
      if(tab&&tab!==curTab&&!fromPop&&!ignorePop){ try{history.pushState({dagTab:tab},'','#'+tab);}catch(e){} }
      if(tab)curTab=tab; return r;
    };
    wrapped.__dagWrapped=true; window[SW]=wrapped;
    // status awal = tab yang sedang aktif (atau dari #hash bila ada)
    var h=(location.hash||'').replace('#','');
    var act=document.querySelector('#nav button.active[data-tab], .abn-item.active[data-tab], .bnav button.on[data-p]');
    var startTab=h||(act&&(act.dataset.tab||act.dataset.p))||null;
    if(h){ try{ ignorePop=true; orig(h); }catch(e){} ignorePop=false; }
    curTab=startTab;
    try{ history.replaceState({dagTab:startTab},'',location.href); }catch(e){}
    // modal → riwayat
    var mo=new MutationObserver(function(muts){muts.forEach(function(m){var el=m.target;if(!el.matches||!el.matches(OVSEL))return;var was=(m.oldValue||'').split(/\s+/);var wasOpen=OPENCLS.some(function(c){return was.indexOf(c)>=0;});var nowOpen=isOpen(el);
      if(!wasOpen&&nowOpen){ try{history.pushState({dagModal:el.id||true,dagTab:curTab},'',location.href);}catch(e){} }
      else if(wasOpen&&!nowOpen&&history.state&&history.state.dagModal&&!ignorePop){ ignorePop=true; history.back(); setTimeout(function(){ignorePop=false;},60); }
    });});
    mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
    window.addEventListener('popstate',function(e){
      if(ignorePop)return;
      var ov=openOverlays();
      if(ov.length){ ignorePop=true; ov.forEach(closeEl); document.body.style.overflow=''; setTimeout(function(){ignorePop=false;},60); return; }
      var st=e.state;
      if(st&&st.dagTab){ ignorePop=true; try{orig(st.dagTab);}catch(x){} curTab=st.dagTab; ignorePop=false; if(typeof window.closeMobileMenu==='function')window.closeMobileMenu(); }
    });
    addHomeButtons();
  }
  function homeSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>';}
  function addHomeButtons(){
    if(document.getElementById('dag-home-btn'))return;
    // bottom nav (Build/Owner)
    var track=document.querySelector('.android-bottom-nav .nav-track, .bottom-nav .nav-track');
    if(track){ var b=document.createElement('button'); b.className='abn-item'; b.id='dag-home-btn'; b.type='button'; b.innerHTML=homeSvg()+'<span>Beranda</span>'; b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();location.href=HUB;}); track.insertBefore(b,track.firstChild); }
    // sidebar (Build/Perencanaan)
    var nav=document.getElementById('nav');
    if(nav){ var a=document.createElement('a'); a.href=HUB; a.id='dag-home-link'; a.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 14px;margin:0 0 6px;border-radius:14px;font-size:13px;font-weight:600;color:var(--k-orange,#FF6A00);text-decoration:none;border:1px dashed var(--k-mist,#D9D9D9);'; a.innerHTML='<span style="width:18px;height:18px;display:inline-flex">'+homeSvg()+'</span> Beranda DAG Studio'; nav.parentNode.insertBefore(a,nav); }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
