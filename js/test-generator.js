(() => {
    const BLOQUES = {
        juridicas: {
            nombre: "Jurídicas",
            icono: "⚖️",
            desde: 1,
            hasta: 26
        },
        sociales: {
            nombre: "Sociales",
            icono: "👥",
            desde: 27,
            hasta: 37
        },
        cientificas: {
            nombre: "Científicas",
            icono: "🔬",
            desde: 38,
            hasta: 45
        }
    };

    const CANTIDADES = [10, 20, 30, 50, 70, 100];

    let preguntas = [];
    let examen = [];
    let respuestas = {};
    let riesgos = {};
    let pagina = 0;
    let cantidad = 10;
    let temasSeleccionados = [];

    const porId = id => document.getElementById(id);

    function mezclar(lista) {
        const copia = [...lista];

        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }

        return copia;
    }

    function escapar(texto) {
        return String(texto ?? "").replace(
            /[&<>"']/g,
            caracter => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[caracter]
        );
    }

    function crearContenedor() {
        let contenedor = porId("test-generator-screen");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.id = "test-generator-screen";
            document.body.appendChild(contenedor);
        }

        contenedor.className = "test-overlay";

        return contenedor;
    }

    function mostrar(html) {
        crearContenedor().innerHTML = html;
    }

    async function abrir() {
        preguntas = await TestAppDB.getAllQuestions();

        if (!preguntas.length) {
            alert("Todavía no hay preguntas importadas.");
            return;
        }

        document.body.classList.add("test-generator-active");

        mostrarConfiguracion();
    }

    function mostrarConfiguracion() {
        mostrar(`
            <div class="test-config">

                <header class="test-config-header">
                    <div>
                        <span class="test-config-kicker">
                            TEST A LA CARTA
                        </span>

                        <h2>
                            Crea tu test
                        </h2>

                        <p>
                            Selecciona los temas que quieres practicar y el número de preguntas.
                        </p>
                    </div>

                    <button
                        class="test-close-button"
                        id="cerrar-configuracion"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </header>

                <section class="test-config-section">

                    <div class="test-section-title">
                        <div>
                            <h3>
                                Bloques de temas
                            </h3>

                            <p>
                                Puedes combinar temas de diferentes bloques.
                            </p>
                        </div>
                    </div>

                    <div class="temas-container">
                        ${Object.entries(BLOQUES)
                            .map(([id, bloque]) => crearBloqueTema(id, bloque))
                            .join("")}
                    </div>

                </section>

                <section class="test-config-section">

                    <div class="test-section-title">
                        <div>
                            <h3>
                                Número de preguntas
                            </h3>

                            <p>
                                Elige cuántas preguntas tendrá el test.
                            </p>
                        </div>
                    </div>

                    <div class="cantidad-grid">
                        ${CANTIDADES.map(
                            numero => `
                                <button
                                    type="button"
                                    class="cantidad-button ${numero === 10 ? "selected" : ""}"
                                    data-cantidad="${numero}"
                                >
                                    ${numero}
                                </button>
                            `
                        ).join("")}
                    </div>

                    <p class="cantidad-info" id="cantidad-info">
                        Selecciona al menos un tema.
                    </p>

                </section>

                <div class="test-config-footer">
                    <button
                        class="test-primary-button"
                        id="empezar-test"
                        disabled
                    >
                        Empezar test
                    </button>
                </div>

            </div>
        `);

        conectarConfiguracion();
        actualizarConfiguracion();
    }

    function crearBloqueTema(id, bloque) {
        const temas = obtenerTemasDelBloque(bloque);

        return `
            <div
                class="tema-bloque"
                data-bloque-contenedor="${id}"
            >

                <button
                    type="button"
                    class="tema-bloque-header"
                    data-toggle-bloque="${id}"
                    aria-expanded="false"
                >
                    <span>
                        ${bloque.icono} ${bloque.nombre}
                    </span>
                </button>

                <div
                    class="tema-bloque-panel"
                    id="panel-${id}"
                    hidden
                >

                    <div class="tema-bloque-actions">
                        <button
                            type="button"
                            class="test-secondary-button"
                            data-marcar-bloque="${id}"
                        >
                            Marcar todos
                        </button>
                    </div>

                    <div class="tema-grid">
                        ${temas
                            .map(tema => {
                                const total = preguntas.filter(
                                    pregunta =>
                                        Number(pregunta.tema) === tema
                                ).length;

                                return `
                                    <label class="tema-card">

                                        <input
                                            type="checkbox"
                                            class="tema-checkbox"
                                            data-bloque="${id}"
                                            value="${tema}"
                                        >

                                        <span class="tema-card-content">

                                            <span class="tema-number">
                                                ${tema}
                                            </span>

                                            <span class="tema-text">
                                                <strong>
                                                    Tema ${tema}
                                                </strong>

                                                <small>
                                                    ${total} preguntas
                                                </small>
                                            </span>

                                            <span class="tema-check">
                                                ✓
                                            </span>

                                        </span>

                                    </label>
                                `;
                            })
                            .join("")}
                    </div>

                </div>

            </div>
        `;
    }

    function obtenerTemasDelBloque(bloque) {
        return [
            ...new Set(
                preguntas
                    .map(p => Number(p.tema))
                    .filter(
                        tema =>
                            tema >= bloque.desde &&
                            tema <= bloque.hasta
                    )
            )
        ].sort((a, b) => a - b);
    }

    function conectarConfiguracion() {
        document
            .querySelectorAll("[data-toggle-bloque]")
            .forEach(boton => {
                boton.onclick = () => {
                    const id = boton.dataset.toggleBloque;
                    const panel = porId(`panel-${id}`);

                    const abierto =
                        !panel.hasAttribute("hidden");

                    if (abierto) {
                        panel.setAttribute("hidden", "");
                    } else {
                        panel.removeAttribute("hidden");
                    }

                    boton.setAttribute(
                        "aria-expanded",
                        String(!abierto)
                    );
                };
            });

        document
            .querySelectorAll(".tema-checkbox")
            .forEach(checkbox => {
                checkbox.onchange = actualizarConfiguracion;
            });

        document
            .querySelectorAll("[data-marcar-bloque]")
            .forEach(boton => {
                boton.onclick = () => {
                    const bloque = boton.dataset.marcarBloque;

                    const checks = [
                        ...document.querySelectorAll(
                            `.tema-checkbox[data-bloque="${bloque}"]`
                        )
                    ];

                    const todosMarcados =
                        checks.length > 0 &&
                        checks.every(check => check.checked);

                    checks.forEach(check => {
                        check.checked = !todosMarcados;
                    });

                    actualizarConfiguracion();
                };
            });

        document
            .querySelectorAll("[data-cantidad]")
            .forEach(boton => {
                boton.onclick = () => {
                    if (boton.disabled) {
                        return;
                    }

                    cantidad = Number(
                        boton.dataset.cantidad
                    );

                    document
                        .querySelectorAll("[data-cantidad]")
                        .forEach(otro => {
                            otro.classList.toggle(
                                "selected",
                                Number(
                                    otro.dataset.cantidad
                                ) === cantidad
                            );
                        });

                    actualizarConfiguracion();
                };
            });

        porId("empezar-test").onclick = comenzar;
        porId("cerrar-configuracion").onclick = cerrar;
    }

    function actualizarConfiguracion() {
        temasSeleccionados = [
            ...document.querySelectorAll(
                ".tema-checkbox:checked"
            )
        ].map(checkbox => Number(checkbox.value));

        const disponibles = preguntas.filter(
            pregunta =>
                temasSeleccionados.includes(
                    Number(pregunta.tema)
                )
        );

        const total = disponibles.length;
        const info = porId("cantidad-info");

        if (!total) {
            info.textContent =
                "Selecciona al menos un tema.";

            porId("empezar-test").disabled = true;
        } else {
            info.textContent =
                `${total} preguntas disponibles para tu selección.`;

            porId("empezar-test").disabled = false;
        }

        document
            .querySelectorAll("[data-cantidad]")
            .forEach(boton => {
                const numero = Number(
                    boton.dataset.cantidad
                );

                boton.disabled = numero > total;
            });

        if (total && cantidad > total) {
            const validas = CANTIDADES.filter(
                numero => numero <= total
            );

            cantidad = validas.length
                ? validas[validas.length - 1]
                : 10;

            document
                .querySelectorAll("[data-cantidad]")
                .forEach(boton => {
                    boton.classList.toggle(
                        "selected",
                        Number(
                            boton.dataset.cantidad
                        ) === cantidad
                    );
                });
        }
    }

    function comenzar() {
        const disponibles = preguntas.filter(
            pregunta =>
                temasSeleccionados.includes(
                    Number(pregunta.tema)
                )
        );

        if (!disponibles.length) {
            return;
        }

        if (disponibles.length < cantidad) {
            alert(
                `Solo hay ${disponibles.length} preguntas disponibles.`
            );

            return;
        }

        examen = mezclar(disponibles).slice(0, cantidad);

        respuestas = {};
        riesgos = {};
        pagina = 0;

        mostrarPregunta();
    }

    function mostrarPregunta() {
        const pregunta = examen[pagina];
        const respuesta =
            respuestas[pregunta.id] ?? null;

        const total = examen.length;

        const opciones = [
            ["A", pregunta.respuesta_a],
            ["B", pregunta.respuesta_b],
            ["C", pregunta.respuesta_c]
        ].filter(
            ([, texto]) =>
                typeof texto === "string" &&
                texto.trim() !== ""
        );

        mostrar(`
            <div class="test-running">

                <header class="test-running-header">

                    <button
                        class="test-icon-button"
                        id="abandonar-test"
                        aria-label="Salir"
                    >
                        ←
                    </button>

                    <div class="test-running-progress">

                        <span>
                            Pregunta ${pagina + 1} de ${total}
                        </span>

                        <div class="progress-track">
                            <div
                                class="progress-value"
                                style="width:${((pagina + 1) / total) * 100}%"
                            ></div>
                        </div>

                    </div>

                </header>

                <main class="question-container">

                    <div class="question-meta">
                        <span>
                            Pregunta ${pagina + 1}
                        </span>

                        <span>
                            Tema ${escapar(pregunta.tema)}
                        </span>
                    </div>

                    <article class="question-card">
                        <h2>
                            ${escapar(pregunta.enunciado)}
                        </h2>
                    </article>

                    <div class="answers-container">
                        ${opciones
                            .map(
                                ([letra, texto]) => `
                                    <button
                                        type="button"
                                        class="answer-button ${
                                            respuesta === letra
                                                ? "selected"
                                                : ""
                                        }"
                                        data-respuesta="${letra}"
                                    >

                                        <span class="answer-letter">
                                            ${letra}
                                        </span>

                                        <span class="answer-text">
                                            ${escapar(texto)}
                                        </span>

                                    </button>
                                `
                            )
                            .join("")}
                    </div>

                    <div
                        class="risk-container ${
                            respuesta ? "visible" : ""
                        }"
                    >
                        <button
                            type="button"
                            class="risk-button ${
                                riesgos[pregunta.id]
                                    ? "active"
                                    : ""
                            }"
                            id="marcar-riesgo"
                        >
                            ${
                                riesgos[pregunta.id]
                                    ? "✓ Respuesta arriesgada"
                                    : "⚡ Arriesgar"
                            }
                        </button>
                    </div>

                </main>

                <nav class="test-navigation">

                    <button
                        type="button"
                        class="navigation-button secondary"
                        id="anterior"
                        ${pagina === 0 ? "disabled" : ""}
                    >
                        ← Anterior
                    </button>

                    ${
                        pagina < total - 1
                            ? `
                                <button
                                    type="button"
                                    class="navigation-button primary"
                                    id="siguiente"
                                >
                                    Siguiente →
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="navigation-button primary"
                                    id="finalizar"
                                >
                                    Finalizar test
                                </button>
                            `
                    }

                </nav>

            </div>
        `);

        document
    .querySelectorAll("[data-respuesta]")
    .forEach(boton => {
        boton.onclick = () => {
            const nuevaRespuesta =
                boton.dataset.respuesta;

            if (
                respuestas[pregunta.id] ===
                nuevaRespuesta
            ) {
                delete respuestas[pregunta.id];
                delete riesgos[pregunta.id];
            } else {
                respuestas[pregunta.id] =
                    nuevaRespuesta;
            }

            mostrarPregunta();
        };
    });

        /*
         * El riesgo SOLO se puede marcar cuando
         * existe una respuesta.
         *
         * Una pregunta en blanco nunca será riesgo.
         */
        porId("marcar-riesgo").onclick = () => {
            if (!respuestas[pregunta.id]) {
                return;
            }

            riesgos[pregunta.id] =
                !riesgos[pregunta.id];

            mostrarPregunta();
        };

        porId("anterior").onclick = () => {
            if (pagina > 0) {
                pagina--;
                mostrarPregunta();
            }
        };

        if (porId("siguiente")) {
            porId("siguiente").onclick = () => {

                /*
                 * Si no hay respuesta, permanece en blanco.
                 *
                 * Si hay riesgo, se conserva.
                 */
                if (!respuestas[pregunta.id]) {
                    delete riesgos[pregunta.id];
                }

                pagina++;

                mostrarPregunta();
            };
        }

        if (porId("finalizar")) {
            porId("finalizar").onclick = () => {
                finalizar();
            };
        }

        porId("abandonar-test").onclick = () => {
            if (
                confirm(
                    "¿Quieres salir? Perderás las respuestas de este test."
                )
            ) {
                cerrar();
            }
        };
    }

    function calcularNota(aciertos, fallos, total) {
        const puntos = Math.max(
            0,
            aciertos - fallos / 2
        );

        return total
            ? (puntos / total) * 10
            : 0;
    }

    function finalizar() {
        const detalle = examen.map(pregunta => {
            const respuesta =
                respuestas[pregunta.id] ?? null;

            const correcta =
                pregunta.respuesta_correcta;

            const acertada =
                Boolean(respuesta) &&
                respuesta === correcta;

            return {
                pregunta,
                respuesta,
                correcta,
                acertada,
                riesgo: Boolean(
                    riesgos[pregunta.id]
                )
            };
        });

        /*
         * =========================================
         * ESTADÍSTICAS REALES
         * =========================================
         *
         * Las preguntas con riesgo quedan fuera
         * completamente de la nota real.
         *
         * Las preguntas en blanco tampoco cuentan.
         */

        const aciertos = detalle.filter(
            d =>
                d.respuesta &&
                d.acertada &&
                !d.riesgo
        ).length;

        const fallos = detalle.filter(
            d =>
                d.respuesta &&
                !d.acertada &&
                !d.riesgo
        ).length;

        const blancas = detalle.filter(
            d => !d.respuesta
        ).length;

        /*
         * =========================================
         * ESTADÍSTICAS DE RIESGO
         * =========================================
         */

        const aciertosRiesgo = detalle.filter(
            d =>
                d.respuesta &&
                d.acertada &&
                d.riesgo
        ).length;

        const fallosRiesgo = detalle.filter(
            d =>
                d.respuesta &&
                !d.acertada &&
                d.riesgo
        ).length;

        /*
         * =========================================
         * NOTA REAL
         * =========================================
         *
         * No se contabiliza ningún acierto ni fallo
         * que esté marcado como riesgo.
         */

        const nota = calcularNota(
            aciertos,
            fallos,
            examen.length
        );

        /*
         * =========================================
         * NOTA CON RIESGO
         * =========================================
         *
         * Aquí sí incluimos TODAS las preguntas
         * contestadas:
         *
         * - Correctas normales
         * - Correctas con riesgo
         * - Falladas normales
         * - Falladas con riesgo
         *
         * Las blancas siguen siendo blancas.
         */

        const aciertosConRiesgo = detalle.filter(
            d =>
                d.respuesta &&
                d.acertada
        ).length;

        const fallosConRiesgo = detalle.filter(
            d =>
                d.respuesta &&
                !d.acertada
        ).length;

        const notaConRiesgo = calcularNota(
            aciertosConRiesgo,
            fallosConRiesgo,
            examen.length
        );

        mostrarResultados({
            detalle,
            aciertos,
            fallos,
            blancas,
            aciertosRiesgo,
            fallosRiesgo,
            aciertosConRiesgo,
            fallosConRiesgo,
            nota,
            notaConRiesgo
        });
    }

    function mostrarResultados(resultado) {
        const {
            detalle,
            aciertos,
            fallos,
            blancas,
            aciertosRiesgo,
            fallosRiesgo,
            nota,
            notaConRiesgo
        } = resultado;

        mostrar(`
            <div class="test-results">

                <header class="results-header">

                    <button
                        type="button"
                        class="test-icon-button"
                        id="volver-inicio"
                    >
                        ←
                    </button>

                    <div class="results-title">

                        <span class="test-config-kicker">
                            TEST FINALIZADO
                        </span>

                        <h2>
                            Resultados
                        </h2>

                        <p>
                            Revisa tu resultado y tus respuestas.
                        </p>

                    </div>

                </header>

                <section class="results-score-card">

                    <!-- ================================= -->
                    <!-- NOTA REAL -->
                    <!-- ================================= -->

                    <div class="results-score-main">

                        <span>
                            TU NOTA
                        </span>

                        <strong>
                            ${nota
                                .toFixed(2)
                                .replace(".", ",")}
                        </strong>

                        <small>
                            sobre 10
                        </small>

                    </div>

                    <!-- ================================= -->
                    <!-- NOTA CON RIESGO -->
                    <!-- ================================= -->

                    <div class="results-score-main risk-score">

                        <span>
                            ⚡ NOTA CON RIESGO
                        </span>

                        <strong>
                            ${notaConRiesgo
                                .toFixed(2)
                                .replace(".", ",")}
                        </strong>

                        <small>
                            sobre 10
                        </small>

                    </div>

                    <!-- ================================= -->
                    <!-- ESTADÍSTICAS -->
                    <!-- ================================= -->

                    <div class="results-stat-grid">

                        <div class="result-stat correct">
                            <strong>
                                ${aciertos}
                            </strong>

                            <span>
                                Acertadas
                            </span>
                        </div>

                        <div class="result-stat risk-correct">
                            <strong>
                                ${aciertosRiesgo}
                            </strong>

                            <span>
                                Acertadas con riesgo
                            </span>
                        </div>

                        <div class="result-stat incorrect">
                            <strong>
                                ${fallos}
                            </strong>

                            <span>
                                Falladas
                            </span>
                        </div>

                        <div class="result-stat risk-incorrect">
                            <strong>
                                ${fallosRiesgo}
                            </strong>

                            <span>
                                Falladas con riesgo
                            </span>
                        </div>

                        <div class="result-stat blank">
                            <strong>
                                ${blancas}
                            </strong>

                            <span>
                                En blanco
                            </span>
                        </div>

                    </div>

                </section>

                <section class="results-questions">

                    <div class="results-section-heading">

                        <div>

                            <span>
                                PREGUNTAS
                            </span>

                            <h3>
                                Revisión del test
                            </h3>

                        </div>

                    </div>

                    <div class="results-grid">

                        ${detalle
                            .map((d, i) => {

                                let clase = "blank";

                                if (d.respuesta) {
                                    clase =
                                        d.acertada
                                            ? "correct"
                                            : "incorrect";
                                }

                                return `
                                    <button
                                        type="button"
                                        class="result-question ${clase}"
                                        data-ir-pregunta="${i}"
                                    >

                                        <span>
                                            ${i + 1}
                                        </span>

                                        ${
                                            d.riesgo
                                                ? `<b>⚡</b>`
                                                : ""
                                        }

                                    </button>
                                `;
                            })
                            .join("")}

                    </div>

                    <div class="results-legend">

                        <span class="legend-correct">
                            <i></i>
                            Correcta
                        </span>

                        <span class="legend-incorrect">
                            <i></i>
                            Fallada
                        </span>

                        <span class="legend-blank">
                            <i></i>
                            En blanco
                        </span>

                        <span class="legend-risk">
                            ⚡ Riesgo
                        </span>

                    </div>

                </section>

                <section
                    id="revision-preguntas"
                    class="results-review"
                >
                    ${renderRevision(detalle, 0)}
                </section>

                <nav class="results-navigation">

                    <button
                        type="button"
                        class="navigation-button secondary"
                        id="revision-anterior"
                        disabled
                    >
                        ← Anterior
                    </button>

                    <span id="contador-revision">
                        Pregunta 1 de ${detalle.length}
                    </span>

                    <button
                        type="button"
                        class="navigation-button primary"
                        id="revision-siguiente"
                        ${
                            detalle.length <= 1
                                ? "disabled"
                                : ""
                        }
                    >
                        Siguiente →
                    </button>

                </nav>

                <div class="results-footer">

                    <button
                        type="button"
                        class="test-primary-button"
                        id="cerrar-resultados"
                    >
                        Volver al inicio
                    </button>

                </div>

            </div>
        `);

        let indiceRevision = 0;

        porId("volver-inicio").onclick = cerrar;
        porId("cerrar-resultados").onclick = cerrar;

        document
            .querySelectorAll("[data-ir-pregunta]")
            .forEach(boton => {
                boton.onclick = () => {
                    indiceRevision = Number(
                        boton.dataset.irPregunta
                    );

                    actualizarRevision();

                    porId(
                        "revision-preguntas"
                    ).scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                };
            });

        porId("revision-anterior").onclick = () => {
            if (indiceRevision > 0) {
                indiceRevision--;
                actualizarRevision();
            }
        };

        porId("revision-siguiente").onclick = () => {
            if (
                indiceRevision <
                detalle.length - 1
            ) {
                indiceRevision++;
                actualizarRevision();
            }
        };

        function actualizarRevision() {
            porId(
                "revision-preguntas"
            ).innerHTML =
                renderRevision(
                    detalle,
                    indiceRevision
                );

            porId(
                "contador-revision"
            ).textContent =
                `Pregunta ${
                    indiceRevision + 1
                } de ${detalle.length}`;

            porId(
                "revision-anterior"
            ).disabled =
                indiceRevision === 0;

            porId(
                "revision-siguiente"
            ).disabled =
                indiceRevision ===
                detalle.length - 1;
        }
    }

    function renderRevision(detalle, indice) {
        const d = detalle[indice];
        const p = d.pregunta;

        const opciones = [
            ["A", p.respuesta_a],
            ["B", p.respuesta_b],
            ["C", p.respuesta_c]
        ].filter(
            ([, texto]) =>
                typeof texto === "string" &&
                texto.trim() !== ""
        );

        let estadoClase = "blank";
        let estadoTexto = "En blanco";

        if (d.respuesta) {
            if (d.acertada) {
                estadoClase = "correct";
                estadoTexto = "Correcta";
            } else {
                estadoClase = "incorrect";
                estadoTexto = "Fallada";
            }
        }

        return `
            <article class="results-review-card">

                <div class="review-top">

                    <div>

                        <span class="review-kicker">
                            PREGUNTA ${indice + 1}
                        </span>

                        <span class="review-topic">
                            Tema ${escapar(p.tema)}
                        </span>

                    </div>

                    <div class="review-status ${estadoClase}">
                        ${
                            d.riesgo
                                ? "⚡ "
                                : ""
                        }

                        ${estadoTexto}
                    </div>

                </div>

                <h3>
                    ${escapar(p.enunciado)}
                </h3>

                <div class="review-options">

                    ${opciones
                        .map(([letra, texto]) => {

                            let clase = "";

                            if (letra === d.correcta) {
                                clase =
                                    "correct-answer";
                            }

                            if (
                                letra === d.respuesta &&
                                letra !== d.correcta
                            ) {
                                clase =
                                    "wrong-answer";
                            }

                            if (
                                letra === d.respuesta &&
                                letra === d.correcta
                            ) {
                                clase =
                                    "correct-answer user-answer";
                            }

                            return `
                                <div
                                    class="review-option ${clase}"
                                >

                                    <strong>
                                        ${letra}
                                    </strong>

                                    <span>
                                        ${escapar(texto)}
                                    </span>

                                    ${
                                        letra === d.correcta
                                            ? `
                                                <em>
                                                    ✓ Correcta
                                                </em>
                                            `
                                            : ""
                                    }

                                    ${
                                        letra === d.respuesta &&
                                        letra !== d.correcta
                                            ? `
                                                <em>
                                                    Tu respuesta
                                                </em>
                                            `
                                            : ""
                                    }

                                </div>
                            `;
                        })
                        .join("")}

                </div>

            </article>
        `;
    }

    function cerrar() {
        const contenedor =
            porId("test-generator-screen");

        if (contenedor) {
            contenedor.remove();
        }

        document.body.classList.remove(
            "test-generator-active"
        );
    }

    window.TestAppTestGenerator = {
        abrir
    };
})();