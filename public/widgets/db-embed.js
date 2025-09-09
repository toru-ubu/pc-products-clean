(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function getBase(){
    try { var origin = new URL(document.currentScript.src).origin; return origin + '/db'; } catch(_) { return 'https://pc-products-clean.vercel.app/db'; }
  }
  var BASE = getBase();

  function loadCSSIntoShadow(shadowRoot, href){
    try {
      fetch(href, { cache: 'no-cache' })
        .then(function(res){ return res.text(); })
        .then(function(css){ var st = document.createElement('style'); st.textContent = css; shadowRoot.appendChild(st); })
        .catch(function(){ /* ignore */ });
    } catch(_) { /* ignore */ }
  }

  function buildPriceOptions(sel){
    var opts=[["","指定なし"],[50000,"5万円"],[100000,"10万円"],[150000,"15万円"],[200000,"20万円"],[250000,"25万円"],[300000,"30万円"],[350000,"35万円"],[400000,"40万円"],[450000,"45万円"],[500000,"50万円"],[550000,"55万円"],[600000,"60万円"],[650000,"65万円"],[700000,"70万円"],[750000,"75万円"],[800000,"80万円"],[850000,"85万円"],[900000,"90万円"],[950000,"95万円"],[1000000,"100万円"]];
    sel.innerHTML=opts.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>';}).join('');
  }

  function toQS(params){ var p=new URLSearchParams(); Object.keys(params).forEach(function(k){ var v=params[k]; if(v==null||v==="") return; if(Array.isArray(v)&&v.length===0) return; p.set(k, Array.isArray(v)?v.join(','):v); }); return p.toString(); }
  function go(params){ var qs=toQS(params); window.top.location.href = qs? (BASE + '/search?'+qs) : (BASE + '/search'); }

  function toAbsoluteUrl(path){
    if (!path) return '#';
    try { if (path.indexOf('http')===0) return path; if (path[0] === '/') return BASE + path.replace(/^\/db/, ''); } catch(_) {}
    return path;
  }

  function renderChips(root, containerSel, items, key){
    var box = qs(containerSel, root); if(!box) return;
    box.innerHTML = (items||[]).slice(0, 40).map(function(it){
      var name = it.name || it;
      return '<label class="dbw-chip-check"><input type="checkbox" class="dbw-leaf" data-key="'+key+'" value="'+name+'">'+name+'</label>';
    }).join('');
  }

  function renderHierarchy(root, containerSel, hierarchy, key){
    var box = qs(containerSel, root); if(!box) return;
    var html=''; var src = hierarchy || {};
    Object.keys(src).forEach(function(series){
      html += '<div class="dbw-series-group" data-key="'+key+'" data-series="'+series+'">';
      html +=   '<label class="dbw-chip-check"><input type="checkbox" class="dbw-series" data-key="'+key+'" data-series="'+series+'"><strong>'+series+'</strong></label>';
      (src[series]||[]).forEach(function(m){
        html +=   '<label class="dbw-chip-check"><input type="checkbox" class="dbw-leaf" data-key="'+key+'" data-series="'+series+'" value="'+m+'">'+m+'</label>';
      });
      html += '</div>';
    });
    box.innerHTML = html;
  }

  function collectChecked(root,key){
    return qsa('input.dbw-leaf[data-key="'+key+'"]:checked', root).map(function(i){return i.value;});
  }

  function mount(container){
    if(!container) return;
    var shadow = container.attachShadow({ mode: 'open' });

    // Load CSS into shadow
    loadCSSIntoShadow(shadow, BASE + '/widgets/search-widget.css');

    // Build widget DOM inside shadow
    var wrapper = document.createElement('div');
    wrapper.innerHTML = [
      '<div class="dbw-container">',
      '  <h2 class="dbw-title">メーカー横断で探せる日本最大級のゲーミングPC検索ツール</h2>',
      
      '  <div class="dbw-filter-buttons-row">',
      '    <button type="button" class="dbw-filter-button" data-open="manufacturer">メーカー</button>',
      '    <button type="button" class="dbw-filter-button" data-open="cpu">CPU</button>',
      '    <button type="button" class="dbw-filter-button" data-open="gpu">GPU</button>',
      '    <button type="button" class="dbw-filter-button" data-open="memory">メモリ</button>',
      '    <button type="button" class="dbw-filter-button" data-open="storage">ストレージ</button>',
      '  </div>',

      '  <div class="dbw-filterbar secondary">',
      '    <div class="dbw-fieldbox">',
      '      <span class="dbw-label">価格</span>',
      '      <div class="dbw-inline">',
      '        <select id="dbw-price-min-top" class="dbw-select-styled"></select>',
      '        <span>〜</span>',
      '        <select id="dbw-price-max-top" class="dbw-select-styled"></select>',
      '      </div>',
      '    </div>',
      '    <div class="dbw-fieldbox grow">',
      '      <span class="dbw-label">キーワード</span>',
      '      <input id="dbw-keyword-top" type="text" placeholder="商品名、スペックなど" class="dbw-input" />',
      '    </div>',
      '    <div class="dbw-fieldbox shape">',
      '      <label class="dbw-check"><input id="dbw-shape-desktop" type="checkbox" checked />デスクトップ</label>',
      '      <label class="dbw-check"><input id="dbw-shape-notebook" type="checkbox" />ノートブック</label>',
      '    </div>',
      '  </div>',
      '  <div class="dbw-filterbar tertiary">',
      '    <div class="dbw-actions-right" style="justify-content:center;width:100%">',
      '      <button id="dbw-search-top" class="dbw-btn primary">検索</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="dbw-modal" class="dbw-modal-overlay" style="display:none">',
      '  <div class="dbw-modal">',
      '    <button type="button" class="dbw-modal-close" aria-label="閉じる">×</button>',
      '    <h3 class="dbw-modal-title">条件で絞り込む</h3>',
      '    <div id="dbw-common-row" class="dbw-row">',
      '      <div class="dbw-field">',
      '        <label class="dbw-label">キーワード</label>',
      '        <input id="dbw-keyword" type="text" class="dbw-input" placeholder="商品名、スペックなど" />',
      '      </div>',
      '      <div class="dbw-field">',
      '        <label class="dbw-label">価格</label>',
      '        <div class="dbw-inline"><select id="dbw-price-min" class="dbw-select"></select><span>〜</span><select id="dbw-price-max" class="dbw-select"></select></div>',
      '      </div>',
      '      <div class="dbw-field">',
      '        <label class="dbw-label">形状</label>',
      '        <div class="dbw-inline">',
      '          <label class="dbw-check"><input id="dbw-desktop" type="checkbox" checked />デスクトップ</label>',
      '          <label class="dbw-check"><input id="dbw-notebook" type="checkbox" />ノートブック</label>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="dbw-section dbw-section-makers"><h4>メーカー</h4><div id="dbw-modal-makers" class="dbw-grid"></div></div>',
      '    <div class="dbw-section dbw-section-cpu"><h4>CPU</h4><div id="dbw-modal-cpu" class="dbw-grid"></div></div>',
      '    <div class="dbw-section dbw-section-gpu"><h4>GPU</h4><div id="dbw-modal-gpu" class="dbw-grid"></div></div>',
      '    <div class="dbw-section dbw-section-memory"><h4>メモリ</h4><div id="dbw-modal-memory" class="dbw-grid"></div></div>',
      '    <div class="dbw-section dbw-section-storage"><h4>ストレージ</h4><div id="dbw-modal-storage" class="dbw-grid"></div></div>',
      '    <div class="dbw-actions"><button id="dbw-submit" class="dbw-btn primary">検索</button></div>',
      '  </div>',
      '</div>'
    ].join('');

    // adopt widget DOM
    shadow.appendChild(wrapper);
    var root = wrapper; // shadow root subtree

    // Modal events
    var modal = qs('#dbw-modal', root);
    var closeBtn = qs('.dbw-modal-close', root);
    function setModalVisibility(type){
      var common = qs('#dbw-common-row', root);
      var sm = qs('.dbw-section-makers', root);
      var sc = qs('.dbw-section-cpu', root);
      var sg = qs('.dbw-section-gpu', root);
      var smem = qs('.dbw-section-memory', root);
      var ssto = qs('.dbw-section-storage', root);
      function show(el, yes){ if(!el) return; el.style.display = yes ? '' : 'none'; }
      if(type==='maker'){
        show(common,false); show(sm,true); show(sc,false); show(sg,false); show(smem,false); show(ssto,false);
      } else if(type==='cpu'){
        show(common,false); show(sm,false); show(sc,true); show(sg,false); show(smem,false); show(ssto,false);
      } else if(type==='gpu'){
        show(common,false); show(sm,false); show(sc,false); show(sg,true); show(smem,false); show(ssto,false);
      } else if(type==='memory'){
        show(common,false); show(sm,false); show(sc,false); show(sg,false); show(smem,true); show(ssto,false);
      } else if(type==='storage'){
        show(common,false); show(sm,false); show(sc,false); show(sg,false); show(smem,false); show(ssto,true);
      } else {
        show(common,true); show(sm,true); show(sc,true); show(sg,true); show(smem,true); show(ssto,true);
      }
    }
    function openModal(type){ setModalVisibility(type); modal.style.display='flex'; document.body.style.overflow='hidden'; }
    function closeModal(){ modal.style.display='none'; document.body.style.overflow=''; }
    shadow.addEventListener('click', function(e){ var t=e.target; if(!(t instanceof Element)) return; var op=t.closest('.dbw-open-modal, .dbw-filter-button'); if(!op) return; e.preventDefault(); var pf=op.getAttribute('data-prefocus') || op.getAttribute('data-open'); var type = pf==='manufacturer' ? 'maker' : pf; openModal(type); if(pf==='gpu'){ qs('#dbw-modal-gpu', root).scrollIntoView({behavior:'smooth'});} if(pf==='manufacturer'){ qs('#dbw-modal-makers', root).scrollIntoView({behavior:'smooth'});} if(pf==='cpu'){ qs('#dbw-modal-cpu', root).scrollIntoView({behavior:'smooth'});} if(pf==='memory'){ qs('#dbw-modal-memory', root).scrollIntoView({behavior:'smooth'});} if(pf==='storage'){ qs('#dbw-modal-storage', root).scrollIntoView({behavior:'smooth'});} });
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });

    // Top small search
    var topKw = qs('#dbw-keyword-top', root);
    var searchBtn = qs('#dbw-search-top', root);

    // Modal fields
    var kw = qs('#dbw-keyword', root), pmin = qs('#dbw-price-min', root), pmax = qs('#dbw-price-max', root), desktop = qs('#dbw-desktop', root), notebook = qs('#dbw-notebook', root);
    buildPriceOptions(pmin); buildPriceOptions(pmax);
    var pminTop = qs('#dbw-price-min-top', root), pmaxTop = qs('#dbw-price-max-top', root);
    buildPriceOptions(pminTop); buildPriceOptions(pmaxTop);

    // Load data
    fetch(BASE + '/api/db-widget', { cache: 'no-cache' })
      .then(function(r){ if(!r.ok) throw new Error('api'); return r.json(); })
      .then(function(data){
        // modal lists
        renderChips(root, '#dbw-modal-makers', (data.manufacturers||[]).map(function(m){return m.name;}), 'maker');
        renderHierarchy(root, '#dbw-modal-cpu', (data.cpuOptionsHierarchy||{}), 'cpu');
        renderHierarchy(root, '#dbw-modal-gpu', (data.gpuOptionsHierarchy||{}), 'gpu');
        renderChips(root, '#dbw-modal-memory', (data.memories||[]), 'memory');
        renderChips(root, '#dbw-modal-storage', (data.storages||[]), 'storage');
      })
      .catch(function(){ /* ignore */ });

    // series -> leaf cascade
    shadow.addEventListener('change', function(e){ var t=e.target; if(!(t instanceof Element)) return; if(t.classList.contains('dbw-series')){ var group = t.closest('.dbw-series-group'); var key=t.getAttribute('data-key'); if(!group||!key) return; qsa('.dbw-leaf[data-key="'+key+'"]', group).forEach(function(i){ i.checked = t.checked; }); }});

    // selectable chips removed (now unified to checkboxes)

    // Clear/Search
    var submitBtn = qs('#dbw-submit', root);
    function buildParamsFromTop(){
      var params={};
      var s=(topKw&&topKw.value||'').trim(); if(s) params.keyword=s;
      if(pminTop&&pminTop.value) params.priceMin=pminTop.value;
      if(pmaxTop&&pmaxTop.value) params.priceMax=pmaxTop.value;
      var plus=[]; if(qs('#dbw-shape-desktop', root).checked) plus.push('desktop'); if(qs('#dbw-shape-notebook', root).checked) plus.push('notebook'); if(!(plus.length===1 && plus[0]==='desktop')){ if(plus.length) params.plus=plus; }
      // selections from modal (chips/checkboxes)
      params.maker = qsa('#dbw-modal-makers .dbw-chip.selected', root).map(function(a){return a.getAttribute('data-value');});
      params.cpu = collectChecked(root,'cpu');
      params.gpu = collectChecked(root,'gpu');
      params.memory = qsa('#dbw-modal-memory .dbw-chip.selected', root).map(function(a){return a.getAttribute('data-value');});
      params.storage = qsa('#dbw-modal-storage .dbw-chip.selected', root).map(function(a){return a.getAttribute('data-value');});
      return params;
    }
    if(searchBtn) searchBtn.addEventListener('click', function(e){ e.preventDefault(); go(buildParamsFromTop()); });
    // removed clear-top button

    if(submitBtn) submitBtn.addEventListener('click', function(e){ e.preventDefault(); var params={}; var s=(kw&&kw.value||'').trim(); if(s) params.keyword=s; if(pmin&&pmin.value) params.priceMin=pmin.value; if(pmax&&pmax.value) params.priceMax=pmax.value; var plus=[]; if(desktop&&desktop.checked) plus.push('desktop'); if(notebook&&notebook.checked) plus.push('notebook'); if(!(plus.length===1 && plus[0]==='desktop')){ if(plus.length) params.plus=plus; } params.maker = qsa('#dbw-modal-makers .dbw-chip.selected', root).map(function(a){return a.getAttribute('data-value');}); params.cpu = collectChecked(root,'cpu'); params.gpu = collectChecked(root,'gpu'); params.memory = qsa('#dbw-modal-memory .dbw-chip.selected', root).map(function(a){return a.getAttribute('data-value');}); params.storage = qsa('#dbw-modal-storage .dbw-chip.selected', root).map(function(a){return a.getAttribute('data-value');}); go(params); });
  }

  // Entry
  try {
    var script = document.currentScript;
    var mountSel = script && script.getAttribute('data-mount');
    var mountNode = mountSel ? document.querySelector(mountSel) : null;
    if(!mountNode){
      // fallback: create a container just after the script tag
      mountNode = document.createElement('div');
      if(script && script.parentNode){ script.parentNode.insertBefore(mountNode, script.nextSibling); }
    }
    mount(mountNode);
  } catch (e) {
    console.error('[db-embed] init failed:', e);
  }
})();


