const KNOWN_PREFIXES_ = ['BBABF', 'BBACM', 'MHHRR', 'MFIN', 'MDGP', 'MMKD', 'MLDO', 'MPM', 'BBA', 'MBA', 'MMK'];
const CURSO_ESPECIAL_CAPSTONE_ = 'Alumnos Pendientes de Capstone';
const CAPSTONE_REQUERIDOS_ = ['Capstone Project 1', 'Capstone Project 2'];
const TIPO_RESOLUCION_AUTOMATICA_ = 'ASIGNACION AUTOMATICA';
const TIPO_RESOLUCION_CAPSTONE_ = 'DERIVACION CAPSTONE';
const TIPO_RESOLUCION_PENDIENTE_ = 'PENDIENTE APROBACION CAMBIO DE DIA';
const TIPO_RESOLUCION_SIN_ASIGNACION_ = 'SIN ASIGNACION';
const ESTADO_PENDIENTE_APROBACION_ = 'Pendiente de aprobación manual por cambio de día';

function analizarAsignacionMensual() {
  const CONFIG = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const shHistorial = ss.getSheetByName(CONFIG.SHEET_HISTORIAL);
  const shOrigen = ss.getSheetByName(CONFIG.SHEET_ORIGEN);
  const shUsuarios = ss.getSheetByName(CONFIG.SHEET_USUARIOS);
  const shDestino = ss.getSheetByName(CONFIG.SHEET_DESTINO);
  const shReglas = ss.getSheetByName(CONFIG.SHEET_REGLAS);

  if (!shHistorial || !shOrigen || !shUsuarios || !shDestino || !shReglas) {
    throw new Error('Falta una o más hojas requeridas. Revisa Config y ReglasPlanes.');
  }

  const historialData = getDataRows_(shHistorial);
  const origenData = getDataRows_(shOrigen);
  const usuarios = getUsuarios_(shUsuarios);
  const cursosDestino = getCursosDesdeUnaColumna_(shDestino);
  const reglasPlanes = getReglasPlanes_(shReglas);

  const historialPorUsuario = agruparPorUsuario_(historialData, CONFIG);
  const origenPorUsuario = agruparPorUsuario_(origenData, CONFIG);

  const cuposAsignados = {};
  cursosDestino.forEach(curso => {
    cuposAsignados[curso.cursoOriginal] = Number(curso.cupoActual || 0);
  });

  prepararHojaResumen_(ss, CONFIG.SHEET_RESUMEN);

  const headers = [
    'Usuario',
    'Nombre',
    'Plan',
    'Cursos aprobados',
    'Total plan',
    'Pendientes',
    'Alerta cierre',
    'Sigla curso origen',
    'Subfamilia objetivo',
    'Cursos subfamilia aprobados',
    'Cuota subfamilia',
    'Pendientes subfamilia',
    'Cantidad recuperaciones vigentes',
    'Cursos reprobados / recuperación / reasignación',
    'Prioridad aplicada',
    'Curso origen',
    'Día original',
    'Curso destino asignado',
    'Día asignado',
    'Cambio de día',
    'Notificación',
    'Curso historial más parecido',
    'Nota historial',
    'Estado académico curso similar',
    '% coincidencia máxima con historial',
    'Cupo usado',
    'Cupo máximo',
    'Estado'
  ];

  headers.push(
    'Plan normalizado',
    'Programa probable',
    'Coincidencia plan/historico',
    'Confianza programa',
    'Bloque curso origen',
    'Requiere revision',
    'Motivo revision',
    'Confianza asignacion',
    'Score confianza',
    'Tipo resolución',
    'Fuente resolución programa',
    'Plan compuesto',
    'Componentes plan',
    'Evidencia master',
    'Modo cálculo cierre',
    'Historial cierre filtrado',
    'Detalle cálculo cierre'
  );

  const resumenRows = [headers];
  const revisionRows = [headers];
  const stats = crearEstadisticasProceso_(usuarios.length);
  const moodleRows = [];
  const pendientesAprobacionRows = [];

  usuarios.forEach(usuario => {
    stats.usuariosProcesados++;
    const historialUsuario = historialPorUsuario[usuario] || [];
    const origenUsuario = origenPorUsuario[usuario] || [];
    const resumenUsuario = {
      totalCursosOrigen: origenUsuario.length,
      asignados: 0,
      fallidos: 0,
      pendientesManual: 0
    };
    if (origenUsuario.length > 0) stats.usuariosConOrigen++;
    else stats.usuariosSinOrigen++;
    const filaBase = origenUsuario[0] || historialUsuario[0] || null;

    const nombreUsuario = filaBase ? getNombreCompleto_(filaBase, CONFIG) : '';
    const planUsuario = filaBase ? safeValue_(filaBase[CONFIG.COL_PLAN - 1]).trim() : '';
    const resumenHistorial = construirResumenHistorial_(historialUsuario, CONFIG);
    const perfilPrograma = inferirPerfilProgramaAlumno_({
      planUsuario,
      historialUsuario,
      origenUsuario,
      resumenHistorial,
      CONFIG
    });
    const revisionBase = evaluarRevisionPrograma_(perfilPrograma);
    const estructuraPrograma = getEstructuraProgramaInferida_(perfilPrograma.programaCodigo);
    const totalPlanDeclarado = extraerTotalPlan_(planUsuario);
    const contextoCierre = resolverContextoCalculoCierrePrograma_({
      perfilPrograma,
      resumenHistorial,
      estructuraPrograma,
      totalPlanDeclarado,
      alertaPendientesDefault: CONFIG.ALERTA_PENDIENTES
    });
    const totalPlan = contextoCierre.totalPlan;
    const cursosAprobados = contextoCierre.cursosAprobados;
    const pendientes = contextoCierre.pendientes;
    const alertaCierre = contextoCierre.alertaCierre;

    const fechaReferenciaResumen = origenUsuario.length > 0
      ? extraerFechaCursoDesdeNombre_(safeValue_(origenUsuario[0][CONFIG.COL_COURSE - 1]))
      : new Date();

    const recuperacionesVigentes = obtenerRecuperacionesVigentes_(
      resumenHistorial,
      fechaReferenciaResumen
    );
    const cursosSeguimiento = obtenerCursosNoAprobadosParaSeguimiento_(resumenHistorial);

    const cantidadRecuperaciones = recuperacionesVigentes.length;
    const listaRecuperaciones = cursosSeguimiento
      .map(x => `${x.curso} (${x.nota}, ${x.estado})`)
      .join(' | ');

    if (origenUsuario.length === 0) {
      stats.alumnosSinAsignacion++;
      resumenRows.push(agregarColumnasPerfilPrograma_([
        usuario,
        nombreUsuario,
        planUsuario,
        cursosAprobados,
        totalPlan === null ? '' : totalPlan,
        pendientes,
        alertaCierre,
        '',
        '',
        '',
        '',
        '',
        cantidadRecuperaciones,
        listaRecuperaciones,
        '',
        'Sin cursos en hoja origen',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        CONFIG.MAX_CUPO_POR_CURSO,
        'Sin datos en hoja origen',
        perfilPrograma.planNormalizado || '',
        perfilPrograma.programaCodigo || '',
        perfilPrograma.coincidenciaPlanHistorico || '',
        perfilPrograma.confianzaEtiqueta || '',
        '',
        revisionBase.requiereRevision ? 'SI' : 'NO',
        revisionBase.motivo || '',
        '',
        '',
        TIPO_RESOLUCION_SIN_ASIGNACION_
      ], perfilPrograma, contextoCierre));
      return;
    }

    const historialCursos = Object.keys(resumenHistorial).map(k => resumenHistorial[k]);

    const cursosAsignadosAlUsuario = new Set();
    const asignadosSubfamiliaPorSigla = {};
    const contextoMBA21 = resolverContextoMBA21_({
      planUsuario,
      perfilPrograma,
      resumenHistorial
    });
    const contextoCapstoneCierre = evaluarCierreConCapstonePendiente_({
      alertaCierre,
      resumenHistorial: contextoCierre.resumenHistorialCierre,
      familiaObjetivo: perfilPrograma.familiaProbable
    });
    let derivacionCapstoneResuelta = null;

    origenUsuario.forEach(rowOrigen => {
      stats.cursosOrigenProcesados++;
      const cursoOrigen = safeValue_(rowOrigen[CONFIG.COL_COURSE - 1]).trim();
      const diaOrigen = detectDay_(cursoOrigen);
      const siglaOrigen = extraerPrefijoCurso_(cursoOrigen);
      const bloqueCursoOrigen = inferirBloqueCursoDesdeNombre_(cursoOrigen);

      if (contextoCapstoneCierre.aplica) {
        if (!derivacionCapstoneResuelta) {
          derivacionCapstoneResuelta = resolverDerivacionCapstonePendiente_({
            cursosDestino,
            cuposAsignados,
            cursosAsignadosAlUsuario,
            maxCupo: CONFIG.MAX_CUPO_POR_CURSO,
            capstonesFaltantes: contextoCapstoneCierre.capstonesFaltantes
          });

          if (derivacionCapstoneResuelta.asignado) {
            cuposAsignados[derivacionCapstoneResuelta.cursoOriginal] += 1;
            cursosAsignadosAlUsuario.add(derivacionCapstoneResuelta.cursoOriginal);
            stats.asignacionesExitosas++;
            stats.derivadosCapstone++;
            resumenUsuario.asignados = resumenUsuario.totalCursosOrigen;

            const confianzaCapstone = crearConfianzaDerivacionCapstone_();
            const revisionCapstone = evaluarRevisionAsignacion_(revisionBase, confianzaCapstone);
            acumularConfianza_(stats, confianzaCapstone);
            moodleRows.push(crearFilaMoodle_({
              usuario,
              rowOrigen,
              cursoDestino: derivacionCapstoneResuelta.cursoOriginal,
              diaAsignado: derivacionCapstoneResuelta.diaAsignado,
              role: CONFIG.MOODLE_ROLE_DEFAULT
            }, CONFIG));

            const rowCapstoneAsignado = agregarColumnasPerfilPrograma_([
              usuario,
              nombreUsuario,
              planUsuario,
              cursosAprobados,
              totalPlan === null ? '' : totalPlan,
              pendientes,
              alertaCierre,
              siglaOrigen,
              '',
              '',
              '',
              '',
              cantidadRecuperaciones,
              listaRecuperaciones,
              derivacionCapstoneResuelta.prioridadAplicada,
              cursoOrigen,
              diaOrigen || '',
              derivacionCapstoneResuelta.cursoOriginal,
              derivacionCapstoneResuelta.diaAsignado || '',
              'No',
              derivacionCapstoneResuelta.notificacion,
              '',
              '',
              '',
              '',
              cuposAsignados[derivacionCapstoneResuelta.cursoOriginal],
              CONFIG.MAX_CUPO_POR_CURSO,
              derivacionCapstoneResuelta.estado,
              perfilPrograma.planNormalizado || '',
              perfilPrograma.programaCodigo || '',
              perfilPrograma.coincidenciaPlanHistorico || '',
              perfilPrograma.confianzaEtiqueta || '',
              bloqueCursoOrigen || '',
               revisionCapstone.requiereRevision ? 'SI' : 'NO',
               revisionCapstone.motivo || '',
                 confianzaCapstone.etiqueta,
                 confianzaCapstone.score,
                 TIPO_RESOLUCION_CAPSTONE_
               ], perfilPrograma, contextoCierre);
            resumenRows.push(rowCapstoneAsignado);
            if (revisionCapstone.requiereRevision) revisionRows.push(rowCapstoneAsignado);
          } else {
            stats.asignacionesFallidas++;
            resumenUsuario.fallidos = resumenUsuario.totalCursosOrigen;
            registrarMotivoNoAsignacion_(stats, derivacionCapstoneResuelta.estado);

            const rowCapstoneFallido = agregarColumnasPerfilPrograma_([
              usuario,
              nombreUsuario,
              planUsuario,
              cursosAprobados,
              totalPlan === null ? '' : totalPlan,
              pendientes,
              alertaCierre,
              siglaOrigen,
              '',
              '',
              '',
              '',
              cantidadRecuperaciones,
              listaRecuperaciones,
              derivacionCapstoneResuelta.prioridadAplicada,
              cursoOrigen,
              diaOrigen || '',
              '',
              '',
              'No',
              derivacionCapstoneResuelta.notificacion,
              '',
              '',
              '',
              '',
              '',
              CONFIG.MAX_CUPO_POR_CURSO,
              derivacionCapstoneResuelta.estado,
              perfilPrograma.planNormalizado || '',
              perfilPrograma.programaCodigo || '',
              perfilPrograma.coincidenciaPlanHistorico || '',
              perfilPrograma.confianzaEtiqueta || '',
               bloqueCursoOrigen || '',
               'SI',
               unirMotivosRevision_(revisionBase.motivo, derivacionCapstoneResuelta.estado),
                 '',
                 '',
                 TIPO_RESOLUCION_CAPSTONE_
               ], perfilPrograma, contextoCierre);
            resumenRows.push(rowCapstoneFallido);
            revisionRows.push(rowCapstoneFallido);
          }
        } else {
          const rowCapstoneInformativo = agregarColumnasPerfilPrograma_([
            usuario,
            nombreUsuario,
            planUsuario,
            cursosAprobados,
            totalPlan === null ? '' : totalPlan,
            pendientes,
            alertaCierre,
            siglaOrigen,
            '',
            '',
            '',
            '',
            cantidadRecuperaciones,
            listaRecuperaciones,
            derivacionCapstoneResuelta.prioridadAplicada,
            cursoOrigen,
            diaOrigen || '',
            derivacionCapstoneResuelta.asignado ? derivacionCapstoneResuelta.cursoOriginal : '',
            derivacionCapstoneResuelta.diaAsignado || '',
            'No',
            derivacionCapstoneResuelta.notificacion,
            '',
            '',
            '',
            '',
            derivacionCapstoneResuelta.asignado ? cuposAsignados[derivacionCapstoneResuelta.cursoOriginal] : '',
            CONFIG.MAX_CUPO_POR_CURSO,
            derivacionCapstoneResuelta.estado,
            perfilPrograma.planNormalizado || '',
            perfilPrograma.programaCodigo || '',
            perfilPrograma.coincidenciaPlanHistorico || '',
            perfilPrograma.confianzaEtiqueta || '',
            bloqueCursoOrigen || '',
             derivacionCapstoneResuelta.asignado ? 'NO' : 'SI',
             derivacionCapstoneResuelta.asignado ? '' : unirMotivosRevision_(revisionBase.motivo, derivacionCapstoneResuelta.estado),
               derivacionCapstoneResuelta.asignado ? 'ALTA' : '',
               derivacionCapstoneResuelta.asignado ? 100 : '',
               TIPO_RESOLUCION_CAPSTONE_
            ], perfilPrograma, contextoCierre);
          resumenRows.push(rowCapstoneInformativo);
          if (!derivacionCapstoneResuelta.asignado) revisionRows.push(rowCapstoneInformativo);
        }
        return;
      }

      const reglaPlan = getReglaPlanContextual_(siglaOrigen, perfilPrograma, reglasPlanes);

      if (!reglaPlan) {
        stats.asignacionesFallidas++;
        stats.sinRegla++;
        resumenUsuario.fallidos++;
        const rowSinRegla = agregarColumnasPerfilPrograma_([
          usuario,
          nombreUsuario,
          planUsuario,
          cursosAprobados,
          totalPlan === null ? '' : totalPlan,
          pendientes,
          alertaCierre,
          siglaOrigen,
          '',
          '',
          '',
          '',
          cantidadRecuperaciones,
          listaRecuperaciones,
          '',
          cursoOrigen,
          diaOrigen || '',
          '',
          '',
          'No',
          '',
          '',
          '',
          '',
          '',
          '',
          CONFIG.MAX_CUPO_POR_CURSO,
          'Sigla del curso origen sin regla configurada',
          perfilPrograma.planNormalizado || '',
          perfilPrograma.programaCodigo || '',
          perfilPrograma.coincidenciaPlanHistorico || '',
          perfilPrograma.confianzaEtiqueta || '',
           bloqueCursoOrigen || '',
           'SI',
           unirMotivosRevision_(revisionBase.motivo, 'Sin regla configurada'),
            '',
            '',
            TIPO_RESOLUCION_SIN_ASIGNACION_
         ], perfilPrograma, contextoCierre);
        resumenRows.push(rowSinRegla);
        revisionRows.push(rowSinRegla);
        return;
      }

      const cursosSubfamiliaAprobados = contarCursosSubfamiliaAprobados_(resumenHistorial, reglaPlan);
      const cuotaSubfamilia = reglaPlan.cuotaSubfamilia;
      const yaAsignadosSigla = asignadosSubfamiliaPorSigla[reglaPlan.subfamilia] || 0;
      const pendientesSubfamilia = Math.max(cuotaSubfamilia - cursosSubfamiliaAprobados, 0);

      const prioridadSubfamiliaActiva =
        reglaPlan &&
        reglaPlan.subfamilia &&
        reglaPlan.cuotaSubfamilia > 0 &&
        (cursosSubfamiliaAprobados + yaAsignadosSigla) < reglaPlan.cuotaSubfamilia;

      const asignacionResuelta = resolverAsignacionCurso_({
        cursosDestino,
        diaOrigen,
        reglaPlan,
        resumenHistorial,
        historialCursos,
        origenCursosVigentes: origenUsuario.map(item => safeValue_(item[CONFIG.COL_COURSE - 1]).trim()).filter(Boolean),
        cuposAsignados,
        cursosAsignadosAlUsuario,
        maxCupo: CONFIG.MAX_CUPO_POR_CURSO,
        umbralHistorial: CONFIG.UMBRAL_HISTORIAL,
        prioridadSubfamiliaActiva,
        contextoMBA21
      });

      let evaluacion = asignacionResuelta.evaluacion;
      let diaAsignado = asignacionResuelta.diaAsignado;
      let cambioDeDia = asignacionResuelta.cambioDeDia;
      let notificacion = asignacionResuelta.notificacion;
      let tipoResolucion = asignacionResuelta.tipoResolucion || TIPO_RESOLUCION_SIN_ASIGNACION_;

      if (tipoResolucion === TIPO_RESOLUCION_PENDIENTE_) {
        stats.pendientesAprobacionManual++;
        resumenUsuario.pendientesManual++;

        const revisionPendiente = {
          requiereRevision: true,
          motivo: unirMotivosRevision_(revisionBase.motivo, ESTADO_PENDIENTE_APROBACION_)
        };

        pendientesAprobacionRows.push(crearFilaPendienteAprobacion_({
          usuario,
          rowOrigen,
          cursoDestino: evaluacion.cursoOriginal,
          diaAsignado,
          role: CONFIG.MOODLE_ROLE_DEFAULT,
          comentario: notificacion,
          estado: ESTADO_PENDIENTE_APROBACION_,
          cursoOrigen,
          diaOrigen,
          tipoResolucion
        }, CONFIG));

        const rowPendiente = agregarColumnasPerfilPrograma_([
          usuario,
          nombreUsuario,
          planUsuario,
          cursosAprobados,
          totalPlan === null ? '' : totalPlan,
          pendientes,
          alertaCierre,
          siglaOrigen,
          reglaPlan ? reglaPlan.subfamilia : '',
          cursosSubfamiliaAprobados,
          cuotaSubfamilia,
          pendientesSubfamilia,
          cantidadRecuperaciones,
          listaRecuperaciones,
          evaluacion.prioridadAplicada || '',
          cursoOrigen,
          diaOrigen || '',
          evaluacion.cursoOriginal,
          diaAsignado || '',
          cambioDeDia,
          notificacion,
          evaluacion.cursoHistorialMasParecido || '',
          evaluacion.notaHistorial || '',
          evaluacion.estadoAcademicoCursoSimilar || '',
          formatPercent_(evaluacion.maxSimilarity),
          '',
          CONFIG.MAX_CUPO_POR_CURSO,
          ESTADO_PENDIENTE_APROBACION_,
          perfilPrograma.planNormalizado || '',
          perfilPrograma.programaCodigo || '',
          perfilPrograma.coincidenciaPlanHistorico || '',
          perfilPrograma.confianzaEtiqueta || '',
          bloqueCursoOrigen || '',
          'SI',
          revisionPendiente.motivo || '',
           'PENDIENTE_MANUAL',
           '',
           tipoResolucion
        ], perfilPrograma, contextoCierre);
        resumenRows.push(rowPendiente);
        revisionRows.push(rowPendiente);
      } else if (evaluacion.asignado) {
        cuposAsignados[evaluacion.cursoOriginal] += 1;
        cursosAsignadosAlUsuario.add(evaluacion.cursoOriginal);
        stats.asignacionesExitosas++;
        resumenUsuario.asignados++;

        if (!diaAsignado) {
          diaAsignado = detectDay_(evaluacion.cursoOriginal);
        }

        if (cambioDeDia !== 'No') {
          stats.cambiosDeDia++;
        }

        if (
          reglaPlan &&
          extraerPrefijoCurso_(evaluacion.cursoOriginal) &&
          reglaPlan.prefijosSubfamilia.indexOf(extraerPrefijoCurso_(evaluacion.cursoOriginal)) !== -1
        ) {
          asignadosSubfamiliaPorSigla[reglaPlan.subfamilia] =
            (asignadosSubfamiliaPorSigla[reglaPlan.subfamilia] || 0) + 1;
        }

        const confianza = calcularConfianzaAsignacion_({
          evaluacion,
          diaOrigen,
          diaAsignado,
          umbralHistorial: CONFIG.UMBRAL_HISTORIAL
        });
        const revisionAsignacion = evaluarRevisionAsignacion_(revisionBase, confianza);
        acumularConfianza_(stats, confianza);
        moodleRows.push(crearFilaMoodle_({
          usuario,
          rowOrigen,
          cursoDestino: evaluacion.cursoOriginal,
          diaAsignado,
          role: CONFIG.MOODLE_ROLE_DEFAULT
        }, CONFIG));

        const rowAsignado = agregarColumnasPerfilPrograma_([
          usuario,
          nombreUsuario,
          planUsuario,
          cursosAprobados,
          totalPlan === null ? '' : totalPlan,
          pendientes,
          alertaCierre,
          siglaOrigen,
          reglaPlan ? reglaPlan.subfamilia : '',
          cursosSubfamiliaAprobados,
          cuotaSubfamilia,
          pendientesSubfamilia,
          cantidadRecuperaciones,
          listaRecuperaciones,
          evaluacion.prioridadAplicada || '',
          cursoOrigen,
          diaOrigen || '',
          evaluacion.cursoOriginal,
          diaAsignado || '',
          cambioDeDia,
          notificacion,
          evaluacion.cursoHistorialMasParecido || '',
          evaluacion.notaHistorial || '',
          evaluacion.estadoAcademicoCursoSimilar || '',
          formatPercent_(evaluacion.maxSimilarity),
          cuposAsignados[evaluacion.cursoOriginal],
          CONFIG.MAX_CUPO_POR_CURSO,
          'Asignado',
          perfilPrograma.planNormalizado || '',
          perfilPrograma.programaCodigo || '',
          perfilPrograma.coincidenciaPlanHistorico || '',
          perfilPrograma.confianzaEtiqueta || '',
          bloqueCursoOrigen || '',
          revisionAsignacion.requiereRevision ? 'SI' : 'NO',
          revisionAsignacion.motivo || '',
           confianza.etiqueta,
           confianza.score,
           tipoResolucion
        ], perfilPrograma, contextoCierre);
        resumenRows.push(rowAsignado);
        if (revisionAsignacion.requiereRevision) revisionRows.push(rowAsignado);
      } else {
        stats.asignacionesFallidas++;
        resumenUsuario.fallidos++;
        registrarMotivoNoAsignacion_(stats, evaluacion.estado);
        const rowFallido = agregarColumnasPerfilPrograma_([
          usuario,
          nombreUsuario,
          planUsuario,
          cursosAprobados,
          totalPlan === null ? '' : totalPlan,
          pendientes,
          alertaCierre,
          siglaOrigen,
          reglaPlan ? reglaPlan.subfamilia : '',
          cursosSubfamiliaAprobados,
          cuotaSubfamilia,
          pendientesSubfamilia,
          cantidadRecuperaciones,
          listaRecuperaciones,
          evaluacion.prioridadAplicada || '',
          cursoOrigen,
          diaOrigen || '',
          '',
          '',
          'No',
          '',
          evaluacion.cursoHistorialMasParecidoGeneral || '',
          evaluacion.notaHistorialGeneral || '',
          evaluacion.estadoAcademicoCursoSimilarGeneral || '',
          evaluacion.maxSimilarityGeneral === null ? '' : formatPercent_(evaluacion.maxSimilarityGeneral),
          '',
          CONFIG.MAX_CUPO_POR_CURSO,
          evaluacion.estado,
          perfilPrograma.planNormalizado || '',
          perfilPrograma.programaCodigo || '',
          perfilPrograma.coincidenciaPlanHistorico || '',
          perfilPrograma.confianzaEtiqueta || '',
           bloqueCursoOrigen || '',
           'SI',
           unirMotivosRevision_(revisionBase.motivo, evaluacion.estado),
            '',
            '',
            tipoResolucion
         ], perfilPrograma, contextoCierre);
        resumenRows.push(rowFallido);
        revisionRows.push(rowFallido);
      }
    });

    if (resumenUsuario.totalCursosOrigen > 0) {
      if (resumenUsuario.asignados === resumenUsuario.totalCursosOrigen) {
        stats.alumnosAsignacionCompleta++;
      } else if (resumenUsuario.asignados > 0 || resumenUsuario.pendientesManual > 0) {
        stats.alumnosAsignacionParcial++;
      } else {
        stats.alumnosSinAsignacion++;
      }
    }
  });

  const shResumen = ss.getSheetByName(CONFIG.SHEET_RESUMEN);
  shResumen.clearContents();
  shResumen.getRange(1, 1, resumenRows.length, resumenRows[0].length).setValues(resumenRows);
  formatSheet_(shResumen);
  escribirHojaRevision_(ss, CONFIG.SHEET_REVISION, revisionRows);
  escribirHojaPendientesAprobacion_(ss, CONFIG.SHEET_PENDIENTES_APROBACION, pendientesAprobacionRows);
  actualizarConteosCursosDestino_(shDestino, cuposAsignados);
  generarHojasMoodlePorDia_(ss, moodleRows, CONFIG);
  escribirResumenProceso_(ss, CONFIG.SHEET_AUDITORIA, stats);
  SpreadsheetApp.flush();
  mostrarResumenProceso_(stats);
}

