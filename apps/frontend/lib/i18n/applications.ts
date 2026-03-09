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

    accessDenied: 'You do not have access to the Applications module.',
    accessDeniedDesc: 'Contact your administrator to enable this module.',
  },
} as const;

export const applicationsTranslations: Record<string, typeof applicationsES> = {
  es: applicationsES,
  en: applicationsEN,
};
