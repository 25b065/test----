// 간단한 로컬 저장 기반 감정 나무
const leaves = Array.from(document.querySelectorAll('.leaf'));
const select = document.getElementById('emotion-select');
const reason = document.getElementById('reason');
const colorPicker = document.getElementById('color-picker');
const autoColorBtn = document.getElementById('auto-color');
const saveBtn = document.getElementById('save-leaf');
const clearBtn = document.getElementById('clear-leaf');
const selectedInfo = document.getElementById('selected-info');
const adviceBox = document.getElementById('advice');
const gratitudeListEl = document.getElementById('gratitude-list');
const saveGratitudeBtn = document.getElementById('save-gratitude');
const exportBtn = document.getElementById('export');
const importBtn = document.getElementById('import');
const importFile = document.getElementById('import-file');
const combineModal = document.getElementById('combine-modal');
const modalGratitudeList = document.getElementById('modal-gratitude-list');
const modalSaveBtn = document.getElementById('modal-save');
const combineEffect = document.getElementById('combine-effect');
const archiveBtn = document.getElementById('archive-btn');
const archiveModal = document.getElementById('archive-modal');
const archiveList = document.getElementById('archive-list');
const archiveClose = document.getElementById('archive-close');
const gratitudeArchiveBtn = document.getElementById('gratitude-archive-btn');
const gratitudeArchiveModal = document.getElementById('gratitude-archive-modal');
const gratitudeArchiveList = document.getElementById('gratitude-archive-list');
const gratitudeArchiveClose = document.getElementById('gratitude-archive-close');

let state = {

  leaves: Array(6).fill(null),
  gratitude: Array(10).fill('')
};
// combined flag persists whether tree is visually combined
state.combined = true;
let selectedIndex = null;

function loadState(){
  try{
    const raw = localStorage.getItem('emotion-tree-v1');
    if(raw) state = JSON.parse(raw);
  }catch(e){console.error(e)}
}

function isFirstVisit(){
  return !localStorage.getItem('emotion-tree-v1');
}

function saveState(){
  localStorage.setItem('emotion-tree-v1', JSON.stringify(state));
}

// save gratitude list as a separate archive
function saveGratitudeArchive(){
  const list = JSON.parse(localStorage.getItem('gratitude-archives')||'[]');
  const item = { id: Date.now(), items: state.gratitude.slice(), created: new Date().toISOString() };
  list.push(item);
  localStorage.setItem('gratitude-archives', JSON.stringify(list));
  return item;
}

