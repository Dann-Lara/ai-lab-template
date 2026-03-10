import type { Locale } from './types';

export const applicationsES = {
  applications: {
    // Page header
    moduleLabel: 'Módulo',
    pageTitle: 'Postulaciones',
    pageSubtitle: 'Gestiona tus postulaciones y genera CVs optimizados para ATS con IA.',

    // Tabs
    tabList: 'Listado',
    tabNew: '+ Nueva postulación',
    tabBaseCV: 'CV Base',
    tabDashboard: 'Dashboard IA',

    // Warnings
    cvBaseIncompleteTitle: 'CV Base incompleto',
    cvBaseIncompleteDesc: 'Configura tu CV Base antes de crear postulaciones. Puedes subir tu CV en PDF y la IA extraerá los datos automáticamente.',
    cvBaseConfigureBtn: 'Configurar →',

    // List tab
    loadingApps: 'Cargando postulaciones...',
    noApps: 'No hay postulaciones aún.',
    createFirstApp: '+ Crear primera postulación',
    configureCVFirst: 'Configurar CV Base primero',

    // Status
    statusPending: 'Pendiente',
    statusInProcess: 'En proceso',
    statusAccepted: 'Aceptado',
    statusRejected: 'Rechazado',

    // App card actions
    generateCV: 'Generar CV ATS',
    regenerateCV: 'Re-generar CV ATS',
    // Delete
    deleteApp: 'Eliminar',
    deleteConfirm: '¿Eliminar postulación?',
    deleteYes: 'Sí, eliminar',
    deleteNo: 'Cancelar',
    toastAppDeleted: 'Postulación eliminada',
    // Card CV viewer
    viewCV: 'Ver CV ATS',
    // New application form
    jobOfferHint: 'Pega la descripción completa — requisitos, responsabilidades y tecnologías.',
    generatingStep1: '1. Extrayendo palabras clave de la oferta...',
    generatingStep2: '2. Adaptando CV base al puesto sin inventar datos...',
    generatingStep3: '3. Generando versión en español e inglés...',
    atsCompliantNote: 'PDF 100% legible por ATS (sin tablas, columnas ni gráficos)',
    saveAppHint: 'Guarda la postulación con ambas versiones del CV.',
    cvEditHint: 'Podés editar el CV directamente. El PDF y el guardado usarán esta versión.',
    cvEdited: 'Editado',
    cvHumanEdited: 'Revisado por vos',
    pdfExportEs: 'PDF Español (ATS)',
    pdfExportEn: 'PDF Inglés (ATS)',
    saveAppHintEdited: 'Se guardará tu versión editada.',
    // Applied from
    appliedFromLabel: 'Origen de la postulación',
    appliedFromPlaceholder: 'Seleccioná de dónde aplicás...',
    appliedFromCustom: 'o escribí uno...',
    appliedFromAdd: '+ Agregar origen',
    // Interview Q&A
    interviewQA: 'Entrevista',
    interviewQATitle: 'Preguntas de entrevista',
    interviewQuestionsLabel: 'Preguntas (una por línea o numeradas)',
    interviewQuestionsPlaceholder: '¿Por qué querés trabajar aquí?\n¿Cuál es tu mayor fortaleza?\n¿Cómo manejás el trabajo bajo presión?',
    interviewAnswersLabel: 'Respuestas sugeridas — editá antes de usar',
    generateAnswers: 'Generar respuestas',
    generatingAnswers: 'Generando...',
    saveAnswers: 'Guardar preguntas y respuestas',
    savingAnswers: 'Guardando...',
    // Generic
    save: 'Guardar',
    cancel: 'Cancelar',

    // New application tab
    cvRequiredTitle: 'CV Base requerido',
    cvRequiredDesc: 'Completa tu CV Base antes de crear una postulación. La IA lo usará para generar un CV 100% ATS adaptado a cada oferta.',
    goToBaseCV: 'Ir a CV Base →',

    // New app form
    newAppFormTitle: 'Datos de la postulación',
    fieldCompany: 'Empresa',
    fieldCompanyPlaceholder: 'Google, Meta, Startup MX...',
    fieldPosition: 'Puesto',
    fieldPositionPlaceholder: 'Senior Frontend Developer...',
    fieldJobOffer: 'Texto de la oferta / postulación',
    fieldJobOfferPlaceholder: 'Pega aquí la descripción completa de la oferta de trabajo...',
    generateATSBtn: 'Generar CV 100% ATS con IA',
    generatingCV: 'Generando CV ATS con IA...',
    fieldRequired: '*',

    // ATS Score
    atsScoreLabel: 'ATS Match Score',
    atsExcellent: 'Excelente — muy alineado con la oferta.',
    atsGood: 'Bueno — considera agregar más palabras clave.',
    atsLow: 'Bajo — actualiza tu CV base con más detalles relevantes.',

    // Generated CV
    generatedCVTitle: 'CV Generado',
    exportPDF: 'PDF',
    editBack: '← Editar',
    saveApplication: 'Guardar postulación',

    // Base CV tab
    importFromPDF: 'Importar desde PDF',
    pdfUploaderTitle: 'Cargar CV actual (PDF)',
    pdfUploaderDesc: 'La IA extrae automáticamente todos tus datos del PDF y rellena el formulario',
    pdfUploadBtn: 'Subir PDF',
    pdfExtracting: 'Extrayendo...',
    pdfOnlyPDF: 'Solo se aceptan archivos PDF.',
    pdfTooLarge: 'El PDF no debe superar 5 MB.',
    pdfExtractError: 'No se pudo extraer el CV del PDF. Intenta con otro archivo.',
    pdfExtractSuccess: 'Datos extraídos — revisa los campos abajo y guarda.',

    baseCVTitle: 'CV Base Global',
    baseCVDesc: 'Fuente para generar CVs 100% ATS. Los campos con * son requeridos para crear postulaciones.',

    // Base CV form fields
    fieldFullName: 'Nombre completo *',
    fieldEmail: 'Email profesional *',
    fieldPhone: 'Teléfono',
    fieldLocation: 'Ubicación',
    fieldLinkedIn: 'LinkedIn URL',
    fieldSummary: 'Resumen profesional *',
    fieldSummaryPlaceholder: 'Profesional con X años de experiencia en...',
    fieldExperience: 'Experiencia laboral *',
    fieldExperiencePlaceholder: 'Empresa — Puesto (Año-Año)\n• Logro cuantificable...',
    fieldEducation: 'Educación',
    fieldEducationPlaceholder: 'Universidad — Carrera (Año)',
    fieldSkills: 'Habilidades técnicas',
    fieldSkillsPlaceholder: 'React, TypeScript, Node.js...',
    fieldLanguages: 'Idiomas',
    fieldLanguagesPlaceholder: 'Español (nativo), Inglés (B2)',
    fieldCertifications: 'Certificaciones',
    fieldCertificationsPlaceholder: 'AWS Solutions Architect — 2024',

    saveBaseCV: 'Guardar CV Base',
    savingBaseCV: 'Guardando...',
    baseCVComplete: 'CV Base completo',

    // Dashboard tab
    statTotal: 'Total',
    statAccepted: 'Aceptadas',
    statRejected: 'Rechazadas',
    statSuccessRate: 'Tasa de éxito',
    avgATSLabel: 'ATS Score promedio',
    avgATSBased: 'Basado en {n} postulaciones con CV generado.',
    needMoreApps: 'Agrega al menos 2 postulaciones para ver el análisis de IA.',

    // AI Feedback
    feedbackTitle: 'Feedback & Análisis IA',
    feedbackGenerate: 'Generar análisis',
    feedbackGenerating: 'Analizando...',
    feedbackEmpty: 'Presiona "Generar análisis" para obtener feedback personalizado.',

    // Toasts
    toastCVSaved: 'CV base guardado correctamente',
    toastCVSaveError: 'Error al guardar CV base',
    toastPDFExtractOK: '¡CV extraído con éxito! Revisa los campos y guarda.',
    toastStatusError: 'Error al actualizar estado',
    toastGenerateError: 'Error al generar CV ATS',
    toastAppSaved: 'Postulación guardada',
    toastAppSaveError: 'Error al guardar postulación',
    toastFormIncomplete: 'Completa todos los campos',


    // CV Base — ATS hints per field
    hintFullName: 'Usa tu nombre legal completo, sin apodos. ATS busca coincidencia exacta.',
    hintEmail: 'Usa un email profesional. Evita hotmail o emails con números raros.',
    hintPhone: 'Incluye código de país. Ej: +52 555 123 4567',
    hintLocation: 'Ciudad y país es suficiente. Ej: Ciudad de México, México (Remoto)',
    hintLinkedIn: 'URL personalizada: linkedin.com/in/tu-nombre. Los ATS la indexan.',
    hintSummary: 'Mín. 3 frases: título profesional + años de experiencia + propuesta de valor. Sin pronombres en primera persona.',
    hintExperience: 'Formato: Empresa | Puesto | MM/AAAA – MM/AAAA. Cada logro con verbo de acción + número: "Reduje el tiempo de carga en 40%".',
    hintEducation: 'Institución + carrera/grado + año de graduación. Los ATS filtran por palabras clave del título.',
    hintSkills: 'Mín. 6 habilidades técnicas separadas por coma. Usa las palabras exactas de las ofertas de trabajo.',
    hintLanguages: 'Usa niveles estándar: nativo, C1, B2, etc. Ej: Español (nativo), Inglés (C1)',
    hintCertifications: 'Incluye nombre, emisor y año. Ej: AWS Solutions Architect — Amazon — 2024',

    // CV Evaluation
    cvEvalTitle: 'Evaluación ATS',
    cvEvalDesc: 'La IA evalúa tu CV con criterios estrictos. Necesitas 85/100 para guardar.',
    cvEvalBtn: '✦ Evaluar CV con IA',
    cvEvalRunning: 'Evaluando...',
    cvEvalApprovedBadge: 'Aprobado',
    cvEvalApproved: '¡CV aprobado! Ya puedes guardarlo.',
    cvEvalNeedsWork: 'El CV necesita mejoras. Revisa los campos marcados.',
    cvEvalRequired: 'Evalúa el CV con IA primero (mínimo 85/100).',
    cvEvalNeedMore: 'Necesitas {n} puntos más para poder guardar. Mejora los campos marcados.',
    cvEvalBeforeSave: 'Evalúa el CV con IA para habilitarlo.',
    downloadBaseCV: 'Descargar CV Base',
    fieldUnlock: 'Editar',
    fieldGroupContact: 'Contacto',
    fieldGroupOk: 'Todo completo',
    legendOk: 'Completo',
    legendWarn: 'Mejorar',
    legendError: 'Falta',
    legendFieldsOk: 'campos aprobados',

    // Access denied
    accessDenied: 'No tienes acceso al módulo de Postulaciones.',
    accessDeniedDesc: 'Contacta a tu administrador para habilitar este módulo.',
  },
} as const;