function filtrarCandidatos_(params) {
  const { cursosDestino, diaObjetivo, reglaPlan, contextoMBA21, bloquesPermitidos, diasObjetivo } = params;

  return cursosDestino.filter(cursoDestino => {
    const coincideDia = diasObjetivo && diasObjetivo.length
      ? diasObjetivo.indexOf(cursoDestino.dia) !== -1
      : (!diaObjetivo || cursoDestino.dia === diaObjetivo || cursoDestino.dia === '');
    const compatiblePlan = esCursoCompatibleConRegla_(cursoDestino.cursoOriginal, reglaPlan, contextoMBA21);
    const bloqueCurso = inferirBloqueCursoParaPrograma_(cursoDestino.cursoOriginal, contextoMBA21);
    const bloquePermitido = !bloquesPermitidos || !bloquesPermitidos.length || bloquesPermitidos.indexOf(bloqueCurso) !== -1;
    return coincideDia && compatiblePlan && bloquePermitido;
  });
}

function detectarFamiliaCapstoneCurso_(cursoNombre) {
  const textoOriginal = safeValue_(cursoNombre).trim();
  const normalizado = normalizeCourseName_(cursoNombre);
  if (!textoOriginal || !normalizado) return '';

  if (normalizado.indexOf(normalizeCourseName_(CURSO_ESPECIAL_CAPSTONE_)) !== -1) return '';

  const prefijo = extraerPrefijoCurso_(textoOriginal);
  if (prefijo === 'BBA') return 'BBA';
  if (prefijo === 'MBA') return 'MBA';

  const textoMayus = removeAccents_(textoOriginal).toUpperCase();
  if (textoMayus.indexOf('MAESTRIA') !== -1) return 'MBA';

  return '';
}

function esCursoCapstoneRequeridoParaFamilia_(cursoNombre, familiaObjetivo) {
  const normalizado = normalizeCourseName_(cursoNombre);
  if (!normalizado) return false;

  const familiaCurso = detectarFamiliaCapstoneCurso_(cursoNombre);
  const familia = safeValue_(familiaObjetivo).trim().toUpperCase();
  if (!familiaCurso || !familia || familiaCurso !== familia) return false;

  return CAPSTONE_REQUERIDOS_.some(capstone => normalizado.indexOf(normalizeCourseName_(capstone)) !== -1)
    || normalizado.indexOf('capstone') !== -1;
}

function evaluarCierreConCapstonePendiente_(params) {
  const { alertaCierre, resumenHistorial, familiaObjetivo } = params;

  if (safeValue_(alertaCierre).trim().toUpperCase() !== 'PRÓXIMO A CIERRE') {
    return {
      aplica: false,
      capstonesFaltantes: []
    };
  }

  const cursosConsolidados = Object.keys(resumenHistorial || {});
  const capstonesFaltantes = CAPSTONE_REQUERIDOS_.filter(capstone => {
    return !cursosConsolidados.some(curso => esCursoCapstoneRequeridoParaFamilia_(curso, familiaObjetivo));
  });

  return {
    aplica: capstonesFaltantes.length > 0,
    capstonesFaltantes: capstonesFaltantes
  };
}

function resolverDerivacionCapstonePendiente_(params) {
  const { cursosDestino, cuposAsignados, cursosAsignadosAlUsuario, maxCupo, capstonesFaltantes } = params;
  const cursoEspecial = (cursosDestino || []).find(curso =>
    curso.cursoNormalizado === normalizeCourseName_(CURSO_ESPECIAL_CAPSTONE_)
  );
  const faltantesTexto = (capstonesFaltantes || []).join(', ');
  const notificacionBase = 'DERIVADO A ' + CURSO_ESPECIAL_CAPSTONE_.toUpperCase() + (faltantesTexto ? ' POR FALTA DE: ' + faltantesTexto : '');

  if (!cursoEspecial) {
    return {
      asignado: false,
      estado: 'Curso especial Alumnos Pendientes de Capstone no disponible en oferta destino',
      cursoOriginal: '',
      diaAsignado: '',
      prioridadAplicada: 'CIERRE CAPSTONE',
      notificacion: notificacionBase
    };
  }

  const cupoActual = cuposAsignados[cursoEspecial.cursoOriginal] || 0;
  if (cursosAsignadosAlUsuario.has(cursoEspecial.cursoOriginal)) {
    return {
      asignado: false,
      estado: 'Curso ya asignado al usuario en esta corrida',
      cursoOriginal: cursoEspecial.cursoOriginal,
      diaAsignado: cursoEspecial.dia || '',
      prioridadAplicada: 'CIERRE CAPSTONE',
      notificacion: notificacionBase
    };
  }

  return {
    asignado: true,
    estado: 'Derivado a Alumnos Pendientes de Capstone',
    cursoOriginal: cursoEspecial.cursoOriginal,
    diaAsignado: cursoEspecial.dia || '',
    prioridadAplicada: 'CIERRE CAPSTONE',
    notificacion: notificacionBase
  };
}

function esDiaSemana_(dia) {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].indexOf(safeValue_(dia).trim()) !== -1;
}

function esDiaSabado_(dia) {
  return safeValue_(dia).trim() === 'Sábado';
}

function contarCursosSubfamiliaIniciados_(resumenHistorial, reglaPlan) {
  if (!reglaPlan || !reglaPlan.prefijosSubfamilia || !reglaPlan.prefijosSubfamilia.length) return 0;

  return Object.keys(resumenHistorial || {}).filter(k => {
    const item = resumenHistorial[k];
    return reglaPlan.prefijosSubfamilia.indexOf(item.prefijo) !== -1;
  }).length;
}

function crearEstrategiaAsignacion_(base) {
  return {
    diaObjetivo: base.diaObjetivo,
    diasObjetivo: base.diasObjetivo,
    bloquesPermitidos: base.bloquesPermitidos || null,
    esCambioDia: base.esCambioDia || false,
    prioridad: base.prioridad || '',
    tipoResultado: base.tipoResultado || TIPO_RESOLUCION_AUTOMATICA_,
    notificacion: base.notificacion || ''
  };
}

function construirEstrategiasCambioDia_(params) {
  const {
    diaOrigen,
    diasAlternos,
    bloquesPermitidos,
    prioridad,
    permitirPendienteSemanaDesdeSabado,
    notificacionPendienteSemana,
    notificacionPendienteSabado
  } = params;

  const estrategias = [];
  const diasSemana = (diasAlternos || []).filter(esDiaSemana_);
  const diasSabado = (diasAlternos || []).filter(esDiaSabado_);

  estrategias.push(crearEstrategiaAsignacion_({
    diaObjetivo: diaOrigen,
    bloquesPermitidos,
    esCambioDia: false,
    prioridad,
    tipoResultado: TIPO_RESOLUCION_AUTOMATICA_
  }));

  if (!diaOrigen) {
    return estrategias;
  }

  if (esDiaSemana_(diaOrigen) && diasSemana.length) {
    estrategias.push(crearEstrategiaAsignacion_({
      diasObjetivo: diasSemana,
      bloquesPermitidos,
      esCambioDia: true,
      prioridad,
      tipoResultado: TIPO_RESOLUCION_AUTOMATICA_
    }));
  }

  if (esDiaSemana_(diaOrigen) && diasSabado.length) {
    estrategias.push(crearEstrategiaAsignacion_({
      diasObjetivo: diasSabado,
      bloquesPermitidos,
      esCambioDia: true,
      prioridad,
      tipoResultado: TIPO_RESOLUCION_PENDIENTE_,
      notificacion: notificacionPendienteSabado
    }));
  }

  if (esDiaSabado_(diaOrigen) && permitirPendienteSemanaDesdeSabado && diasSemana.length) {
    estrategias.push(crearEstrategiaAsignacion_({
      diasObjetivo: diasSemana,
      bloquesPermitidos,
      esCambioDia: true,
      prioridad,
      tipoResultado: TIPO_RESOLUCION_PENDIENTE_,
      notificacion: notificacionPendienteSemana
    }));
  }

  return estrategias;
}