function renderGratitudeArchiveList(){
  gratitudeArchiveList.innerHTML = '';
  const list = JSON.parse(localStorage.getItem('gratitude-archives')||'[]');
  if(!list.length) gratitudeArchiveList.innerHTML = '<p>저장된 감사가 없습니다.</p>';
  list.slice().reverse().forEach(g=>{
    const el = document.createElement('div'); el.className='gratitude-item';
    el.innerHTML = `<div class="archive-meta">${new Date(g.created).toLocaleString()}</div><ul>${g.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    gratitudeArchiveList.appendChild(el);
  });
}

function saveToArchive(name){
  const archives = JSON.parse(localStorage.getItem('emotion-tree-archives')||'[]');
  const item = { id: Date.now(), name: name||`나무 ${archives.length+1}`, state: JSON.parse(JSON.stringify(state)), created: new Date().toISOString() };
  archives.push(item);
  localStorage.setItem('emotion-tree-archives', JSON.stringify(archives));
  return item;
}

function loadFromArchive(id){
  const archives = JSON.parse(localStorage.getItem('emotion-tree-archives')||'[]');
  const found = archives.find(a=>a.id===id);
  if(found){ state = found.state; saveState(); renderAll(); }
}

function deleteArchive(id){
  let archives = JSON.parse(localStorage.getItem('emotion-tree-archives')||'[]');
  archives = archives.filter(a=>a.id!==id);
  localStorage.setItem('emotion-tree-archives', JSON.stringify(archives));
  renderArchiveList();
}

function renderArchiveList(){
  archiveList.innerHTML = '';
  const archives = JSON.parse(localStorage.getItem('emotion-tree-archives')||'[]');
  if(!archives.length) archiveList.innerHTML = '<p>저장된 나무가 없습니다.</p>';
  archives.slice().reverse().forEach(a=>{
    const el = document.createElement('div'); el.className='archive-item';
    el.innerHTML = `<div><div><strong>${escapeHtml(a.name)}</strong></div><div class="archive-meta">생성: ${new Date(a.created).toLocaleString()}</div></div>`;
    const controls = document.createElement('div');
    const loadBtn = document.createElement('button'); loadBtn.textContent='불러오기'; loadBtn.addEventListener('click', ()=>{ if(confirm('이 나무로 불러오시겠습니까? 현재 작업 중인 내용은 덮어써집니다.')){ loadFromArchive(a.id); closeArchiveModal(); }});
    const delBtn = document.createElement('button'); delBtn.textContent='삭제'; delBtn.style.marginLeft='8px'; delBtn.addEventListener('click', ()=>{ if(confirm('정말 삭제하시겠습니까?')) deleteArchive(a.id); });
    controls.appendChild(loadBtn); controls.appendChild(delBtn);
    el.appendChild(controls);
    archiveList.appendChild(el);
  });
}

function renderLeaves(){
  leaves.forEach((el, i)=>{
    const info = state.leaves[i];
    if(info){
  el.dataset.emotion = info.emotion;
  el.title = info.reason || info.emotion;
  if(info.color) el.style.background = info.color; else el.style.background = '';
    }else{
      delete el.dataset.emotion;
      el.title = '';
  el.style.background = '';
    }
  });
  // tree combined visual
  const treeEl = document.querySelector('.tree');
  if(state.combined) treeEl.classList.add('combined'); else treeEl.classList.remove('combined');
  // apply saved positions (if any)
  leaves.forEach((el,i)=>{
    const info = state.leaves[i];
    if(info && info.pos){
      el.style.position = 'absolute';
      el.style.left = info.pos.left;
      el.style.top = info.pos.top;
    } else {
      // restore default positioning by clearing inline pos when no saved pos
      el.style.position = '';
      // don't remove left/top if combined (leaves move to trunk via CSS)
    }
  });
}

function renderGratitude(){
  gratitudeListEl.innerHTML = '';
  for(let i=0;i<10;i++){
    const input = document.createElement('input');
    input.placeholder = `${i+1}. 감사한 일`;
    input.value = state.gratitude[i] || '';
    input.dataset.index = i;
    input.addEventListener('input',e=>{ state.gratitude[i]=e.target.value });
    gratitudeListEl.appendChild(input);
  }

  // modal 목록도 동기화
  modalGratitudeList.innerHTML = '';
  for(let i=0;i<10;i++){
    const input = document.createElement('input');
    input.placeholder = `${i+1}. 감사한 일`;
    input.value = state.gratitude[i] || '';
    input.dataset.index = i;
    input.addEventListener('input',e=>{ state.gratitude[i]=e.target.value; gratitudeListEl.querySelectorAll('input')[i].value = e.target.value; });
    modalGratitudeList.appendChild(input);
  }
}

function updateSelectedPanel(){
  if(selectedIndex===null){
    selectedInfo.innerHTML = '<p>잎을 클릭해 감정과 이유를 적어보세요.</p>';
    reason.value = '';
    select.value = 'neutral';
  colorPicker.value = '#7bb451';
    clearBtn.disabled = true;
    saveBtn.disabled = true;
    return;
  }
  const info = state.leaves[selectedIndex];
  selectedInfo.innerHTML = `<p>잎 ${selectedIndex+1} 선택됨</p>`;
  if(info){
    select.value = info.emotion || 'neutral';
    reason.value = info.reason || '';
  clearBtn.disabled = false;
  colorPicker.value = info.color || '#7bb451';
  }else{
    select.value = 'neutral';
    reason.value = '';
    clearBtn.disabled = true;
  colorPicker.value = '#7bb451';
  }
  saveBtn.disabled = false;
}

function pickLeaf(i){
  leaves.forEach(l=>l.classList.remove('selected'));
  const el = leaves[i];
  el.classList.add('selected');
  selectedIndex = i;
  updateSelectedPanel();
}

leaves.forEach((el,i)=>{
  el.addEventListener('click',()=> pickLeaf(i));
});

// drag & drop positioning for leaves
leaves.forEach((el, i)=>{
  let dragging = false;
  let startX=0, startY=0, origLeft=0, origTop=0;
  el.addEventListener('mousedown', (e)=>{
    dragging = true; el.classList.add('dragging');
    startX = e.clientX; startY = e.clientY;
    const rect = el.getBoundingClientRect();
    origLeft = rect.left + window.scrollX; origTop = rect.top + window.scrollY;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    el.style.position = 'absolute';
    el.style.left = (origLeft + dx - el.parentElement.getBoundingClientRect().left) + 'px';
    el.style.top = (origTop + dy - el.parentElement.getBoundingClientRect().top) + 'px';
  });
  window.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging = false; el.classList.remove('dragging');
    // save pos
    state.leaves[i] = state.leaves[i] || {};
    state.leaves[i].pos = { left: el.style.left, top: el.style.top };
    saveState();
  });
});

saveBtn.addEventListener('click', ()=>{
  if(selectedIndex===null) return;
  const existing = state.leaves[selectedIndex] || {};
  state.leaves[selectedIndex] = { ...existing, emotion: select.value, reason: reason.value, color: colorPicker.value };
  saveState();
  renderLeaves();
  generateAdvice();
  checkCombineCondition();
});

// 즉시 색상 적용: 색상 선택 시 선택된 잎의 색을 변경하고 저장
colorPicker.addEventListener('input', ()=>{
  if(selectedIndex===null) return;
  const el = leaves[selectedIndex];
  // apply color immediately
  el.style.background = colorPicker.value;
  // persist in state
  const existing = state.leaves[selectedIndex] || {};
  state.leaves[selectedIndex] = { ...existing, color: colorPicker.value };
  saveState();
});

clearBtn.addEventListener('click', ()=>{
  if(selectedIndex===null) return;
  state.leaves[selectedIndex] = null;
  saveState();
  renderLeaves();
  updateSelectedPanel();
  generateAdvice();
});

autoColorBtn.addEventListener('click', ()=>{
  const map = {
    happy: '#ffd66b',
    sad: '#6fa8ff',
    angry: '#ff6b6b',
    anxious: '#b58cff',
    grateful: '#66d48e',
    neutral: '#cfcfcf'
  };
  const em = select.value || 'neutral';
  colorPicker.value = map[em] || '#7bb451';
});

saveGratitudeBtn.addEventListener('click', ()=>{
  saveState();
  generateAdvice();
  alert('감사 내용이 저장되었습니다.');
});

// 모달 저장
modalSaveBtn.addEventListener('click', ()=>{
  // 최소 10개가 모두 입력되었는지 확인
  const all = state.gratitude.every(g=> g && g.trim().length>0);
  if(!all){ alert('감사한 일 10가지를 모두 적어주세요.'); return; }
  saveState();
  closeCombineModal();
  alert('축하합니다 — 오늘의 나무가 완성되었습니다!');
});

exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'emotion-tree.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const txt = await f.text();
  try{ state = JSON.parse(txt); saveState(); renderAll(); alert('데이터를 불러왔습니다.'); }
  catch(err){ alert('잘못된 파일입니다.'); }
});

function generateAdvice(){
  // 단순 규칙 기반 생성: 가장 최근 저장된 감정들에서 우선순위로 조언을 만듦
  const emotions = state.leaves.filter(Boolean).map(l=>l.emotion);
  let primary = emotions.length? emotions[emotions.length-1] : 'neutral';

  // if any angry/sad present, prioritize them
  if(emotions.includes('angry')) primary = 'angry';
  else if(emotions.includes('sad')) primary = 'sad';
  else if(emotions.includes('anxious')) primary = 'anxious';
  else if(emotions.includes('happy')) primary = 'happy';
  else if(emotions.includes('grateful')) primary = 'grateful';

  const gratitude = state.gratitude.filter(Boolean);

  const templates = {
    happy: {
      comfort: '오늘 좋은 일이 있었네요. 그 기분을 오래 기억하려면 작은 메모나 사진을 남겨보세요.',
      solution: '행복을 다른 사람과 나눠보세요. 감사 메시지를 전하거나 축하해보세요.',
      feedback: '이 기분을 만든 행동을 기록해 다음에도 의도적으로 해보세요.'
    },
    sad: {
      comfort: '지금은 힘들 수 있어요. 감정을 인정하고 천천히 쉬어도 괜찮습니다.',
      solution: '가까운 사람에게 상황을 이야기하거나 짧은 산책으로 기분 전환해보세요.',
      feedback: '무엇이 가장 아팠는지 한 문장으로 적어보면 정리가 됩니다.'
    },
    angry: {
      comfort: '화가 날 때는 감정이 매우 강합니다. 깊게 숨을 쉬어보세요.',
      solution: '감정을 폭발시키기 전, 5분 동안 다른 활동(스트레칭, 물 마시기)을 해보세요.',
      feedback: '화가 난 이유와 원하는 결과를 적고, 작은 다음 행동을 정하세요.'
    },
    anxious: {
      comfort: '불안은 예상과 통제의 불확실성에서 옵니다. 지금 여기로 돌아오세요.',
      solution: '호흡 연습(4-4-4)이나 작은 체크리스트로 과제를 나눠보세요.',
      feedback: '가장 걱정되는 항목 하나를 골라 내일 할 작은 행동을 적어보세요.'
    },
    grateful: {
      comfort: '감사의 순간을 발견하셨네요. 그 느낌을 음미해보세요.',
      solution: '감사한 사람에게 메시지를 전하거나 감사 일기를 써보세요.',
      feedback: '감사의 원인을 기록해 반복할 수 있는 행동을 찾아보세요.'
    },
    neutral: {
      comfort: '오늘 하루를 천천히 되돌아보는 시간입니다.',
      solution: '간단한 루틴(정리, 짧은 산책)으로 마무리해보세요.',
      feedback: '작은 성취를 찾아 적어보면 내일에 도움이 됩니다.'
    }
  };

  const chosen = templates[primary] || templates.neutral;
  let text = `<strong>주된 감정:</strong> ${primary}\n`;
  text += `<p><strong>위로:</strong> ${chosen.comfort}</p>`;
  text += `<p><strong>해결책:</strong> ${chosen.solution}</p>`;
  text += `<p><strong>피드백:</strong> ${chosen.feedback}</p>`;

  if(gratitude.length){
    text += `<hr><p>오늘 적은 감사 (${gratitude.length}):</p><ul>`;
    gratitude.slice(0,10).forEach(g=> text += `<li>${escapeHtml(g)}</li>`);
    text += '</ul>';
  }
  adviceBox.innerHTML = text;
}

function allLeavesFilled(){
  return state.leaves.every(Boolean);
}

function checkCombineCondition(){
  if(allLeavesFilled()){
    // only trigger modal/animation when this transition happens in-session
    if(!state.combined){
      state.combined = true;
      saveState();
      // 애니메이션 활성화
      combineEffect.classList.add('active');
      setTimeout(()=> combineEffect.classList.remove('active'), 1200);
      // 모달 열기 대신 저장 여부 묻기
      const wantSave = confirm('나무를 다 채우셨습니다. 저장하실건가요?');
      if(wantSave){
        // ask about saving gratitude as well
        const saveGrat = confirm('오늘 적은 감사도 저장할건가요?');
        const name = prompt('이 나무의 이름을 입력하세요 (생략 시 기본명 사용):') || undefined;
        saveToArchive(name);
        if(saveGrat){ saveGratitudeArchive(); }
        const makeAnother = confirm('하나를 더 만드실건가요?');
        if(makeAnother){
          // 초기화하고 새 나무 시작 (do not overwrite archives)
          state = { leaves: Array(6).fill(null), gratitude: Array(10).fill(''), combined: false };
          // leave combined false so leaves are shown separately
          renderAll();
          alert('새 나무가 만들어졌습니다.');
        }else{
          // 닫기(모달 없이 끝)
          alert('저장되었습니다. 작업을 종료합니다.');
        }
      }else{
        // 저장하지 않으면 아무것도 하지 않음
      }
    }
  }
}

function openCombineModal(){
  combineModal.setAttribute('aria-hidden', 'false');
  // focus 첫 입력
  const first = modalGratitudeList.querySelector('input');
  if(first) first.focus();
}

function closeCombineModal(){
  combineModal.setAttribute('aria-hidden', 'true');
}

function openArchiveModal(){
  renderArchiveList();
  archiveModal.setAttribute('aria-hidden', 'false');
}

function closeArchiveModal(){
  archiveModal.setAttribute('aria-hidden', 'true');
}

function escapeHtml(s){ return s? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : s }

function renderAll(){ loadState(); renderLeaves(); renderGratitude(); generateAdvice(); updateSelectedPanel(); }

renderAll();

// 기본 가이드: 첫 번째 잎 선택
pickLeaf(0);

// archive button wiring
archiveBtn.addEventListener('click', ()=> openArchiveModal());
archiveClose.addEventListener('click', ()=> closeArchiveModal());

// gratitude archive wiring
gratitudeArchiveBtn.addEventListener('click', ()=>{ renderGratitudeArchiveList(); gratitudeArchiveModal.setAttribute('aria-hidden','false'); });
gratitudeArchiveClose.addEventListener('click', ()=> gratitudeArchiveModal.setAttribute('aria-hidden','true'));

// start a new session (fresh empty tree) on every page load
function startNewSession(){
  state = { leaves: Array(6).fill(null), gratitude: Array(10).fill(''), combined: true };
  saveState();
  renderAll();
}

startNewSession();