export const applicationsEN = {
  applications: {
    moduleLabel: 'Module',
    pageTitle: 'Applications',
    pageSubtitle: 'Manage your job applications and generate ATS-optimized CVs with AI.',

    tabList: 'List',
    tabNew: '+ New application',
    tabBaseCV: 'Base CV',
    tabDashboard: 'AI Dashboard',

    cvBaseIncompleteTitle: 'Base CV incomplete',
    cvBaseIncompleteDesc: 'Set up your Base CV before creating applications. You can upload your CV as a PDF and AI will extract your data automatically.',
    cvBaseConfigureBtn: 'Set up →',

    loadingApps: 'Loading applications...',
    noApps: 'No applications yet.',
    createFirstApp: '+ Create first application',
    configureCVFirst: 'Set up Base CV first',

    statusPending: 'Pending',
    statusInProcess: 'In process',
    statusAccepted: 'Accepted',
    statusRejected: 'Rejected',

    generateCV: 'Generate ATS CV',
    regenerateCV: 'Re-generate ATS CV',
    // Delete
    deleteApp: 'Delete',
    deleteConfirm: 'Delete application?',
    deleteYes: 'Yes, delete',
    deleteNo: 'Cancel',
    toastAppDeleted: 'Application deleted',
    // Card CV viewer
    viewCV: 'View ATS CV',
    // New application form
    jobOfferHint: 'Paste the full job description — requirements, responsibilities and tech stack.',
    generatingStep1: '1. Extracting keywords from the job offer...',
    generatingStep2: '2. Adapting base CV to the role without inventing data...',
    generatingStep3: '3. Generating Spanish and English versions...',
    atsCompliantNote: 'PDF 100% ATS-readable (no tables, columns or graphics)',
    saveAppHint: 'Saves the application with both CV versions.',
    cvEditHint: 'You can edit the CV directly. The PDF and save will use this version.',
    cvEdited: 'Edited',
    cvHumanEdited: 'Reviewed by you',
    pdfExportEs: 'PDF Spanish (ATS)',
    pdfExportEn: 'PDF English (ATS)',
    saveAppHintEdited: 'Your edited version will be saved.',
    // Applied from
    appliedFromLabel: 'Application source',
    appliedFromPlaceholder: 'Select where you applied from...',
    appliedFromCustom: 'or type one...',
    appliedFromAdd: '+ Add source',
    // Interview Q&A
    interviewQA: 'Interview',
    interviewQATitle: 'Interview questions',
    interviewQuestionsLabel: 'Questions (one per line or numbered)',
    interviewQuestionsPlaceholder: 'Why do you want to work here?\nWhat is your greatest strength?\nHow do you handle working under pressure?',
    interviewAnswersLabel: 'Suggested answers — edit before using',
    generateAnswers: 'Generate answers',
    generatingAnswers: 'Generating...',
    saveAnswers: 'Save questions & answers',
    savingAnswers: 'Saving...',
    // Generic
    save: 'Save',
    cancel: 'Cancel',

    cvRequiredTitle: 'Base CV required',
    cvRequiredDesc: 'Complete your Base CV before creating an application. AI will use it to generate a 100% ATS-optimized CV tailored to each offer.',
    goToBaseCV: 'Go to Base CV →',

    newAppFormTitle: 'Application details',
    fieldCompany: 'Company',
    fieldCompanyPlaceholder: 'Google, Meta, Startup...',
    fieldPosition: 'Position',
    fieldPositionPlaceholder: 'Senior Frontend Developer...',
    fieldJobOffer: 'Job offer / description',
    fieldJobOfferPlaceholder: 'Paste the full job description here...',
    generateATSBtn: 'Generate 100% ATS CV with AI',
    generatingCV: 'Generating ATS CV with AI...',
    fieldRequired: '*',

    atsScoreLabel: 'ATS Match Score',
    atsExcellent: 'Excellent — highly aligned with the offer.',
    atsGood: 'Good — consider adding more keywords.',
    atsLow: 'Low — update your base CV with more relevant details.',

    generatedCVTitle: 'Generated CV',
    exportPDF: 'PDF',
    editBack: '← Edit',
    saveApplication: 'Save application',

    importFromPDF: 'Import from PDF',
    pdfUploaderTitle: 'Upload current CV (PDF)',
    pdfUploaderDesc: 'AI automatically extracts all your data from the PDF and fills the form',
    pdfUploadBtn: 'Upload PDF',
    pdfExtracting: 'Extracting...',
    pdfOnlyPDF: 'Only PDF files are accepted.',
    pdfTooLarge: 'PDF must not exceed 5 MB.',
    pdfExtractError: 'Could not extract CV from PDF. Try another file.',
    pdfExtractSuccess: 'Data extracted — review the fields below and save.',

    baseCVTitle: 'Global Base CV',
    baseCVDesc: 'Source for generating 100% ATS CVs. Fields marked with * are required to create applications.',

    fieldFullName: 'Full name *',
    fieldEmail: 'Professional email *',
    fieldPhone: 'Phone',
    fieldLocation: 'Location',
    fieldLinkedIn: 'LinkedIn URL',
    fieldSummary: 'Professional summary *',
    fieldSummaryPlaceholder: 'Professional with X years of experience in...',
    fieldExperience: 'Work experience *',
    fieldExperiencePlaceholder: 'Company — Position (Year-Year)\n• Quantifiable achievement...',
    fieldEducation: 'Education',
    fieldEducationPlaceholder: 'University — Degree (Year)',
    fieldSkills: 'Technical skills',
    fieldSkillsPlaceholder: 'React, TypeScript, Node.js...',
    fieldLanguages: 'Languages',
    fieldLanguagesPlaceholder: 'English (native), Spanish (B2)',
    fieldCertifications: 'Certifications',
    fieldCertificationsPlaceholder: 'AWS Solutions Architect — 2024',

    saveBaseCV: 'Save Base CV',
    savingBaseCV: 'Saving...',
    baseCVComplete: 'Base CV complete',

    statTotal: 'Total',
    statAccepted: 'Accepted',
    statRejected: 'Rejected',
    statSuccessRate: 'Success rate',
    avgATSLabel: 'Average ATS Score',
    avgATSBased: 'Based on {n} applications with generated CV.',
    needMoreApps: 'Add at least 2 applications to see the AI analysis.',

    feedbackTitle: 'AI Feedback & Analysis',
    feedbackGenerate: 'Generate analysis',
    feedbackGenerating: 'Analyzing...',
    feedbackEmpty: 'Press "Generate analysis" to get personalized feedback.',

    toastCVSaved: 'Base CV saved successfully',
    toastCVSaveError: 'Error saving base CV',
    toastPDFExtractOK: 'CV extracted successfully! Review the fields and save.',
    toastStatusError: 'Error updating status',
    toastGenerateError: 'Error generating ATS CV',
    toastAppSaved: 'Application saved',
    toastAppSaveError: 'Error saving application',
    toastFormIncomplete: 'Please complete all fields',


    // CV Base — ATS hints per field
    hintFullName: 'Use your full legal name, no nicknames. ATS systems match exact names.',
    hintEmail: 'Use a professional email. Avoid personal emails with numbers or random domains.',
    hintPhone: 'Include country code. E.g.: +1 555 123 4567',
    hintLocation: 'City and country is enough. E.g.: New York, USA (Remote)',
    hintLinkedIn: 'Use a custom URL: linkedin.com/in/your-name. ATS systems index this.',
    hintSummary: 'Min. 3 sentences: job title + years of experience + value proposition. No first-person pronouns.',
    hintExperience: 'Format: Company | Role | MM/YYYY – MM/YYYY. Each achievement with action verb + number: "Reduced load time by 40%".',
    hintEducation: 'Institution + degree/field + graduation year. ATS filters by exact title keywords.',
    hintSkills: 'Min. 6 technical skills separated by commas. Use the exact words from job postings.',
    hintLanguages: 'Use standard levels: native, C1, B2, etc. E.g.: English (native), Spanish (C1)',
    hintCertifications: 'Include name, issuer and year. E.g.: AWS Solutions Architect — Amazon — 2024',

    // CV Evaluation
    cvEvalTitle: 'ATS Evaluation',
    cvEvalDesc: 'AI evaluates your CV with strict ATS criteria. You need 85/100 to save.',
    cvEvalBtn: '✦ Evaluate CV with AI',
    cvEvalRunning: 'Evaluating...',
    cvEvalApprovedBadge: 'Approved',
    cvEvalApproved: 'CV approved! You can now save it.',
    cvEvalNeedsWork: 'The CV needs improvements. Review the flagged fields.',
    cvEvalRequired: 'Evaluate the CV with AI first (minimum 85/100).',
    cvEvalNeedMore: 'You need {n} more points to save. Improve the flagged fields.',
    cvEvalBeforeSave: 'Evaluate the CV with AI to unlock saving.',
    downloadBaseCV: 'Download Base CV',
    fieldUnlock: 'Edit',
    fieldGroupContact: 'Contact',
    fieldGroupOk: 'All complete',
    legendOk: 'Complete',
    legendWarn: 'Improve',
    legendError: 'Missing',
    legendFieldsOk: 'fields approved',

    accessDenied: 'You do not have access to the Applications module.',
    accessDeniedDesc: 'Contact your administrator to enable this module.',
  },
} as const;

export const applicationsTranslations: Record<string, typeof applicationsES> = {
  es: applicationsES,
  en: applicationsEN,
};