function resolverAsignacionCurso_(params) {
  const {
    cursosDestino,
    diaOrigen,
    reglaPlan,
    resumenHistorial,
    historialCursos,
    origenCursosVigentes,
    cuposAsignados,
    cursosAsignadosAlUsuario,
    maxCupo,
    umbralHistorial,
    prioridadSubfamiliaActiva,
    contextoMBA21
  } = params;

  const diasAlternos = getDiasAlternosPermitidos_(diaOrigen, reglaPlan);
  const estrategias = [];
  const subfamiliaIniciada = contarCursosSubfamiliaIniciados_(resumenHistorial, reglaPlan) > 0;
  const notificacionPendienteSabado = 'PENDIENTE APROBACION MANUAL: única opción válida en sábado; revisar notificación y aprobar antes de cargar en Moodle';
  const notificacionPendienteSemana = 'PENDIENTE APROBACION MANUAL: alumno de sábado con subfamilia iniciada; sugerir cambio a entre semana solo con validación manual';

  if (contextoMBA21 && contextoMBA21.aplica && !contextoMBA21.baseBBACompleto) {
    construirEstrategiasCambioDia_({
      diaOrigen,
      diasAlternos,
      bloquesPermitidos: ['BASE_BBA'],
      prioridad: '',
      permitirPendienteSemanaDesdeSabado: subfamiliaIniciada,
      notificacionPendienteSemana,
      notificacionPendienteSabado
    }).forEach(item => estrategias.push(item));
  } else if (contextoMBA21 && contextoMBA21.aplica) {
    construirEstrategiasCambioDia_({
      diaOrigen,
      diasAlternos,
      bloquesPermitidos: ['SUBFAMILIA'],
      prioridad: 'SUBFAMILIA PRIORITARIA',
      permitirPendienteSemanaDesdeSabado: subfamiliaIniciada,
      notificacionPendienteSemana,
      notificacionPendienteSabado
    }).forEach(item => estrategias.push(item));
    construirEstrategiasCambioDia_({
      diaOrigen,
      diasAlternos,
      bloquesPermitidos: ['COMUN_MBA'],
      prioridad: 'MBA BASE PRIORITARIA',
      permitirPendienteSemanaDesdeSabado: subfamiliaIniciada,
      notificacionPendienteSemana,
      notificacionPendienteSabado
    }).forEach(item => estrategias.push(item));
  } else {
    construirEstrategiasCambioDia_({
      diaOrigen,
      diasAlternos,
      bloquesPermitidos: null,
      prioridad: '',
      permitirPendienteSemanaDesdeSabado: subfamiliaIniciada,
      notificacionPendienteSemana,
      notificacionPendienteSabado
    }).forEach(item => estrategias.push(item));
  }

  let mejorFallo = null;
  let sugerenciaPendiente = null;

  for (let i = 0; i < estrategias.length; i++) {
    const estrategia = estrategias[i];
    const candidatos = filtrarCandidatos_({
      cursosDestino,
      diaObjetivo: estrategia.diaObjetivo,
      diasObjetivo: estrategia.diasObjetivo,
      reglaPlan,
      contextoMBA21,
      bloquesPermitidos: estrategia.bloquesPermitidos
    });

    const evaluacion = elegirCursoDestinoParaAlumno_({
      candidatosDestino: candidatos,
      historialCursos,
      origenCursosVigentes,
      cuposAsignados,
      cursosAsignadosAlUsuario,
      maxCupo,
      umbralHistorial,
      reglaPlan,
      prioridadSubfamiliaActiva: estrategia.prioridad || prioridadSubfamiliaActiva
    });

    if (evaluacion.asignado) {
      if (estrategia.tipoResultado === TIPO_RESOLUCION_AUTOMATICA_) {
        return {
          tipoResolucion: TIPO_RESOLUCION_AUTOMATICA_,
          evaluacion: evaluacion,
          diaAsignado: detectDay_(evaluacion.cursoOriginal),
          cambioDeDia: estrategia.esCambioDia ? 'Sí' : 'No',
          notificacion: estrategia.esCambioDia ? 'REQUIERE NOTIFICAR CAMBIO DE DÍA' : ''
        };
      }

      if (!sugerenciaPendiente) {
        const diaSugerido = detectDay_(evaluacion.cursoOriginal);
        sugerenciaPendiente = {
          tipoResolucion: TIPO_RESOLUCION_PENDIENTE_,
          evaluacion: evaluacion,
          diaAsignado: diaSugerido,
          cambioDeDia: 'Pendiente aprobación',
          notificacion: [
            estrategia.notificacion || ESTADO_PENDIENTE_APROBACION_,
            'Curso sugerido: ' + evaluacion.cursoOriginal,
            diaSugerido ? 'Día sugerido: ' + diaSugerido : ''
          ].filter(Boolean).join(' | ')
        };
      }
    }

    if (!mejorFallo || esEvaluacionFallidaMasInformativa_(evaluacion, mejorFallo)) {
      mejorFallo = evaluacion;
    }
  }

  if (sugerenciaPendiente) {
    return sugerenciaPendiente;
  }

  return {
    tipoResolucion: TIPO_RESOLUCION_SIN_ASIGNACION_,
    evaluacion: mejorFallo || {
      asignado: false,
      estado: 'Sin oferta compatible para ese día',
      maxSimilarityGeneral: null,
      cursoHistorialMasParecidoGeneral: '',
      notaHistorialGeneral: '',
      estadoAcademicoCursoSimilarGeneral: '',
      prioridadAplicada: prioridadSubfamiliaActiva ? 'SUBFAMILIA PRIORITARIA' : 'COMPATIBILIDAD GENERAL'
    },
    diaAsignado: '',
    cambioDeDia: 'No',
    notificacion: ''
  };
}

function esEvaluacionFallidaMasInformativa_(actual, previa) {
  const getRank = evaluacion => {
    const estado = safeValue_(evaluacion && evaluacion.estado).trim().toUpperCase();
    if (!estado) return 0;
    if (estado.indexOf('CURSO ORIGEN VIGENTE') !== -1) return 5;
    if (estado.indexOf('RECURSADO VIGENTE') !== -1) return 4;
    if (estado.indexOf('RECUPERACION VIGENTE') !== -1) return 4;
    if (estado.indexOf('APROBADO') !== -1) return 3;
    if (estado.indexOf('SIN CUPO') !== -1) return 2;
    if (estado.indexOf('ASIGNADO AL USUARIO') !== -1) return 2;
    if (estado.indexOf('SIN OFERTA') !== -1) return 1;
    return 2;
  };

  return getRank(actual) > getRank(previa);
}

function getDiasAlternosPermitidos_(diaOriginal, reglaPlan) {
  const familia = reglaPlan ? reglaPlan.familia : '';

  if (!diaOriginal || !familia) return [];

  if (familia === 'MASTER') {
    const permitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves'];
    return permitidos.filter(d => d !== diaOriginal);
  }

  if (familia === 'BACHELOR') {
    const permitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Sábado'];
    return permitidos.filter(d => d !== diaOriginal);
  }

  return [];
}

function crearHojaConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Config');

  if (!sh) {
    sh = ss.insertSheet('Config');
  } else {
    sh.clearContents();
  }

  const rows = [
    ['Parámetro', 'Valor'],
    ['SHEET_HISTORIAL', 'Matriculados'],
    ['SHEET_ORIGEN', 'Matriculados Marzo'],
    ['SHEET_USUARIOS', 'UsuariosPasan a Abril'],
    ['SHEET_DESTINO', 'CursosAbril'],
    ['SHEET_RESUMEN', 'ResumenAbril'],
      ['SHEET_AUDITORIA', 'ResumenProceso'],
      ['SHEET_REVISION', 'CasosRevision'],
      ['SHEET_PENDIENTES_APROBACION', 'Moodle_PendientesAprobacion'],
      ['MOODLE_SHEET_PREFIX', 'Moodle_'],
      ['MOODLE_ROLE_DEFAULT', 'student'],
    ['SHEET_REGLAS', 'ReglasPlanes'],
    ['MAX_CUPO_POR_CURSO', '35'],
    ['UMBRAL_HISTORIAL', '65'],
    ['ALERTA_PENDIENTES', '4'],
    ['TITULO_MENU', 'Cursos AI'],
    ['TITULO_ACCION', 'Analizar asignación mensual']
  ];

  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange(1, 1, 1, 2).setFontWeight('bold');
  sh.autoResizeColumns(1, 2);
  sh.setFrozenRows(1);
}

function crearHojaReglasPlanes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('ReglasPlanes');

  if (!sh) {
    sh = ss.insertSheet('ReglasPlanes');
  } else {
    sh.clearContents();
  }

  const rows = [
    ['PLAN_BASE', 'FAMILIA', 'SUBFAMILIA', 'CUOTA_SUBFAMILIA', 'PREFIJOS_PERMITIDOS', 'PREFIJOS_SUBFAMILIA'],
    ['BBA', 'BACHELOR', 'BBA', '0', 'BBA', 'BBA'],
    ['BBABF', 'BACHELOR', 'BBABF', '7', 'BBA,BBABF', 'BBABF'],
    ['BBACM', 'BACHELOR', 'BBACM', '6', 'BBA,BBACM', 'BBACM'],
    ['MBA', 'MASTER', 'MBA', '0', 'MBA', 'MBA'],
    ['MMK', 'MASTER', 'MMK', '6', 'MBA,MMK', 'MMK'],
    ['MMKD', 'MASTER', 'MMKD', '6', 'MBA,MMKD', 'MMKD'],
    ['MFIN', 'MASTER', 'MFIN', '6', 'MBA,MFIN', 'MFIN'],
    ['MDGP', 'MASTER', 'MDGP', '6', 'MBA,MDGP', 'MDGP'],
    ['MHHRR', 'MASTER', 'MHHRR', '6', 'MBA,MHHRR', 'MHHRR'],
    ['MLDO', 'MASTER', 'MLDO', '6', 'MBA,MLDO', 'MLDO']
  ];

  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sh.autoResizeColumns(1, rows[0].length);
  sh.setFrozenRows(1);
}

function getConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Config');

  if (!sh) {
    throw new Error('No existe la hoja "Config". Ejecuta primero crearHojaConfig().');
  }

  const values = sh.getDataRange().getValues();
  const map = {};

  for (let i = 1; i < values.length; i++) {
    const key = safeValue_(values[i][0]).trim();
    const value = safeValue_(values[i][1]).trim();
    if (key) map[key] = value;
  }

  return {
    SHEET_HISTORIAL: map.SHEET_HISTORIAL || 'Matriculados',
    SHEET_ORIGEN: map.SHEET_ORIGEN || 'Matriculados Marzo',
    SHEET_USUARIOS: map.SHEET_USUARIOS || 'UsuariosPasan a Abril',
    SHEET_DESTINO: map.SHEET_DESTINO || 'CursosAbril',
    SHEET_RESUMEN: map.SHEET_RESUMEN || 'ResumenAbril',
    SHEET_AUDITORIA: map.SHEET_AUDITORIA || 'ResumenProceso',
    SHEET_REVISION: map.SHEET_REVISION || 'CasosRevision',
    SHEET_PENDIENTES_APROBACION: map.SHEET_PENDIENTES_APROBACION || 'Moodle_PendientesAprobacion',
    SHEET_REGLAS: map.SHEET_REGLAS || 'ReglasPlanes',
    MOODLE_SHEET_PREFIX: map.MOODLE_SHEET_PREFIX || 'Moodle_',
    MOODLE_ROLE_DEFAULT: map.MOODLE_ROLE_DEFAULT || 'student',

    COL_USER: 1,
    COL_FULLNAME: 2,
    COL_EMAIL: 3,
    COL_PLAN: 5,
    COL_GRADE: 6,
    COL_COURSE: 7,
    COL_NAME1: 8,
    COL_LASTNAME: 9,

    MAX_CUPO_POR_CURSO: parseInt(map.MAX_CUPO_POR_CURSO || '35', 10),
    UMBRAL_HISTORIAL: parseInt(map.UMBRAL_HISTORIAL || '65', 10),
    ALERTA_PENDIENTES: parseInt(map.ALERTA_PENDIENTES || '4', 10),

    TITULO_MENU: map.TITULO_MENU || 'Cursos AI',
    TITULO_ACCION: map.TITULO_ACCION || 'Analizar asignación mensual'
  };
}

function getReglasPlanes_(sheet) {
  const values = sheet.getDataRange().getValues();
  const reglas = [];

  for (let i = 1; i < values.length; i++) {
    const planBase = safeValue_(values[i][0]).trim().toUpperCase();
    if (!planBase) continue;

    reglas.push({
      planBase: planBase,
      familia: safeValue_(values[i][1]).trim().toUpperCase(),
      subfamilia: safeValue_(values[i][2]).trim().toUpperCase(),
      cuotaSubfamilia: parseInt(safeValue_(values[i][3]).trim() || '0', 10) || 0,
      prefijosPermitidos: splitCsvUpper_(values[i][4]),
      prefijosSubfamilia: splitCsvUpper_(values[i][5])
    });
  }

  return reglas;
}

function getReglaPlanForSigla_(sigla, reglasPlanes) {
  const prefijo = safeValue_(sigla).trim().toUpperCase();
  if (!prefijo) return null;

  const exacta = reglasPlanes.find(r => r.planBase === prefijo);
  return exacta || null;
}

function getReglaPlanContextual_(siglaOrigen, perfilPrograma, reglasPlanes) {
  const sigla = safeValue_(siglaOrigen).trim().toUpperCase();
  if (!sigla) return null;

  const reglaDirecta = getReglaPlanForSigla_(sigla, reglasPlanes);
  if (sigla !== 'MBA') return reglaDirecta;

  const subfamilia = perfilPrograma && perfilPrograma.subfamiliaProbable
    ? safeValue_(perfilPrograma.subfamiliaProbable).trim().toUpperCase()
    : '';

  if (subfamilia && subfamilia !== 'MBA' && subfamilia !== 'BBA') {
    const reglaSubfamilia = getReglaPlanForSigla_(subfamilia, reglasPlanes);
    if (reglaSubfamilia) return reglaSubfamilia;
  }

  return reglaDirecta;
}

function resolverEvidenciaMasterDesdeHistorial_(resumenHistorial) {
  const evidencia = {
    totalMaster: 0,
    totalSubfamiliaMaster: 0,
    aprobadosMaster: 0,
    prefijos: {}
  };

  Object.keys(resumenHistorial || {}).forEach(key => {
    const item = resumenHistorial[key];
    const prefijo = safeValue_(item.prefijo).trim().toUpperCase();
    const familia = inferirFamiliaDesdePrefijo_(prefijo);
    if (familia !== 'MBA') return;

    evidencia.totalMaster++;
    evidencia.prefijos[prefijo] = (evidencia.prefijos[prefijo] || 0) + 1;

    if (prefijo && prefijo !== 'MBA') evidencia.totalSubfamiliaMaster++;
    if (safeValue_(item.estadoAcademico).trim().toUpperCase() === 'APROBADO') evidencia.aprobadosMaster++;
  });

  evidencia.esClara = evidencia.totalSubfamiliaMaster >= 1 || evidencia.totalMaster >= 2 || evidencia.aprobadosMaster >= 1;
  evidencia.etiqueta = evidencia.esClara
    ? 'MASTER_CLARO'
    : (evidencia.totalMaster > 0 ? 'MASTER_INCIPIENTE' : 'SIN_EVIDENCIA_MASTER');

  return evidencia;
}

function resolverPlanCompuestoDesdeHistorial_(planUsuario, resumenHistorial) {
  const componentes = typeof extraerComponentesPlanDeclarado_ === 'function'
    ? extraerComponentesPlanDeclarado_(planUsuario)
    : [];

  if (!componentes.length) {
    return {
      esCompuesto: false,
      componentePrincipal: null,
      componentes: [],
      fuenteResolucion: 'PLAN',
      conflicto: false,
      motivoConflicto: '',
      evidenciaMaster: resolverEvidenciaMasterDesdeHistorial_(resumenHistorial)
    };
  }

  const evidenciaMaster = resolverEvidenciaMasterDesdeHistorial_(resumenHistorial);
  const componentesReconocidos = componentes.filter(item => item.reconocido);
  const esCompuesto = componentes.length > 1;
  const componentesMaster = componentesReconocidos.filter(item => item.familia === 'MBA');
  const componentePrincipal = evidenciaMaster.esClara && componentesMaster.length
    ? componentesMaster[componentesMaster.length - 1]
    : componentes[0];
  const conflicto = esCompuesto && (componentesReconocidos.length !== componentes.length || !componentePrincipal || !componentePrincipal.reconocido);
  const motivoConflicto = conflicto
    ? 'Plan compuesto con componentes no reconocidos o sin resolución confiable'
    : '';

  return {
    esCompuesto: esCompuesto,
    componentePrincipal: componentePrincipal,
    componentes: componentes,
    fuenteResolucion: !esCompuesto
      ? 'PLAN'
      : (evidenciaMaster.esClara && componentesMaster.length ? 'PLAN_COMPUESTO_HISTORIAL' : 'PLAN_COMPUESTO_PLAN'),
    conflicto: conflicto,
    motivoConflicto: motivoConflicto,
    evidenciaMaster: evidenciaMaster
  };
}

function agregarColumnasPerfilPrograma_(filaBase, perfilPrograma, contextoCierre) {
  const componentesTexto = perfilPrograma && perfilPrograma.planComponentes
    ? perfilPrograma.planComponentes
        .map(item => item.planNormalizado || item.prefijo || item.raw)
        .filter(Boolean)
        .join(' | ')
    : '';

  return filaBase.concat([
    perfilPrograma && perfilPrograma.fuenteResolucion ? perfilPrograma.fuenteResolucion : '',
    perfilPrograma && perfilPrograma.planCompuesto ? 'SI' : 'NO',
    componentesTexto,
    perfilPrograma && perfilPrograma.evidenciaMasterEtiqueta ? perfilPrograma.evidenciaMasterEtiqueta : '',
    contextoCierre && contextoCierre.modoCalculo ? contextoCierre.modoCalculo : '',
    contextoCierre ? (contextoCierre.usaHistorialFiltrado ? 'SI' : 'NO') : '',
    contextoCierre && contextoCierre.detalleAuditoria ? contextoCierre.detalleAuditoria : ''
  ]);
}

