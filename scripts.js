tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                }
            }
        }
    }
}

// Inicializa el juego cuando el documento esté listo.
document.addEventListener('DOMContentLoaded', () => {
    // Definición estructurada de verbos por grupos según patrón fonético/gramatical
    const VERB_GROUPS = {
        A: {
            title: "Grupo A: Cambian a vocal '-o-' en pasado",
            tip: "En este grupo, los verbos cambian la vocal central por una '-o-' en su forma de pasado simple.",
            verbs: [
                { base: "choose", past: "chose", es: "elegir" },
                { base: "drive", past: "drove", es: "conducir" },
                { base: "ride", past: "rode", es: "montar" },
                { base: "speak", past: "spoke", es: "hablar" },
                { base: "write", past: "wrote", es: "escribir" }
            ]
        },
        B: {
            title: "Grupo B: Terminación en '-ought' / '-aught'",
            tip: "Estos verbos transforman su pasado con la terminación '-ought' o '-aught' (ambas suenan similar a 'ot').",
            verbs: [
                { base: "buy", past: "bought", es: "comprar" },
                { base: "teach", past: "taught", es: "enseñar" },
                { base: "think", past: "thought", es: "pensar" }
            ]
        },
        C: {
            title: "Grupo C: Cambio de vocal 'i' / 'u' → 'a'",
            tip: "En estos verbos la vocal 'i' (o en algunos casos 'u') cambia directamente a la vocal 'a' en el pasado.",
            verbs: [
                { base: "drink", past: "drank", es: "beber" },
                { base: "run", past: "ran", es: "correr" },
                { base: "sing", past: "sang", es: "cantar" },
                { base: "sit", past: "sat", es: "sentarse" },
                { base: "swim", past: "swam", es: "nadar" }
            ]
        },
        D: {
            title: "Grupo D: Terminación en '-ew'",
            tip: "Su forma en pasado siempre termina en '-ew' (suena como 'iu').",
            verbs: [
                { base: "draw", past: "drew", es: "dibujar" },
                { base: "fly", past: "flew", es: "volar" },
                { base: "know", past: "knew", es: "saber/conocer" }
            ]
        },
        E: {
            title: "Grupo E: Cambio a sufijo '-ept' / '-elt' / '-eft'",
            tip: "La vocal se acorta o cambia terminando en las combinaciones consonánticas '-ept', '-elt' o '-eft'.",
            verbs: [
                { base: "feel", past: "felt", es: "sentir" },
                { base: "leave", past: "left", es: "salir/dejar" },
                { base: "sleep", past: "slept", es: "dormir" },
                { base: "keep", past: "kept", es: "guardar/mantener" }
            ]
        },
        F: {
            title: "Grupo F: La '-d' final pasa a ser '-t'",
            tip: "Verbos cuya consonante final '-d' simplemente se sustituye por una '-t' fuerte.",
            verbs: [
                { base: "build", past: "built", es: "construir" },
                { base: "send", past: "sent", es: "enviar" },
                { base: "spend", past: "spent", es: "gastar" }
            ]
        },
        G: {
            title: "Grupo G: Invariabilidad / Mismo patrón",
            tip: "Misma escritura en presente y pasado. *Nota: En 'read', la escritura es idéntica pero su voz suena como 'red'.",
            verbs: [
                { base: "read", past: "read", es: "leer" }
            ]
        },
        H: {
            title: "Grupo H: Verbos Especiales / Muy Comunes",
            tip: "Son verbos fundamentales muy frecuentes que requieren memorización individual.",
            verbs: [
                { base: "be", past: "was, were", es: "ser/estar" },
                { base: "do", past: "did", es: "hacer" },
                { base: "go", past: "went", es: "ir" },
                { base: "have", past: "had", es: "tener" },
                { base: "make", past: "made", es: "hacer/fabricar" },
                { base: "see", past: "saw", es: "ver" }
            ]
        }
    };

    // Estado del Juego
    let currentCards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let totalPairs = 0;
    let moves = 0;
    let timerInterval = null;
    let secondsElapsed = 0;
    let isBoardLocked = true;
    let isPreviewPhase = false;

    // Elementos DOM
    const gameGrid = document.getElementById('game-grid');
    const movesCountEl = document.getElementById('moves-count');
    const matchesCountEl = document.getElementById('matches-count');
    const timerEl = document.getElementById('timer');
    const groupSelect = document.getElementById('group-select');
    const restartBtn = document.getElementById('restart-btn');
    const victoryModal = document.getElementById('victory-modal');
    const victoryCard = document.getElementById('victory-card');
    const finalMovesEl = document.getElementById('final-moves');
    const finalTimeEl = document.getElementById('final-time');
    const finalStarsEl = document.getElementById('final-stars');
    const modalNextBtn = document.getElementById('modal-next-btn');

    // Elementos del Overlay de Inicio
    const startOverlay = document.getElementById('start-overlay');
    const startGameBtn = document.getElementById('start-game-btn');

    // Tip Header DOM Elements
    const tipTitle = document.getElementById('tip-title');
    const tipDesc = document.getElementById('tip-desc');

    // Pronunciación por voz
    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.88;
            window.speechSynthesis.speak(utterance);
        }
    }

    // Actualizar el encabezado con los datos y tips del grupo seleccionado
    function updateGroupTip(groupKey) {
        if (groupKey === "ALL") {
            tipTitle.textContent = "Modo General: Todos los Grupos";
            tipDesc.textContent = "Práctica completa integrando todos los patrones fonéticos e irregulares.";
        } else {
            const groupInfo = VERB_GROUPS[groupKey];
            tipTitle.textContent = groupInfo.title;
            tipDesc.textContent = groupInfo.tip;
        }
    }

    // Cargar las cartas al cambiar de grupo o reiniciar (pero esperando el botón)
    function setupGame() {
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        secondsElapsed = 0;
        isBoardLocked = true;
        isPreviewPhase = false;

        clearInterval(timerInterval);
        timerInterval = null;

        movesCountEl.textContent = "0";
        timerEl.textContent = "00:00";

        const selectedKey = groupSelect.value;
        updateGroupTip(selectedKey);

        let verbList = [];
        if (selectedKey === "ALL") {
            Object.keys(VERB_GROUPS).forEach(key => {
                verbList = verbList.concat(VERB_GROUPS[key].verbs);
            });
        } else {
            verbList = VERB_GROUPS[selectedKey].verbs;
        }

        totalPairs = verbList.length;
        matchesCountEl.textContent = `0 / ${totalPairs}`;

        // Crear cartas
        let cardsData = [];
        verbList.forEach((pair, index) => {
            cardsData.push({
                pairId: index,
                text: pair.base,
                label: "Base Form",
                translation: pair.es,
                type: "base",
                audioText: pair.base
            });
            cardsData.push({
                pairId: index,
                text: pair.past,
                label: "Simple Past",
                translation: pair.es,
                type: "past",
                audioText: pair.past === "was, were" ? "was were" : pair.past
            });
        });

        // Mezclar aleatoriamente
        cardsData.sort(() => Math.random() - 0.5);
        currentCards = cardsData;

        // Renderizamos las cartas ocultas (boca abajo) por defecto al preparar
        renderBoardHidden();

        // Asegurarnos de que el overlay de inicio esté visible
        if (startOverlay) {
            startOverlay.classList.remove('opacity-0', 'pointer-events-none');
            startOverlay.style.display = "flex";
        }
    }

    // Renderizar tablero con las cartas ocultas antes de iniciar
    function renderBoardHidden() {
        gameGrid.innerHTML = '';

        if (currentCards.length > 20) {
            gameGrid.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3 w-full";
        } else {
            gameGrid.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full";
        }

        currentCards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'perspective-1000 h-28 sm:h-32 cursor-pointer select-none';
            cardEl.dataset.index = index;

            cardEl.innerHTML = `
                <div class="card-inner relative w-full h-full transform-style-3d transition-transform duration-500 rounded-2xl shadow-lg">
                    <!-- Frente oculto -->
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center p-2 text-white">
                        <i class="fa-solid fa-sparkles text-2xl text-indigo-400/60 mb-1"></i>
                        <span class="text-[9px] tracking-widest uppercase font-bold text-indigo-300/50">English</span>
                    </div>
                    <!-- Reverso revelado -->
                    <div class="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900 rounded-2xl border-2 ${card.type === 'base' ? 'border-sky-500/80' : 'border-purple-500/80'} p-2.5 flex flex-col items-center justify-between text-center shadow-2xl">
                        <div class="w-full flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wider ${card.type === 'base' ? 'text-sky-400' : 'text-purple-400'} border-b border-slate-800 pb-1">
                            <span>${card.label}</span>
                            <button onclick="event.stopPropagation(); speakText('${card.audioText}')" class="text-slate-400 hover:text-white p-1">
                                <i class="fa-solid fa-volume-high text-xs"></i>
                            </button>
                        </div>
                        <div class="my-auto px-1">
                            <p class="text-base sm:text-lg font-bold text-white leading-tight">${card.text}</p>
                            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">${card.translation}</p>
                        </div>
                        <div class="text-[9px] text-slate-500 font-medium">${card.type === 'base' ? 'Forma Base' : 'Pasado'}</div>
                    </div>
                </div>
            `;

            cardEl.addEventListener('click', () => handleCardClick(index, cardEl));
            gameGrid.appendChild(cardEl);
        });
    }

    // Acción al dar clic en "¡Comenzar a Jugar!"
    function handleStartGameClick() {
        // Ocultar overlay de bienvenida
        if (startOverlay) {
            startOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => { startOverlay.style.display = "none"; }, 300);
        }

        isPreviewPhase = true;
        isBoardLocked = true;

        // Voltear todas las cartas boca arriba para la vista previa
        const allCardInners = gameGrid.querySelectorAll('.card-inner');
        allCardInners.forEach(inner => {
            inner.classList.add('rotate-y-180');
        });

        // Esperar 3 segundos, luego ocultarlas y arrancar el juego
        setTimeout(() => {
            allCardInners.forEach(inner => {
                inner.classList.remove('rotate-y-180');
            });
            isBoardLocked = false;
            isPreviewPhase = false;
        }, 3000);
    }

    // Cronómetro
    function startTimer() {
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                secondsElapsed++;
                const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
                const secs = String(secondsElapsed % 60).padStart(2, '0');
                timerEl.textContent = `${mins}:${secs}`;
            }, 1000);
        }
    }

    // Clics en las tarjetas
    function handleCardClick(index, cardEl) {
        if (isBoardLocked || isPreviewPhase) return;

        const inner = cardEl.querySelector('.card-inner');

        if (flippedCards.some(item => item.index === index) || cardEl.classList.contains('matched')) {
            return;
        }

        startTimer();

        inner.classList.add('rotate-y-180');
        speakText(currentCards[index].audioText);

        flippedCards.push({ index, element: cardEl, data: currentCards[index] });

        if (flippedCards.length === 2) {
            moves++;
            movesCountEl.textContent = moves;
            checkMatch();
        }
    }

    // Verificación de pares
    function checkMatch() {
        isBoardLocked = true;
        const [card1, card2] = flippedCards;

        const isMatch = card1.data.pairId === card2.data.pairId && card1.data.type !== card2.data.type;

        if (isMatch) {
            setTimeout(() => {
                card1.element.classList.add('matched', 'animate-success');
                card2.element.classList.add('matched', 'animate-success');

                const inner1 = card1.element.querySelector('.card-inner > div:nth-child(2)');
                const inner2 = card2.element.querySelector('.card-inner > div:nth-child(2)');
                if (inner1) inner1.classList.add('bg-emerald-950/60', 'border-emerald-500');
                if (inner2) inner2.classList.add('bg-emerald-950/60', 'border-emerald-500');

                matchedPairs++;
                matchesCountEl.textContent = `${matchedPairs} / ${totalPairs}`;

                flippedCards = [];
                isBoardLocked = false;

                if (matchedPairs === totalPairs) {
                    handleVictory();
                }
            }, 350);
        } else {
            setTimeout(() => {
                card1.element.querySelector('.card-inner').classList.remove('rotate-y-180');
                card2.element.querySelector('.card-inner').classList.remove('rotate-y-180');
                flippedCards = [];
                isBoardLocked = false;
            }, 1000);
        }
    }

    // Victoria
    function handleVictory() {
        clearInterval(timerInterval);

        confetti({
            particleCount: 130,
            spread: 85,
            origin: { y: 0.6 }
        });

        finalMovesEl.textContent = moves;
        finalTimeEl.textContent = timerEl.textContent;

        const ratio = moves / totalPairs;
        if (ratio <= 1.3) {
            finalStarsEl.innerHTML = '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>';
        } else if (ratio <= 1.8) {
            finalStarsEl.innerHTML = '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-regular fa-star"></i>';
        } else {
            finalStarsEl.innerHTML = '<i class="fa-solid fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i>';
        }

        setTimeout(() => {
            victoryModal.classList.remove('opacity-0', 'pointer-events-none');
            victoryCard.classList.remove('scale-90');
            victoryCard.classList.add('scale-100');
        }, 400);
    }

    function hideVictoryModal() {
        victoryModal.classList.add('opacity-0', 'pointer-events-none');
        victoryCard.classList.remove('scale-100');
        victoryCard.classList.add('scale-90');
    }

    // Eventos de controles
    restartBtn.addEventListener('click', setupGame);

    groupSelect.addEventListener('change', () => {
        setupGame();
    });

    if (startGameBtn) {
        startGameBtn.addEventListener('click', handleStartGameClick);
    }

    modalNextBtn.addEventListener('click', () => {
        hideVictoryModal();
        const keys = Object.keys(VERB_GROUPS);
        const currentKey = groupSelect.value;
        const currentIndex = keys.indexOf(currentKey);

        if (currentIndex >= 0 && currentIndex < keys.length - 1) {
            groupSelect.value = keys[currentIndex + 1];
        } else {
            groupSelect.value = "A";
        }
        setupGame();
    });

    // Inicialización al cargar la ventana
    window.onload = () => {
        setupGame();
    };
});