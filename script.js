document.addEventListener("DOMContentLoaded", function () {
    const maxRows = 6; // Número màxim de files
    const maxCols = 5; // Número màxim de columnas
    let paraulaOculta = ""; // Paraula a adivinar
    let currentRow = 0; // Fila actual
    let currentCol = 0; // Columna actual
    let partidaAcabada = false; // Indica si la partida ha acabat
    let startTime = null; // Temps d'inici de la partida

    const grid = document.getElementById("letter-grid"); // Cuadrícula de lletres
    const keyboard = document.getElementById("keyboard"); // Teclat virtual 

    keyboard.addEventListener("click", function (event) {
        if (partidaAcabada) return;  // Evita que fincioni després d'acabar la partida

        const btn = event.target.closest("button");
        if (!btn) return;

        if (btn.id === "btnDelete") {
            esborrarLletra();
        } else if (btn.id === "btnEnter") {
            validarFila();
        } else {
            afegirLletra(btn.textContent);
        }
    });

    // Verificar si ja s'han introduit les dades del jugador
    if (!localStorage.getItem("nom")) {
        mostrarFormulariInicial(); // Mostrar formulari si no hi ha dades
    } else {
        iniciarPartida(); // Iniciar partida si ja hi ha dades
    }

    // Funció per mostrar el formulari inicial
    function mostrarFormulariInicial() {
        const template = document.getElementById("template-formulari-inicial").innerHTML;

        Swal.fire({
            title: "<h1 style='color: #4CAF50; font-weight: bold;'>Benvingut/da a Wordle!</h1>",
            html: template,
            showCancelButton: false,
            confirmButtonText: "Començar partida",
            confirmButtonColor: "#4CAF50",
            focusConfirm: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            preConfirm: () => {
                const nom = document.getElementById("nom").value.trim();
                const cognom = document.getElementById("cognom").value.trim();
                const email = document.getElementById("email").value.trim();
                const telefon = document.getElementById("telefon").value.trim();

                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const telefonRegex = /^[0-9]{9}$/;

                let errors = false;

                // Rastrejar errors
                document.querySelectorAll(".text-danger").forEach(error => error.style.display = "none");

                if (nom == "") {
                    mostrarError("nomError");
                    errors = true;
                }
                if (cognom == "") {
                    mostrarError("cognomError");
                    errors = true;
                }
                if (!emailRegex.test(email)) {
                    mostrarError("emailError");
                    errors = true;
                }
                if (!telefonRegex.test(telefon)) {
                    mostrarError("telefonError");
                    errors = true;
                }

                if (errors) return false;

                localStorage.setItem("nom", nom);
                localStorage.setItem("cognom", cognom);
                localStorage.setItem("email", email);
                localStorage.setItem("telefon", telefon);

                // Inicialitzar estadistiques si no existeixen
                if (!localStorage.getItem("partidesTotals")) {
                    localStorage.setItem("partidesTotals", 0);
                    localStorage.setItem("partidesGuanyades", 0);
                    localStorage.setItem("millorPartida", 0);
                    localStorage.setItem("partidaMesRapida", 0);
                }

                iniciarPartida();
            }
        });
    }

    // Funció per mostrar errors al formulari
    function mostrarError(id) {
        document.getElementById(id).style.display = "block";
    }

    // Funció per iniciar una nova partida
    function iniciarPartida() {
        paraulaOculta = dic[Math.floor(Math.random() * dic.length)].toUpperCase(); // Escollir la paraula a l'atzar
        console.log("Paraula oculta:", paraulaOculta);

        partidaAcabada = false;
        currentRow = 0;
        currentCol = 0;
        startTime = Date.now(); // Registrar temps d'inici

        crearMatriu(); // Crear cuadrícula de lletres

        // Activar el teclat físic
        document.addEventListener("keydown", handleKeyDown);
    }

    // Funció per crear la cuadrícula de lletres
    function crearMatriu() {
        grid.innerHTML = "";
        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement("div");
            row.classList.add("row");
            for (let j = 0; j < maxCols; j++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                row.appendChild(cell);
            }
            grid.appendChild(row);
        }
    }

    // Funció per afegir una lletra a la cuadrícula
    function afegirLletra(lletra) {
        if (partidaAcabada || currentCol >= maxCols) return;
        grid.children[currentRow].children[currentCol].textContent = lletra;
        currentCol++;
    }

    // Funció per esborrar una lletra de la cuadrícula
    function esborrarLletra() {
        if (partidaAcabada || currentCol === 0) return;
        currentCol--;
        grid.children[currentRow].children[currentCol].textContent = "";
    }

    // Funció per validar una fila
    function validarFila() {
        if (partidaAcabada) return;

        if (currentCol < maxCols) {
            grid.children[currentRow].classList.add("shake");
            setTimeout(() => {
                grid.children[currentRow].classList.remove("shake");
            }, 300);

            Swal.fire({
                title: "Error",
                text: "Si us plau, completa la paraula abans de validar.",
                icon: "error",
                confirmButtonText: "D'acord"
            });
            return;
        }

        const intent = [...grid.children[currentRow].children].map(c => c.textContent).join("");
        if (!dic.includes(intent.toLowerCase())) {
            grid.children[currentRow].classList.add("shake");
            setTimeout(() => {
                grid.children[currentRow].classList.remove("shake");
            }, 300);

            Swal.fire({
                title: "Error",
                text: "La paraula no existeix al diccionari. Pots utilitzar la tecla de retrocés per corregir-la.",
                icon: "error",
                confirmButtonText: "D'acord"
            });
            return;
        }

        processarFila(intent);
    }

    // Funció per procesar una fila y verificar si s'ha guanyat
    function processarFila(intent) {
        let encerts = 0;
        for (let i = 0; i < maxCols; i++) {
            const casella = grid.children[currentRow].children[i];
            const lletra = intent[i];
            casella.style.backgroundColor = lletra === paraulaOculta[i] ? "green" :
                paraulaOculta.includes(lletra) ? "orange" : "lightgrey";
            if (lletra === paraulaOculta[i]) encerts++;
        }

        if (encerts == maxCols) {
            finalitzarPartida(true);
        } else if (++currentRow == maxRows) {
            finalitzarPartida(false);
        }
        currentCol = 0;
    }

    // Funció per finaliztar la partida
    function finalitzarPartida(guanyada) {
        partidaAcabada = true;

        document.removeEventListener("keydown", handleKeyDown);
        keyboard.querySelectorAll("button").forEach(btn => {
            btn.disabled = true;
        });

        const temps = Math.floor((Date.now() - startTime) / 1000);

        let partidesTotals = parseInt(localStorage.getItem("partidesTotals")) || 0;
        let partidesGuanyades = parseInt(localStorage.getItem("partidesGuanyades")) || 0;
        let millorPartida = parseInt(localStorage.getItem("millorPartida")) || 0;
        let partidaMesRapida = parseInt(localStorage.getItem("partidaMesRapida")) || 0;

        partidesTotals++;
        if (guanyada) partidesGuanyades++;

        if (guanyada && (currentRow + 1 < millorPartida || millorPartida == 0)) {
            millorPartida = currentRow + 1;
        }
        if (guanyada && (temps < partidaMesRapida || partidaMesRapida == 0)) {
            partidaMesRapida = temps;
        }

        localStorage.setItem("partidesTotals", partidesTotals);
        localStorage.setItem("partidesGuanyades", partidesGuanyades);
        localStorage.setItem("millorPartida", millorPartida);
        localStorage.setItem("partidaMesRapida", partidaMesRapida);

        Swal.fire({
            title: guanyada ? "Enhorabona, " + localStorage.getItem("nom") + "!" : "Has perdut",
            text: guanyada ? `Has guanyat en ${currentRow + 1} intents i ${temps} segons!` : `La paraula era: ${paraulaOculta}`,
            icon: guanyada ? "success" : "error"
        });
    }

    // Event listener pel teclat físic
    function handleKeyDown(e) {
        if (partidaAcabada) return;

        if (e.key === "Enter") {
            e.preventDefault();
            validarFila();
        } else if (e.key === "Backspace") {
            e.preventDefault();
            esborrarLletra();
        } else if (/^[a-zA-Zç]$/.test(e.key)) {
            afegirLletra(e.key.toUpperCase());
        }
    }

    // Event listeners per els buttons d'estadictiques, ajuda i reiniciar
    document.getElementById("btnStats").addEventListener("click", mostrarEstadistiques);
    document.getElementById("btnHelp").addEventListener("click", mostrarAjuda);
    document.getElementById("btnRestart").addEventListener("click", reiniciarPartida);

    // Funció per mostrar las estadístiques
    function mostrarEstadistiques() {
        const template = document.getElementById("template-estadistiques").content.cloneNode(true);

        // Insertar dades dinamiques
        template.getElementById("nom-usuari").innerText = localStorage.getItem("nom") || "Jugador desconegut";
        template.getElementById("partides-totals").innerText = localStorage.getItem("partidesTotals") || 0;
        template.getElementById("partides-guanyades").innerText = localStorage.getItem("partidesGuanyades") || 0;
        template.getElementById("millor-partida").innerText = localStorage.getItem("millorPartida") || 0;
        template.getElementById("partida-mes-rapida").innerText = localStorage.getItem("partidaMesRapida") || 0;

        Swal.fire({
            title: "Estadístiques de la partida",
            html: template.firstElementChild.outerHTML,
            icon: "info",
            confirmButtonText: "D'acord"
        });
    }

    // Funció per mostrar l'ajuda
    function mostrarAjuda() {
        const plantilla = document.getElementById("template-ajuda").innerHTML;

        Swal.fire({
            title: "Com jugar al WordleIBC?",
            html: plantilla,
            confirmButtonText: "OK",
            icon: "info"
        });
    }

    function reiniciarPartida() {
        document.removeEventListener("keydown", handleKeyDown);
        iniciarPartida();

        // Reactivar tots els buttons del teclat virtual
        keyboard.querySelectorAll("button").forEach(btn => {
            btn.disabled = false;
        });
    }

});