function inferirPerfilProgramaAlumno_(params) {
  const { planUsuario, historialUsuario, origenUsuario, resumenHistorial } = params;

  const planResuelto = resolverPlanCompuestoDesdeHistorial_(planUsuario, resumenHistorial);
  const planNormalizado = planResuelto.componentePrincipal && planResuelto.componentePrincipal.planNormalizado
    ? planResuelto.componentePrincipal.planNormalizado
    : (typeof normalizarPlanDeclarado_ === 'function'
      ? normalizarPlanDeclarado_(planUsuario)
      : safeValue_(planUsuario).trim().toUpperCase());

  const candidatosPrograma = typeof getProgramasCatalogo_ === 'function'
    ? getProgramasCatalogo_()
    : [];

   const planInfo = extraerInfoPlanDeclarado_(planUsuario, planNormalizado, planResuelto.componentePrincipal);
   const prefijosHistorial = contarPrefijosConsolidadosHistorial_(resumenHistorial);
   const prefijosOrigen = contarPrefijosOrigenPrograma_(origenUsuario);
   const subfamiliaProbable = inferirSubfamiliaProbable_({
     planInfo,
     conteoHistorial: prefijosHistorial,
     conteoOrigen: prefijosOrigen
   });
   const familiaProbable = inferirFamiliaProbable_({
     planInfo,
     conteoHistorial: prefijosHistorial,
     conteoOrigen: prefijosOrigen,
     subfamiliaProbable: subfamiliaProbable
   });
   const duracionProbable = planInfo.duracionProbable || inferirDuracionProbable_(planNormalizado);

  const programa = elegirProgramaProbable_(candidatosPrograma, {
    familiaProbable,
    subfamiliaProbable,
    duracionProbable,
    planNormalizado
  });

  const coincidenciaPlanHistorico = calcularCoincidenciaPlanHistorico_(planNormalizado, {
    familiaProbable,
    subfamiliaProbable,
    duracionProbable,
    programaCodigo: programa ? programa.programaCodigo : ''
  });

  let confianzaProgramaScore = coincidenciaPlanHistorico.score;
  if (planResuelto.esCompuesto && planResuelto.componentePrincipal && planResuelto.componentePrincipal.reconocido) {
    confianzaProgramaScore += planResuelto.fuenteResolucion === 'PLAN_COMPUESTO_HISTORIAL' ? 10 : 5;
  }
  if (planResuelto.conflicto) confianzaProgramaScore -= 25;
  confianzaProgramaScore = Math.max(0, Math.min(100, confianzaProgramaScore));

  return {
     planNormalizado: planNormalizado,
     familiaProbable: familiaProbable,
     subfamiliaProbable: subfamiliaProbable,
     duracionProbable: duracionProbable,
     programaCodigo: programa ? programa.programaCodigo : '',
     coincidenciaPlanHistorico: coincidenciaPlanHistorico.etiqueta,
     confianzaProgramaScore: confianzaProgramaScore,
     confianzaEtiqueta: getEtiquetaConfianzaPrograma_(confianzaProgramaScore),
     fuenteResolucion: planResuelto.fuenteResolucion,
     planCompuesto: planResuelto.esCompuesto,
     planComponentes: planResuelto.componentes,
     conflictoPrograma: planResuelto.conflicto,
     motivoConflictoPrograma: planResuelto.motivoConflicto,
     evidenciaMasterEtiqueta: planResuelto.evidenciaMaster.etiqueta,
     evidenciaMaster: planResuelto.evidenciaMaster
   };
}

function contarPrefijosConsolidadosHistorial_(resumenHistorial) {
  const conteo = {};
  const sumar = prefijo => {
    const key = safeValue_(prefijo).trim().toUpperCase();
    if (!key) return;
    conteo[key] = (conteo[key] || 0) + 1;
  };

  Object.keys(resumenHistorial || {}).forEach(k => sumar(resumenHistorial[k].prefijo));

  return conteo;
}

function contarPrefijosOrigenPrograma_(origenUsuario) {
  const conteo = {};

  (origenUsuario || []).forEach(row => {
    const prefijo = extraerPrefijoCurso_(row[5]);
    const key = safeValue_(prefijo).trim().toUpperCase();
    if (!key) return;
    conteo[key] = (conteo[key] || 0) + 1;
  });

  return conteo;
}

function extraerInfoPlanDeclarado_(planUsuario, planNormalizado, componentePrincipal) {
  const planTexto = safeValue_(planUsuario).trim().toUpperCase();
  const normalizado = safeValue_(planNormalizado).trim().toUpperCase() || planTexto;
  const prefijoPlan = componentePrincipal && componentePrincipal.prefijo
    ? componentePrincipal.prefijo
    : extraerPrefijoCurso_(normalizado || planTexto);
  const infoPrefijo = resolverInfoPrefijoPrograma_(prefijoPlan);
  const familia = componentePrincipal && componentePrincipal.familia
    ? componentePrincipal.familia
    : (infoPrefijo.familia || (normalizado.indexOf('BBA') !== -1 ? 'BBA' : (normalizado.indexOf('MBA') !== -1 ? 'MBA' : '')));
  const subfamilia = componentePrincipal && componentePrincipal.subfamilia
    ? componentePrincipal.subfamilia
    : (infoPrefijo.subfamilia || (familia ? familia : ''));
  const duracion = componentePrincipal && componentePrincipal.duracion
    ? componentePrincipal.duracion
    : inferirDuracionProbable_(normalizado);

  return {
    planNormalizado: normalizado,
    prefijoPlan: prefijoPlan,
    familiaProbable: familia,
    subfamiliaProbable: subfamilia,
    duracionProbable: duracion
  };
}

function inferirSubfamiliaProbable_(contexto) {
  const planInfo = contexto ? contexto.planInfo : null;
  const conteoHistorial = contexto ? contexto.conteoHistorial : null;
  const conteoOrigen = contexto ? contexto.conteoOrigen : null;

  if (planInfo && planInfo.subfamiliaProbable && planInfo.subfamiliaProbable !== 'BBA' && planInfo.subfamiliaProbable !== 'MBA') {
    return planInfo.subfamiliaProbable;
  }

  const dominanteHistorial = obtenerPrefijoEspecialDominante_(conteoHistorial);
  if (dominanteHistorial) return dominanteHistorial;

  const dominanteOrigen = obtenerPrefijoEspecialDominante_(conteoOrigen);
  if (dominanteOrigen) return dominanteOrigen;

  if (planInfo && planInfo.familiaProbable) return planInfo.familiaProbable;

  return inferirFamiliaDominanteDesdeConteo_(conteoHistorial) || inferirFamiliaDominanteDesdeConteo_(conteoOrigen) || '';
}

function inferirFamiliaProbable_(contexto) {
  const planInfo = contexto ? contexto.planInfo : null;
  const conteoHistorial = contexto ? contexto.conteoHistorial : null;
  const conteoOrigen = contexto ? contexto.conteoOrigen : null;
  const subfamiliaProbable = contexto ? contexto.subfamiliaProbable : '';

  if (planInfo && planInfo.familiaProbable) return planInfo.familiaProbable;

  const familiaSubfamilia = inferirFamiliaDesdePrefijo_(subfamiliaProbable);
  if (familiaSubfamilia) return familiaSubfamilia;

  const familiaHistorial = inferirFamiliaDominanteDesdeConteo_(conteoHistorial);
  if (familiaHistorial) return familiaHistorial;

  const familiaOrigen = inferirFamiliaDominanteDesdeConteo_(conteoOrigen);
  if (familiaOrigen) return familiaOrigen;

  return '';
}

function inferirDuracionProbable_(planNormalizado) {
  const match = safeValue_(planNormalizado).match(/(\d{1,2})/);
  return match ? parseInt(match[1], 10) : null;
}

function elegirProgramaProbable_(programas, contexto) {
  if (!programas || !programas.length) return null;

  let mejor = null;
  let mejorScore = -1;

  programas.forEach(programa => {
    let score = 0;

    if (contexto.familiaProbable && programa.familia === contexto.familiaProbable) score += 40;
    if (contexto.subfamiliaProbable) {
      if (programa.subfamilia === contexto.subfamiliaProbable) score += 35;
      else if (programa.subfamilia === 'GENERICA') score += 10;
    }
    if (contexto.duracionProbable && programa.duracionMeses === contexto.duracionProbable) score += 20;
    if (contexto.planNormalizado && programa.planNormalizado === contexto.planNormalizado) score += 25;

    if (score > mejorScore) {
      mejorScore = score;
      mejor = programa;
    }
  });

  if (
    contexto.familiaProbable === 'MBA' &&
    contexto.duracionProbable &&
    contexto.duracionProbable >= 9 &&
    contexto.duracionProbable <= 21 &&
    typeof getProgramaPorCodigo_ === 'function'
  ) {
    const derivado = getProgramaPorCodigo_(
      ['MBA', contexto.subfamiliaProbable && contexto.subfamiliaProbable !== 'MBA' ? contexto.subfamiliaProbable : 'GENERICA', contexto.duracionProbable].join('_')
    );
    if (derivado) return derivado;
  }

  if (
    contexto.familiaProbable === 'BBA' &&
    contexto.duracionProbable &&
    typeof getProgramaPorCodigo_ === 'function'
  ) {
    const derivadoBBA = getProgramaPorCodigo_(
      ['BBA', contexto.subfamiliaProbable || 'BBA', contexto.duracionProbable].join('_')
    );
    if (derivadoBBA) return derivadoBBA;
  }

  return mejorScore > 0 ? mejor : null;
}

function calcularCoincidenciaPlanHistorico_(planNormalizado, inferencia) {
  let score = 0;
  const plan = safeValue_(planNormalizado).trim().toUpperCase();

  if (plan && inferencia.familiaProbable && plan.indexOf(inferencia.familiaProbable) !== -1) score += 35;
  if (plan && inferencia.subfamiliaProbable && plan.indexOf(inferencia.subfamiliaProbable) !== -1) score += 35;
  if (plan && inferencia.duracionProbable && plan.indexOf(String(inferencia.duracionProbable)) !== -1) score += 20;
  if (inferencia.programaCodigo) score += 10;

  score = Math.max(0, Math.min(100, score));

  let etiqueta = 'BAJA';
  if (score >= 80) etiqueta = 'ALTA';
  else if (score >= 45) etiqueta = 'MEDIA';

  return {
    score: score,
    etiqueta: etiqueta
  };
}

function getEtiquetaConfianzaPrograma_(score) {
  if (score >= 80) return 'ALTA';
  if (score >= 45) return 'MEDIA';
  return 'BAJA';
}

function inferirBloqueCursoDesdeNombre_(cursoNombre) {
  if (typeof inferirCatalogoCurso_ === 'function') {
    const info = inferirCatalogoCurso_(cursoNombre);
    return info ? info.bloque : '';
  }

  const prefijo = extraerPrefijoCurso_(cursoNombre);
  if (prefijo === 'BBA') return 'COMUN_BBA';
  if (prefijo === 'MBA') return 'COMUN_MBA';
  if (prefijo) return 'SUBFAMILIA';
  return '';
}

function inferirBloqueCursoParaPrograma_(cursoNombre, contextoMBA21) {
  const prefijo = extraerPrefijoCurso_(cursoNombre);

  if (contextoMBA21 && contextoMBA21.aplica) {
    if (prefijo === 'BBA') return 'BASE_BBA';
    if (prefijo === 'MBA') return 'COMUN_MBA';
    if (prefijo) return 'SUBFAMILIA';
  }

  return inferirBloqueCursoDesdeNombre_(cursoNombre);
}

function getEstructuraProgramaInferida_(programaCodigo) {
  if (!programaCodigo || typeof getBloquesPorPrograma_ !== 'function') {
    return {
      totalObjetivo: null,
      cierreObjetivo: null
    };
  }

  const bloques = getBloquesPorPrograma_(programaCodigo);
  if (!bloques.length) {
    return {
      totalObjetivo: null,
      cierreObjetivo: null
    };
  }

  const totalObjetivo = bloques.reduce((acc, item) => acc + (Number(item.cantidadObjetivo) || 0), 0);
  const cierre = bloques.find(x => x.bloque === 'CIERRE');

  return {
    totalObjetivo: totalObjetivo || null,
    cierreObjetivo: cierre ? Number(cierre.cantidadObjetivo) || null : null
  };
}

function getObjetivosProgramaPorBloque_(programaCodigo) {
  const objetivos = {};
  if (!programaCodigo || typeof getBloquesPorPrograma_ !== 'function') return objetivos;

  getBloquesPorPrograma_(programaCodigo).forEach(item => {
    const bloque = safeValue_(item.bloque).trim().toUpperCase();
    if (!bloque) return;
    objetivos[bloque] = Number(item.cantidadObjetivo) || 0;
  });

  return objetivos;
}

function debeUsarAvanceFiltradoPorPrograma_(perfilPrograma, estructuraPrograma) {
  const programaCodigo = perfilPrograma ? safeValue_(perfilPrograma.programaCodigo).trim().toUpperCase() : '';
  if (!programaCodigo) return false;

  const totalObjetivo = estructuraPrograma ? Number(estructuraPrograma.totalObjetivo || 0) : 0;
  return totalObjetivo > 0;
}

function esCursoCapstoneRequerido_(cursoNombre, familiaObjetivo) {
  return esCursoCapstoneRequeridoParaFamilia_(cursoNombre, familiaObjetivo);
}

function resolverBloqueRelevanteCursoParaProgramaObjetivo_(item, programaObjetivo, objetivosPorBloque) {
  if (!item || !programaObjetivo) return '';

  if ((objetivosPorBloque.CIERRE || 0) > 0 && esCursoCapstoneRequerido_(item.cursoOriginal, programaObjetivo.familia)) {
    return 'CIERRE';
  }

  const prefijo = safeValue_(item.prefijo).trim().toUpperCase();
  const infoCurso = resolverInfoPrefijoPrograma_(prefijo);
  const familiaObjetivo = safeValue_(programaObjetivo.familia).trim().toUpperCase();
  const subfamiliaObjetivo = safeValue_(programaObjetivo.subfamilia).trim().toUpperCase();

  if (familiaObjetivo === 'MBA') {
    if ((objetivosPorBloque.BASE_BBA || 0) > 0 && infoCurso.familia === 'BBA') return 'BASE_BBA';
    if ((objetivosPorBloque.COMUN_MBA || 0) > 0 && prefijo === 'MBA') return 'COMUN_MBA';

    if ((objetivosPorBloque.SUBFAMILIA || 0) > 0 && infoCurso.familia === 'MBA' && prefijo && prefijo !== 'MBA') {
      if (subfamiliaObjetivo === 'GENERICA') return 'SUBFAMILIA';
      if (infoCurso.subfamilia === subfamiliaObjetivo) return 'SUBFAMILIA';
    }

    return '';
  }

  if (familiaObjetivo === 'BBA') {
    if ((objetivosPorBloque.COMUN_BBA || 0) > 0 && prefijo === 'BBA') return 'COMUN_BBA';

    if ((objetivosPorBloque.SUBFAMILIA || 0) > 0 && infoCurso.familia === 'BBA' && prefijo && prefijo !== 'BBA') {
      if (subfamiliaObjetivo === 'BBA') return 'SUBFAMILIA';
      if (infoCurso.subfamilia === subfamiliaObjetivo) return 'SUBFAMILIA';
    }

    return '';
  }

  return '';
}

function contarAvanceRelevantePorProgramaObjetivo_(params) {
  const { perfilPrograma, resumenHistorial } = params;
  const programaCodigo = perfilPrograma ? safeValue_(perfilPrograma.programaCodigo).trim().toUpperCase() : '';
  const programaObjetivo = programaCodigo && typeof getProgramaPorCodigo_ === 'function'
    ? getProgramaPorCodigo_(programaCodigo)
    : null;
  const objetivosPorBloque = getObjetivosProgramaPorBloque_(programaCodigo);
  const bloquesObjetivo = Object.keys(objetivosPorBloque).filter(bloque => (objetivosPorBloque[bloque] || 0) > 0);

  if (!programaObjetivo || !bloquesObjetivo.length) {
    return null;
  }

  const conteoBrutoPorBloque = {};
  const conteoUsadoPorBloque = {};
  const resumenHistorialRelevante = {};

  bloquesObjetivo.forEach(bloque => {
    conteoBrutoPorBloque[bloque] = 0;
    conteoUsadoPorBloque[bloque] = 0;
  });

  Object.keys(resumenHistorial || {}).forEach(key => {
    const item = resumenHistorial[key];
    const bloque = resolverBloqueRelevanteCursoParaProgramaObjetivo_(item, programaObjetivo, objetivosPorBloque);
    if (!bloque) return;

    resumenHistorialRelevante[key] = item;

    if (safeValue_(item.estadoAcademico).trim().toUpperCase() !== 'APROBADO') return;
    conteoBrutoPorBloque[bloque] = (conteoBrutoPorBloque[bloque] || 0) + 1;
  });

  let cursosAprobados = 0;
  const detalleBloques = bloquesObjetivo.map(bloque => {
    const objetivo = Number(objetivosPorBloque[bloque] || 0);
    const bruto = Number(conteoBrutoPorBloque[bloque] || 0);
    const usado = Math.min(bruto, objetivo);
    conteoUsadoPorBloque[bloque] = usado;
    cursosAprobados += usado;
    return `${bloque}: ${usado}/${objetivo} (reales ${bruto})`;
  });

  return {
    programaCodigo,
    cursosAprobados,
    bloquesObjetivo,
    objetivosPorBloque,
    conteoBrutoPorBloque,
    conteoUsadoPorBloque,
    resumenHistorialRelevante,
    detalle: detalleBloques.join(' | ')
  };
}

function resolverContextoCalculoCierrePrograma_(params) {
  const {
    perfilPrograma,
    resumenHistorial,
    estructuraPrograma,
    totalPlanDeclarado,
    alertaPendientesDefault
  } = params;

  const totalPlan = estructuraPrograma && estructuraPrograma.totalObjetivo
    ? estructuraPrograma.totalObjetivo
    : totalPlanDeclarado;
  const umbralCierre = estructuraPrograma && estructuraPrograma.cierreObjetivo
    ? estructuraPrograma.cierreObjetivo
    : alertaPendientesDefault;

  let cursosAprobados = contarCursosAprobados_(resumenHistorial);
  let resumenHistorialCierre = resumenHistorial;
  let modoCalculo = 'TOTAL_HISTORIAL';
  let usaHistorialFiltrado = false;
  let detalleAuditoria = `TOTAL: ${cursosAprobados}`;

  if (debeUsarAvanceFiltradoPorPrograma_(perfilPrograma, estructuraPrograma)) {
    const avanceRelevante = contarAvanceRelevantePorProgramaObjetivo_({
      perfilPrograma,
      resumenHistorial
    });

    if (avanceRelevante) {
      cursosAprobados = avanceRelevante.cursosAprobados;
      resumenHistorialCierre = avanceRelevante.resumenHistorialRelevante;
      modoCalculo = 'FILTRADO_PROGRAMA_OBJETIVO';
      usaHistorialFiltrado = true;
      detalleAuditoria = `${avanceRelevante.programaCodigo}: ${avanceRelevante.detalle}`;
    }
  }

  const pendientes = totalPlan !== null && totalPlan !== ''
    ? Math.max(totalPlan - cursosAprobados, 0)
    : '';
  const alertaCierre =
    (typeof pendientes === 'number' && pendientes <= umbralCierre)
      ? 'PRÓXIMO A CIERRE'
      : '';

  return {
    totalPlan,
    umbralCierre,
    cursosAprobados,
    pendientes,
    alertaCierre,
    modoCalculo,
    usaHistorialFiltrado,
    detalleAuditoria,
    resumenHistorialCierre
  };
}

