(function() {
  'use strict';

  // -------- globals --------
  var TITLE = 'gampert.dev';
  var t0 = Date.now(), reboots = 0, sndOn = false, zTop = 20;

  // -------- refs --------
  var $ = function(s) { return document.getElementById(s); };
  var wins   = document.querySelectorAll('.desktop .win[id]');
  var tbWins = $('tbWins');
  var mobile = function() { return innerWidth <= 960; };

  // =========================================================
  //  AUDIO — 8-bit beeps via Web Audio API. no files needed.
  // =========================================================
  var actx;
  function au() { if (!actx) actx = new (AudioContext || webkitAudioContext)(); return actx; }
  function tone(f, d, t, v) {
    if (!sndOn) return;
    try { var c = au(), o = c.createOscillator(), g = c.createGain(); o.type = t||'square'; o.frequency.value = f; g.gain.value = v||.08; g.gain.exponentialRampToValueAtTime(.001, c.currentTime+d); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+d); } catch(e) {}
  }
  function sClick()    { tone(800,.05,'square',.06); }
  function sMin()      { tone(400,.1); tone(300,.1); }
  function sMax()      { tone(500,.08); setTimeout(function(){ tone(700,.08); },80); }
  function sStartup()  { tone(523,.15,'sine',.1); setTimeout(function(){ tone(659,.15,'sine',.1); },150); setTimeout(function(){ tone(784,.3,'sine',.1); },300); }
  function sShutdown() { tone(784,.2,'sine',.1); setTimeout(function(){ tone(659,.2,'sine',.1); },200); setTimeout(function(){ tone(523,.4,'sine',.1); },400); }
  function sErr()      { tone(200,.3,'square',.08); }

  $('sndToggle').onclick = function() {
    sndOn = !sndOn;
    $('sndIco').innerHTML = sndOn ? '&#128266;' : '&#128264;';
    $('sndTip').textContent = 'Sound: ' + (sndOn ? 'ON' : 'OFF');
    if (sndOn) { au(); sClick(); }
  };

  // =========================================================
  //  CLOCK — dubai time
  // =========================================================
  function tick() {
    var n = new Date();
    $('clock').textContent    = n.toLocaleString('en-US', { timeZone:'Asia/Dubai', hour:'numeric', minute:'2-digit', hour12:true });
    $('clockTip').textContent = n.toLocaleString('en-US', { timeZone:'Asia/Dubai', weekday:'long', year:'numeric', month:'long', day:'numeric' }) + '\nDubai Time (GMT+4)';
  }
  tick(); setInterval(tick, 1000);

  // =========================================================
  //  WINDOW MANAGEMENT
  // =========================================================

  // build taskbar buttons
  wins.forEach(function(w) {
    var b = document.createElement('div');
    b.className = 'tb-btn in'; b.textContent = w.dataset.title || w.id;
    b.dataset.w = w.id; tbWins.appendChild(b);
    b.onclick = function() { tbToggle(w.id); };
  });

  function tb(id) { return tbWins.querySelector('[data-w="'+id+'"]'); }

  function focus(id) {
    wins.forEach(function(w) { w.classList.remove('focus'); });
    var w = $(id);
    if (w) {
      w.classList.add('focus');
      // on desktop, bump z-index so the focused window is always on top.
      // each focus increments the counter — simple stacking order.
      if (!mobile()) w.style.zIndex = ++zTop;
    }
    wins.forEach(function(w) {
      var b = tb(w.id); if (!b || b.style.display==='none') return;
      var open = !w.classList.contains('hidden') && !w.classList.contains('mini');
      b.classList.toggle('in', open);
    });
  }

  function minimize(id) {
    var w = $(id), b = tb(id); if (!w) return; sMin();
    // if this window is currently fullscreen, exit fullscreen first
    if (document.fullscreenElement === w) document.exitFullscreen();
    if (mobile()) { w.classList.add('mini'); w.classList.remove('hidden'); }
    else          { w.classList.add('hidden'); w.classList.remove('mini'); }
    w.classList.remove('maxi','focus'); if (b) b.classList.remove('in');
  }

  function close(id) {
    var w = $(id), b = tb(id); if (!w) return; sMin();
    // if this window is currently fullscreen, exit fullscreen first
    if (document.fullscreenElement === w) document.exitFullscreen();
    w.classList.add('hidden'); w.classList.remove('mini','maxi','focus');
    if (b) b.style.display = 'none';
  }

  function restore(id) {
    var w = $(id), b = tb(id); if (!w) return; sClick();
    w.classList.remove('hidden','mini','maxi');
    if (b) b.style.display = '';
    focus(id);
    if (mobile()) w.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function maximize(id) {
    var w = $(id); if (!w) return; sMax();
    // if already fullscreen, exit
    if (document.fullscreenElement === w) {
      document.exitFullscreen();
    } else {
      w.classList.remove('hidden','mini'); w.classList.add('maxi'); focus(id);
      // use the real Fullscreen API — requestFullscreen() must be
      // called from a user gesture (click). it returns a promise.
      var rfs = w.requestFullscreen || w.webkitRequestFullscreen || w.msRequestFullscreen;
      if (rfs) rfs.call(w);
    }
  }

  // when the user exits fullscreen (e.g. pressing Escape), the browser
  // fires 'fullscreenchange'. we listen for it so we can clean up the
  // 'maxi' class — otherwise the window would stay styled as maximized
  // even though it's back to normal size.
  document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
      wins.forEach(function(w) { w.classList.remove('maxi'); });
    }
  });

  function tbToggle(id) {
    var w = $(id); if (!w) return;
    if (w.classList.contains('hidden') || w.classList.contains('mini')) restore(id);
    else if (w.classList.contains('focus')) minimize(id);
    else { focus(id); if (mobile()) w.scrollIntoView({ behavior:'smooth', block:'center' }); }
  }

  // click window → focus
  document.addEventListener('mousedown', function(e) {
    var w = e.target.closest('.desktop .win[id]');
    if (w && !w.classList.contains('hidden') && !w.classList.contains('mini')) focus(w.id);
  });

  // window control buttons
  document.addEventListener('click', function(e) {
    var b = e.target.closest('.wbtn[data-a]'); if (!b) return;
    var w = b.closest('.win'); if (!w || !w.id) return;
    var a = b.dataset.a;
    if (a==='min') minimize(w.id); else if (a==='close') close(w.id); else if (a==='max') maximize(w.id);
  });

  // mobile: tap minimized titlebar to restore
  document.addEventListener('click', function(e) {
    if (!mobile()) return;
    var bar = e.target.closest('.win-bar');
    if (!bar || e.target.closest('.wbtn')) return;
    var w = bar.closest('.win');
    if (w && w.classList.contains('mini')) restore(w.id);
  });

  // ESC — close one thing at a time, priority order.
  // if the browser is in fullscreen the browser itself eats the first
  // Escape and fires 'fullscreenchange' (handled above), so we never
  // accidentally double-close.
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    // 1. fullscreen — let the browser handle it
    if (document.fullscreenElement) return;
    // 2. start menu
    if (sm.classList.contains('on')) { smClose(); return; }
    // 3. context menu
    if (ctxMenu.classList.contains('on')) { ctxClose(); return; }
    // 4. properties dialog
    if ($('propsWin').classList.contains('on')) { $('propsWin').classList.remove('on'); sClick(); return; }
    // 5. y2k popup
    if ($('y2kPopup').classList.contains('on')) { $('y2kPopup').classList.remove('on'); sClick(); return; }
    // 6. aim messenger
    if (aimOpen) { closeAIM(); return; }
    // 7. notepad
    if (npOpen) { closeNP(); return; }
    // 8. source viewer
    if (srcOpen) { closeSrc(); return; }
    // 9. focused desktop window
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i];
      if (w.classList.contains('focus') && !w.classList.contains('hidden') && !w.classList.contains('mini')) {
        close(w.id); return;
      }
    }
  });

  // =========================================================
  //  RESIZE GRIP — clamp to viewport edge
  // =========================================================
  var rz = null;
  document.addEventListener('mousedown', function(e) {
    var g = e.target.closest('.grip'); if (!g) return;
    var w = g.closest('.win'); if (!w) return;
    e.preventDefault(); focus(w.id);
    rz = { w:w, x:e.clientX, y:e.clientY, sw:w.offsetWidth, sh:w.offsetHeight };
  });
  document.addEventListener('mousemove', function(e) {
    if (!rz) return;
    var maxW = innerWidth - rz.w.getBoundingClientRect().left - 4;
    rz.w.style.width     = Math.max(200, Math.min(rz.sw + e.clientX - rz.x, maxW)) + 'px';
    rz.w.style.minHeight = Math.max(60, rz.sh + e.clientY - rz.y) + 'px';
  });
  document.addEventListener('mouseup', function() { rz = null; });

  // =========================================================
  //  DRAGGABLE WINDOWS — on desktop, windows are position:fixed
  //  and can be dragged by their title bar.
  // =========================================================
  function setInitialPositions() {
    if (mobile()) return;
    // windows live in normal document flow — CSS handles width (960px),
    // centring (margin auto), and stacking. this function just clears
    // any inline overrides left over from dragging / resizing / reboot.
    wins.forEach(function(w) {
      w.classList.remove('floating');
      w.style.position  = '';
      w.style.left      = '';
      w.style.top       = '';
      w.style.width     = '';
      w.style.height    = '';
      w.style.minHeight = '';
      w.style.maxHeight = '';
      w.style.zIndex    = '';
    });
    zTop = 20;
  }

  // wire up dragging on each desktop window's title bar.
  // always register handlers — the mobile() guard inside makeDraggable
  // prevents dragging on small viewports dynamically. this way dragging
  // works even if the page loaded at mobile width and was later resized.
  wins.forEach(function(w) {
    var bar = w.querySelector('.win-bar');
    if (bar) makeDraggable(bar, w, '.wbtn');
  });
  if (!mobile()) setInitialPositions();

  // handle viewport resize across the 960px breakpoint.
  // when crossing in either direction, reset all windows to document flow
  // so the CSS media queries can take over cleanly.
  var wasMobile = mobile();
  window.addEventListener('resize', function() {
    var isMobile = mobile();
    if (isMobile === wasMobile) return;
    wasMobile = isMobile;
    wins.forEach(function(w) {
      w.classList.remove('floating');
      w.style.position  = '';
      w.style.left      = '';
      w.style.top       = '';
      w.style.width     = '';
      w.style.height    = '';
      w.style.minHeight = '';
      w.style.maxHeight = '';
      w.style.zIndex    = '';
    });
    zTop = 20;
  });

  // =========================================================
  //  DESKTOP ICONS — click to select, double-click to open
  // =========================================================
  var selIcon = null;
  $('icons').addEventListener('click', function(e) {
    var i = e.target.closest('.icon'); if (!i) return; sClick();
    // on mobile, single tap opens directly — dblclick is unreliable
    // on touch devices (triggers zoom, inconsistent timing). the
    // "select then double-click" metaphor is a desktop thing.
    if (mobile()) {
      var g = i.dataset.go;
      if (g==='notepad') openNP(); else if (g==='source') openSrc();
      else if (g==='aim') openAIM();
      else if (g.indexOf('url:')===0) window.open(g.slice(4),'_blank');
      else openWin(g);
      return;
    }
    if (selIcon) selIcon.classList.remove('sel');
    i.classList.add('sel'); selIcon = i;
  });
  $('icons').addEventListener('dblclick', function(e) {
    var i = e.target.closest('.icon'); if (!i) return;
    var g = i.dataset.go;
    if (g==='notepad') openNP(); else if (g==='source') openSrc();
    else if (g==='aim') openAIM();
    else if (g.indexOf('url:')===0) window.open(g.slice(4),'_blank');
    else openWin(g);
  });
  var selDragged = false; // flag: true right after a drag-select, prevents click from undoing it
  document.addEventListener('click', function(e) {
    if (selDragged) return;
    if (!e.target.closest('.icon')) {
      document.querySelectorAll('.icon.sel').forEach(function(ic) { ic.classList.remove('sel'); });
      selIcon = null;
    }
  });

  // =========================================================
  //  START MENU
  // =========================================================
  var sm = $('sm'), startBtn = $('startBtn'), overlay = $('overlay');
  function smOpen()  { sClick(); sm.classList.add('on'); startBtn.classList.add('on'); overlay.classList.add('on'); }
  function smClose() { sm.classList.remove('on'); startBtn.classList.remove('on'); overlay.classList.remove('on'); }
  startBtn.onclick = function(e) { e.stopPropagation(); sm.classList.contains('on') ? smClose() : smOpen(); };
  overlay.onclick  = function() { smClose(); ctxClose(); };

  document.querySelectorAll('.sm-item').forEach(function(it) {
    it.onclick = function() {
      var a = it.dataset.a;
      if (a==='go')       openWin(it.dataset.t);
      else if (a==='url') window.open(it.dataset.href,'_blank');
      else if (a==='notepad')  openNP();
      else if (a==='source')   openSrc();
      else if (a==='aim')      openAIM();
      else if (a==='crt')      toggleCRT();
      else if (a==='shutdown') doShutdown();
      smClose();
    };
  });

  // =========================================================
  //  NOTEPAD — draggable, resizable, taskbar-integrated
  // =========================================================
  var np = $('np'), npOpen = false;
  var npTb = document.createElement('div');
  npTb.className = 'tb-btn'; npTb.textContent = 'Notepad'; npTb.style.display = 'none';
  tbWins.appendChild(npTb);

  function openNP()  { sClick(); np.classList.add('on'); np.classList.remove('min'); npOpen = true; npTb.style.display = ''; npTb.classList.add('in'); }
  function minNP()   { sMin(); np.classList.add('min'); npOpen = false; npTb.classList.remove('in'); }
  function closeNP() { sClick(); np.classList.remove('on','min'); npOpen = false; npTb.style.display = 'none'; }
  $('npMin').onclick = minNP;
  $('npX').onclick = closeNP;
  npTb.onclick = function() { np.classList.contains('min') ? openNP() : npOpen ? minNP() : openNP(); };

  // drag
  makeDraggable($('npBar'), np, '.wbtn');
  // resize
  makeResizable($('npGrip'), np, 240, 120, function(h) { $('npTxt').style.minHeight = Math.max(80, h-60)+'px'; });

  // =========================================================
  //  SOURCE VIEWER
  // =========================================================
  var srcWin = $('srcWin'), srcOpen = false;
  var srcTb = document.createElement('div');
  srcTb.className = 'tb-btn'; srcTb.textContent = 'Source'; srcTb.style.display = 'none';
  tbWins.appendChild(srcTb);

  function openSrc() {
    sClick(); $('srcBody').textContent = document.documentElement.outerHTML;
    srcWin.classList.add('on'); srcOpen = true; srcTb.style.display = ''; srcTb.classList.add('in');
  }
  function closeSrc() { sClick(); srcWin.classList.remove('on'); srcWin.style.display = ''; srcOpen = false; srcTb.style.display = 'none'; }
  function minSrc()   { sMin(); srcWin.style.display = 'none'; srcTb.classList.remove('in'); }
  function restoreSrc() { sClick(); srcWin.style.display = 'flex'; srcTb.classList.add('in'); }
  $('srcX').onclick = closeSrc;
  srcTb.onclick = function() { srcWin.style.display==='none'&&srcOpen ? restoreSrc() : srcOpen ? minSrc() : openSrc(); };

  makeDraggable($('srcBar'), srcWin, '.wbtn');

  // =========================================================
  //  AIM MESSENGER — draggable, taskbar-integrated
  //  SmarterChild was the first chatbot. before ChatGPT,
  //  before Siri, there was a robot on AIM that could
  //  tell you the weather and roast you simultaneously.
  // =========================================================
  var aim = $('aim'), aimOpen = false;
  var aimTb = document.createElement('div');
  aimTb.className = 'tb-btn'; aimTb.textContent = 'Messenger'; aimTb.style.display = 'none';
  tbWins.appendChild(aimTb);

  function openAIM()  { sClick(); aim.classList.add('on'); aim.classList.remove('min'); aimOpen = true; aimTb.style.display = ''; aimTb.classList.add('in'); }
  function minAIM()   { sMin(); aim.classList.add('min'); aimOpen = false; aimTb.classList.remove('in'); }
  function closeAIM() { sClick(); aim.classList.remove('on','min'); aimOpen = false; aimTb.style.display = 'none'; }
  $('aimMin').onclick = minAIM;
  $('aimX').onclick = closeAIM;
  aimTb.onclick = function() { aim.classList.contains('min') ? openAIM() : aimOpen ? minAIM() : openAIM(); };

  makeDraggable($('aimBar'), aim, '.wbtn');

  // =========================================================
  //  RIGHT-CLICK CONTEXT MENU
  // =========================================================
  var ctxMenu = $('ctxMenu');
  function ctxClose() { ctxMenu.classList.remove('on'); }

  document.addEventListener('contextmenu', function(e) {
    var onDesktop = e.target.closest('.desktop') && !e.target.closest('.win') && !e.target.closest('.icon');
    if (!onDesktop && e.target !== document.body) return;
    e.preventDefault(); sClick();
    ctxMenu.style.left = Math.min(e.clientX, innerWidth-190)+'px';
    ctxMenu.style.top  = Math.min(e.clientY, innerHeight-120)+'px';
    ctxMenu.classList.add('on');
  });
  document.addEventListener('click', function(e) { if (!e.target.closest('.ctx-menu')) ctxClose(); });

  document.querySelectorAll('.ctx-item[data-a]').forEach(function(it) {
    it.onclick = function() {
      if (it.dataset.a==='refresh') location.reload();
      if (it.dataset.a==='props')   showProps();
      ctxClose();
    };
  });

  function showProps() {
    sClick();
    var up = Math.floor((Date.now()-t0)/1000), m = (up/60)|0, s = up%60;
    var open = 0; wins.forEach(function(w){ if(!w.classList.contains('hidden')&&!w.classList.contains('mini')) open++; });
    $('propsBody').innerHTML = '<b>Desktop Properties</b><br><br>Resolution: '+innerWidth+' x '+innerHeight+'<br>Uptime: '+m+'m '+s+'s<br>Windows open: '+open+' / '+wins.length+'<br>Reboots: '+reboots+'<br>Sound: '+(sndOn?'ON':'OFF')+'<br>Konami: '+(document.body.classList.contains('konami')?'ACTIVE':'no')+'<br><br><i>gampert.dev v0.4.2</i>';
    $('propsWin').classList.add('on');
  }
  $('propsX').onclick = function() { sClick(); $('propsWin').classList.remove('on'); };

  // =========================================================
  //  SHUTDOWN + BOOT
  // =========================================================
  function doShutdown() {
    sShutdown();
    document.body.classList.add('wait');
    $('sdOverlay').classList.add('on'); $('sdBlue').classList.add('on');
    $('sdBlack').classList.remove('on'); $('boot').classList.remove('on');
    wins.forEach(function(w) { w.classList.add('hidden'); var b=tb(w.id); if(b){b.classList.remove('in');} });
    np.classList.remove('on','min'); npOpen=false; npTb.style.display='none';
    srcWin.classList.remove('on'); srcWin.style.display=''; srcOpen=false; srcTb.style.display='none';
    aim.classList.remove('on','min'); aimOpen=false; aimTb.style.display='none';
    ldShown = {}; $('y2kPopup').classList.remove('on');
    setTimeout(function() { $('sdBlue').classList.remove('on'); $('sdBlack').classList.add('on'); document.body.classList.remove('wait'); }, 2500);
  }

  $('sdOverlay').onclick = function() {
    if (!$('sdBlack').classList.contains('on')) return;
    $('sdBlack').classList.remove('on'); reboots++; doBoot();
  };

  var flavors = [
    'restoring questionable design choices...', 'recompiling opinions...', 'defragmenting ambition...',
    'mounting /dev/coffee...', 'loading fonts... (the important part)...', 'recovering unsaved motivation...',
    'calibrating ego... done.', 'indexing side projects... too many found.', 'searching for work-life balance... not found.',
    'rebuilding css... pray.', 'locating missing semicolons...', 'initializing procrastination engine...',
    'syncing with the void...', 'warming up cold takes...', 'compressing regrets... 41% savings.',
    'polling stackoverflow... connection strong.', 'spinning up hamster wheel...',
    'auditing design tokens... 47 near-duplicates.', 'calculating spacing violations... delta E < 5...',
    'checking figma for detached instances... oh no.', 'normalizing border-radius... 14 unique values found.',
    'resolving merge conflicts in the design system...', 'counting z-index layers... lost count at 9999.',
  ];

  function pick(a, n) { var s=a.slice(),i=s.length; while(i){var j=Math.random()*i--|0,t=s[i];s[i]=s[j];s[j]=t;} return s.slice(0,n); }

  function doBoot() {
    document.body.classList.add('wait');
    var bt=$('boot'), txt=$('bootTxt'), fill=$('bootFill'), track=fill.parentElement;
    bt.classList.add('on'); txt.innerHTML=''; fill.style.width='0%'; track.classList.remove('on');
    document.title = TITLE+' — booting...';
    var f = pick(flavors, 3);
    var lines = [
      {t:'GAMPERT BIOS v0.4.2',c:'bh',d:0},{t:'(build: saturday-3am-dubai)',c:'bd',d:80},{t:'',d:200},
      {t:'CPU: mass of caffeine and opinions',d:100},{t:'RAM: enough (barely)',d:80},
      {t:'DISK: 90% figma files, 10% side projects',d:80},{t:'',d:150},
      {t:'Memory Test: 640K OK',c:'bok',d:200},{t:'Detecting hard drives... C:\\',d:300},{t:'',d:100},
      {t:'Checking projects.......... 4 found',d:250},{t:'Checking abandoned ideas... 41 found',c:'bw',d:200},{t:'',d:100},
      {t:f[0],c:'bd',d:250},{t:f[1],c:'bd',d:250},{t:f[2],c:'bd',d:250},{t:'',d:100},
      {t:'Loading gampert.dev...',c:'bh',d:200},{t:'__BAR__',d:100},{t:'',d:50},{t:'READY.',c:'bok',d:300}
    ];
    var i=0;
    (function next() {
      if (i>=lines.length) { setTimeout(finishBoot,400); return; }
      var l=lines[i++];
      setTimeout(function() {
        if (l.t==='__BAR__') { track.classList.add('on'); animBar(next); }
        else { var s=document.createElement('span'); if(l.c) s.className=l.c; s.textContent=l.t; txt.appendChild(s); txt.appendChild(document.createTextNode('\n')); txt.scrollTop=txt.scrollHeight; next(); }
      }, l.d);
    })();
  }

  function animBar(cb) {
    var steps=[5,12,20,28,35,42,55,63,70,78,85,92,100], j=0, fill=$('bootFill');
    (function n() { if(j>=steps.length){setTimeout(cb,150);return;} fill.style.width=steps[j++]+'%'; setTimeout(n,(40+Math.random()*120)|0); })();
  }

  function finishBoot() {
    document.body.classList.remove('wait');
    $('boot').classList.remove('on'); $('sdOverlay').classList.remove('on');
    document.title = TITLE;
    wins.forEach(function(w) { w.classList.remove('hidden','mini','maxi','floating'); w.classList.add('booting'); w.classList.remove('boot-in'); w.style.position=''; w.style.left=''; w.style.top=''; w.style.width=''; w.style.height=''; w.style.minHeight=''; w.style.maxHeight=''; w.style.zIndex=''; });
    setInitialPositions(); // reset dragged positions on reboot
    var crt = document.createElement('div'); crt.className='crt-on'; document.body.appendChild(crt);
    setTimeout(function() {
      crt.remove(); sStartup();
      wins.forEach(function(w,i) {
        setTimeout(function() { w.classList.add('boot-in'); var b=tb(w.id); if(b){b.style.display='';b.classList.add('in');} }, 150*(i+1));
        setTimeout(function() { w.classList.remove('booting','boot-in'); }, 150*(i+1)+300);
      });
      setTimeout(function(){ focus(wins[0].id); },150);
      scrollTo({top:0,behavior:'smooth'});
    }, 500);
  }

  // =========================================================
  //  SCREENSAVER — 60s idle, bouncing DVD-style
  // =========================================================
  var ss=$('ss'), ssTxt=$('ssTxt'), ssT, ssOn=false, ssX,ssY,ssDx,ssDy,ssR;
  // 60s on desktop, 180s (3min) on mobile — people read slower on phones,
  // check notifications mid-scroll, and generally don't expect a screensaver.
  function resetIdle() { if(ssOn) hideSS(); clearTimeout(ssT); ssT=setTimeout(showSS, mobile()?180000:60000); }
  function showSS() { ssOn=true; ss.classList.add('on'); document.title=TITLE+' — screensaver'; ssX=Math.random()*(innerWidth-200); ssY=Math.random()*(innerHeight-60); ssDx=1.5; ssDy=1; ssTxt.style.color='#00ff88'; animSS(); }
  function hideSS() { ssOn=false; ss.classList.remove('on'); document.title=TITLE; cancelAnimationFrame(ssR); }
  function animSS() {
    ssX+=ssDx; ssY+=ssDy;
    var mx=innerWidth-ssTxt.offsetWidth, my=innerHeight-ssTxt.offsetHeight;
    if(ssX<=0||ssX>=mx){ssDx*=-1;ssX=Math.max(0,Math.min(ssX,mx));ssTxt.style.color='#'+((Math.random()*0xffffff)|0).toString(16).padStart(6,'0');}
    if(ssY<=0||ssY>=my){ssDy*=-1;ssY=Math.max(0,Math.min(ssY,my));ssTxt.style.color='#'+((Math.random()*0xffffff)|0).toString(16).padStart(6,'0');}
    ssTxt.style.left=ssX+'px'; ssTxt.style.top=ssY+'px'; ssR=requestAnimationFrame(animSS);
  }
  ['mousemove','mousedown','keydown','scroll','touchstart'].forEach(function(e){ document.addEventListener(e,resetIdle,{passive:true}); });
  resetIdle();

  // =========================================================
  //  KONAMI CODE — ↑↑↓↓←→←→BA
  // =========================================================
  // e.code = physical key name, locale-independent. e.keyCode is deprecated.
  var kSeq=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'], kPos=0;
  document.addEventListener('keydown', function(e) {
    if (e.code===kSeq[kPos]) { kPos++; if(kPos===kSeq.length) { kPos=0; document.body.classList.toggle('konami'); $('kToast').classList.add('on'); sStartup(); setTimeout(function(){$('kToast').classList.remove('on');},3000); } } else kPos=0;
  });

  // =========================================================
  //  SPLASH — first visit only (per tab)
  // =========================================================
  (function() {
    var sp=$('splash'),bar=$('splashFill');
    if (sessionStorage.getItem('g-splash')) { sp.classList.remove('on'); return; }
    document.body.classList.add('wait');
    sessionStorage.setItem('g-splash','1');
    var s=[10,25,40,55,70,85,100],i=0;
    setTimeout(function n(){ if(i>=s.length){setTimeout(function(){sp.classList.remove('on');document.body.classList.remove('wait');sStartup();},300);return;} bar.style.width=s[i++]+'%'; setTimeout(n,(150+Math.random()*150)|0); }, 400);
  })();

  // =========================================================
  //  ANIMATED FAVICON — the tab deserves the same love.
  //  draws the gampert G logo on a 32×32 canvas with a CRT
  //  boot sequence, phosphor glow flicker & colour cycling.
  //  because a static .ico is so 2003.
  // =========================================================
  (function(){
    // the animated favicon is invisible on most mobile browsers (iOS Safari
    // doesn't show it at all, Android Chrome barely). skip it entirely to
    // save CPU cycles and battery. nobody will miss what they can't see.
    if(mobile()) return;
    var S=32, cv=document.createElement('canvas'), cx=cv.getContext('2d');
    cv.width=cv.height=S;
    var ico=document.querySelector('link[rel="icon"]');
    if(!ico){ico=document.createElement('link');ico.rel='icon';document.head.appendChild(ico);}
    ico.type='image/png';

    // the gampert G — two Path2D objects built from the logo SVG (viewBox 0 0 86 86).
    // Path2D accepts SVG path-data strings, so we can reuse the exact brand mark
    // without any rasterised assets. the paths get scaled down by 86→32 (×0.372).
    var g1=new Path2D('M0 86V33.14C0 14.87 15.33 0 34.18 0H86V12.16H34.49C22.39 12.16 12.54 21.71 12.54 33.43V85.97H0Z');
    var g2=new Path2D('M38.09 86V73.84H51.84C63.77 73.84 73.46 64.45 73.46 52.89V49.08H38.7V36.92H86V52.97C86 71.16 70.72 85.97 51.95 85.97H38.09Z');
    var sc=S/86;

    // palette — pulled from the site's window bar gradients + accents
    var pal=['#00ff88','#1084d0','#ff6633','#ffcc00','#ff00ff','#44ddaa','#7b2fa0'];
    var ci=0, t=0, phase=0, bf=0, idleIv=null;

    function logo(c,gl){
      cx.save(); cx.scale(sc,sc);
      if(gl){cx.shadowColor=c;cx.shadowBlur=gl/sc;}
      cx.fillStyle=c; cx.fill(g1); cx.fill(g2);
      cx.restore();
    }
    function scan(){
      // faux scanlines — every other row gets a dark overlay.
      // at 32px it's subtle, but your brain registers "CRT".
      cx.fillStyle='rgba(0,0,0,0.12)';
      for(var y=0;y<S;y+=2) cx.fillRect(0,y,S,1);
    }

    function render(){
      cx.clearRect(0,0,S,S);
      cx.shadowBlur=0; cx.shadowColor='transparent';
      var c=pal[ci];

      // ---- phase 0: CRT boot (plays once) ----
      if(phase===0){
        cx.fillStyle='#000';cx.fillRect(0,0,S,S);
        if(bf<3){
          // the horizontal white line — like an old TV powering on.
          // starts as 1px, expands to fill the canvas vertically.
          var h=Math.max(1,bf*5);
          cx.fillStyle='#fff';cx.fillRect(0,(S-h)/2|0,S,h);
        }else if(bf<6){
          // white flash fading to black — the phosphor afterglow
          var a=1-(bf-3)/3;
          cx.fillStyle='rgba(255,255,255,'+a.toFixed(2)+')';
          cx.fillRect(0,0,S,S);
        }else if(bf<10){
          // logo materialises on the dark background
          cx.fillStyle='#0a0a1e';cx.fillRect(0,0,S,S);
          logo(c,3);scan();
        }else{phase=1;}
        bf++;
      }

      // ---- phase 1: idle — the main loop ----
      if(phase===1){
        cx.fillStyle='#0a0a1e';cx.fillRect(0,0,S,S);
        if(t>0&&t%80===0){
          // glitch frame — full invert, like a CRT hiccup.
          // happens roughly every 40 seconds. blink and you miss it.
          cx.fillStyle='#fff';cx.fillRect(0,0,S,S);
          logo('#000',0);
        }else{
          // alternating glow intensity = phosphor flicker.
          // odd frames get a tight glow (2), even frames a wide one (4).
          // at ~2fps this reads as a subtle CRT pulse.
          logo(c, t%2?2:4);
          scan();
        }
      }

      ico.href=cv.toDataURL('image/png');
      t++;
      // cycle accent colour roughly every ~25 seconds
      if(phase===1&&t%50===0) ci=(ci+1)%pal.length;
    }

    // boot frames run at 100ms (fast), then settle into ~530ms idle.
    // the 530ms is intentionally not 500 — keeps it slightly off-beat,
    // which feels more organic than a rigid half-second tick.
    var biv=setInterval(function(){
      render();
      if(phase===1){clearInterval(biv);idleIv=setInterval(render,530);}
    },100);
    render();

    // ---- tab visibility: yellow when away, animate back to green ----
    // the Page Visibility API fires 'visibilitychange' when the user
    // switches tabs. document.hidden is true when the tab is in the
    // background. we use this to swap the favicon to a static yellow
    // "away" state and play a little wake-up animation on return.
    var away = false;

    function drawStatic(c) {
      cx.clearRect(0,0,S,S);
      cx.shadowBlur=0; cx.shadowColor='transparent';
      cx.fillStyle='#0a0a1e'; cx.fillRect(0,0,S,S);
      logo(c, 2); scan();
      ico.href = cv.toDataURL('image/png');
    }

    document.addEventListener('visibilitychange', function() {
      if (phase !== 1) return; // only during idle, not boot

      if (document.hidden) {
        // ---- tab lost focus → go yellow ----
        if (idleIv) { clearInterval(idleIv); idleIv = null; }
        away = true;
        drawStatic('#ffcc00');

      } else if (away) {
        // ---- tab regained focus → animate yellow → green ----
        away = false;
        ci = 0; // reset palette index to green (#00ff88)
        t = 0;  // reset tick counter

        // quick CRT "wake up" sequence: flash → bright green → settle
        var wake = [
          function() {
            cx.clearRect(0,0,S,S);
            cx.fillStyle='#fff'; cx.fillRect(0,0,S,S);
            logo('#000',0);
            ico.href = cv.toDataURL('image/png');
          },
          function() { drawStatic('#33ffaa'); },
          function() { drawStatic('#00ff88'); }
        ];
        var wi = 0;
        var wIv = setInterval(function() {
          if (wi >= wake.length) {
            clearInterval(wIv);
            // resume normal idle animation
            idleIv = setInterval(render, 530);
            return;
          }
          wake[wi++]();
        }, 120);
      }
    });
  })();

  // =========================================================
  //  LOADING DIALOG — chunky progress bar, just like win95.
  //  shows on first open of each window. because in the 2000s,
  //  everything took a while. even when it didn't need to.
  // =========================================================
  var ldMsgs = {
    'w-welcome':  'Loading welcome.txt...',
    'w-projects': 'Loading projects.dll...',
    'w-about':    'Executing about.exe...',
    'w-links':    'Resolving links.url...'
  };
  var ldShown = {};

  function showLoading(id, cb) {
    var dlg = $('loadDlg'), fill = $('ldFill');
    $('ldTitle').textContent = 'Opening...';
    $('ldText').textContent = ldMsgs[id] || 'Loading...';
    fill.style.transition = 'none';
    fill.style.width = '0%';
    fill.offsetWidth;
    dlg.classList.add('on');
    var steps = [8, 20, 38, 55, 70, 85, 100], i = 0;
    (function next() {
      if (i >= steps.length) {
        setTimeout(function() { dlg.classList.remove('on'); cb(); }, 200);
        return;
      }
      fill.style.width = steps[i++] + '%';
      setTimeout(next, (60 + Math.random() * 140) | 0);
    })();
  }

  function openWin(id) {
    var w = $(id);
    if (!w) return;
    if (w.classList.contains('hidden') && !ldShown[id] && ldMsgs[id]) {
      ldShown[id] = true;
      showLoading(id, function() { restore(id); });
    } else {
      restore(id);
    }
  }

  // =========================================================
  //  Y2K POPUP — the classic 2000s popup.
  //  "congratulations! you are the 1,000,000th visitor!"
  //  appears once, ~25-40s after load. dismiss it if you dare.
  // =========================================================
  var popupMsgs = [
    'Congratulations!!! You are the 1,000,000th visitor to this website! Click OK to claim your FREE prize!',
    'WARNING: Your computer may be infected with up to 47 viruses. Click OK to scan now.',
    'URGENT: Your gampert.dev license expires in 0 days! Renew for only $0.00!',
    'This website uses cookies. Just kidding \u2014 it doesn\'t even have a server.',
    'Error 418: I\'m a teapot. The requested entity body is short and stout.',
    'Did you know? This website was built without a single npm install. Doctors hate this one weird trick.',
    'SYSTEM ALERT: Too much style detected on this page. Reduce vibe levels immediately.',
    'Your free trial of the internet has expired. Please insert another quarter to continue browsing.'
  ];

  var popupShown = false;
  setTimeout(function() {
    if (popupShown) return;
    popupShown = true;
    $('y2kText').textContent = popupMsgs[Math.random() * popupMsgs.length | 0];
    $('y2kPopup').classList.add('on');
    sErr();
  }, (25000 + Math.random() * 15000) | 0);

  $('y2kOk').onclick = $('y2kX').onclick = function() {
    $('y2kPopup').classList.remove('on');
    sClick();
  };

  // =========================================================
  //  CRT MODE — toggle from the start menu.
  //  heavier scanlines, vignette, flicker. for when you
  //  really want to feel the burn of a 15" CRT monitor.
  // =========================================================
  var crtOn = false;
  function toggleCRT() {
    crtOn = !crtOn;
    document.body.classList.toggle('crt-mode', crtOn);
    $('crtLabel').textContent = 'CRT mode: ' + (crtOn ? 'ON' : 'OFF');
    sClick();
  }

  // =========================================================
  //  STARFIELD — tiled canvas background.
  //  every 2000s personal site had a starfield, or at least
  //  a tiled space background downloaded from some free
  //  "backgrounds for your website!!" page.
  // =========================================================
  (function() {
    var c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = c.height = 200;
    for (var i = 0; i < 60; i++) {
      x.beginPath();
      x.arc(Math.random() * 200, Math.random() * 200, Math.random() * .8 + .2, 0, 6.28);
      x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .5 + .15).toFixed(2) + ')';
      x.fill();
    }
    document.body.style.background = '#0a0a1e url(' + c.toDataURL() + ')';
  })();

  // =========================================================
  //  LAST UPDATED — auto-formatted timestamp in the footer.
  //  every 2000s site had one. always suspiciously recent.
  //  ours literally updates every visit. peak authenticity.
  // =========================================================
  (function() {
    var el = $('lastUpdated');
    if (!el) return;
    var d = new Date();
    el.textContent = 'page last updated: ' + d.toLocaleString('en-US', {
      timeZone: 'Asia/Dubai', weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric', hour: 'numeric',
      minute: '2-digit', second: '2-digit', hour12: true
    }) + ' GST';
  })();

  // =========================================================
  //  HELPERS — drag & resize utilities
  // =========================================================
  function makeDraggable(handle, el, ignore) {
    var d=false,ox,oy;

    // if the element is in normal document flow, pop it out to
    // position:fixed at its current visual location so dragging works.
    function floatOut() {
      if (getComputedStyle(el).position !== 'fixed') {
        var rect = el.getBoundingClientRect();
        el.classList.add('floating');
        el.style.left  = rect.left + 'px';
        el.style.top   = rect.top + 'px';
        el.style.width = rect.width + 'px';
      }
      el.style.zIndex = ++zTop;
    }

    handle.addEventListener('mousedown', function(e) {
      if (mobile()) return; // no dragging on mobile
      if (ignore && e.target.closest(ignore)) return;
      floatOut();
      d=true; ox=e.clientX-el.getBoundingClientRect().left; oy=e.clientY-el.getBoundingClientRect().top; e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if(!d) return;
      el.style.left = Math.max(0,Math.min(e.clientX-ox, innerWidth-60))+'px';
      el.style.top  = Math.max(0,Math.min(e.clientY-oy, innerHeight-60))+'px';
    });
    document.addEventListener('mouseup', function(){ d=false; });
    // touch — only on non-mobile (tablets in landscape, etc.)
    handle.addEventListener('touchstart', function(e) {
      if (mobile()) return;
      if (ignore && e.target.closest(ignore)) return;
      floatOut();
      var t=e.touches[0];
      d=true; ox=t.clientX-el.getBoundingClientRect().left; oy=t.clientY-el.getBoundingClientRect().top;
    },{passive:true});
    document.addEventListener('touchmove', function(e) {
      if(!d) return; var t=e.touches[0];
      el.style.left = Math.max(0,Math.min(t.clientX-ox, innerWidth-60))+'px';
      el.style.top  = Math.max(0,Math.min(t.clientY-oy, innerHeight-60))+'px';
    },{passive:true});
    document.addEventListener('touchend', function(){ d=false; });
  }

  function makeResizable(grip, el, minW, minH, cb) {
    var r=null;
    grip.addEventListener('mousedown', function(e) { e.preventDefault(); r={x:e.clientX,y:e.clientY,w:el.offsetWidth,h:el.offsetHeight}; });
    document.addEventListener('mousemove', function(e) {
      if(!r) return;
      var mw = innerWidth - el.offsetLeft;
      var w = Math.max(minW, Math.min(r.w + e.clientX - r.x, mw));
      var h = Math.max(minH, r.h + e.clientY - r.y);
      el.style.width = w+'px'; el.style.minHeight = h+'px';
      if (cb) cb(h);
    });
    document.addEventListener('mouseup', function(){ r=null; });
  }

  // =========================================================
  //  CURSOR TRAIL — the hallmark of every 90s website.
  //  a pool of tiny squares that follow the mouse and fade.
  //  every geocities page had this. it's mandatory.
  //
  //  how it works:
  //  - pre-create 16 tiny <div> squares and add them to body
  //  - on every mousemove (~40ms throttle), grab the next
  //    particle from the pool, snap it to the cursor, then
  //    CSS-transition it to opacity:0 + scale(0). that's it.
  //  - the pool recycles automatically — when we wrap around,
  //    old particles get repositioned and re-triggered.
  //  - skip on mobile (no cursor) and during screensaver
  //    (cursor is hidden).
  // =========================================================
  var TRAIL_N = 16, trailPool = [], trailIdx = 0, trailT = 0;

  (function() {
    for (var i = 0; i < TRAIL_N; i++) {
      var p = document.createElement('div');
      p.className = 'trail';
      p.style.opacity = '0';
      document.body.appendChild(p);
      trailPool.push(p);
    }
  })();

  document.addEventListener('mousemove', function(e) {
    if (mobile() || ssOn) return;
    var now = Date.now();
    if (now - trailT < 40) return;
    trailT = now;

    var p = trailPool[trailIdx];
    trailIdx = (trailIdx + 1) % TRAIL_N;

    // snap to cursor position (offset by half the 3px size)
    p.style.transition = 'none';
    p.style.left = (e.clientX - 1) + 'px';
    p.style.top  = (e.clientY - 1) + 'px';
    p.style.opacity = '0.6';
    p.style.transform = 'scale(1)';

    // force reflow so the browser registers the "start" state,
    // then kick off the fade-out transition
    p.offsetWidth;
    p.style.transition = 'opacity .5s ease-out, transform .5s ease-out';
    p.style.opacity = '0';
    p.style.transform = 'scale(0.2)';
  });

  // =========================================================
  //  DESKTOP DRAG-SELECT — the rubber-band selection box.
  //  click and drag on the desktop to draw a selection
  //  rectangle, just like Windows 95. selects any desktop
  //  icons that fall inside the rect.
  //
  //  how it works:
  //  - mousedown on empty desktop area (not on any window,
  //    icon, menu, or other UI element) starts the drag.
  //  - mousemove draws the rectangle and hit-tests icons.
  //  - mouseup finalises the selection.
  //  - a "moved" threshold of 5px prevents accidental
  //    micro-drags from showing the rectangle.
  //  - sets `selDragged` flag so the click handler (which
  //    fires right after mouseup) doesn't immediately
  //    deselect everything we just selected.
  // =========================================================
  var selRect = document.createElement('div');
  selRect.className = 'sel-rect';
  document.body.appendChild(selRect);

  var selDrag = null;

  document.addEventListener('mousedown', function(e) {
    if (mobile() || e.button !== 0) return;
    // only start on desktop background — not on any UI element
    if (e.target.closest('.win, .icon, .taskbar, .start-menu, .ctx-menu, .np, .src, .props, .splash, .sd-overlay, .ss, .overlay, .aim, .y2k-popup, .ld')) return;
    if (e.target !== document.body && !e.target.closest('.desktop')) return;

    selDrag = { x: e.clientX, y: e.clientY, moved: false };
    e.preventDefault(); // prevent text selection while dragging
  });

  document.addEventListener('mousemove', function(e) {
    if (!selDrag) return;

    var dx = e.clientX - selDrag.x;
    var dy = e.clientY - selDrag.y;

    // require a minimum drag before showing the rect
    if (!selDrag.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    selDrag.moved = true;

    // compute rectangle bounds (handle drag in any direction)
    var x = Math.min(selDrag.x, e.clientX);
    var y = Math.min(selDrag.y, e.clientY);
    var w = Math.abs(dx);
    var h = Math.abs(dy);

    selRect.style.display = 'block';
    selRect.style.left   = x + 'px';
    selRect.style.top    = y + 'px';
    selRect.style.width  = w + 'px';
    selRect.style.height = h + 'px';

    // hit-test: highlight icons whose bounding box overlaps the selection rect
    var r = { left: x, top: y, right: x + w, bottom: y + h };
    document.querySelectorAll('.icon').forEach(function(ic) {
      var b = ic.getBoundingClientRect();
      var inside = b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
      ic.classList.toggle('sel', inside);
    });
  });

  document.addEventListener('mouseup', function() {
    if (!selDrag) return;
    selRect.style.display = 'none';

    if (!selDrag.moved) {
      // no drag happened — this was a click on empty desktop, deselect all
      document.querySelectorAll('.icon.sel').forEach(function(ic) { ic.classList.remove('sel'); });
      selIcon = null;
    } else {
      // drag finished — keep the selected icons highlighted
      var sel = document.querySelectorAll('.icon.sel');
      selIcon = sel.length ? sel[sel.length - 1] : null;
      // set flag so the click handler (which fires next) doesn't undo the selection
      selDragged = true;
      setTimeout(function() { selDragged = false; }, 0);
    }

    selDrag = null;
  });

})();
