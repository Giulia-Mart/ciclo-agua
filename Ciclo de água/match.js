// Jogo de Combinação: Ciclo da Água (Números → Palavras em sequência)
(() => {
  const numbersEl = document.getElementById('numbers');
  const wordsEl = document.getElementById('words');
  const timeEl = document.getElementById('time');
  const movesEl = document.getElementById('moves');
  const matchesEl = document.getElementById('matches');
  const nextLabelEl = document.getElementById('next-label');
  const restartBtn = document.getElementById('restart');
  const toast = document.getElementById('toast');

  if (!numbersEl || !wordsEl) return; // Só nesta página

  // Etapas em ordem correta
  const steps = [
    { id: 'evaporacao', numero: 1, titulo: 'EVAPORAÇÃO', desc: 'A água aquece e passa do líquido para o gasoso.' },
    { id: 'condensacao', numero: 2, titulo: 'CONDENSAÇÃO', desc: 'O vapor esfria e forma nuvens.' },
    { id: 'precipitacao', numero: 3, titulo: 'PRECIPITAÇÃO', desc: 'A água cai como chuva, granizo ou neve.' },
    { id: 'transpiracao', numero: 4, titulo: 'TRANSPIRAÇÃO', desc: 'Plantas liberam vapor de água.' },
    { id: 'infiltracao', numero: 5, titulo: 'INFILTRAÇÃO', desc: 'Parte da água penetra no solo.' },
  ];

  // Estado
  let moves = 0;
  let matches = 0; // 0..5
  let timer = null;
  let seconds = 0;
  let selectedTile = null; // para modo clique

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
      seconds += 1;
      timeEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function showToast(message, duration = 2500) {
    if (!toast) return;
    toast.innerHTML = message;
    toast.hidden = false;
    toast.classList.remove('hide');
    if (duration) {
      setTimeout(() => { toast.classList.add('hide'); toast.hidden = true; }, duration);
    }
  }

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function updateHUD() {
    movesEl.textContent = String(moves);
    matchesEl.textContent = `${matches}/5`;
    if (matches >= 5) {
      if (nextLabelEl) nextLabelEl.textContent = 'Completo';
    } else {
      if (nextLabelEl) nextLabelEl.textContent = 'Livre';
    }
  }

  // Renderização
  function renderNumbers() {
    numbersEl.innerHTML = '';
    // Mantém os números sempre em ordem 1..5 (não embaralhar)
    const nums = steps.map(s => s.numero);
    nums.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'number-tile';
      btn.type = 'button';
      btn.draggable = true;
      btn.textContent = String(n);
      btn.setAttribute('aria-label', `Número ${n}`);

      // Drag
      btn.addEventListener('dragstart', (e) => {
        startTimer();
        if (btn.getAttribute('aria-disabled') === 'true') {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/plain', String(n));
        // Para feedback visual durante drag
        btn.classList.add('selected');
      });
      btn.addEventListener('dragend', () => btn.classList.remove('selected'));

      // Clique (modo alternativo)
      btn.addEventListener('click', () => {
        startTimer();
        if (btn.getAttribute('aria-disabled') === 'true') return;
        if (selectedTile && selectedTile !== btn) {
          selectedTile.classList.remove('selected');
        }
        if (selectedTile === btn) {
          selectedTile.classList.remove('selected');
          selectedTile = null;
        } else {
          btn.classList.add('selected');
          selectedTile = btn;
        }
      });

      numbersEl.appendChild(btn);
    });
  }

  function renderWords() {
    wordsEl.innerHTML = '';
    const shuffledSteps = shuffle(steps);
    shuffledSteps.forEach(step => {
      const row = document.createElement('div');
      row.className = 'word-row';

      const label = document.createElement('div');
      label.className = 'word-label';
      label.textContent = step.titulo;

      const slot = document.createElement('div');
      slot.className = 'drop-slot';
      slot.setAttribute('role', 'button');
      slot.setAttribute('aria-label', `Soltar número correspondente para ${step.titulo}`);
      slot.dataset.stepId = step.id;
      slot.dataset.correctNumber = String(step.numero);

      // Drag targets
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('dragover');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('dragover'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('dragover');
        const value = Number(e.dataTransfer.getData('text/plain'));
        attemptPlace(value, slot);
      });

      // Clique target
      slot.addEventListener('click', () => {
        if (!selectedTile) return;
        const value = Number(selectedTile.textContent);
        attemptPlace(value, slot, selectedTile);
      });

      row.appendChild(label);
      row.appendChild(slot);
      wordsEl.appendChild(row);
    });
  }

  function markTileUsed(value) {
    const tiles = numbersEl.querySelectorAll('.number-tile');
    tiles.forEach(t => {
      if (t.textContent === String(value)) {
        t.setAttribute('aria-disabled', 'true');
        t.draggable = false;
        t.classList.remove('selected');
        t.style.opacity = '0.5';
      }
    });
  }

  function fillSlot(slot, value) {
    slot.classList.add('filled');
    const content = document.createElement('div');
    content.className = 'slot-content';
    content.textContent = String(value);
    slot.replaceChildren(content);
  }

  function wiggle(slot) {
    slot.classList.add('wrong');
    setTimeout(() => slot.classList.remove('wrong'), 400);
  }

  function attemptPlace(value, slot, sourceBtn = null) {
    // Evita colocar em slot já preenchido
    if (slot.classList.contains('filled')) return;

    // Conta tentativa
    moves += 1;
    updateHUD();

    // Regra 2: etapa correta para o número
    const correctNumber = Number(slot.dataset.correctNumber);
    if (value !== correctNumber) {
      wiggle(slot);
      const stepTitle = steps.find(s => s.numero === value)?.titulo || value;
      showToast(`Número ${value} não corresponde a ${slot.parentElement.querySelector('.word-label').textContent}`);
      return; // volta
    }

  // Corretíssimo: fixa no slot
    fillSlot(slot, value);
    markTileUsed(value);
    matches += 1;
  updateHUD();

    // Mensagem educativa
    const data = steps.find(s => s.numero === value);
    if (data) {
      showToast(`<strong>${value} - ${data.titulo}</strong><br>${data.desc}`);
    }

    // Limpa seleção se veio via clique
    if (sourceBtn && selectedTile === sourceBtn) {
      selectedTile = null;
    }

    checkWin();
  }

  function reset() {
    stopTimer();
    seconds = 0;
    timeEl.textContent = '00:00';
    moves = 0;
    matches = 0;
    selectedTile = null;
    numbersEl.innerHTML = '';
    wordsEl.innerHTML = '';
    renderNumbers();
    renderWords();
    updateHUD();
  }

  function checkWin() {
    if (matches === 5) {
      stopTimer();
      showToast(`<div style="display:flex; gap:10px; align-items:center;"><span aria-hidden="true">🎉</span><div><strong>Parabéns!</strong> Você montou a sequência correta.<div>Tempo: ${timeEl.textContent} · Movimentos: ${moves}</div></div></div>`, 4500);
    }
  }

  restartBtn?.addEventListener('click', reset);

  // Inicializa
  reset();
})();