function construirResumenHistorial_(historialUsuario, CONFIG) {
  const mapa = {};

  historialUsuario.forEach(row => {
    const cursoOriginal = safeValue_(row[CONFIG.COL_COURSE - 1]).trim();
    if (!cursoOriginal) return;

    const normalizado = normalizeCourseName_(cursoOriginal);
    if (!normalizado) return;

    const nota = normalizarNota_(row[CONFIG.COL_GRADE - 1]);
    const estadoAcademico = clasificarEstadoAcademico_(nota);
    const prefijo = extraerPrefijoCurso_(cursoOriginal);
    const fechaCurso = extraerFechaCursoDesdeNombre_(cursoOriginal);

    if (!mapa[normalizado]) {
      mapa[normalizado] = {
        cursoOriginal: cursoOriginal,
        cursoNormalizado: normalizado,
        prefijo: prefijo,
        mejorNota: nota,
        estadoAcademico: estadoAcademico,
        dia: detectDay_(cursoOriginal),
        fechaCurso: fechaCurso
      };
    } else {
      if (nota > mapa[normalizado].mejorNota) {
        mapa[normalizado].mejorNota = nota;
        mapa[normalizado].estadoAcademico = estadoAcademico;
        mapa[normalizado].cursoOriginal = cursoOriginal;
        mapa[normalizado].prefijo = prefijo;
        mapa[normalizado].dia = detectDay_(cursoOriginal);
        mapa[normalizado].fechaCurso = fechaCurso;
      } else if (nota === mapa[normalizado].mejorNota) {
        const actualRank = getEstadoRank_(estadoAcademico);
        const previoRank = getEstadoRank_(mapa[normalizado].estadoAcademico);
        if (actualRank > previoRank) {
          mapa[normalizado].estadoAcademico = estadoAcademico;
          mapa[normalizado].cursoOriginal = cursoOriginal;
          mapa[normalizado].prefijo = prefijo;
          mapa[normalizado].dia = detectDay_(cursoOriginal);
          mapa[normalizado].fechaCurso = fechaCurso;
        }
      }
    }
  });

  return mapa;
}

function contarCursosAprobados_(resumenHistorial) {
  return Object.keys(resumenHistorial).filter(k => resumenHistorial[k].estadoAcademico === 'APROBADO').length;
}

function contarCursosSubfamiliaAprobados_(resumenHistorial, reglaPlan) {
  if (!reglaPlan || !reglaPlan.prefijosSubfamilia.length) return 0;

  return Object.keys(resumenHistorial).filter(k => {
    const item = resumenHistorial[k];
    return item.estadoAcademico === 'APROBADO' &&
      reglaPlan.prefijosSubfamilia.indexOf(item.prefijo) !== -1;
  }).length;
}

function resolverContextoMBA21_(params) {
  const { planUsuario, perfilPrograma, resumenHistorial } = params;
  const planTexto = safeValue_(planUsuario).trim().toUpperCase();
  const prefijoPlan = extraerPrefijoCurso_(planTexto);
  const duracionPlan = extraerTotalPlan_(planTexto);
  const familiaPlan = inferirFamiliaDesdePrefijo_(prefijoPlan) || (planTexto.indexOf('MBA') !== -1 ? 'MBA' : '');
  const planDeclaraMBA21 = familiaPlan === 'MBA' && duracionPlan === 21;

  const familiaPerfil = perfilPrograma ? safeValue_(perfilPrograma.familiaProbable).trim().toUpperCase() : '';
  const duracionPerfil = perfilPrograma ? Number(perfilPrograma.duracionProbable || 0) : 0;
  const programaCodigo = perfilPrograma ? safeValue_(perfilPrograma.programaCodigo).trim().toUpperCase() : '';
  const perfilIndicaMBA21 = familiaPerfil === 'MBA' && duracionPerfil === 21;
  const programaIndicaMBA21 = programaCodigo.indexOf('MBA_') === 0 && programaCodigo.slice(-3) === '_21';
  const aplica = planDeclaraMBA21 || perfilIndicaMBA21 || programaIndicaMBA21;
  const baseBBARequeridos = getCantidadObjetivoBloquePrograma_(programaCodigo, 'BASE_BBA') || 3;
  const cursosBaseBBACompletos = contarCursosCompletosBloquePrograma_(resumenHistorial, { aplica: aplica }, 'BASE_BBA');

  return {
    aplica: aplica,
    fuente: planDeclaraMBA21 ? 'PLAN' : 'HISTORIAL',
    baseBBARequeridos: baseBBARequeridos,
    cursosBaseBBACompletos: cursosBaseBBACompletos,
    baseBBACompleto: cursosBaseBBACompletos >= baseBBARequeridos
  };
}

function getCantidadObjetivoBloquePrograma_(programaCodigo, bloqueObjetivo) {
  if (!programaCodigo || typeof getBloquesPorPrograma_ !== 'function') return 0;

  const match = getBloquesPorPrograma_(programaCodigo).find(item => item.bloque === bloqueObjetivo);
  return match ? Number(match.cantidadObjetivo) || 0 : 0;
}

function contarCursosCompletosBloquePrograma_(resumenHistorial, contextoMBA21, bloqueObjetivo) {
  return Object.keys(resumenHistorial || {}).filter(k => {
    const item = resumenHistorial[k];
    const estado = safeValue_(item.estadoAcademico).trim().toUpperCase();
    const bloque = inferirBloqueCursoParaPrograma_(item.cursoOriginal, contextoMBA21);
    return bloque === bloqueObjetivo && (estado === 'APROBADO' || estado === 'RECUPERACION');
  }).length;
}

function obtenerRecuperacionesVigentes_(resumenHistorial, fechaReferencia) {
  return Object.keys(resumenHistorial)
    .map(k => resumenHistorial[k])
    .filter(item => {
      if (item.estadoAcademico !== 'RECUPERACION') return false;
      return estaRecuperacionVigente_(item.fechaCurso, fechaReferencia);
    })
    .sort((a, b) => a.cursoOriginal.localeCompare(b.cursoOriginal))
    .map(item => ({
      curso: item.cursoOriginal,
      nota: item.mejorNota
    }));
}

function obtenerCursosNoAprobadosParaSeguimiento_(resumenHistorial) {
  return Object.keys(resumenHistorial)
    .map(k => resumenHistorial[k])
    .filter(item =>
      item.estadoAcademico === 'RECUPERACION' ||
      item.estadoAcademico === 'RECURSAR'
    )
    .sort((a, b) => a.cursoOriginal.localeCompare(b.cursoOriginal))
    .map(item => ({
      curso: item.cursoOriginal,
      nota: item.mejorNota,
      estado: item.estadoAcademico
    }));
}

function elegirCursoDestinoParaAlumno_(params) {
  const {
    candidatosDestino,
    historialCursos,
    origenCursosVigentes,
    cuposAsignados,
    cursosAsignadosAlUsuario,
    maxCupo,
    umbralHistorial,
    reglaPlan,
    prioridadSubfamiliaActiva
  } = params;

  const prioridadModo = safeValue_(prioridadSubfamiliaActiva).trim().toUpperCase();
  const prioridadSubfamilia = prioridadSubfamiliaActiva === true || prioridadModo === 'SUBFAMILIA PRIORITARIA';
  const prioridadBaseMBA = prioridadModo === 'MBA BASE PRIORITARIA';
  const prioridadDefault = prioridadBaseMBA
    ? 'MBA BASE PRIORITARIA'
    : (prioridadSubfamilia ? 'SUBFAMILIA PRIORITARIA' : 'COMPATIBILIDAD GENERAL');

  if (!candidatosDestino.length) {
    return {
      asignado: false,
      estado: 'Sin oferta compatible para ese día',
      maxSimilarityGeneral: null,
      cursoHistorialMasParecidoGeneral: '',
      notaHistorialGeneral: '',
      estadoAcademicoCursoSimilarGeneral: '',
      prioridadAplicada: prioridadDefault
    };
  }

  const evaluados = candidatosDestino.map(cursoDestino => {
    let maxSimilarity = 0;
    let cursoHistorialMasParecido = '';
    let notaHistorial = '';
    let estadoAcademicoCursoSimilar = '';
    let fechaHistorial = null;
    let bloqueoMotivo = '';
    let cursoOrigenBloqueante = '';

    historialCursos.forEach(hist => {
      const sim = similarityPercent_(cursoDestino.cursoNormalizado, hist.cursoNormalizado);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        cursoHistorialMasParecido = hist.cursoOriginal;
        notaHistorial = hist.mejorNota;
        estadoAcademicoCursoSimilar = hist.estadoAcademico;
        fechaHistorial = hist.fechaCurso || null;
      }
    });

    const matchRelevante = maxSimilarity >= umbralHistorial;
    const fechaDestino = extraerFechaCursoDesdeNombre_(cursoDestino.cursoOriginal);

    let bloqueaPorHistorial = false;

    if (matchRelevante) {
      if (estadoAcademicoCursoSimilar === 'APROBADO') {
        bloqueaPorHistorial = true;
        bloqueoMotivo = 'Curso similar ya aprobado';
      } else if (estadoAcademicoCursoSimilar === 'RECUPERACION') {
        const recuperacionVigente = estaRecuperacionVigente_(fechaHistorial, fechaDestino);
        if (recuperacionVigente) {
          bloqueaPorHistorial = true;
          bloqueoMotivo = 'Bloqueado por recuperación vigente; la recuperación va en paralelo y no sustituye la asignación mensual';
        }
      } else if (estadoAcademicoCursoSimilar === 'RECURSAR') {
        const recursadoVigente = estaRecuperacionVigente_(fechaHistorial, fechaDestino);
        if (recursadoVigente) {
          bloqueaPorHistorial = true;
          bloqueoMotivo = 'Bloqueado por recursado vigente; el curso perdido debe recuperarse o recursarse dentro de la ventana de 2 meses';
        }
      }
    }

    if (!bloqueaPorHistorial) {
      const bloqueoOrigen = buscarCursoOrigenVigenteEquivalente_(cursoDestino.cursoOriginal, origenCursosVigentes, umbralHistorial);
      if (bloqueoOrigen.bloqueado) {
        bloqueaPorHistorial = true;
        bloqueoMotivo = 'Bloqueado por curso origen vigente o equivalente del mes actual';
        cursoOrigenBloqueante = bloqueoOrigen.cursoOrigen;
      }
    }

    const cupoActual = cuposAsignados[cursoDestino.cursoOriginal] || 0;
    const tieneCupo = cupoActual < maxCupo;
    const yaAsignadoEnEstaCorrida = cursosAsignadosAlUsuario.has(cursoDestino.cursoOriginal);

    const esSubfamilia = reglaPlan
      ? reglaPlan.prefijosSubfamilia.indexOf(extraerPrefijoCurso_(cursoDestino.cursoOriginal)) !== -1
      : false;

    return {
      cursoOriginal: cursoDestino.cursoOriginal,
      cursoNormalizado: cursoDestino.cursoNormalizado,
      maxSimilarity: maxSimilarity,
      cursoHistorialMasParecido: cursoHistorialMasParecido,
      notaHistorial: notaHistorial,
      estadoAcademicoCursoSimilar: estadoAcademicoCursoSimilar,
      bloqueaPorHistorial: bloqueaPorHistorial,
      bloqueoMotivo: bloqueoMotivo,
      cupoActual: cupoActual,
      tieneCupo: tieneCupo,
      yaAsignadoEnEstaCorrida: yaAsignadoEnEstaCorrida,
      esSubfamilia: esSubfamilia,
      cursoOrigenBloqueante: cursoOrigenBloqueante
    };
  });

  let candidatosPrioritarios = evaluados;
  let prioridadAplicada = prioridadDefault;

  if (prioridadSubfamilia) {
    const soloSubfamilia = evaluados.filter(x => x.esSubfamilia);

    const validosSubfamilia = soloSubfamilia.filter(x =>
      !x.bloqueaPorHistorial &&
      x.tieneCupo &&
      !x.yaAsignadoEnEstaCorrida
    );

    if (validosSubfamilia.length > 0) {
      candidatosPrioritarios = soloSubfamilia;
      prioridadAplicada = 'SUBFAMILIA PRIORITARIA';
    }
  }

  const validos = candidatosPrioritarios.filter(x =>
    !x.bloqueaPorHistorial &&
    x.tieneCupo &&
    !x.yaAsignadoEnEstaCorrida
  );

  if (validos.length > 0) {
    validos.sort((a, b) => {
      if (a.cupoActual !== b.cupoActual) return a.cupoActual - b.cupoActual;
      if (a.maxSimilarity !== b.maxSimilarity) return a.maxSimilarity - b.maxSimilarity;
      return a.cursoOriginal.localeCompare(b.cursoOriginal);
    });

    const elegido = validos[0];

    return {
      asignado: true,
      estado: 'Asignado',
      cursoOriginal: elegido.cursoOriginal,
      maxSimilarity: elegido.maxSimilarity,
      cursoHistorialMasParecido: elegido.cursoHistorialMasParecido,
      notaHistorial: elegido.notaHistorial,
      estadoAcademicoCursoSimilar: elegido.estadoAcademicoCursoSimilar,
      prioridadAplicada: prioridadAplicada
    };
  }

  let estado = 'Sin opción válida después de filtros';

  const bloqueadosPorAprobado = candidatosPrioritarios.some(x => x.bloqueoMotivo === 'Curso similar ya aprobado');
  const bloqueadosPorRecuperacion = candidatosPrioritarios.some(x =>
    x.bloqueoMotivo === 'Bloqueado por recuperación vigente; la recuperación va en paralelo y no sustituye la asignación mensual'
  );
  const bloqueadosPorRecursado = candidatosPrioritarios.some(x =>
    x.bloqueoMotivo === 'Bloqueado por recursado vigente; el curso perdido debe recuperarse o recursarse dentro de la ventana de 2 meses'
  );
  const bloqueadosPorOrigenVigente = candidatosPrioritarios.some(x =>
    x.bloqueoMotivo === 'Bloqueado por curso origen vigente o equivalente del mes actual'
  );
  const todosSinCupo = candidatosPrioritarios.length > 0 && candidatosPrioritarios.every(x => !x.tieneCupo);
  const todosDuplicados = candidatosPrioritarios.length > 0 && candidatosPrioritarios.every(x => x.yaAsignadoEnEstaCorrida);

  if (bloqueadosPorAprobado) {
    estado = 'Bloqueado por curso similar ya aprobado';
  } else if (bloqueadosPorRecuperacion) {
    estado = 'Bloqueado por recuperación vigente; la recuperación va en paralelo y no sustituye la asignación mensual';
  } else if (bloqueadosPorRecursado) {
    estado = 'Bloqueado por recursado vigente; el curso perdido debe recuperarse o recursarse dentro de la ventana de 2 meses';
  } else if (bloqueadosPorOrigenVigente) {
    estado = 'Bloqueado por curso origen vigente o equivalente del mes actual';
  } else if (todosSinCupo) {
    estado = 'Sin cupo disponible';
  } else if (todosDuplicados) {
    estado = 'Curso ya asignado al usuario en esta corrida';
  }

  const baseEvaluacion = candidatosPrioritarios.length ? candidatosPrioritarios : evaluados;

  const maxSimilarityGeneral = baseEvaluacion.length
    ? Math.max.apply(null, baseEvaluacion.map(x => x.maxSimilarity))
    : null;

  let cursoHistorialMasParecidoGeneral = '';
  let notaHistorialGeneral = '';
  let estadoAcademicoCursoSimilarGeneral = '';

  if (baseEvaluacion.length > 0) {
    const masParecido = baseEvaluacion.reduce((best, actual) =>
      actual.maxSimilarity > best.maxSimilarity ? actual : best
    , baseEvaluacion[0]);

    cursoHistorialMasParecidoGeneral = masParecido.cursoHistorialMasParecido || '';
    notaHistorialGeneral = masParecido.notaHistorial || '';
    estadoAcademicoCursoSimilarGeneral = masParecido.estadoAcademicoCursoSimilar || '';
  }

  return {
    asignado: false,
    estado: estado,
    maxSimilarityGeneral: maxSimilarityGeneral,
    cursoHistorialMasParecidoGeneral: cursoHistorialMasParecidoGeneral,
    notaHistorialGeneral: notaHistorialGeneral,
    estadoAcademicoCursoSimilarGeneral: estadoAcademicoCursoSimilarGeneral,
    prioridadAplicada: prioridadAplicada
  };
}

