// src/lib/roles.ts

export enum Role {
    ADMIN             = "Administrador",
    DOCENTE           = "Docente",
    ESTUDIANTE        = "Estudiante",
    ADMINISTRATIVO    = "Administrativo",
    FINANZAS          = "Finanzas",
    SEGURIDAD         = "Seguridad",
    ASESOR            = "Asesor",
    ROLTEST           = "Roltest",
    MARKETING         = "Marketing",
  }
  
  // Módulos de tu sidebar y los roles que los pueden ver:
  export const accessConfig: Record<string, Role[]> = {
    inicio:       Object.values(Role),           // todos los roles
    prospectos:   [Role.ADMIN, Role.ASESOR],
    inscripcion:  [Role.ADMIN , Role.ASESOR],
    academico:    [Role.ADMIN, Role.DOCENTE],
    docentes:     [Role.ADMIN, Role.DOCENTE],
    estudiantes:  [Role.ADMIN, Role.ESTUDIANTE],
    administracion: [Role.ADMINISTRATIVO, Role.ADMIN],
    seguridad:    [Role.ADMIN, Role.SEGURIDAD],
    finanzas:     [Role.ADMIN, Role.FINANZAS],
    marketing:    [Role.ADMIN, Role.MARKETING],


  };
  