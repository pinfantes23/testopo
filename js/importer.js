function validarPregunta(question, index) {
    const errores = [];

    if (!question || typeof question !== "object") {
        errores.push(`La pregunta ${index + 1} no es un objeto válido.`);
        return errores;
    }

    if (
        question.id === undefined ||
        question.id === null ||
        question.id === ""
    ) {
        errores.push(`Pregunta ${index + 1}: falta "id".`);
    }

    if (
        question.numero === undefined ||
        question.numero === null
    ) {
        errores.push(`Pregunta ${index + 1}: falta "numero".`);
    }

    if (
        question.tema === undefined ||
        question.tema === null
    ) {
        errores.push(`Pregunta ${index + 1}: falta "tema".`);
    }

    if (
        typeof question.enunciado !== "string" ||
        question.enunciado.trim() === ""
    ) {
        errores.push(`Pregunta ${index + 1}: falta "enunciado".`);
    }

    if (
        typeof question.respuesta_a !== "string" ||
        question.respuesta_a.trim() === ""
    ) {
        errores.push(`Pregunta ${index + 1}: falta "respuesta_a".`);
    }

    if (
        typeof question.respuesta_b !== "string" ||
        question.respuesta_b.trim() === ""
    ) {
        errores.push(`Pregunta ${index + 1}: falta "respuesta_b".`);
    }

    if (
        question.respuesta_c !== undefined &&
        typeof question.respuesta_c !== "string"
    ) {
        errores.push(
            `Pregunta ${index + 1}: "respuesta_c" debe ser texto.`
        );
    }

    const respuestaCorrecta = String(
        question.respuesta_correcta || ""
    ).toUpperCase();

    if (!["A", "B", "C"].includes(respuestaCorrecta)) {
        errores.push(
            `Pregunta ${index + 1}: "respuesta_correcta" debe ser A, B o C.`
        );
    }

    if (
        respuestaCorrecta === "C" &&
        (
            question.respuesta_c === undefined ||
            question.respuesta_c.trim() === ""
        )
    ) {
        errores.push(
            `Pregunta ${index + 1}: la respuesta correcta es C pero no existe "respuesta_c".`
        );
    }

    return errores;
}


function prepararPregunta(question) {
    return {
        id: Number(question.id),
        numero: Number(question.numero),
        tema: Number(question.tema),
        enunciado: question.enunciado.trim(),
        respuesta_a: question.respuesta_a.trim(),
        respuesta_b: question.respuesta_b.trim(),

        ...(question.respuesta_c !== undefined &&
        question.respuesta_c !== null &&
        question.respuesta_c.trim() !== ""
            ? {
                respuesta_c: question.respuesta_c.trim()
            }
            : {}),

        respuesta_correcta: String(
            question.respuesta_correcta
        ).toUpperCase()
    };
}


async function importarTestDesdeArchivo(file) {
    if (!file) {
        throw new Error("No se ha seleccionado ningún archivo.");
    }

    if (
        !file.name.toLowerCase().endsWith(".json") &&
        file.type !== "application/json"
    ) {
        throw new Error("El archivo seleccionado no es un JSON.");
    }

    const texto = await file.text();

    let datos;

    try {
        datos = JSON.parse(texto);
    } catch (error) {
        throw new Error(
            "El archivo no contiene un JSON válido."
        );
    }

    if (!datos || !Array.isArray(datos.questions)) {
        throw new Error(
            'El JSON debe tener una propiedad "questions" que sea un array.'
        );
    }

    if (datos.questions.length === 0) {
        throw new Error(
            "El archivo no contiene ninguna pregunta."
        );
    }

    const preguntasValidas = [];
    const errores = [];

    datos.questions.forEach((question, index) => {
        const erroresPregunta = validarPregunta(
            question,
            index
        );

        if (erroresPregunta.length > 0) {
            errores.push(...erroresPregunta);
        } else {
            preguntasValidas.push(
                prepararPregunta(question)
            );
        }
    });

    if (errores.length > 0) {
        throw new Error(
            "El archivo contiene errores:\n\n" +
            errores.join("\n")
        );
    }

    await TestAppDB.saveQuestions(preguntasValidas);

    const totalPreguntas =
        await TestAppDB.getQuestionCount();

    return {
        importadas: preguntasValidas.length,
        total: totalPreguntas
    };
}


window.TestAppImporter = {
    importarTestDesdeArchivo
};