function esCursoCompatibleConRegla_(cursoDestino, reglaPlan, contextoMBA21) {
  if (contextoMBA21 && contextoMBA21.aplica && !contextoMBA21.baseBBACompleto) {
    return inferirBloqueCursoParaPrograma_(cursoDestino, contextoMBA21) === 'BASE_BBA';
  }

  if (contextoMBA21 && contextoMBA21.aplica && contextoMBA21.baseBBACompleto) {
    if (!reglaPlan) return false;
    const bloque = inferirBloqueCursoParaPrograma_(cursoDestino, contextoMBA21);
    if (bloque !== 'SUBFAMILIA' && bloque !== 'COMUN_MBA') return false;
    const prefijoCurso = extraerPrefijoCurso_(cursoDestino);
    return prefijoCurso && reglaPlan.prefijosPermitidos.indexOf(prefijoCurso) !== -1;
  }

  if (!reglaPlan) return false;
  const prefijoCurso = extraerPrefijoCurso_(cursoDestino);
  if (!prefijoCurso) return false;
  return reglaPlan.prefijosPermitidos.indexOf(prefijoCurso) !== -1;
}

function buscarCursoOrigenVigenteEquivalente_(cursoDestino, origenCursosVigentes, umbralHistorial) {
  const cursos = origenCursosVigentes || [];

  for (let i = 0; i < cursos.length; i++) {
    if (sonCursosEquivalentes_(cursoDestino, cursos[i], umbralHistorial)) {
      return {
        bloqueado: true,
        cursoOrigen: cursos[i]
      };
    }
  }

  return {
    bloqueado: false,
    cursoOrigen: ''
  };
}

function sonCursosEquivalentes_(cursoA, cursoB, umbralHistorial) {
  const familiaA = inferirFamiliaCurso_(cursoA);
  const familiaB = inferirFamiliaCurso_(cursoB);
  if (!familiaA || !familiaB || familiaA !== familiaB) return false;

  const prefijoA = extraerPrefijoCurso_(cursoA);
  const prefijoB = extraerPrefijoCurso_(cursoB);
  const compatibilidadPrefijo = prefijoA === prefijoB || prefijoA === familiaB || prefijoB === familiaA;
  if (!compatibilidadPrefijo) return false;

  const normalizadoA = normalizeCourseName_(cursoA);
  const normalizadoB = normalizeCourseName_(cursoB);
  const similitud = similarityPercent_(normalizadoA, normalizadoB);

  return normalizadoA === normalizadoB || similitud >= Math.max(umbralHistorial || 0, 65);
}

function inferirFamiliaCurso_(cursoNombre) {
  const info = typeof inferirCatalogoCurso_ === 'function' ? inferirCatalogoCurso_(cursoNombre) : null;
  if (info && info.familia) return safeValue_(info.familia).trim().toUpperCase();

  const prefijo = extraerPrefijoCurso_(cursoNombre);
  return inferirFamiliaDesdePrefijo_(prefijo);
}

function resolverInfoPrefijoPrograma_(prefijo) {
  const key = safeValue_(prefijo).trim().toUpperCase();
  if (!key) return { familia: '', subfamilia: '' };

  if (key === 'BBA') return { familia: 'BBA', subfamilia: 'BBA' };
  if (key.indexOf('BBA') === 0) return { familia: 'BBA', subfamilia: key };
  if (key === 'MBA') return { familia: 'MBA', subfamilia: 'MBA' };

  const info = typeof inferirCatalogoCurso_ === 'function' ? inferirCatalogoCurso_(key) : null;
  if (info && info.familia) {
    return {
      familia: safeValue_(info.familia).trim().toUpperCase(),
      subfamilia: safeValue_(info.subfamilia).trim().toUpperCase() || safeValue_(info.familia).trim().toUpperCase()
    };
  }

  return { familia: '', subfamilia: '' };
}

function inferirFamiliaDesdePrefijo_(prefijo) {
  return resolverInfoPrefijoPrograma_(prefijo).familia;
}

function obtenerPrefijoEspecialDominante_(conteoPrefijos) {
  return Object.keys(conteoPrefijos || {})
    .filter(key => {
      const info = resolverInfoPrefijoPrograma_(key);
      return info.subfamilia && info.subfamilia !== 'BBA' && info.subfamilia !== 'MBA';
    })
    .sort((a, b) => (conteoPrefijos[b] || 0) - (conteoPrefijos[a] || 0))[0] || '';
}

function inferirFamiliaDominanteDesdeConteo_(conteoPrefijos) {
  const totales = { BBA: 0, MBA: 0 };

  Object.keys(conteoPrefijos || {}).forEach(key => {
    const familia = inferirFamiliaDesdePrefijo_(key);
    if (!familia) return;
    totales[familia] = (totales[familia] || 0) + (conteoPrefijos[key] || 0);
  });

  if (totales.BBA > totales.MBA) return 'BBA';
  if (totales.MBA > totales.BBA) return 'MBA';
  if (totales.BBA > 0) return 'BBA';
  if (totales.MBA > 0) return 'MBA';
  return '';
}

function normalizarNota_(valor) {
  const num = Number(valor);
  if (isNaN(num)) return '';

  if (num > 0 && num <= 1) return num * 100;
  if (num > 100) return num / 100;
  if (num >= 0 && num <= 100) return num;

  return num;
}

function clasificarEstadoAcademico_(nota) {
  if (nota === '' || nota === null || typeof nota === 'undefined' || isNaN(Number(nota))) {
    return 'SIN_NOTA';
  }

  const n = Number(nota);

  if (n >= 70) return 'APROBADO';
  if (n > 40 && n < 70) return 'RECUPERACION';
  if (n <= 40) return 'RECURSAR';
  return 'SIN_NOTA';
}

function getEstadoRank_(estado) {
  const ranks = {
    'SIN_NOTA': 0,
    'RECURSAR': 1,
    'RECUPERACION': 2,
    'APROBADO': 3
  };
  return ranks[estado] || 0;
}

function extraerPrefijoCurso_(curso) {
  const texto = safeValue_(curso).trim().toUpperCase();
  if (!texto) return '';

  if (typeof tokenizarPlanDeclarado_ === 'function') {
    const tokens = tokenizarPlanDeclarado_(texto);
    for (let i = 0; i < tokens.length; i++) {
      const token = safeValue_(tokens[i]).trim().toUpperCase();
      if (!token) continue;

      if (KNOWN_PREFIXES_.indexOf(token) !== -1) return token;
      if (token === 'BBA' || token.indexOf('BBA') === 0) return token;
      if (token === 'MBA') return token;
    }
  }

  for (let i = 0; i < KNOWN_PREFIXES_.length; i++) {
    const regex = new RegExp('\\b' + KNOWN_PREFIXES_[i] + '\\b');
    if (regex.test(texto)) return KNOWN_PREFIXES_[i];
  }

  const matchBBA = texto.match(/\b(BBA[A-Z0-9]+)\b/);
  if (matchBBA) return typeof canonicalizarAliasPrefijoPrograma_ === 'function'
    ? canonicalizarAliasPrefijoPrograma_(matchBBA[1])
    : matchBBA[1];

  const matchMBA = texto.match(/\b(MBA[A-Z0-9]+)\b/);
  if (matchMBA) return typeof canonicalizarAliasPrefijoPrograma_ === 'function'
    ? canonicalizarAliasPrefijoPrograma_(matchMBA[1])
    : matchMBA[1];

  const matchMaster = texto.match(/\b(M[ADF-HK-Z]{2,6})\b/);
  if (matchMaster) return typeof canonicalizarAliasPrefijoPrograma_ === 'function'
    ? canonicalizarAliasPrefijoPrograma_(matchMaster[1])
    : matchMaster[1];

  return '';
}

function splitCsvUpper_(value) {
  return safeValue_(value)
    .split(',')
    .map(x => x.trim().toUpperCase())
    .filter(Boolean);
}

function getDataRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

function getUsuarios_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return [...new Set(
    sheet.getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .flat()
      .map(v => safeValue_(v).trim())
      .filter(Boolean)
  )];
}

function getCursosDesdeUnaColumna_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, Math.max(sheet.getLastColumn(), 2)).getValues();

  return values
    .map(row => ({
      curso: safeValue_(row[0]).trim(),
      cupoActual: normalizarCupoActualCursoDestino_(row[1])
    }))
    .filter(item => item.curso !== '')
    .filter(item => item.curso.toLowerCase() !== 'curso' && item.curso.toLowerCase() !== 'cursos')
    .map(item => ({
      cursoOriginal: item.curso,
      cursoNormalizado: normalizeCourseName_(item.curso),
      dia: detectDay_(item.curso),
      prefijo: extraerPrefijoCurso_(item.curso),
      cupoActual: item.cupoActual
    }));
}

function normalizarCupoActualCursoDestino_(valor) {
  const texto = safeValue_(valor).trim();
  if (!texto) return 0;

  const numero = Number(texto.toString().replace(',', '.'));
  return isNaN(numero) ? 0 : Math.max(0, Math.round(numero));
}

function agruparPorUsuario_(rows, CONFIG) {
  return rows.reduce((acc, row) => {
    const user = safeValue_(row[CONFIG.COL_USER - 1]).trim();
    if (!user) return acc;
    if (!acc[user]) acc[user] = [];
    acc[user].push(row);
    return acc;
  }, {});
}

function getNombreCompleto_(row, CONFIG) {
  const full = safeValue_(row[CONFIG.COL_FULLNAME - 1]);
  const n1 = safeValue_(row[CONFIG.COL_NAME1 - 1]);
  const ap = safeValue_(row[CONFIG.COL_LASTNAME - 1]);
  return full || [n1, ap].filter(Boolean).join(' ').trim();
}

function extraerTotalPlan_(plan) {
  const texto = safeValue_(plan).trim();
  if (!texto) return null;

  const match = texto.match(/(\d+)/);
  if (!match) return null;

  const numero = parseInt(match[1], 10);
  return isNaN(numero) ? null : numero;
}

function normalizeCourseName_(text) {
  let s = safeValue_(text).toLowerCase();
  s = removeAccents_(s);
  s = s.replace(/[^\w\s]/g, ' ');
  s = s.replace(/\b20\d{2}\b/g, ' ');

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'setiembre',
    'octubre', 'noviembre', 'diciembre'
  ];
  s = s.replace(new RegExp('\\b(' + meses.join('|') + ')\\b', 'g'), ' ');

  const dias = [
    'lunes', 'martes', 'miercoles', 'jueves',
    'viernes', 'sabado', 'domingo'
  ];
  s = s.replace(new RegExp('\\b(' + dias.join('|') + ')\\b', 'g'), ' ');

  const prefijos = KNOWN_PREFIXES_.map(x => x.toLowerCase());
  s = s.replace(new RegExp('\\b(' + prefijos.join('|') + ')\\b', 'g'), ' ');

  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function detectDay_(text) {
  const s = removeAccents_(safeValue_(text).toLowerCase());

  if (/\blunes\b/.test(s)) return 'Lunes';
  if (/\bmartes\b/.test(s)) return 'Martes';
  if (/\bmiercoles\b/.test(s)) return 'Miércoles';
  if (/\bjueves\b/.test(s)) return 'Jueves';
  if (/\bviernes\b/.test(s)) return 'Viernes';
  if (/\bsabado\b/.test(s)) return 'Sábado';
  if (/\bdomingo\b/.test(s)) return 'Domingo';

  return '';
}

function similarityPercent_(a, b) {
  a = safeValue_(a);
  b = safeValue_(b);

  if (!a && !b) return 100;
  if (!a || !b) return 0;

  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));

  let inter = 0;
  setA.forEach(token => {
    if (setB.has(token)) inter++;
  });

  const union = new Set([].concat(Array.from(setA), Array.from(setB))).size;
  return union === 0 ? 0 : Math.round((inter / union) * 100);
}

function extraerFechaCursoDesdeNombre_(texto) {
  const s = removeAccents_(safeValue_(texto).toLowerCase()).trim();
  if (!s) return null;

  const meses = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11
  };

  const match = s.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(20\d{2})\b/);
  if (!match) return null;

  const mes = meses[match[1]];
  const anio = parseInt(match[2], 10);
  if (isNaN(anio) || typeof mes === 'undefined') return null;

  return new Date(anio, mes, 1);
}

function diferenciaMeses_(fechaAnterior, fechaPosterior) {
  if (!(fechaAnterior instanceof Date) || isNaN(fechaAnterior.getTime())) return null;
  if (!(fechaPosterior instanceof Date) || isNaN(fechaPosterior.getTime())) return null;

  return (
    (fechaPosterior.getFullYear() - fechaAnterior.getFullYear()) * 12 +
    (fechaPosterior.getMonth() - fechaAnterior.getMonth())
  );
}

function estaRecuperacionVigente_(fechaCursoHistorial, fechaCursoObjetivo) {
  const meses = diferenciaMeses_(fechaCursoHistorial, fechaCursoObjetivo);
  if (meses === null) return false;
  return meses >= 0 && meses <= 2;
}

function prepararHojaResumen_(ss, sheetName) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);
}

function formatSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) return;

  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, lastCol);
}

function safeValue_(v) {
  return v == null ? '' : String(v);
}

function removeAccents_(str) {
  return safeValue_(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatPercent_(n) {
  return n === '' || n == null ? '' : n + '%';
}

function crearEstadisticasProceso_(totalUsuarios) {
  return {
    totalUsuarios: totalUsuarios,
    usuariosProcesados: 0,
    usuariosConOrigen: 0,
    usuariosSinOrigen: 0,
    cursosOrigenProcesados: 0,
    asignacionesExitosas: 0,
    asignacionesFallidas: 0,
    alumnosAsignacionCompleta: 0,
    alumnosAsignacionParcial: 0,
    alumnosSinAsignacion: 0,
    derivadosCapstone: 0,
    pendientesAprobacionManual: 0,
    cambiosDeDia: 0,
    sinRegla: 0,
    sinOferta: 0,
    sinCupo: 0,
    bloqueadoAprobado: 0,
    bloqueadoRecuperacion: 0,
    bloqueadoRecursado: 0,
    bloqueadoOrigenVigente: 0,
    cursoDuplicado: 0,
    confianzaAlta: 0,
    confianzaMedia: 0,
    confianzaBaja: 0,
    confianzaAcumulada: 0,
    confianzaMuestras: 0
  };
}

function registrarMotivoNoAsignacion_(stats, estado) {
  const estadoNormalizado = removeAccents_(safeValue_(estado)).toUpperCase();

  if (estadoNormalizado === 'SIGLA DEL CURSO ORIGEN SIN REGLA CONFIGURADA') {
    stats.sinRegla++;
  } else if (
    estadoNormalizado === 'SIN OFERTA COMPATIBLE PARA ESE DIA' ||
    estadoNormalizado.indexOf('NO DISPONIBLE EN OFERTA DESTINO') !== -1
  ) {
    stats.sinOferta++;
  } else if (
    estadoNormalizado === 'SIN CUPO DISPONIBLE' ||
    estadoNormalizado.indexOf('SIN CUPO DISPONIBLE EN ALUMNOS PENDIENTES DE CAPSTONE') !== -1
  ) {
    stats.sinCupo++;
  } else if (estadoNormalizado === 'BLOQUEADO POR CURSO SIMILAR YA APROBADO') {
    stats.bloqueadoAprobado++;
  } else if (estadoNormalizado === 'BLOQUEADO POR RECUPERACION VIGENTE; LA RECUPERACION VA EN PARALELO Y NO SUSTITUYE LA ASIGNACION MENSUAL') {
    stats.bloqueadoRecuperacion++;
  } else if (estadoNormalizado === 'BLOQUEADO POR RECURSADO VIGENTE; EL CURSO PERDIDO DEBE RECUPERARSE O RECURSARSE DENTRO DE LA VENTANA DE 2 MESES') {
    stats.bloqueadoRecursado++;
  } else if (estadoNormalizado === 'BLOQUEADO POR CURSO ORIGEN VIGENTE O EQUIVALENTE DEL MES ACTUAL') {
    stats.bloqueadoOrigenVigente++;
  } else if (estadoNormalizado === 'CURSO YA ASIGNADO AL USUARIO EN ESTA CORRIDA') {
    stats.cursoDuplicado++;
  } else if (estadoNormalizado.indexOf('PENDIENTE DE APROBACION MANUAL') !== -1) {
    stats.pendientesAprobacionManual++;
  }
}

function calcularConfianzaAsignacion_(params) {
  const { evaluacion, diaOrigen, diaAsignado, umbralHistorial } = params;
  const similarity = Number(evaluacion.maxSimilarity || 0);
  const mismoDia = diaOrigen && diaAsignado && diaOrigen === diaAsignado;
  const cambioDia = diaOrigen && diaAsignado && diaOrigen !== diaAsignado;

  let score = 100;

  if (cambioDia) score -= 20;
  if (!diaOrigen || !diaAsignado) score -= 10;

  if (similarity >= umbralHistorial) {
    score -= 35;
  } else if (similarity >= Math.max(0, umbralHistorial - 15)) {
    score -= 20;
  } else if (similarity >= Math.max(0, umbralHistorial - 30)) {
    score -= 10;
  }

  if (evaluacion.prioridadAplicada === 'SUBFAMILIA PRIORITARIA') score += 5;
  if (mismoDia) score += 5;

  score = Math.max(0, Math.min(100, score));

  let etiqueta = 'MEDIA';
  if (score >= 85) etiqueta = 'ALTA';
  else if (score < 60) etiqueta = 'BAJA';

  return {
    etiqueta: etiqueta,
    score: score
  };
}

function crearConfianzaDerivacionCapstone_() {
  return {
    etiqueta: 'ALTA',
    score: 100
  };
}

function evaluarRevisionPrograma_(perfilPrograma) {
  const motivos = [];

  if (!perfilPrograma.programaCodigo) motivos.push('Programa no inferido');
  if (perfilPrograma.conflictoPrograma) motivos.push(perfilPrograma.motivoConflictoPrograma || 'Conflicto fuerte plan vs historial');
  if (perfilPrograma.coincidenciaPlanHistorico === 'BAJA' && !perfilPrograma.planCompuesto) {
    motivos.push('Plan vs historico con baja coincidencia');
  }
  if (perfilPrograma.confianzaEtiqueta === 'BAJA') motivos.push('Confianza programa baja');

  return {
    requiereRevision: motivos.length > 0,
    motivo: motivos.join(' | ')
  };
}

function evaluarRevisionAsignacion_(revisionBase, confianzaAsignacion) {
  const motivos = [];

  if (revisionBase && revisionBase.motivo) motivos.push(revisionBase.motivo);
  if (confianzaAsignacion && confianzaAsignacion.etiqueta === 'BAJA') {
    motivos.push('Confianza asignacion baja');
  }

  return {
    requiereRevision: motivos.length > 0,
    motivo: motivos.join(' | ')
  };
}

function unirMotivosRevision_(motivoA, motivoB) {
  return [safeValue_(motivoA).trim(), safeValue_(motivoB).trim()].filter(Boolean).join(' | ');
}

function acumularConfianza_(stats, confianza) {
  stats.confianzaAcumulada += confianza.score;
  stats.confianzaMuestras++;

  if (confianza.etiqueta === 'ALTA') stats.confianzaAlta++;
  else if (confianza.etiqueta === 'MEDIA') stats.confianzaMedia++;
  else stats.confianzaBaja++;
}

function escribirResumenProceso_(ss, sheetName, stats) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
  } else {
    sh.clearContents();
  }

  const confianzaPromedio = stats.confianzaMuestras
    ? Math.round((stats.confianzaAcumulada / stats.confianzaMuestras) * 10) / 10
    : '';

  const rows = [
    ['Metrica', 'Valor'],
    ['Usuarios listados', stats.totalUsuarios],
    ['Usuarios procesados', stats.usuariosProcesados],
    ['Usuarios con cursos origen', stats.usuariosConOrigen],
    ['Usuarios sin cursos origen', stats.usuariosSinOrigen],
    ['Cursos origen procesados', stats.cursosOrigenProcesados],
      ['Asignaciones exitosas', stats.asignacionesExitosas],
      ['Asignaciones fallidas', stats.asignacionesFallidas],
      ['Derivados a Alumnos Pendientes de Capstone', stats.derivadosCapstone],
      ['Pendientes de aprobación manual por cambio de día', stats.pendientesAprobacionManual],
      ['Alumnos con asignacion completa', stats.alumnosAsignacionCompleta],
    ['Alumnos con asignacion parcial', stats.alumnosAsignacionParcial],
    ['Alumnos sin asignacion', stats.alumnosSinAsignacion],
    ['Cambios de dia', stats.cambiosDeDia],
    ['Sin regla configurada', stats.sinRegla],
    ['Sin oferta compatible', stats.sinOferta],
    ['Sin cupo disponible', stats.sinCupo],
    ['Bloqueados por curso similar aprobado', stats.bloqueadoAprobado],
    ['Bloqueados por recuperacion vigente', stats.bloqueadoRecuperacion],
    ['Bloqueados por recursado vigente', stats.bloqueadoRecursado],
    ['Bloqueados por origen vigente/equivalente', stats.bloqueadoOrigenVigente],
    ['Duplicados evitados en la corrida', stats.cursoDuplicado],
    ['Confianza alta', stats.confianzaAlta],
    ['Confianza media', stats.confianzaMedia],
    ['Confianza baja', stats.confianzaBaja],
    ['Confianza promedio', confianzaPromedio]
  ];

  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(1, 1, 1, 2).setFontWeight('bold');
  sh.autoResizeColumns(1, 2);
  sh.setFrozenRows(1);
}

