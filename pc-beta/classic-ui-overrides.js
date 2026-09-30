(() => {
  function injectClassicUiStyles() {
    if (document.getElementById('classic-ui-overrides-style')) return;
    const style = document.createElement('style');
    style.id = 'classic-ui-overrides-style';
    style.textContent = `
      .classicRefNote{display:none}

      .runeClient.classicSkinned{box-sizing:border-box;max-width:100%;padding:5px 4px 10px;overflow-x:clip;background:#08111a}
      .runeClient.classicSkinned .runeClientTop{min-width:0}
      .runeClient.classicSkinned .runeClientLayout{display:grid;grid-template-columns:minmax(72px,1fr) minmax(0,4fr);grid-template-areas:"inventory board" "stats stats";align-items:stretch;gap:7px;width:100%;min-width:0;padding:5px;background:#14170f;border:1px solid #8b682e}
      .runeClient.classicSkinned .runeInventory,.runeClient.classicSkinned .runeBoardPane,.runeClient.classicSkinned .runeClientStats{min-width:0;height:auto}
      .runeClient.classicSkinned .runeBoardPane{grid-area:board;order:initial;padding:4px;background:#dfbf72}
      .runeClient.classicSkinned .runeBoardPane h3{height:31px;margin:0 0 4px;padding-top:8px;color:#2a1b0a;font-size:13px}
      .runeClient.classicSkinned .runeBoard{width:100%;height:auto;min-height:0;aspect-ratio:197.5/255.1;background:
        radial-gradient(circle at 27% 67%,rgba(154,107,37,.22) 0 8%,transparent 8.5%),
        radial-gradient(circle at 61% 41%,rgba(154,107,37,.2) 0 7%,transparent 7.5%),
        linear-gradient(#f1daa5,#dfbc72 72%,#d0a95d);border:1px solid #866530;box-shadow:inset 0 0 28px rgba(120,80,20,.27)}
      .runeClient.classicSkinned .runeBoardActions{right:8px;bottom:8px;width:min(164px,calc(100% - 16px));gap:6px}
      .runeClient.classicSkinned .runeBoardActions button{height:34px;background:#312311;color:#fff0bd;border:1px solid #b38a45;font-size:11px}
      .runeClient.classicSkinned .runeSocket{width:30px;height:30px;padding:3px;box-shadow:0 2px 5px rgba(71,42,8,.34)}
      .runeClient.classicSkinned .runeSocket.quint{width:50px;height:50px;padding:5px}
      .runeClient.classicSkinned .runeSocketIcon{display:block;width:100%;height:100%;object-fit:contain}
      .runeClient.classicSkinned .runeInventory{grid-area:inventory;order:initial;display:flex;flex-direction:column;max-height:none;overflow:hidden;background:linear-gradient(#252c24,#121712);color:#f7edcf;border:1px solid #756744}
      .runeClient.classicSkinned .runeClientStats{grid-area:stats;order:initial;width:100%;overflow:visible;background:linear-gradient(#282f27,#151a15);color:#f2e8c8;border:1px solid #756744}
      .runeClient.classicSkinned .runeInventory h4,.runeClient.classicSkinned .runeClientStats h4{height:32px;color:#fff0bd;background:linear-gradient(#514a32,#292719);font-size:12px}
      .runeClient.classicSkinned .runeInventoryTabs{display:grid;grid-template-columns:1fr;gap:2px;padding:4px;background:#111713;border-bottom:1px solid #756744}
      .runeClient.classicSkinned .runeInventoryTabs button{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px;min-height:34px;padding:3px 5px;color:#d6d8cf;background:#202723;border:1px solid #4f554a;font-size:9px;text-align:left}
      .runeClient.classicSkinned .runeInventoryTabs button b{font-size:8px}.runeClient.classicSkinned .runeInventoryTabs button.on{color:#fff4c0;background:linear-gradient(#69501c,#261d0b);border-color:#d2a94a}
      .runeClient.classicSkinned .runeInventoryTabs button.mark{border-left:4px solid #aa4036}.runeClient.classicSkinned .runeInventoryTabs button.seal{border-left:4px solid #c9a32f}.runeClient.classicSkinned .runeInventoryTabs button.glyph{border-left:4px solid #3e7eaa}.runeClient.classicSkinned .runeInventoryTabs button.quint{border-left:4px solid #9e6b9f}
      .runeClient.classicSkinned .runeInventoryFilter{position:static;grid-template-columns:minmax(0,1fr) auto;align-items:center;padding:6px 5px;color:#fff0bd;background:linear-gradient(#315b88,#17395f)}
      .runeClient.classicSkinned .runeInventoryFilter span{font-size:11px}.runeClient.classicSkinned .runeInventoryFilter b{color:#dcecff;font-size:10px}
      .runeClient.classicSkinned .runeInventoryList{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;background:#111711}
      .runeClient.classicSkinned .runeInventoryList li>button{grid-template-columns:36px minmax(0,1fr) auto;gap:8px;min-height:48px;padding:5px 8px;color:#fff2d0;background:linear-gradient(90deg,#2a3229,#171d17);border-left:3px solid transparent}
      .runeClient.classicSkinned .runeInventoryList li>button.available:hover,.runeClient.classicSkinned .runeInventoryList li>button.available:active{background:linear-gradient(90deg,#3a4538,#20281f)}
      .runeClient.classicSkinned .runeInventoryList li>button.selected{color:#fff8dc;background:linear-gradient(90deg,#4b4025,#272216);border-left-color:#efc85f;box-shadow:inset 0 0 0 1px #8f7436}
      .runeClient.classicSkinned .runeInventoryList li>button.unavailable{color:#979d91;background:#171b17;opacity:.72}
      .runeClient.classicSkinned .runeInventoryList .pic.ri{width:34px!important;height:34px!important;min-width:34px}
      .runeClient.classicSkinned .runeInventoryList .pic.noimg i{display:none}
      .runeClient.classicSkinned .runeInventoryList li b{color:inherit;font-size:11px;line-height:1.25}
      .runeClient.classicSkinned .runeInventoryList li small{margin-top:3px;color:#c3cbbd;font-size:9px;line-height:1.25}
      .runeClient.classicSkinned .runeInventoryList li>button.unavailable small{color:#858c82}
      .runeClient.classicSkinned .runeInventoryList li em{color:#b6bdaf;font-size:10px}.runeClient.classicSkinned .runeInventoryList li em.on{color:#ffe077;font-weight:800}
      .runeClient.classicSkinned .runeInventoryFooter{height:34px;color:#fff3cd;font-size:11px}
      .runeClient.classicSkinned .runeTotal{margin:7px;padding:8px;color:#ffe078;font-size:17px}
      .runeClient.classicSkinned .runeClientStats p{margin:7px;padding:8px;color:#e8e1ca;background:#1d231d;border-color:#4d5748;font-size:11px;line-height:1.5}
      .runeClient.classicSkinned .runeClientStats dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:0 7px 7px}
      .runeClient.classicSkinned .runeClientStats dl div{padding:7px;color:#ded7c0;background:#1a201a;border:1px solid #454e41;font-size:10px;line-height:1.4}
      .runeClient.classicSkinned .runeClientStats dt{color:#ded7c0}.runeClient.classicSkinned .runeClientStats dd{color:#ffe078;font-weight:700}
      .runeClient.classicSkinned .runeClientStats dl div.empty{grid-column:1/-1;color:#aeb5a8}
      .runeClient.classicSkinned .runeClientHint{min-width:0;margin:6px 4px 0;color:#c9cdd2;font-size:10px}
      .runeClient.classicSkinned .runeSocket.mark{border-color:#8c3029}
      .runeClient.classicSkinned .runeSocket.seal{border-color:#8b7624}
      .runeClient.classicSkinned .runeSocket.glyph{border-color:#315f88}
      .runeClient.classicSkinned .runeSocket.quint{border-color:#8f5c39}

      @media(max-width:360px){
        .runeClient.classicSkinned .runeClientLayout{grid-template-columns:minmax(60px,1fr) minmax(0,4fr);gap:4px;padding:3px}
        .runeClient.classicSkinned .runeInventoryTabs button{min-height:31px;padding-inline:3px;font-size:8px}
        .runeClient.classicSkinned .runeInventoryList li>button{grid-template-columns:24px minmax(0,1fr) auto;gap:3px;padding-inline:3px}
        .runeClient.classicSkinned .runeInventoryList .pic.ri{width:24px!important;height:24px!important;min-width:24px}
        .runeClient.classicSkinned .runeSocket{width:25px;height:25px}.runeClient.classicSkinned .runeSocket.quint{width:42px;height:42px}
      }

      .masteryShell.classicMastery{box-sizing:border-box;max-width:100%;margin:4px;padding:5px;overflow-x:clip;background:#d8c084;color:#1d150d;border:1px solid #8a6c35}
      .masteryShell.classicMastery h3{min-width:0;margin:3px 2px 7px;color:#22170c;font-size:13px}
      .masteryShell.classicMastery h3 small{color:#5a4527}
      .masteryShell.classicMastery .masteryTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-bottom:7px}
      .masteryShell.classicMastery .masteryTabs button{height:44px;color:#f3e7bd;background:linear-gradient(#3b3526,#201d15);border:1px solid #837044;font-size:13px;font-weight:750}
      .masteryShell.classicMastery .masteryTabs button.on{color:#261a09;background:linear-gradient(#f1d078,#b5842b);border-color:#ffe39d;box-shadow:inset 0 0 0 1px #fff0bc66}
      .masteryShell.classicMastery .masteryBoards{display:block;width:100%;min-width:0;border:1px solid #4a331b}
      .masteryShell.classicMastery .masteryColumn{display:flex;flex-direction:column;width:100%;min-width:0;min-height:570px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
      .masteryShell.classicMastery .masteryColumn.branch-0{background:linear-gradient(90deg,rgba(112,7,9,.95),rgba(78,4,7,.96)),radial-gradient(circle at 50% 75%,#b52124,#4b0709 65%)}
      .masteryShell.classicMastery .masteryColumn.branch-1{background:linear-gradient(90deg,rgba(9,49,108,.96),rgba(5,35,78,.96)),radial-gradient(circle at 50% 75%,#2377bb,#08284f 65%)}
      .masteryShell.classicMastery .masteryColumn.branch-2{background:linear-gradient(90deg,rgba(24,91,12,.96),rgba(15,62,8,.96)),radial-gradient(circle at 50% 75%,#45a123,#123d0a 65%)}
      .masteryShell.classicMastery .masteryColumnHead{padding:8px 3px;color:#fff0c7;font-size:14px;font-weight:750;text-align:center;border-bottom:1px solid rgba(255,255,255,.22)}
      .masteryShell.classicMastery .masteryTreeGrid{display:grid;gap:5px;min-width:0;padding:8px 7px}
      .masteryShell.classicMastery .masteryRow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;min-width:0;min-height:86px}
      .masteryShell.classicMastery .masteryCell{min-width:0}
      .masteryShell.classicMastery .masteryCell.empty{visibility:hidden}
      .masteryShell.classicMastery .masteryCell.locked{opacity:.43;filter:grayscale(1)}
      .masteryShell.classicMastery .masteryCell.needs .mnode{box-shadow:0 0 0 1px rgba(255,120,120,.55) inset}
      .masteryShell.classicMastery .mnode{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:100%;min-width:0;min-height:82px;padding:5px 2px 3px;border:1px solid #20150c;background:rgba(0,0,0,.58);color:#fff;touch-action:manipulation}
      .masteryShell.classicMastery .mnode.has{border-color:#e0bb54;box-shadow:0 0 0 1px #8aca39 inset}
      .masteryShell.classicMastery .mnode.full{box-shadow:0 0 0 2px #efe06c inset}
      .masteryShell.classicMastery .mnode em{position:absolute;right:3px;top:3px;margin:0;padding:1px 3px;background:rgba(0,0,0,.82);color:#fff7d8;font-style:normal;font-size:10px}
      .masteryShell.classicMastery .mnode .pic{position:relative;inset:auto;display:grid;flex:none;place-items:center;width:100%;height:49px;border:0}
      .masteryShell.classicMastery .mnode img{width:48px;height:48px;object-fit:cover;border:1px solid #111}
      .masteryShell.classicMastery .masteryLabel{display:-webkit-box;width:100%;min-width:0;margin-top:3px;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#fff3d8;font-size:10px;line-height:1.18;text-align:center;overflow-wrap:anywhere;word-break:keep-all}
      .masteryShell.classicMastery .masteryTotals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;width:100%;min-width:0;margin-top:0}
      .masteryShell.classicMastery .masteryTotals div{min-width:0;padding:6px 1px;background:#ead8a8;border:1px solid #9a7b45;text-align:center;font-size:clamp(9px,2.6vw,12px)}
      .masteryShell.classicMastery .masteryDetail{min-width:0;margin-top:6px;background:#f4ead0;border:1px solid #9b804a;color:#20160b}
      .masteryShell.classicMastery .masteryDetail>div{min-width:0}
      .masteryShell.classicMastery .masteryDetail small,.masteryShell.classicMastery .masteryDetail em,.masteryShell.classicMastery .hint,.masteryShell.classicMastery .mnames{color:#5c4728}
      .masteryShell.classicMastery .masteryDetail p{color:#20160b;overflow-wrap:anywhere}
      .masteryShell.classicMastery .boardTop{min-width:0}
      .masteryShell.classicMastery .boardTop button{background:#352513;color:#f4dfa6;border:1px solid #8f6c35}
    `;
    document.head.appendChild(style);
  }

  const originalRunesPage = runesPage;
  const originalRunePaperPage = runePaperPage;
  const originalMstGrid = mstGrid;
  const masteryBranchLabel = branch => branch.key === 'o' && appLocale.getLocale() === 'en_US'
    ? 'Offense' : localized(branch.ko);
  runesPage = function () {
    if (!S.runeView) S.runeView = 'paper';
    return originalRunesPage();
  };

  runePaperPage = function () {
    const source = runeData();
    const sel = runePageState();
    const summary = runeSelectionSummary(source, sel);
    const slotNames = { mark: localized('빨강 표식'), seal: localized('노랑 인장'), glyph: localized('파랑 문양'), quint: localized('정수') };
    const activeSlot = slotNames[S.rslot] ? S.rslot : 'mark';
    const sockets = RUNE_SLOT_DEFS.map(([slot, , limit]) => {
      const selected = runeSelectionEntries(source, sel, slot);
      return Array.from({ length: limit }, (_, index) => runeSocketHtml(slot, index, selected[index])).join('');
    }).join('');
    const inventoryQuery = (S.rq || '').trim().toLowerCase();
    const runeLimits = { mark: 9, seal: 9, glyph: 9, quint: 3 };
    const usedBySlot = Object.fromEntries(Object.keys(runeLimits).map(slot => [
      slot,
      runeSelectionEntries(source, sel, slot).length,
    ]));
    const inventoryRows = source
      .filter(rune => rune.slot === activeSlot)
      .filter(rune => !inventoryQuery || `${rune.ko} ${runeName(rune)} ${rune.text || ''} ${appLocale.description('runes', rune)}`.toLowerCase().includes(inventoryQuery))
      .map(rune => {
        const count = Number(sel[rune.i]) || 0;
        const unavailable = !count && usedBySlot[rune.slot] >= runeLimits[rune.slot];
        const stateClass = count ? 'selected' : (unavailable ? 'unavailable' : 'available');
        return `<li><button class="${stateClass}" data-runei="${rune.i}" aria-pressed="${count ? 'true' : 'false'}"${unavailable ? ' aria-disabled="true"' : ''}>${pic(runeIconPath(rune), runeName(rune), 'ri')}<span><b>${esc(runeName(rune))}</b><small>${esc(appLocale.description('runes', rune) || rune.text || '')}</small></span><em class="${count ? 'on' : ''}">×${count}</em></button></li>`;
      })
      .join('');
    const page = runePageNumber();
    const sourceLabel = appMessage(`클래식 룬 ${source.length}종`, `クラシックルーン ${source.length}種`, `${source.length} Classic runes`);
    const statRows = Object.entries(summary.numeric).map(([key, value]) => `<div><dt>${esc(runeStatLabel(key))}</dt><dd>${esc(runeStatValue(key, value))}</dd></div>`).join('') || `<div class="empty"><dt>${localized('룬을 선택하면 적용 스탯이 표시됩니다.')}</dt></div>`;
    const slotTabs = RUNE_SLOT_DEFS.map(([slot, , limit]) => `<button class="${slot} ${slot === activeSlot ? 'on' : ''}" data-rslot="${slot}" aria-pressed="${slot === activeSlot}"><span>${slotNames[slot]}</span><b>${usedBySlot[slot]}/${limit}</b></button>`).join('');
    const selectedNames = summary.choices.map(({ rune, count }) => `<li><button type="button" data-rune-remove="${esc(rune.i)}" aria-label="${esc(runeName(rune))} ${localized('1개 해제')}"><b>${esc(runeName(rune))}</b><span>×${count}</span></button></li>`).join('');
    return `<section class="runeClient classicSkinned" aria-label="${appMessage('클래식 룬 페이지', 'クラシックルーンページ', 'Classic rune page')}">
      <div class="runeClientTop"><div class="runeClientSearch"><input id="runePaperQ" value="${esc(S.rq || '')}" placeholder="${localized('룬 검색')}" aria-label="${localized('룬 보관함 검색')}"><button data-act="runePaperSearch" aria-label="${localized('룬 검색')}">⌕</button></div><div class="runePageTabs" aria-label="${localized('룬 페이지 선택')}">${Array.from({ length: RUNE_PAGE_COUNT }, (_, index) => index + 1).map(number => `<button data-runepage="${number}" class="${page === number ? 'on' : ''}" aria-label="${localized('룬 페이지')} ${number}">${number}</button>`).join('')}</div><span>${page}/${RUNE_PAGE_COUNT}</span></div>
      <div class="runeClientLayout">
        <aside class="runeInventory" aria-label="${localized('룬 선택기')}"><h4>${localized('룬 보관함')}</h4><div class="runeInventoryTabs" role="group" aria-label="${localized('룬 색상 선택')}">${slotTabs}</div><div class="runeInventoryFilter"><span>${slotNames[activeSlot]}</span><b>${sourceLabel}</b></div><ul class="runeInventoryList">${inventoryRows || `<li class="empty">${localized('검색 결과가 없습니다.')}</li>`}</ul></aside>
        <div class="runeBoardPane" aria-label="${localized('완성 룬 페이지')}"><h3>${localized('룬 페이지')} ${page} · ${summary.total}/30</h3><div class="runeBoard"><i class="runeBoardOrnament one"></i><i class="runeBoardOrnament two"></i>${sockets}<div class="runeBoardActions"><button data-act="rpSave">${localized('저장')}</button><button data-act="rpReset">${localized('초기화')}</button></div></div><section class="runePaperNames" aria-label="${localized('장착한 룬 이름과 수량')}"><h4>${localized('장착한 룬')}</h4><ul>${selectedNames || `<li class="empty">${localized('장착한 룬이 없습니다.')}</li>`}</ul></section></div>
        <aside class="runeClientStats" aria-label="${localized('현재 적용된 룬 페이지 스탯')}"><h4>${localized('현재 적용된 룬 페이지 스탯')}</h4><b class="runeTotal">${summary.total}/30</b><p>${esc(summary.numericLabel)}</p><dl>${statRows}</dl></aside>
      </div>
      <p class="runeClientHint">${localized('룬 보관함에서 룬을 고르고 룬판에서 30개 편성을 확인합니다. 빈 소켓을 누르면 해당 색상으로 전환되고, 장착된 룬을 누르면 1개 해제됩니다.')}</p>
    </section>`;
  };

  function renderMasteryCell(branch, node, pts, interactive) {
    if (!node) return '<span class="masteryCell empty"></span>';
    const value = pts[node.id] || 0;
    const requiresMet = masteryRequirementsMet(node, pts);
    const rowPoints = masteryLowerPoints({ ...node, branch: branch.key }, pts);
    const rowOpen = rowPoints >= node.requiredPoints;
    const classes = ['masteryCell'];
    if (!rowOpen) classes.push('locked');
    if (!requiresMet) classes.push('needs');
    return `<span class="${classes.join(' ')}"><button class="mnode ${value ? 'has ' : ''}${value >= node.max ? 'full' : ''}" ${interactive ? `data-mst="${node.id}"` : 'disabled'} aria-label="${esc(masteryName(node))} ${value}/${node.max}" title="${esc(masteryName(node))} — ${esc(appLocale.description('masteries', node) || node.desc || '')}">${pic(masteryIconPath(node, value), masteryName(node), 'mi')}<small class="masteryLabel">${esc(masteryName(node))}</small><em>${value}/${node.max}</em></button></span>`;
  }

  mstGrid = function (interactive) {
    if (!MST.branches.length) return '<p class="hint">특성 데이터가 없습니다.</p>';
    const pts = mstState();
    const totals = MST.branches.map(branch => branch.nodes.reduce((sum, node) => sum + (pts[node.id] || 0), 0));
    const total = totals.reduce((sum, value) => sum + value, 0);
    const activeKey = S.mbranch || MST.branches[0].key;
    const activeBranch = MST.branches.find(branch => branch.key === activeKey) || MST.branches[0];
    const activeIndex = MST.branches.indexOf(activeBranch);
    const selected = activeBranch.nodes.find(node => node.id === S.masteryInfo) || activeBranch.nodes[0];
    const selectedBranch = activeBranch;
    const requirements = (selected.requires || []).map(requirement => {
      const parent = mstById[requirement.id];
      return `${parent ? masteryName(parent) : requirement.id} ${requirement.rank}${localized('포인트')}`;
    }).join(' · ');

    const tabs = MST.branches.map((branch, index) => `<button role="tab" aria-selected="${branch === activeBranch ? 'true' : 'false'}" data-mbranch="${branch.key}" class="${branch === activeBranch ? 'on' : ''}">${esc(masteryBranchLabel(branch))} <b>${totals[index]}</b></button>`).join('');
    const rowCount = Math.max(...activeBranch.nodes.map(node => node.row)) + 1;
    const rows = Array.from({ length: rowCount }, (_, row) => {
        const cells = Array.from({ length: 4 }, (_, col) => activeBranch.nodes.find(node => node.row === row && node.col === col) || null)
          .map(node => renderMasteryCell(activeBranch, node, pts, interactive)).join('');
        return `<div class="masteryRow">${cells}</div>`;
      }).join('');
    const activeTree = `<section class="masteryColumn branch-${activeIndex}" data-active-mastery="${activeBranch.key}"><div class="masteryColumnHead">${esc(masteryBranchLabel(activeBranch))} <b>${totals[activeIndex]}</b></div><div class="masteryTreeGrid">${rows}</div></section>`;

    const detail = `<section class="masteryDetail">${pic(masteryIconPath(selected, pts[selected.id] || 0), masteryName(selected), 'mdi')}<div><b>${esc(masteryName(selected))}</b><small>${appLocale.getLocale() === 'ko_KR' && selected.nameEn ? `${esc(selected.nameEn)} · ` : ''}${esc(masteryBranchLabel(selectedBranch))}</small><p>${editorialText(appLocale.description('masteries', selected) || selected.desc || '')}</p><em>${selected.requiredPoints ? `${localized('이 분기에')} ${selected.requiredPoints}${localized('포인트 필요')}` : localized('첫 번째 단계')}${requirements ? ` · ${localized('선행')}: ${esc(requirements)}` : ''}</em></div></section>`;

    return `<div class="masteryShell classicMastery">
      <h3>${localized('특성')} ${totals.join(' / ')} <small>(${localized('남은 포인트')} ${30 - total})</small></h3>
      <div class="masteryTabs" role="tablist" aria-label="특성 트리 선택">${tabs}</div>
      <div class="masteryBoards">${activeTree}</div>
      <div class="masteryTotals">${MST.branches.map((branch, index) => `<div>${esc(masteryBranchLabel(branch))}: <b>${totals[index]}</b></div>`).join('')}</div>
      ${detail}
      ${interactive ? '<div class="boardTop"><button data-act="mstReset">초기화</button></div>' : ''}
      <p class="hint">위 탭으로 공격 · 방어 · 보조 트리를 전환합니다. 포인트는 세 트리가 하나의 30포인트 상태를 공유하며, 탭하면 +1, 길게 누르기나 우클릭하면 −1입니다.</p>
      <details class="mnames"><summary>${localized('클래식 특성 이름')} ${MST.branches.reduce((total, branch) => total + branch.nodes.length, 0)}${localized('종')}</summary><p>${MST.branches.flatMap(branch => branch.nodes.map(node => esc(masteryName(node)))).join(' · ')}</p></details>
    </div>`;
  };

  /*
   * Activate the project-owned 30-socket rune geometry requested for the
   * current UI. Facts and exact icons come only from the current Riot Classic/Jade dataset;
   * only exact source rune mappings are rendered, with no guessed
   * Classic values or third-party APK rune artwork.
   */
  injectClassicUiStyles();
  window.__classicUiOverridesReady = true;
})();
