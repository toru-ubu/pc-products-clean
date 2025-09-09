(function(){
  function ready(fn){ if(document.readyState!=='loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }

  ready(function(){
    try {
      var modal = document.getElementById('dbw-modal');
      if (!modal) return; // ウィジェットが無いページはスキップ

      var closeBtn = modal.querySelector('.modal-close');
      var form = document.getElementById('dbw-form');
      var keyInput = document.getElementById('dbw-keyword');
      var priceMin = document.getElementById('dbw-price-min');
      var priceMax = document.getElementById('dbw-price-max');
      var cbDesktop = document.getElementById('dbw-desktop');
      var cbNotebook = document.getElementById('dbw-notebook');
      var clearTop = document.getElementById('dbw-clear');
      var clearBottom = document.getElementById('dbw-clear-bottom');

      function openModal(){ modal.style.display='flex'; document.body.style.overflow='hidden'; }
      function closeModal(){ modal.style.display='none'; document.body.style.overflow=''; }

      // デリゲートでモーダル起動（後から挿入された要素にも反応）
      document.addEventListener('click', function(e){
        var target = e.target;
        if (!(target instanceof Element)) return;
        var opener = target.closest('.dbw-open-modal');
        if (!opener) return;
        e.preventDefault();
        openModal();
        var prefocus = opener.getAttribute('data-prefocus');
        if (prefocus === 'cpu') {
          var el = modal.querySelector('#dbw-cpu'); if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
        } else if (prefocus === 'gpu') {
          var eg = modal.querySelector('#dbw-gpu'); if (eg) eg.scrollIntoView({behavior:'smooth', block:'start'});
        } else if (prefocus === 'manufacturer') {
          try { modal.scrollTo({top:0, behavior:'instant'}); } catch(_) { modal.scrollTop = 0; }
        }
      }, false);

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });

      // 階層の展開/選択（存在する場合のみ）
      modal.querySelectorAll('.expand-button').forEach(function(btn){
        btn.addEventListener('click', function(){
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          var container = btn.closest('.filter-series-group')?.querySelector('.filter-models-container');
          btn.setAttribute('aria-expanded', String(!expanded));
          if (container) container.style.display = expanded ? 'none' : 'grid';
        });
      });

      modal.querySelectorAll('.dbw-series-checkbox').forEach(function(cb){
        cb.addEventListener('change', function(){
          var group = cb.closest('.filter-series-group');
          if (!group) return;
          group.querySelectorAll('.dbw-model-checkbox').forEach(function(m){ m.checked = cb.checked; });
        });
      });

      function clearAll(){
        if (keyInput) keyInput.value='';
        if (priceMin) priceMin.value='';
        if (priceMax) priceMax.value='';
        if (cbDesktop) cbDesktop.checked=true;
        if (cbNotebook) cbNotebook.checked=false;
        modal.querySelectorAll('input[type=checkbox]').forEach(function(c){ c.checked=false; });
      }

      if (clearTop) clearTop.addEventListener('click', clearAll);
      if (clearBottom) clearBottom.addEventListener('click', clearAll);

      function buildAndGo(){
        var p = new URLSearchParams();
        var kw = (keyInput && keyInput.value || '').trim();
        if (kw) p.set('keyword', kw);
        if (priceMin && priceMin.value) p.set('priceMin', priceMin.value);
        if (priceMax && priceMax.value) p.set('priceMax', priceMax.value);

        function collect(name){
          return Array.prototype.map.call(modal.querySelectorAll('input[data-type='+name+']:checked'), function(i){ return i.value; });
        }
        var makers = collect('maker'); if (makers.length) p.set('maker', makers.join(','));
        var cpus = collect('cpu'); if (cpus.length) p.set('cpu', cpus.join(','));
        var gpus = collect('gpu'); if (gpus.length) p.set('gpu', gpus.join(','));
        var mem = collect('memory'); if (mem.length) p.set('memory', mem.join(','));
        var sto = collect('storage'); if (sto.length) p.set('storage', sto.join(','));

        var plus = [];
        if (cbDesktop && cbDesktop.checked) plus.push('desktop');
        if (cbNotebook && cbNotebook.checked) plus.push('notebook');
        if (!(plus.length===1 && plus[0]==='desktop')) { if (plus.length) p.set('plus', plus.join(',')); }

        var qs = p.toString();
        window.location.href = qs ? '/db/search?'+qs : '/db/search';
      }

      if (form) form.addEventListener('submit', function(e){ e.preventDefault(); buildAndGo(); });
    } catch (e) {
      console.error('[db-widget] init error:', e);
    }
  });
})();