function escribirHojaRevision_(ss, sheetName, rows) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
  } else {
    sh.clearContents();
  }

  if (!rows || !rows.length) return;

  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatSheet_(sh);
}

function crearFilaPendienteAprobacion_(params, CONFIG) {
  const moodleBase = crearFilaMoodle_(params, CONFIG);
  return [
    moodleBase.username,
    moodleBase.firstname,
    moodleBase.lastname,
    moodleBase.email,
    moodleBase.course1,
    moodleBase.role1,
    safeValue_(params.estado).trim(),
    safeValue_(params.comentario).trim(),
    safeValue_(params.cursoOrigen).trim(),
    safeValue_(params.diaOrigen).trim(),
    safeValue_(params.diaAsignado).trim(),
    safeValue_(params.tipoResolucion).trim()
  ];
}

function escribirHojaPendientesAprobacion_(ss, sheetName, rows) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
  } else {
    sh.clearContents();
  }

  const headers = [
    ['username', 'firstname', 'lastname', 'email', 'course1', 'role1', 'estado', 'comentario', 'curso_origen', 'dia_origen', 'dia_sugerido', 'tipo_resolucion']
  ];
  const salida = headers.concat(rows || []);
  sh.getRange(1, 1, salida.length, salida[0].length).setValues(salida);
  formatSheet_(sh);
}

function mostrarResumenProceso_(stats) {
  const confianzaPromedio = stats.confianzaMuestras
    ? Math.round((stats.confianzaAcumulada / stats.confianzaMuestras) * 10) / 10
    : 0;

  const mensaje = [
    'Proceso finalizado',
    'Usuarios procesados: ' + stats.usuariosProcesados,
    'Asignaciones exitosas: ' + stats.asignacionesExitosas,
    'Asignaciones fallidas: ' + stats.asignacionesFallidas,
    'Derivados a Alumnos Pendientes de Capstone: ' + stats.derivadosCapstone,
    'Pendientes aprobación manual cambio de día: ' + stats.pendientesAprobacionManual,
    'Alumnos con asignacion completa: ' + stats.alumnosAsignacionCompleta,
    'Alumnos con asignacion parcial: ' + stats.alumnosAsignacionParcial,
    'Alumnos sin asignacion: ' + stats.alumnosSinAsignacion,
    'Confianza promedio: ' + confianzaPromedio
  ].join('\n');

  SpreadsheetApp.getUi().alert(mensaje);
}

function crearFilaMoodle_(params, CONFIG) {
  const { usuario, rowOrigen, cursoDestino, diaAsignado, role } = params;
  const firstname = safeValue_(rowOrigen[CONFIG.COL_NAME1 - 1]).trim();
  const lastname = safeValue_(rowOrigen[CONFIG.COL_LASTNAME - 1]).trim();
  const email = safeValue_(rowOrigen[CONFIG.COL_EMAIL - 1]).trim();
  const fullname = safeValue_(rowOrigen[CONFIG.COL_FULLNAME - 1]).trim();
  const nombres = obtenerNombresParaMoodle_(firstname, lastname, fullname);

  return {
    dia: diaAsignado || detectDay_(cursoDestino) || 'SinDia',
    username: safeValue_(usuario).trim(),
    firstname: nombres.firstname,
    lastname: nombres.lastname,
    email: email,
    course1: safeValue_(cursoDestino).trim(),
    role1: role || 'student'
  };
}

function obtenerNombresParaMoodle_(firstname, lastname, fullname) {
  if (firstname || lastname) {
    return {
      firstname: firstname,
      lastname: lastname
    };
  }

  const partes = safeValue_(fullname).trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) {
    return {
      firstname: partes[0] || '',
      lastname: ''
    };
  }

  return {
    firstname: partes.slice(0, -1).join(' '),
    lastname: partes.slice(-1).join(' ')
  };
}

function actualizarConteosCursosDestino_(sheet, cuposAsignados) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return;

  const cursos = sheet.getRange(1, 1, lastRow, 1).getValues();
  const salida = [];

  for (let i = 0; i < cursos.length; i++) {
    const curso = safeValue_(cursos[i][0]).trim();
    if (i === 0 && (curso.toLowerCase() === 'curso' || curso.toLowerCase() === 'cursos')) {
      salida.push(['Matriculados']);
      continue;
    }

    salida.push([curso ? (cuposAsignados[curso] || 0) : '']);
  }

  sheet.getRange(1, 2, salida.length, 1).setValues(salida);
}

function generarHojasMoodlePorDia_(ss, moodleRows, CONFIG) {
  const prefijo = safeValue_(CONFIG.MOODLE_SHEET_PREFIX).trim() || 'Moodle_';
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'SinDia'];
  const agrupado = {};

  moodleRows.forEach(row => {
    const dia = row.dia || 'SinDia';
    if (!agrupado[dia]) agrupado[dia] = [];
    agrupado[dia].push([
      row.username,
      row.firstname,
      row.lastname,
      row.email,
      row.course1,
      row.role1
    ]);
  });

  dias.forEach(dia => {
    const sheetName = construirNombreHojaMoodle_(prefijo, dia);
    let sh = ss.getSheetByName(sheetName);

    if (!agrupado[dia] || agrupado[dia].length === 0) {
      if (sh) sh.clearContents();
      return;
    }

    if (!sh) {
      sh = ss.insertSheet(sheetName);
    } else {
      sh.clearContents();
    }

    const rows = [
      ['username', 'firstname', 'lastname', 'email', 'course1', 'role1']
    ].concat(agrupado[dia]);

    sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, rows[0].length);
  });
}

function construirNombreHojaMoodle_(prefijo, dia) {
  const limpio = removeAccents_(safeValue_(dia)).replace(/\s+/g, '');
  return (prefijo + limpio).substring(0, 99);
}

function onOpen() {
  const config = tryGetConfigForMenu_();

  SpreadsheetApp.getUi()
    .createMenu(config.TITULO_MENU)
    .addItem(config.TITULO_ACCION, 'analizarAsignacionMensual')
    .addSeparator()
    .addItem('Crear o reiniciar hoja Config', 'crearHojaConfig')
    .addItem('Crear o reiniciar hoja ReglasPlanes', 'crearHojaReglasPlanes')
    .addToUi();
}

function tryGetConfigForMenu_() {
  try {
    const cfg = getConfig_();
    return {
      TITULO_MENU: cfg.TITULO_MENU || 'Cursos AI',
      TITULO_ACCION: cfg.TITULO_ACCION || 'Analizar asignacion mensual'
    };
  } catch (e) {
    return {
      TITULO_MENU: 'Cursos AI',
      TITULO_ACCION: 'Analizar asignacion mensual'
    };
  }
}







Parte dos:

const PROGRAMAS_CATALOGO_ = [
  {
    programaCodigo: 'MBA_MMK_21',
    familia: 'MBA',
    subfamilia: 'MMK',
    duracionMeses: 21,
    planNormalizado: 'MMK 21',
    descripcion: 'MBA MMK de 21 meses'
  },
  {
    programaCodigo: 'MBA_GENERICO_18',
    familia: 'MBA',
    subfamilia: 'GENERICA',
    duracionMeses: 18,
    planNormalizado: 'MBA 18',
    descripcion: 'MBA de 18 meses con 7 subfamilia, 7 comun MBA y 4 cierre'
  },
  {
    programaCodigo: 'MBA_GENERICO_9',
    familia: 'MBA',
    subfamilia: 'GENERICA',
    duracionMeses: 9,
    planNormalizado: 'MBA 9',
    descripcion: 'MBA de 9 meses con 7 subfamilia y 2 cierre'
  },
  {
    programaCodigo: 'MBA_GENERICO_12',
    familia: 'MBA',
    subfamilia: 'GENERICA',
    duracionMeses: 12,
    planNormalizado: 'MBA 12',
    descripcion: 'MBA de 12 meses con 7 subfamilia, 3 comun MBA y 2 cierre'
  },
  {
    programaCodigo: 'MBA_GENERICO_10',
    familia: 'MBA',
    subfamilia: 'GENERICA',
    duracionMeses: 10,
    planNormalizado: 'MBA 10',
    descripcion: 'MBA de 10 meses con 7 subfamilia, 1 comun MBA y 2 cierre'
  },
  {
    programaCodigo: 'MBA_GENERICO_13',
    familia: 'MBA',
    subfamilia: 'GENERICA',
    duracionMeses: 13,
    planNormalizado: 'MBA 13',
    descripcion: 'MBA de 13 meses con 7 subfamilia, 4 comun MBA y 2 cierre'
  },
  {
    programaCodigo: 'BBACM_32',
    familia: 'BBA',
    subfamilia: 'BBACM',
    duracionMeses: 32,
    planNormalizado: 'BBACM 32',
    descripcion: 'Bachelor BBACM de 32 meses'
  },
  {
    programaCodigo: 'BBACM_24',
    familia: 'BBA',
    subfamilia: 'BBACM',
    duracionMeses: 24,
    planNormalizado: 'BBACM 24',
    descripcion: 'Bachelor BBACM de 24 meses'
  },
  {
    programaCodigo: 'BBACM_18',
    familia: 'BBA',
    subfamilia: 'BBACM',
    duracionMeses: 18,
    planNormalizado: 'BBACM 18',
    descripcion: 'Bachelor BBACM de 18 meses'
  },
  {
    programaCodigo: 'BBACM_12',
    familia: 'BBA',
    subfamilia: 'BBACM',
    duracionMeses: 12,
    planNormalizado: 'BBACM 12',
    descripcion: 'Bachelor BBACM de 12 meses'
  },
  {
    programaCodigo: 'BBACM_8',
    familia: 'BBA',
    subfamilia: 'BBACM',
    duracionMeses: 8,
    planNormalizado: 'BBACM 8',
    descripcion: 'Bachelor BBACM de 8 meses'
  },
  {
    programaCodigo: 'BBABF_32',
    familia: 'BBA',
    subfamilia: 'BBABF',
    duracionMeses: 32,
    planNormalizado: 'BBABF 32',
    descripcion: 'Bachelor BBABF de 32 meses'
  },
  {
    programaCodigo: 'BBABF_24',
    familia: 'BBA',
    subfamilia: 'BBABF',
    duracionMeses: 24,
    planNormalizado: 'BBABF 24',
    descripcion: 'Bachelor BBABF de 24 meses'
  },
  {
    programaCodigo: 'BBABF_18',
    familia: 'BBA',
    subfamilia: 'BBABF',
    duracionMeses: 18,
    planNormalizado: 'BBABF 18',
    descripcion: 'Bachelor BBABF de 18 meses'
  },
  {
    programaCodigo: 'BBABF_12',
    familia: 'BBA',
    subfamilia: 'BBABF',
    duracionMeses: 12,
    planNormalizado: 'BBABF 12',
    descripcion: 'Bachelor BBABF de 12 meses'
  },
  {
    programaCodigo: 'BBABF_8',
    familia: 'BBA',
    subfamilia: 'BBABF',
    duracionMeses: 8,
    planNormalizado: 'BBABF 8',
    descripcion: 'Bachelor BBABF de 8 meses'
  }
];

