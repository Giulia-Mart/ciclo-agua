// Jogo da Memória: Ciclo da Água
(() => {
	const grid = document.getElementById('memory-game');
	if (!grid) return; // Só roda nesta página

	const timeEl = document.getElementById('time');
	const movesEl = document.getElementById('moves');
	const matchesEl = document.getElementById('matches');
	const restartBtn = document.getElementById('restart');
	const toast = document.getElementById('toast');

	// Dados educativos das etapas
	const stages = [
		{ id: 'evaporacao', img: 'img/evaporacao.png', titulo: 'Evaporação', desc: 'A água aquece e passa do estado líquido para o gasoso, subindo para a atmosfera.' },
		{ id: 'condensacao', img: 'img/condensacao.png', titulo: 'Condensação', desc: 'O vapor de água esfria e forma gotículas, originando nuvens.' },
		{ id: 'precipitacao', img: 'img/precipitacao.png', titulo: 'Precipitação', desc: 'A água cai das nuvens como chuva, granizo ou neve.' },
		{ id: 'terra', img: 'img/terra.png', titulo: 'Terra', desc: 'A terra é onde a água se acumula e é filtrada.' },
		{ id: 'transpiracao', img: 'img/transpiracao.png', titulo: 'Transpiração', desc: 'Plantas liberam vapor de água pelas folhas para a atmosfera.' },
		{ id: 'infiltracao', img: 'img/infiltracao.png', titulo: 'Infiltração', desc: 'Parte da água penetra no solo, reabastecendo aquíferos.' },
		{ id: 'agua', img: 'img/agua.png', titulo: 'Água', desc: 'A água é essencial para todos os seres vivos.' },
        { id: 'sol', img: 'img/sol.png', titulo: 'Sol', desc: 'A luz do sol aquece a água, iniciando o ciclo da evaporação.' }
    ];

	// Estado do jogo
	let deck = [];
	let first = null;
	let lock = false;
	let moves = 0;
	let matches = 0;
	let timer = null;
	let seconds = 0;

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

    /* Exibe uma mensagem temporária na tela, ou seja, o tempo da mensagem */
	function showToast(message, duration = 3000) {
		if (!toast) return;
		toast.innerHTML = message;
		toast.hidden = false;
		toast.classList.remove('hide');
		if (duration) {
			setTimeout(() => { toast.classList.add('hide'); toast.hidden = true; }, duration);
		}
	}

	function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	function createDeck() {
		// Duplica para criar pares
		const pairs = stages.flatMap(s => [
			{ ...s },
			{ ...s }
		]);
		return shuffle(pairs.map((card, idx) => ({ ...card, uid: `${card.id}-${idx}` })));
	}

	function render() {
		grid.innerHTML = '';
		deck.forEach((card) => {
			const cardEl = document.createElement('button');
			cardEl.className = 'card';
			cardEl.type = 'button';
			cardEl.dataset.id = card.id;
			cardEl.setAttribute('aria-label', `Carta: ${card.titulo}`);
			cardEl.innerHTML = `
				<div class="card-inner">
					<div class="face card-front">Ciclo da Água</div>
					<div class="face card-back">
						<img class="card-image" src="${card.img}" alt="${card.titulo}" loading="lazy" />
					</div>
				</div>
			`;

			const handleFlip = () => flip(cardEl);
			cardEl.addEventListener('click', handleFlip);
			cardEl.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); }
			});

			grid.appendChild(cardEl);
		});
	}

	function updateHUD() {
		movesEl.textContent = String(moves);
		matchesEl.textContent = `${matches}/${stages.length}`;
	}

	function sameCard(a, b) {
		return a === b;
	}

	function flip(el) {
		if (lock) return;
		if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

		startTimer();
		el.classList.add('flipped');

		if (!first) {
			first = el;
			return;
		}

		// Segundo clique
		moves += 1;
		updateHUD();
		const isMatch = first.dataset.id === el.dataset.id && !sameCard(first, el);
		if (isMatch) {
			// Par encontrado
			first.classList.add('matched');
			el.classList.add('matched');
			const stage = stages.find(s => s.id === el.dataset.id);
			showToast(`<strong>Par: ${stage.titulo}</strong><br>${stage.desc}`);
			first = null;
			matches += 1;
			updateHUD();
			checkWin();
		} else {
			// Não combinou
			lock = true;
			setTimeout(() => {
				first.classList.remove('flipped');
				el.classList.remove('flipped');
				first = null;
				lock = false;
			}, 700);
		}
	}

	function checkWin() {
		if (matches === stages.length) {
			stopTimer();
			const msg = `
				<div style="display:flex; gap:10px; align-items:center;">
					<span class="emoji" aria-hidden="true">🎉</span>
					<div>
						<div><strong>Parabéns!</strong> Você completou o ciclo da água.</div>
						<div>Tempo: ${timeEl.textContent} · Movimentos: ${moves}</div>
					</div>
				</div>
			`;
			showToast(msg, 5000);
		}
	}

	function reset() {
		stopTimer();
		seconds = 0;
		timeEl.textContent = '00:00';
		moves = 0;
		matches = 0;
		first = null;
		lock = false;
		updateHUD();
		deck = createDeck();
		render();
	}

	restartBtn?.addEventListener('click', reset);

	// Inicializa
	reset();
})();