const PROGRAMAS_BLOQUES_ = [
  { programaCodigo: 'MBA_MMK_21', bloque: 'BASE_BBA', cantidadObjetivo: 3, prioridad: 1, comentario: 'Cursos BBA requeridos antes o durante el MBA' },
  { programaCodigo: 'MBA_MMK_21', bloque: 'SUBFAMILIA', cantidadObjetivo: 7, prioridad: 2, comentario: 'Cursos de especialidad MMK' },
  { programaCodigo: 'MBA_MMK_21', bloque: 'COMUN_MBA', cantidadObjetivo: 7, prioridad: 3, comentario: 'Cursos comunes del MBA' },
  { programaCodigo: 'MBA_MMK_21', bloque: 'CIERRE', cantidadObjetivo: 4, prioridad: 4, comentario: 'Tramo final o area de cierre' },

  { programaCodigo: 'MBA_GENERICO_18', bloque: 'BASE_BBA', cantidadObjetivo: 0, prioridad: 1, comentario: 'Sin componente BBA' },
  { programaCodigo: 'MBA_GENERICO_18', bloque: 'SUBFAMILIA', cantidadObjetivo: 7, prioridad: 2, comentario: 'Cursos de la subfamilia detectada' },
  { programaCodigo: 'MBA_GENERICO_18', bloque: 'COMUN_MBA', cantidadObjetivo: 7, prioridad: 3, comentario: 'Cursos comunes MBA' },
  { programaCodigo: 'MBA_GENERICO_18', bloque: 'CIERRE', cantidadObjetivo: 4, prioridad: 4, comentario: 'Tramo final o area de cierre' },

  { programaCodigo: 'MBA_GENERICO_9', bloque: 'BASE_BBA', cantidadObjetivo: 0, prioridad: 1, comentario: 'Sin componente BBA' },
  { programaCodigo: 'MBA_GENERICO_9', bloque: 'SUBFAMILIA', cantidadObjetivo: 7, prioridad: 2, comentario: 'Cursos de la subfamilia detectada' },
  { programaCodigo: 'MBA_GENERICO_9', bloque: 'COMUN_MBA', cantidadObjetivo: 0, prioridad: 3, comentario: 'Sin comun MBA' },
  { programaCodigo: 'MBA_GENERICO_9', bloque: 'CIERRE', cantidadObjetivo: 2, prioridad: 4, comentario: 'Tramo final o area de cierre' },

  { programaCodigo: 'MBA_GENERICO_12', bloque: 'BASE_BBA', cantidadObjetivo: 0, prioridad: 1, comentario: 'Sin componente BBA' },
  { programaCodigo: 'MBA_GENERICO_12', bloque: 'SUBFAMILIA', cantidadObjetivo: 7, prioridad: 2, comentario: 'Cursos de la subfamilia detectada' },
  { programaCodigo: 'MBA_GENERICO_12', bloque: 'COMUN_MBA', cantidadObjetivo: 3, prioridad: 3, comentario: 'Cursos comunes MBA' },
  { programaCodigo: 'MBA_GENERICO_12', bloque: 'CIERRE', cantidadObjetivo: 2, prioridad: 4, comentario: 'Tramo final o area de cierre' },

  { programaCodigo: 'MBA_GENERICO_10', bloque: 'BASE_BBA', cantidadObjetivo: 0, prioridad: 1, comentario: 'Sin componente BBA' },
  { programaCodigo: 'MBA_GENERICO_10', bloque: 'SUBFAMILIA', cantidadObjetivo: 7, prioridad: 2, comentario: 'Cursos de la subfamilia detectada' },
  { programaCodigo: 'MBA_GENERICO_10', bloque: 'COMUN_MBA', cantidadObjetivo: 1, prioridad: 3, comentario: 'Cursos comunes MBA' },
  { programaCodigo: 'MBA_GENERICO_10', bloque: 'CIERRE', cantidadObjetivo: 2, prioridad: 4, comentario: 'Tramo final o area de cierre' },

  { programaCodigo: 'MBA_GENERICO_13', bloque: 'BASE_BBA', cantidadObjetivo: 0, prioridad: 1, comentario: 'Sin componente BBA' },
  { programaCodigo: 'MBA_GENERICO_13', bloque: 'SUBFAMILIA', cantidadObjetivo: 7, prioridad: 2, comentario: 'Cursos de la subfamilia detectada' },
  { programaCodigo: 'MBA_GENERICO_13', bloque: 'COMUN_MBA', cantidadObjetivo: 4, prioridad: 3, comentario: 'Cursos comunes MBA' },
  { programaCodigo: 'MBA_GENERICO_13', bloque: 'CIERRE', cantidadObjetivo: 2, prioridad: 4, comentario: 'Tramo final o area de cierre' },

  { programaCodigo: 'BBACM_32', bloque: 'COMUN_BBA', cantidadObjetivo: 29, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBACM_32', bloque: 'SUBFAMILIA', cantidadObjetivo: 6, prioridad: 2, comentario: 'Cursos de subfamilia BBACM' },
  { programaCodigo: 'BBACM_32', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBACM_24', bloque: 'COMUN_BBA', cantidadObjetivo: 21, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBACM_24', bloque: 'SUBFAMILIA', cantidadObjetivo: 6, prioridad: 2, comentario: 'Cursos de subfamilia BBACM' },
  { programaCodigo: 'BBACM_24', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBACM_18', bloque: 'COMUN_BBA', cantidadObjetivo: 15, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBACM_18', bloque: 'SUBFAMILIA', cantidadObjetivo: 6, prioridad: 2, comentario: 'Cursos de subfamilia BBACM' },
  { programaCodigo: 'BBACM_18', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBACM_12', bloque: 'COMUN_BBA', cantidadObjetivo: 9, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBACM_12', bloque: 'SUBFAMILIA', cantidadObjetivo: 6, prioridad: 2, comentario: 'Cursos de subfamilia BBACM' },
  { programaCodigo: 'BBACM_12', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBACM_8', bloque: 'COMUN_BBA', cantidadObjetivo: 1, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBACM_8', bloque: 'SUBFAMILIA', cantidadObjetivo: 5, prioridad: 2, comentario: 'Cursos de subfamilia BBACM para plan corto' },
  { programaCodigo: 'BBACM_8', bloque: 'CIERRE', cantidadObjetivo: 2, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },

  { programaCodigo: 'BBABF_32', bloque: 'COMUN_BBA', cantidadObjetivo: 29, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBABF_32', bloque: 'SUBFAMILIA', cantidadObjetivo: 5, prioridad: 2, comentario: 'Cursos de subfamilia BBABF' },
  { programaCodigo: 'BBABF_32', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBABF_24', bloque: 'COMUN_BBA', cantidadObjetivo: 21, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBABF_24', bloque: 'SUBFAMILIA', cantidadObjetivo: 5, prioridad: 2, comentario: 'Cursos de subfamilia BBABF' },
  { programaCodigo: 'BBABF_24', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBABF_18', bloque: 'COMUN_BBA', cantidadObjetivo: 15, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBABF_18', bloque: 'SUBFAMILIA', cantidadObjetivo: 5, prioridad: 2, comentario: 'Cursos de subfamilia BBABF' },
  { programaCodigo: 'BBABF_18', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBABF_12', bloque: 'COMUN_BBA', cantidadObjetivo: 9, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBABF_12', bloque: 'SUBFAMILIA', cantidadObjetivo: 5, prioridad: 2, comentario: 'Cursos de subfamilia BBABF' },
  { programaCodigo: 'BBABF_12', bloque: 'CIERRE', cantidadObjetivo: 3, prioridad: 3, comentario: 'Umbral de notificacion de cierre' },
  { programaCodigo: 'BBABF_8', bloque: 'COMUN_BBA', cantidadObjetivo: 1, prioridad: 1, comentario: 'Cursos comunes BBA' },
  { programaCodigo: 'BBABF_8', bloque: 'SUBFAMILIA', cantidadObjetivo: 5, prioridad: 2, comentario: 'Cursos de subfamilia BBABF' },
  { programaCodigo: 'BBABF_8', bloque: 'CIERRE', cantidadObjetivo: 2, prioridad: 3, comentario: 'Umbral de notificacion de cierre' }
];

const CATALOGO_CURSOS_ = [
  { matchTipo: 'PREFIJO', matchValor: 'BBA', familia: 'BBA', subfamilia: 'GENERAL', bloque: 'COMUN_BBA', activo: true, comentario: 'Cursos BBA comunes' },
  { matchTipo: 'PREFIJO', matchValor: 'BBACM', familia: 'BBA', subfamilia: 'BBACM', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia BBACM' },
  { matchTipo: 'PREFIJO', matchValor: 'BBABF', familia: 'BBA', subfamilia: 'BBABF', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia BBABF' },
  { matchTipo: 'PREFIJO', matchValor: 'MBA', familia: 'MBA', subfamilia: 'GENERAL', bloque: 'COMUN_MBA', activo: true, comentario: 'Cursos MBA comunes' },
  { matchTipo: 'PREFIJO', matchValor: 'MMK', familia: 'MBA', subfamilia: 'MMK', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MMK' },
  { matchTipo: 'PREFIJO', matchValor: 'MMKD', familia: 'MBA', subfamilia: 'MMKD', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MMKD' },
  { matchTipo: 'PREFIJO', matchValor: 'MLDO', familia: 'MBA', subfamilia: 'MLDO', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MLDO' },
  { matchTipo: 'PREFIJO', matchValor: 'MFIN', familia: 'MBA', subfamilia: 'MFIN', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MFIN' },
  { matchTipo: 'PREFIJO', matchValor: 'MDGP', familia: 'MBA', subfamilia: 'MDGP', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MDGP' },
  { matchTipo: 'PREFIJO', matchValor: 'MHHRR', familia: 'MBA', subfamilia: 'MHHRR', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MHHRR' },
  { matchTipo: 'PREFIJO', matchValor: 'MPM', familia: 'MBA', subfamilia: 'MPM', bloque: 'SUBFAMILIA', activo: true, comentario: 'Cursos de subfamilia MPM' }
];

const ALIAS_PREFIJOS_PLAN_ = {
  MK: 'MMK',
  MLOD: 'MLDO',
  MRRHH: 'MHHRR',
  MHRR: 'MHHRR',
  MHR: 'MHHRR',
  MGDP: 'MDGP',
  MFIM: 'MFIN',
  MFM: 'MFIN'
};

function getProgramasCatalogo_() {
  return PROGRAMAS_CATALOGO_.slice();
}

function getProgramasBloques_() {
  return PROGRAMAS_BLOQUES_.slice();
}

function getCatalogoCursosPrograma_() {
  return CATALOGO_CURSOS_.slice();
}

function getProgramaPorCodigo_(programaCodigo) {
  const explicito = PROGRAMAS_CATALOGO_.find(x => x.programaCodigo === programaCodigo);
  if (explicito) return explicito;

  return construirProgramaDerivado_(programaCodigo);
}

function getBloquesPorPrograma_(programaCodigo) {
  const explicitos = PROGRAMAS_BLOQUES_
    .filter(x => x.programaCodigo === programaCodigo)
    .sort((a, b) => a.prioridad - b.prioridad);

  if (explicitos.length > 0) return explicitos;

  return construirBloquesProgramaDerivado_(programaCodigo);
}

function canonicalizarAliasPrefijoPrograma_(token) {
  const key = safeValue_(token).trim().toUpperCase();
  if (!key) return '';
  return ALIAS_PREFIJOS_PLAN_[key] || key;
}

function tokenizarPlanDeclarado_(plan) {
  const texto = removeAccents_(safeValue_(plan))
    .toUpperCase()
    .replace(/MASTER OF BUSINESS ADMINISTRATION/g, 'MBA')
    .replace(/MAESTRIA EN BUSINESS ADMINISTRATION/g, 'MBA')
    .replace(/MESES?/g, ' ')
    .replace(/[^A-Z0-9/+\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!texto) return [];

  const rawTokens = texto.match(/[A-Z0-9]+/g) || [];
  const tokens = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const actual = canonicalizarAliasPrefijoPrograma_(rawTokens[i]);
    const siguiente = i + 1 < rawTokens.length ? canonicalizarAliasPrefijoPrograma_(rawTokens[i + 1]) : '';
    const matchCompacto = actual.match(/^([A-Z]+)(\d{1,2})$/);

    if (actual === 'BBA' && (siguiente === 'CM' || siguiente === 'BF')) {
      tokens.push('BBA' + siguiente);
      i++;
      continue;
    }

    if (matchCompacto) {
      tokens.push(canonicalizarAliasPrefijoPrograma_(matchCompacto[1]));
      tokens.push(matchCompacto[2]);
      continue;
    }

    tokens.push(actual);
  }

  return tokens;
}

function construirComponentePlanDesdeSegmento_(segmento) {
  const tokens = tokenizarPlanDeclarado_(segmento);
  if (!tokens.length) return null;

  let prefijo = '';
  let duracion = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const info = typeof resolverInfoPrefijoPrograma_ === 'function'
      ? resolverInfoPrefijoPrograma_(token)
      : { familia: '', subfamilia: '' };

    if (!prefijo && (info.familia || token === 'BBA' || token === 'MBA')) {
      prefijo = token;
      continue;
    }

    if (
      prefijo &&
      info.familia &&
      resolverInfoPrefijoPrograma_(prefijo).familia === info.familia &&
      token !== 'BBA' &&
      token !== 'MBA'
    ) {
      prefijo = token;
      continue;
    }

    if (!duracion && /^\d{1,2}$/.test(token)) {
      duracion = token;
    }
  }

  if (!prefijo) return null;

  const infoPrefijo = typeof resolverInfoPrefijoPrograma_ === 'function'
    ? resolverInfoPrefijoPrograma_(prefijo)
    : { familia: '', subfamilia: '' };
  const familia = infoPrefijo.familia || (prefijo.indexOf('BBA') === 0 ? 'BBA' : (prefijo.indexOf('M') === 0 ? 'MBA' : ''));
  const subfamilia = infoPrefijo.subfamilia || prefijo;
  const planNormalizado = [subfamilia || familia, duracion].filter(Boolean).join(' ').trim();

  return {
    raw: safeValue_(segmento).trim(),
    prefijo: prefijo,
    familia: familia,
    subfamilia: subfamilia,
    duracion: duracion ? parseInt(duracion, 10) : null,
    planNormalizado: planNormalizado,
    reconocido: !!familia
  };
}

function extraerComponentesPlanDeclarado_(plan) {
  const texto = removeAccents_(safeValue_(plan))
    .toUpperCase()
    .replace(/MASTER OF BUSINESS ADMINISTRATION/g, 'MBA')
    .replace(/MAESTRIA EN BUSINESS ADMINISTRATION/g, 'MBA')
    .trim();
  if (!texto) return [];

  const separadores = /\s*\/\s*|\s*\+\s*|\s+Y\s+|\s+-\s+/;
  const segmentos = texto.split(separadores).map(x => x.trim()).filter(Boolean);
  const base = segmentos.length > 1 ? segmentos : [texto];

  const componentes = base
    .map(construirComponentePlanDesdeSegmento_)
    .filter(Boolean);

  return componentes.filter((item, index) => {
    if (index === 0) return true;
    const previo = componentes[index - 1];
    return (item.planNormalizado || item.prefijo || item.raw) !== (previo.planNormalizado || previo.prefijo || previo.raw);
  });
}

function normalizarPlanDeclarado_(plan) {
  const componentes = extraerComponentesPlanDeclarado_(plan);
  if (componentes.length > 0) {
    return componentes
      .map(item => item.planNormalizado || item.prefijo || item.raw)
      .filter(Boolean)
      .join(' / ')
      .trim();
  }

  const texto = removeAccents_(safeValue_(plan)).toUpperCase().replace(/\s+/g, ' ').trim();
  if (!texto) return '';

  const prefijo = canonicalizarAliasPrefijoPrograma_(extraerPrefijoCurso_(texto));
  const infoPrefijo = typeof resolverInfoPrefijoPrograma_ === 'function'
    ? resolverInfoPrefijoPrograma_(prefijo)
    : { familia: '', subfamilia: '' };
  const familia = infoPrefijo.familia || (texto.indexOf('BBA') !== -1 ? 'BBA' : (texto.indexOf('MBA') !== -1 ? 'MBA' : ''));
  const subfamilia = infoPrefijo.subfamilia || familia;
  const matchDuracion = texto.match(/(\d{1,2})/);
  const duracion = matchDuracion ? matchDuracion[1] : '';

  return [subfamilia || familia, duracion].filter(Boolean).join(' ').trim();
}

function inferirCatalogoCurso_(cursoNombre) {
  const curso = safeValue_(cursoNombre).trim();
  if (!curso) return null;

  const prefijo = extraerPrefijoCurso_(curso);
  if (!prefijo) return null;

  const exacto = CATALOGO_CURSOS_.find(x =>
    x.activo &&
    x.matchTipo === 'CURSO_EXACTO' &&
    safeValue_(x.matchValor).trim().toUpperCase() === curso.toUpperCase()
  );
  if (exacto) return exacto;

  return CATALOGO_CURSOS_.find(x =>
    x.activo &&
    x.matchTipo === 'PREFIJO' &&
    safeValue_(x.matchValor).trim().toUpperCase() === prefijo
  ) || null;
}

function construirProgramaDerivado_(programaCodigo) {
  const parsed = parseProgramaCodigo_(programaCodigo);
  if (!parsed) return null;

  if (parsed.familia === 'MBA' && parsed.duracionMeses >= 9 && parsed.duracionMeses <= 21) {
    return {
      programaCodigo: programaCodigo,
      familia: 'MBA',
      subfamilia: parsed.subfamilia,
      duracionMeses: parsed.duracionMeses,
      planNormalizado: parsed.subfamilia + ' ' + parsed.duracionMeses,
      descripcion: parsed.duracionMeses === 21
        ? 'Programa derivado MBA 21 con base BBA y especialidad'
        : 'Programa derivado MBA por subfamilia'
    };
  }

  if (parsed.familia === 'BBA' && parsed.duracionMeses >= 8 && parsed.duracionMeses <= 32) {
    return {
      programaCodigo: programaCodigo,
      familia: 'BBA',
      subfamilia: parsed.subfamilia,
      duracionMeses: parsed.duracionMeses,
      planNormalizado: parsed.subfamilia + ' ' + parsed.duracionMeses,
      descripcion: 'Programa derivado BBA conservando duración declarada'
    };
  }

  return null;
}

function construirBloquesProgramaDerivado_(programaCodigo) {
  const parsed = parseProgramaCodigo_(programaCodigo);
  if (!parsed) return [];

  if (parsed.familia === 'MBA' && parsed.duracionMeses === 21) {
    return [
      {
        programaCodigo: programaCodigo,
        bloque: 'BASE_BBA',
        cantidadObjetivo: 3,
        prioridad: 1,
        comentario: 'MBA 21 derivado: 3 BBA primero'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'SUBFAMILIA',
        cantidadObjetivo: 7,
        prioridad: 2,
        comentario: 'MBA 21 derivado: subfamilia fija'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'COMUN_MBA',
        cantidadObjetivo: 7,
        prioridad: 3,
        comentario: 'MBA 21 derivado: tronco MBA'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'CIERRE',
        cantidadObjetivo: 4,
        prioridad: 4,
        comentario: 'MBA 21 derivado: cierre'
      }
    ];
  }

  if (parsed.familia === 'MBA' && parsed.duracionMeses === 18) {
    return [
      {
        programaCodigo: programaCodigo,
        bloque: 'BASE_BBA',
        cantidadObjetivo: 0,
        prioridad: 1,
        comentario: 'MBA 18 derivado: sin componente BBA'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'SUBFAMILIA',
        cantidadObjetivo: 7,
        prioridad: 2,
        comentario: 'MBA 18 derivado: subfamilia fija'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'COMUN_MBA',
        cantidadObjetivo: 7,
        prioridad: 3,
        comentario: 'MBA 18 derivado: tronco MBA'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'CIERRE',
        cantidadObjetivo: 4,
        prioridad: 4,
        comentario: 'MBA 18 derivado: cierre'
      }
    ];
  }

  if (parsed.familia === 'MBA' && parsed.duracionMeses >= 9 && parsed.duracionMeses <= 17) {
    return [
      {
        programaCodigo: programaCodigo,
        bloque: 'BASE_BBA',
        cantidadObjetivo: 0,
        prioridad: 1,
        comentario: 'MBA corto derivado: sin componente BBA'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'SUBFAMILIA',
        cantidadObjetivo: 7,
        prioridad: 2,
        comentario: 'MBA corto derivado: subfamilia fija'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'COMUN_MBA',
        cantidadObjetivo: parsed.duracionMeses - 9,
        prioridad: 3,
        comentario: 'MBA corto derivado: comun MBA = duracion - 9'
      },
      {
        programaCodigo: programaCodigo,
        bloque: 'CIERRE',
        cantidadObjetivo: 2,
        prioridad: 4,
        comentario: 'MBA corto derivado: cierre fijo'
      }
    ];
  }

  return [];
}

function parseProgramaCodigo_(programaCodigo) {
  const texto = safeValue_(programaCodigo).trim().toUpperCase();
  if (!texto) return null;

  const parts = texto.split('_').filter(Boolean);
  if (parts.length < 3) return null;

  const familia = parts[0];
  const duracionMeses = parseInt(parts[parts.length - 1], 10);
  const subfamilia = parts.slice(1, parts.length - 1).join('_');

  if (!familia || !subfamilia || isNaN(duracionMeses)) return null;

  return {
    familia: familia,
    subfamilia: subfamilia,
    duracionMeses: duracionMeses
  };
}
