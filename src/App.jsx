import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FolderRoot,
  Star,
  Settings,
  Sun,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Users,
  Vote,
  Activity,
  History,
  HardDrive,
  ExternalLink,
  FileCode,
  Eye,
  LogOut,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  Layout,
  MessageSquare,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Save,
  ArrowLeft,
  QrCode,
  Download,
  FileText,
  FileBarChart
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from './contexts/AuthContext.jsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './index.css';

// Usa la variable de entorno, si no existe o en desarrollo usa localhost por defecto
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5260';
const PROJECTS_API = `${API_BASE}/api/admin/Projects`;
const DASHBOARD_API = `${API_BASE}/api/admin/Dashboard/stats`;
const EVALUATIONS_API = `${API_BASE}/api/admin/AdminEvaluations`;
const SETTINGS_API = `${API_BASE}/api/admin/AdminSettings`;
const TEMPLATES_API = `${API_BASE}/api/admin/AdminTemplates`;
const MEDIA_API = `${API_BASE}/api/admin/AdminMedia`;
const FILES_API = `${API_BASE}/api/Files`;
const AUDIT_API = `${API_BASE}/api/admin/Audit`;

const getMediaUrl = (url) => {
  if (!url) return '';

  // Si la URL contiene '/uploads/', forzamos el uso de nuestro API_BASE local.
  // Esto soluciona problemas cuando se comparten bases de datos (MongoDB Atlas)
  // pero los archivos están en el wwwroot local de diferentes máquinas.
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    const relativePath = parts[parts.length - 1];
    return `${API_BASE}/uploads/${relativePath}`;
  }

  if (url.startsWith('http')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${path}`;
};

const COLORS = ['#1B5E20', '#4E7D50', '#81C784', '#A5D6A7', '#C8E6C9'];

// --- Sub-componente: LoginView ---
const LoginView = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (!success) setError('Acceso denegado. Verifique sus credenciales.');
    setLoading(false);
  };

  return (
    <div className="login-container" style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1a3d24, #050505 60%)'
    }}>
      <div className="card" style={{ maxWidth: 450, width: '90%', padding: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShieldCheck size={60} style={{ color: 'var(--primary)' }} />
        </div>
        <h1 style={{ marginBottom: '0.5rem', fontWeight: 900 }}>PX <span style={{ color: 'var(--primary)' }}>Forge</span></h1>
        <p className="text-muted" style={{ marginBottom: '2.5rem' }}>Panel de Control Administrativo</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Correo Electrónico</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@kiosco.com"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <div className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" /> : 'Acceder al Núcleo'}
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const { user, token, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({ eventName: '', isVotingEnabled: false, isRankingPublic: false });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  // --- PX Forge State Management ---
  const [error, setError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDesigning, setIsDesigning] = useState(false);
  const [selectedProjectForQR, setSelectedProjectForQR] = useState(null);
  const [selectedProjectForFeedback, setSelectedProjectForFeedback] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({
    version: '',
    isActive: true,
    sections: []
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingField, setUploadingField] = useState(null); // 'logo', 'video', 'gallery'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [dialog, setDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'alert', // 'alert', 'confirm', 'prompt'
    fields: [], // [{ name, label, placeholder, value }]
    onConfirm: null,
    onCancel: null
  });
  const [dialogData, setDialogData] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Software',
    teamMembers: '',
    coverImageUrl: '',
    iconUrl: '',
    videoUrl: '',
    galleryUrls: [],
    documents: [],
    status: 'Active',
    objectives: '',
    techStack: ''
  });

  const categories = ['Software', 'Hardware', 'Gaming', 'IA', 'Robótica'];

  async function fetchDashboardStats() {
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(DASHBOARD_API, { headers });

      if (response.status === 401) {
        logout();
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al cargar estadísticas');
      setDashboardStats(data);
    } catch (err) {
      setError('Fallo al recuperar métricas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects(currentSearch = search) {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(PROJECTS_API);
      if (currentSearch) url.searchParams.append('search', currentSearch);
      if (category) url.searchParams.append('category', category);

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        logout();
        return;
      }
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Error al cargar proyectos');
      setProjects(data);
    } catch (err) {
      setError('No se pudieron forjar los proyectos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvaluations() {
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${EVALUATIONS_API}/ranking`, { headers });

      if (response.status === 401) {
        logout();
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al cargar evaluaciones');
      setEvaluations(data);
    } catch (err) {
      setError('No se pudo leer el historial de evaluaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadProjectBadge(project) {
    setIsGeneratingPDF(true);
    const element = document.getElementById(`badge-${project.id}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Alta calidad
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [150, 200] // Tamaño personalizado para stand
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 150, 200);
      pdf.save(`Ficha_${project.title.replace(/\s+/g, '_')}.pdf`);

      setDialog({
        show: true,
        title: 'Ficha Generada',
        message: 'La ficha del stand ha sido descargada correctamente.',
        type: 'alert',
        fields: []
      });
    } catch (err) {
      console.error(err);
      setDialog({ show: true, title: 'Error', message: 'No se pudo generar el PDF.', type: 'alert', fields: [] });
    } finally {
      setIsGeneratingPDF(false);
      setSelectedProjectForQR(null);
    }
  }

  async function activateTemplate(template) {
    setLoading(true);
    try {
      const updatedTemplate = { ...template, isActive: true };
      const response = await fetch(`${TEMPLATES_API}/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTemplate)
      });

      if (response.ok) {
        fetchTemplates();
        setDialog({
          show: true,
          title: 'Núcleo Conmutado',
          message: `La versión ${template.version} ahora es la fuente de verdad activa.`,
          type: 'alert',
          fields: []
        });
      } else {
        throw new Error('No se pudo activar la plantilla');
      }
    } catch (err) {
      setDialog({ show: true, title: 'Error', message: err.message, type: 'alert', fields: [] });
    } finally {
      setLoading(false);
    }
  }

  function startNewTemplate() {
    // Si ya existe una plantilla activa, clonamos su estructura para no empezar de cero
    const baseTemplate = templates.find(t => t.isActive) || templates[0];

    const nextVersion = templates.length > 0
      ? `v${(parseFloat(templates[0].version.substring(1)) + 0.1).toFixed(1)}`
      : 'v1.0';

    setTemplateDraft({
      version: nextVersion,
      isActive: true,
      sections: baseTemplate ? JSON.parse(JSON.stringify(baseTemplate.sections)) : [
        {
          title: 'Criterio General',
          order: 0,
          questions: [
            { id: `q_${Date.now()}`, text: '¿Calidad de la propuesta?', type: 'scale_1_5' }
          ]
        }
      ]
    });
    setEditingProject(null); // Usamos esto para saber si es edición o creación de plantilla
    setIsDesigning(true);
  }

  function editTemplate(template) {
    setTemplateDraft(JSON.parse(JSON.stringify(template)));
    setIsDesigning(true);
  }

  async function deleteTemplate(id) {
    setDialog({
      show: true,
      title: '¿Archivar Plantilla?',
      message: 'Esta acción eliminará la plantilla del motor activo. El histórico de votos se mantendrá pero no se podrán recibir nuevos votos con esta versión.',
      type: 'confirm',
      fields: [],
      onConfirm: async () => {
        try {
          const response = await fetch(`${TEMPLATES_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            fetchTemplates();
          } else {
            throw new Error('Error al eliminar');
          }
        } catch (err) {
          setDialog({ show: true, title: 'Error', message: err.message, type: 'alert', fields: [] });
        }
      }
    });
  }

  async function downloadFeedbackPDF(project) {
    setLoading(true);
    try {
      const response = await fetch(`${EVALUATIONS_API}/${project.id}/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudo obtener el feedback');
      const data = await response.json();
      setFeedbackData(data);
      setSelectedProjectForFeedback(project);

      // Esperar a que el modal se renderice para capturarlo
      setTimeout(async () => {
        const element = document.getElementById(`feedback-report-${project.id}`);
        if (!element) return;

        setIsGeneratingPDF(true);
        const canvas = await html2canvas(element, {
          scale: 3, // Mayor calidad
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Feedback_${project.title.replace(/\s+/g, '_')}.pdf`);

        setIsGeneratingPDF(false);
        setFeedbackData(null);
        setSelectedProjectForFeedback(null);
      }, 500);
    } catch (err) {
      console.error(err);
      setDialog({ show: true, title: 'Error', message: 'No se pudo generar el reporte de feedback.', type: 'alert', fields: [] });
    } finally {
      setLoading(false);
    }
  }

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(TEMPLATES_API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        logout();
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al cargar plantillas');
      setTemplates(data);
    } catch (err) {
      setError('Fallo al recuperar plantillas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${AUDIT_API}?count=100`, { headers });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate() {
    if (!templateDraft.version) {
      setDialog({ show: true, title: 'Falta Versión', message: 'Debes asignar un código de versión (ej: v1.0).', type: 'alert', fields: [] });
      return;
    }

    setLoading(true);
    try {
      const isEditing = !!templateDraft.id;
      const url = isEditing ? `${TEMPLATES_API}/${templateDraft.id}` : TEMPLATES_API;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateDraft)
      });

      if (response.ok) {
        setIsDesigning(false);
        fetchTemplates();
        setDialog({
          show: true,
          title: isEditing ? 'Núcleo Refinado' : 'Núcleo Forjado',
          message: `La plantilla ${templateDraft.version} ha sido actualizada.`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData || 'Error al guardar plantilla');
      }
    } catch (err) {
      setDialog({ show: true, title: 'Error de Forja', message: err.message, type: 'alert', fields: [] });
    } finally {
      setLoading(false);
    }
  }

  function addSection() {
    setTemplateDraft(prev => ({
      ...prev,
      sections: [...prev.sections, { title: 'Nueva Sección', order: prev.sections.length, questions: [] }]
    }));
  }

  function addQuestion(sIdx) {
    const newSections = [...templateDraft.sections];
    newSections[sIdx].questions.push({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: 'Nueva Pregunta',
      type: 'scale_1_5'
    });
    setTemplateDraft(prev => ({ ...prev, sections: newSections }));
  }

  function updateQuestion(sIdx, qIdx, field, value) {
    const newSections = [...templateDraft.sections];
    newSections[sIdx].questions[qIdx][field] = value;
    setTemplateDraft(prev => ({ ...prev, sections: newSections }));
  }

  function removeQuestion(sIdx, qIdx) {
    const newSections = [...templateDraft.sections];
    newSections[sIdx].questions.splice(qIdx, 1);
    setTemplateDraft(prev => ({ ...prev, sections: newSections }));
  }

  async function fetchSettings() {
    setLoading(true);
    try {
      const response = await fetch(SETTINGS_API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        logout();
        return;
      }
      const data = await response.json();
      if (response.ok) setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- PX Forge Backend Actions ---

  async function saveSettings() {
    try {
      const response = await fetch(SETTINGS_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setDialog({
          show: true,
          title: 'Configuración Guardada',
          message: 'Los ajustes globales han sido actualizados.',
          type: 'alert',
          fields: []
        });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (err) {
      setDialog({ show: true, title: 'Error', message: err.message, type: 'alert', fields: [] });
    }
  }

  const exportRanking = () => {
    fetch(`${EVALUATIONS_API}/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ranking_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error('Error al exportar:', err));
  };

  async function cleanupStorage() {
    setDialog({
      show: true,
      title: 'Confirmar Limpieza',
      message: '¿Está seguro de querer eliminar archivos huérfanos? Esta acción no se puede deshacer y liberará espacio en el núcleo.',
      type: 'confirm',
      fields: [],
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await fetch(`${MEDIA_API}/cleanup`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setDialog({
            show: true,
            title: 'Limpieza Completada',
            message: data.message,
            type: 'alert',
            fields: []
          });
        } catch (err) {
          setDialog({
            show: true,
            title: 'Fallo Crítico',
            message: 'No se pudo completar la limpieza: ' + err.message,
            type: 'alert',
            fields: []
          });
        } finally {
          setLoading(false);
        }
      }
    });
  }

  function openModal(project = null) {
    if (project) {
      setEditingProject(project);
      setFormData({
        ...project,
        coverImageUrl: project.coverImageUrl || '',
        iconUrl: project.iconUrl || '',
        videoUrl: project.videoUrl || '',
        galleryUrls: project.galleryUrls || [],
        documents: project.documents || [],
        teamMembers: project.teamMembers?.join(', ') || '',
        objectives: project.objectives?.join('\n') || '',
        techStack: project.techStack?.join(', ') || ''
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: '',
        description: '',
        category: 'Software',
        teamMembers: '',
        coverImageUrl: '',
        iconUrl: '',
        videoUrl: '',
        galleryUrls: [],
        documents: [],
        status: 'Active',
        objectives: '',
        techStack: ''
      });
    }
    setIsModalOpen(true);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  }

  async function handleFileUpload(e, field, folder = 'projects') {
    const filesList = Array.from(e.target.files);
    if (!filesList || filesList.length === 0) return;

    // Validación de tamaño máximo (500MB)
    const MAX_SIZE = 500 * 1024 * 1024;
    const oversized = filesList.find(f => f.size > MAX_SIZE);
    if (oversized) {
      setDialog({ show: true, title: 'Archivo muy pesado', message: `El archivo ${oversized.name} supera el límite de 500MB.`, type: 'alert', fields: [] });
      return;
    }

    setUploadingField(field);

    const uploadFormData = new FormData();

    try {
      // Optimización: Comprimir si es imagen
      const processedFiles = await Promise.all(filesList.map(async (file) => {
        if (file.type.startsWith('image/') && field !== 'documents') {
          return await compressImage(file);
        }
        return file;
      }));

      processedFiles.forEach(file => {
        uploadFormData.append('file', file);
      });

      const response = await fetch(`${FILES_API}/upload?folder=${folder}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al subir archivo');
      }

      const data = await response.json();

      let newUrls = [];
      if (Array.isArray(data.urls)) {
        newUrls = data.urls;
      } else if (data.urls) {
        newUrls = [data.urls];
      } else if (data.url) {
        newUrls = [data.url];
      }

      if (field === 'galleryUrls') {
        setFormData(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, ...newUrls] }));
      } else if (field === 'documents') {
        const newDocs = newUrls.map((url, index) => ({
          title: filesList[index]?.name || 'Documento',
          url: url,
          type: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'doc'
        }));
        setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }));
      } else if (field) {
        setFormData(prev => ({ ...prev, [field]: newUrls[0] }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setDialog({
        show: true,
        title: 'Error de Subida',
        message: 'No se pudo completar la subida: ' + err.message,
        type: 'alert',
        fields: []
      });
    } finally {
      setUploadingField(null);
    }
  }

  function removeFile(field, index = null) {
    if (field === 'galleryUrls') {
      setFormData(prev => ({
        ...prev,
        galleryUrls: prev.galleryUrls.filter((_, i) => i !== index)
      }));
    } else if (field === 'documents') {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  }

  function addExternalLink() {
    setDialog({
      show: true,
      title: 'Añadir Recurso Externo',
      type: 'prompt',
      fields: [
        { name: 'title', label: 'Nombre del recurso', placeholder: 'Ej: Repositorio GitHub' },
        { name: 'url', label: 'Dirección URL', placeholder: 'https://...' }
      ],
      onConfirm: (data) => {
        if (data.title && data.url) {
          setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, { title: data.title, url: data.url, type: 'link' }]
          }));
        }
      }
    });
  };


  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...formData,
      teamMembers: Array.isArray(formData.teamMembers)
        ? formData.teamMembers
        : (formData.teamMembers || '').split(',').map(m => m.trim()).filter(m => m !== ''),
      objectives: Array.isArray(formData.objectives)
        ? formData.objectives
        : (formData.objectives || '').split('\n').map(o => o.trim()).filter(o => o !== ''),
      techStack: Array.isArray(formData.techStack)
        ? formData.techStack
        : (formData.techStack || '').split(',').map(t => t.trim()).filter(t => t !== '')
    };

    try {
      const method = editingProject ? 'PUT' : 'POST';
      const url = editingProject ? `${PROJECTS_API}/${editingProject.id}` : PROJECTS_API;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar proyecto');
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setDialog({
      show: true,
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar este proyecto de la forja? Esta acción no se puede deshacer.',
      type: 'confirm',
      fields: [],
      onConfirm: async () => {
        try {
          const response = await fetch(`${PROJECTS_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar');
          }
          fetchProjects();
        } catch (err) {
          setDialog({
            show: true,
            title: 'Error',
            message: err.message,
            type: 'alert',
            fields: []
          });
        }
      }
    });
  }

  function toggleTheme() {
    setIsDarkMode(!isDarkMode);
  }

  function getFileIcon(url) {
    const ext = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon size={20} />;
    if (['mp4', 'mov', 'avi'].includes(ext)) return <Video size={20} />;
    return <FileCode size={20} />;
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setPreviewUrl(null);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (view === 'projects') {
      fetchProjects();
    } else if (view === 'dashboard') {
      fetchDashboardStats();
    } else if (view === 'evaluations') {
      fetchEvaluations();
    } else if (view === 'settings') {
      fetchSettings();
    } else if (view === 'templates') {
      fetchTemplates();
    } else if (view === 'audit') {
      fetchAuditLogs();
    }
  }, [view, category, token]);

  if (!user) return <LoginView />;



  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 0', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
          <img src="/logo.png" alt="PX Forge Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          {!isSidebarCollapsed && (
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              PX <span style={{ color: 'var(--primary)' }}>Forge</span>
            </h2>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            className={`btn ${view === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1rem 0' : '0.85rem 1.25rem' }}
            onClick={() => setView('dashboard')}
            title="Dashboard"
          >
            <BarChart3 size={isSidebarCollapsed ? 24 : 20} strokeWidth={isSidebarCollapsed ? 2.5 : 2} />
            {!isSidebarCollapsed && <span className="btn-text">Dashboard</span>}
          </button>
          <button
            className={`btn ${view === 'projects' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1rem 0' : '0.85rem 1.25rem' }}
            onClick={() => setView('projects')}
            title="Proyectos"
          >
            <FolderRoot size={isSidebarCollapsed ? 24 : 20} strokeWidth={isSidebarCollapsed ? 2.5 : 2} />
            {!isSidebarCollapsed && <span className="btn-text">Proyectos</span>}
          </button>
          <button
            className={`btn ${view === 'templates' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1rem 0' : '0.85rem 1.25rem' }}
            onClick={() => setView('templates')}
            title="Plantillas"
          >
            <Layout size={isSidebarCollapsed ? 24 : 20} strokeWidth={isSidebarCollapsed ? 2.5 : 2} />
            {!isSidebarCollapsed && <span className="btn-text">Plantillas</span>}
          </button>
          <button
            className={`btn ${view === 'evaluations' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1rem 0' : '0.85rem 1.25rem' }}
            onClick={() => setView('evaluations')}
            title="Evaluaciones"
          >
            <Star size={isSidebarCollapsed ? 24 : 20} strokeWidth={isSidebarCollapsed ? 2.5 : 2} />
            {!isSidebarCollapsed && <span className="btn-text">Evaluaciones</span>}
          </button>
          <button
            className={`btn ${view === 'audit' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1rem 0' : '0.85rem 1.25rem' }}
            onClick={() => setView('audit')}
            title="Bitácora"
          >
            <History size={isSidebarCollapsed ? 24 : 20} strokeWidth={isSidebarCollapsed ? 2.5 : 2} />
            {!isSidebarCollapsed && <span className="btn-text">Bitácora</span>}
          </button>
          <button
            className={`btn ${view === 'settings' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1rem 0' : '0.85rem 1.25rem' }}
            onClick={() => setView('settings')}
            title="Configuración"
          >
            <Settings size={isSidebarCollapsed ? 24 : 20} strokeWidth={isSidebarCollapsed ? 2.5 : 2} />
            {!isSidebarCollapsed && <span className="btn-text">Configuración</span>}
          </button>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            padding: '1rem',
            background: 'var(--container-tint)',
            borderRadius: '12px',
            marginBottom: '0.5rem',
            display: isSidebarCollapsed ? 'none' : 'block'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SESIÓN ACTIVA</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem' }} onClick={logout} title="Cerrar Sesión">
            <LogOut size={isSidebarCollapsed ? 24 : 18} />
            {!isSidebarCollapsed && <span className="btn-text">Cerrar Sesión</span>}
          </button>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem' }} onClick={toggleTheme} title="Cambiar Tema">
            {isDarkMode ? <Sun size={isSidebarCollapsed ? 24 : 18} /> : <Moon size={isSidebarCollapsed ? 24 : 18} />}
            {!isSidebarCollapsed && <span className="btn-text">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>
          <button
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isSidebarCollapsed ? <Plus size={24} strokeWidth={2.5} style={{ transform: 'rotate(45deg)' }} /> : <X size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="premium-header">
          <h1 className="header-title" key={`title-${view}`}>
            {view === 'projects' ? 'Repositorio de Forja' :
              view === 'evaluations' ? 'Control de Calidad' :
                view === 'settings' ? 'Configuración del Núcleo' :
                  view === 'templates' ? 'Diseñador de Plantillas' :
                    view === 'audit' ? 'Bitácora de Acciones' : 'Forjando el Futuro'}
          </h1>
          <p className="header-subtitle" key={`sub-${view}`}>
            {view === 'projects' ? 'Administra, refina y despliega proyectos con precisión industrial.' :
              view === 'evaluations' ? 'Inspección métrica y ranking de excelencia.' :
                view === 'templates' ? 'Define la estructura y métricas de evaluación.' :
                  view === 'audit' ? 'Historial de integridad y cambios administrativos.' :
                    view === 'settings' ? 'Parámetros globales del sistema.' : 'Bienvenido al núcleo de control de PX Forge.'}
          </p>
        </header>

        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '1rem' }}>
          {view === 'evaluations' && (
            <button className="btn btn-primary" onClick={exportRanking}>
              <FileSpreadsheet size={18} /> Exportar Ranking
            </button>
          )}
        </div>

        {view === 'dashboard' && (
          <div className="dashboard-view">
            {/* KPI Grid */}
            <div className="stats-grid">
              <div className="kpi-card">
                <div className="kpi-icon"><FolderRoot size={24} /></div>
                <div>
                  <div className="kpi-value">{dashboardStats?.totalProjects || 0}</div>
                  <div className="kpi-label">Proyectos Totales</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon"><Vote size={24} /></div>
                <div>
                  <div className="kpi-value">{dashboardStats?.totalEvaluations || 0}</div>
                  <div className="kpi-label">Votos Recibidos</div>
                </div>
              </div>
              <div className="kpi-card" style={{ borderLeft: '4px solid gold' }}>
                <div className="kpi-icon" style={{ color: 'gold' }}><Star size={24} /></div>
                <div>
                  <div className="kpi-value">{dashboardStats?.globalAverageScore?.toFixed(1) || '0.0'}</div>
                  <div className="kpi-label">Promedio Global</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ color: dashboardStats?.isVotingEnabled ? 'var(--primary)' : 'var(--error)' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
                    {dashboardStats?.isVotingEnabled ? 'VOTACIÓN ABIERTA' : 'VOTACIÓN CERRADA'}
                  </div>
                  <div className="kpi-label">Estado del Motor</div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="dashboard-grid">
              <div className="card" style={{ minHeight: 400 }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={20} color="gold" /> Ranking de Forja (Top 5)
                </h3>
                <div style={{ width: '100%', height: 300, minHeight: 300, minWidth: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardStats?.topProjects || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                      <XAxis type="number" domain={[0, 5]} hide />
                      <YAxis dataKey="title" type="category" width={120} style={{ fontSize: '0.8rem', fontWeight: 600 }} />
                      <ReTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Bar name="Promedio" dataKey="averageScore" radius={[0, 4, 4, 0]} barSize={20}>
                        {(dashboardStats?.topProjects || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.status === 'Inactive' ? 'var(--text-muted)' : 'var(--primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Distribución</h3>
                <div style={{ width: '100%', height: 200, minHeight: 200, minWidth: 200 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboardStats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="category"
                        name="Proyectos"
                      >
                        {dashboardStats?.categoryDistribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {dashboardStats?.categoryDistribution?.map((cat, idx) => (
                    <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        {cat.category}
                      </span>
                      <span style={{ fontWeight: 700 }}>{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} /> Actividad Reciente en la Forja
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dashboardStats?.recentEvaluations?.length > 0 ? (
                  dashboardStats.recentEvaluations.map((ev, i) => (
                    <div key={i} style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 12, border: '1px solid var(--border)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{ev.projectTitle}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', margin: 0, opacity: 0.8 }}>"{ev.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Aún no hay actividad registrada.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'audit' && (
          <div className="audit-view animate-fade-in">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--container-tint)', textAlign: 'left' }}>
                      <th style={{ padding: '1.25rem' }}>HORA / FECHA</th>
                      <th style={{ padding: '1.25rem' }}>USUARIO</th>
                      <th style={{ padding: '1.25rem' }}>ACCIÓN</th>
                      <th style={{ padding: '1.25rem' }}>DETALLES</th>
                      <th style={{ padding: '1.25rem' }}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '1.25rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700 }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                            <span style={{ fontWeight: 600 }}>{log.userName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span className="status-badge" style={{
                            background: log.action.includes('Eliminar') ? 'rgba(239, 68, 68, 0.1)' :
                              log.action.includes('Crear') ? 'rgba(27, 94, 32, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                            color: log.action.includes('Eliminar') ? '#ef4444' :
                              log.action.includes('Crear') ? 'var(--primary)' : '#2196f3',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}>
                            {log.action.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', maxWidth: '300px' }}>
                          <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{log.details}</div>
                        </td>
                        <td style={{ padding: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <code>{log.ipAddress || '---'}</code>
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                          <p>No hay registros en la bitácora aún.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'projects' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Listado de Proyectos</h3>
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={18} /> Nuevo Proyecto
              </button>
            </div>

            <div className="search-container">
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar proyectos por nombre..."
                  style={{ width: '100%', paddingLeft: '2.85rem' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchProjects()}
                />
              </div>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-outline" onClick={() => fetchProjects()}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: 'var(--error)', color: 'white', padding: '1rem', margin: '1rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} /> {error}
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                    <th style={{ padding: '1.25rem' }}>Proyecto</th>
                    <th style={{ padding: '1.25rem' }}>Categoría</th>
                    <th style={{ padding: '1.25rem' }}>Multimedia</th>
                    <th style={{ padding: '1.25rem' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </td></tr>
                  ) : (projects?.length > 0) ? (
                    projects.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', opacity: p.status === 'Inactive' ? 0.6 : 1, filter: p.status === 'Inactive' ? 'grayscale(0.8)' : 'none' }}>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {p.iconUrl ? (
                              <img src={getMediaUrl(p.iconUrl)} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: 'var(--container-tint)' }} />
                            ) : p.coverImageUrl ? (
                              <img src={getMediaUrl(p.coverImageUrl)} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--container-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FolderRoot size={20} style={{ opacity: 0.3 }} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700 }}>{p.title}</div>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.teamMembers?.join(', ') || 'Sin miembros'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span className="status-badge" style={{ backgroundColor: 'var(--container-tint)', color: 'var(--primary)' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.85rem', color: 'var(--text-muted)' }}>
                            {p.coverImageUrl && <ImageIcon size={18} strokeWidth={2.5} />}
                            {p.videoUrl && <Video size={18} strokeWidth={2.5} />}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.5rem', color: 'var(--primary)' }}
                              onClick={() => setSelectedProjectForQR(p)}
                              title="Generar Ficha QR"
                            >
                              <QrCode size={16} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => openModal(p)}>
                              <Edit3 size={16} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--error)' }} onClick={() => handleDelete(p.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <FolderRoot size={48} strokeWidth={1} style={{ marginBottom: '1rem' }} />
                      <p>No se encontraron proyectos en la forja.</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Evaluations View */}
        {view === 'evaluations' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Trophy size={24} style={{ color: 'gold' }} />
                Ranking de Evaluaciones
              </h3>
              <button className="btn btn-outline" onClick={() => fetchEvaluations()}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: 'var(--error)', color: 'white', padding: '1rem', margin: '1rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} /> {error}
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                    <th style={{ padding: '1.25rem' }}>Posición</th>
                    <th style={{ padding: '1.25rem' }}>Proyecto</th>
                    <th style={{ padding: '1.25rem' }}>Puntuación</th>
                    <th style={{ padding: '1.25rem' }}>Evaluaciones</th>
                    <th style={{ padding: '1.25rem' }}>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </td></tr>
                  ) : (evaluations?.filter(ev => ev.status !== 'Inactive')?.length > 0) ? (
                    evaluations.filter(ev => ev.status !== 'Inactive').map((ev, index) => (
                      <tr key={ev.id || index} style={{ borderBottom: '1px solid var(--border)', opacity: ev.status === 'Inactive' ? 0.6 : 1 }}>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {index === 0 && <Trophy size={24} style={{ color: 'gold' }} />}
                            {index === 1 && <Trophy size={22} style={{ color: 'silver' }} />}
                            {index === 2 && <Trophy size={20} style={{ color: '#CD7F32' }} />}
                            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>#{index + 1}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {ev.title || 'Sin título'}
                            {ev.status === 'Inactive' && <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--error)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: 4 }}>ARCHIVADO</span>}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Star size={18} style={{ color: ev.status === 'Inactive' ? 'var(--text-muted)' : 'gold', fill: ev.status === 'Inactive' ? 'var(--text-muted)' : 'gold' }} />
                            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: ev.status === 'Inactive' ? 'var(--text-muted)' : 'var(--primary)' }}>
                              {ev.averageScore?.toFixed(2) || '0.00'}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ 5.0</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 600 }}>{ev.voteCount || 0}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="status-badge" style={{ backgroundColor: 'var(--container-tint)', color: 'var(--primary)', flex: 1 }}>
                              {ev.category || 'N/A'}
                            </span>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.4rem', color: 'var(--primary)' }}
                              onClick={() => downloadFeedbackPDF(ev)}
                              title="Generar Reporte de Feedback"
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <Star size={48} strokeWidth={1} style={{ marginBottom: '1rem' }} />
                      <p>No hay evaluaciones registradas aún.</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="card">
            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Settings size={28} /> Configuración Global
            </h3>

            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <label>Nombre del Evento</label>
              <input
                type="text"
                className="form-input"
                value={settings.eventName}
                onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
                placeholder="Ej: ExpoIngeniería 2026"
                style={{ fontSize: '1.1rem', padding: '1rem' }}
              />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Este nombre aparecerá en la aplicación de votación y pantallas públicas.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div className="card" style={{ backgroundColor: 'var(--background)', border: settings.isVotingEnabled ? '1px solid var(--primary)' : '1px solid var(--border)', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem' }}>
                    <Vote size={24} style={{ color: settings.isVotingEnabled ? 'var(--primary)' : 'var(--text-muted)' }} />
                    Sistema de Votación
                  </h4>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.isVotingEnabled}
                      onChange={(e) => setSettings({ ...settings, isVotingEnabled: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Controla la entrada de datos. Al activar, se permiten nuevos votos desde los dispositivos móviles conectados.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: settings.isVotingEnabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: settings.isVotingEnabled ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em'
                }}>
                  <Activity size={16} />
                  {settings.isVotingEnabled ? 'SISTEMA ACTIVO' : 'SISTEMA INACTIVO'}
                </div>
              </div>

              <div className="card" style={{ backgroundColor: 'var(--background)', border: settings.isRankingPublic ? '1px solid gold' : '1px solid var(--border)', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem' }}>
                    <Trophy size={24} style={{ color: settings.isRankingPublic ? 'gold' : 'var(--text-muted)' }} />
                    Ranking Público
                  </h4>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.isRankingPublic}
                      onChange={(e) => setSettings({ ...settings, isRankingPublic: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Controla la visualización pública. Al activar, el ranking de ganadores se muestra en las pantallas.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: settings.isRankingPublic ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: settings.isRankingPublic ? 'gold' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em'
                }}>
                  <Eye size={16} />
                  {settings.isRankingPublic ? 'VISIBILIDAD PÚBLICA' : 'VISIBILIDAD OCULTA'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <button className="btn btn-primary" onClick={saveSettings} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                <CheckCircle2 size={22} /> Guardar Configuración
              </button>
            </div>

            <div className="card" style={{ marginTop: '2rem', border: '1px solid #ef444433', backgroundColor: '#ef444405' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#ef4444' }}>Zona de Peligro: Mantenimiento</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>Elimina archivos que no están vinculados a ningún proyecto para liberar espacio.</p>
                </div>
                <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={cleanupStorage}>
                  <Trash2 size={18} /> Ejecutar Limpieza
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates View */}
        {view === 'templates' && (
          <div className="card" style={{ border: isDesigning ? 'none' : '1px solid var(--border)', background: isDesigning ? 'transparent' : 'var(--surface)', padding: isDesigning ? 0 : '1.5rem' }}>
            {!isDesigning ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Layers size={24} /> Historial de Plantillas</h3>
                  <button className="btn btn-primary" onClick={startNewTemplate}>
                    <Plus size={18} /> Nueva Versión
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', opacity: 0.7 }}>
                      <th style={{ padding: '1rem' }}>Versión</th>
                      <th style={{ padding: '1rem' }}>Estado</th>
                      <th style={{ padding: '1rem' }}>Secciones</th>
                      <th style={{ padding: '1rem' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1.25rem' }}><b style={{ fontSize: '1.2rem' }}>{t.version}</b></td>
                        <td style={{ padding: '1.25rem' }}>
                          <span className="status-badge" style={{ backgroundColor: t.isActive ? 'rgba(34, 197, 94, 0.1)' : 'var(--container-tint)', color: t.isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {t.isActive ? 'ACTIVA' : 'ARCHIVADA'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>{t.sections?.length || 0} secciones</td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {!t.isActive && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => activateTemplate(t)}
                                title="Activar para el evento"
                              >
                                <ShieldCheck size={14} /> Activar
                              </button>
                            )}
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => editTemplate(t)} title="Editar Estructura">
                              <Edit3 size={16} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--error)' }} onClick={() => deleteTemplate(t.id)} title="Archivar">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {templates.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                          No hay plantillas forjadas todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="designer-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                {(() => {
                  const hasEvaluations = evaluations.some(e => e.templateVersion === templateDraft.version);
                  return (
                    <>
                      {/* Editor Column */}
                      <div className="designer-editor">
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setIsDesigning(false)}>
                              <ArrowLeft size={18} />
                            </button>
                            <div>
                              <h3 style={{ margin: 0 }}>Diseñador de Forja</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Construyendo {templateDraft.version}</span>
                                {hasEvaluations && (
                                  <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    background: 'rgba(255, 171, 0, 0.1)',
                                    color: '#FFAB00',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    border: '1px solid rgba(255, 171, 0, 0.1)'
                                  }}>
                                    <ShieldCheck size={10} /> INTEGRIDAD BLOQUEADA
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: 80, textAlign: 'center', fontWeight: 800 }}
                              value={templateDraft.version}
                              onChange={(e) => setTemplateDraft({ ...templateDraft, version: e.target.value })}
                              placeholder="v1.0"
                            />
                            <button className="btn btn-primary" onClick={saveTemplate} disabled={loading}>
                              <Save size={18} /> Forjar Plantilla
                            </button>
                          </div>
                        </header>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {templateDraft.sections.map((section, sIdx) => (
                            <div key={sIdx} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', fontWeight: 800, padding: 0, color: 'var(--primary)' }}
                                  value={section.title}
                                  onChange={(e) => {
                                    const newSections = [...templateDraft.sections];
                                    newSections[sIdx].title = e.target.value;
                                    setTemplateDraft({ ...templateDraft, sections: newSections });
                                  }}
                                />
                                {!hasEvaluations && (
                                  <button className="btn btn-outline" style={{ padding: '0.3rem', color: 'var(--error)' }} onClick={() => {
                                    const newSections = [...templateDraft.sections];
                                    newSections.splice(sIdx, 1);
                                    setTemplateDraft({ ...templateDraft, sections: newSections });
                                  }}>
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {section.questions.map((q, qIdx) => (
                                  <div key={q.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--container-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                                      {qIdx + 1}
                                    </div>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ flex: 1 }}
                                      value={q.text}
                                      onChange={(e) => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                                    />
                                    <select
                                      className="form-select"
                                      style={{ width: 120, fontSize: '0.8rem', padding: '0.4rem' }}
                                      value={q.type}
                                      onChange={(e) => updateQuestion(sIdx, qIdx, 'type', e.target.value)}
                                      disabled={hasEvaluations}
                                    >
                                      <option value="scale_1_5">Escala 1-5</option>
                                      <option value="yes_no">Si / No</option>
                                    </select>
                                    {!hasEvaluations && (
                                      <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem', color: 'var(--error)', border: 'none' }}
                                        onClick={() => removeQuestion(sIdx, qIdx)}
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {!hasEvaluations && (
                                  <button className="btn btn-outline" style={{ borderStyle: 'dashed', marginTop: '0.5rem', justifyContent: 'center' }} onClick={() => addQuestion(sIdx)}>
                                    <Plus size={14} /> Añadir Criterio
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button className="btn btn-outline" style={{ padding: '1.5rem', borderStyle: 'dashed', border: '2px dashed var(--border)', justifyContent: 'center' }} onClick={addSection}>
                            <Layout size={20} /> Añadir Nueva Sección
                          </button>
                        </div>
                      </div>

                      {/* Mobile Twin Column */}
                      <div className="designer-preview" style={{ position: 'sticky', top: '1rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          <Smartphone size={20} />
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', opacity: 0.7 }}>MOBILE TWIN (PREVIEW)</span>
                        </div>
                        <div className="phone-frame" style={{
                          width: '320px',
                          height: '640px',
                          background: '#0a0a0a',
                          borderRadius: '40px',
                          margin: '0 auto',
                          padding: '12px',
                          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                          border: '8px solid #222'
                        }}>
                          <div className="phone-screen" style={{
                            width: '100%',
                            height: '100%',
                            background: isDarkMode ? '#101411' : '#F5F9F6',
                            borderRadius: '24px',
                            overflowY: 'auto',
                            padding: '1.5rem'
                          }}>
                            <div style={{ height: 20, width: 60, background: '#333', borderRadius: 10, margin: '0 auto 1.5rem', opacity: 0.3 }}></div>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Evaluar Proyecto</h4>

                            {templateDraft.sections.map((s, i) => (
                              <div key={i} style={{ marginBottom: '2.5rem' }}>
                                <h5 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem' }}>{s.title}</h5>
                                {s.questions.map((q, qi) => (
                                  <div key={qi} style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: 600 }}>{q.text}</p>

                                    {q.type === 'scale_1_5' ? (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                          <div key={n} style={{
                                            flex: 1,
                                            height: 36,
                                            borderRadius: 8,
                                            border: '1.5px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 800,
                                            color: 'var(--text-muted)'
                                          }}>
                                            {n}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1, height: 36, borderRadius: 8, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>SI</div>
                                        <div style={{ flex: 1, height: 36, borderRadius: 8, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>NO</div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}

                            <div style={{ padding: '1.5rem', background: 'var(--container-tint)', borderRadius: 16, marginTop: '2rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>BOTÓN DE ENVÍO</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* PX Forge Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ border: '2px solid var(--primary)' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {editingProject ? <Edit3 size={24} /> : <Plus size={24} />}
                {editingProject ? 'Refinar Proyecto' : 'Forjar Nuevo Proyecto'}
              </h2>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Título del Proyecto</label>
                  <input type="text" name="title" className="form-input" required value={formData.title} onChange={handleInputChange} placeholder="Nombre de la obra..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoría</label>
                    <select name="category" className="form-select" value={formData.category} onChange={handleInputChange}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select name="status" className="form-select" value={formData.status} onChange={handleInputChange}>
                      <option value="Active">Activo</option>
                      <option value="Inactive">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Equipo (Miembros)</label>
                  <input type="text" name="teamMembers" className="form-input" value={formData.teamMembers} onChange={handleInputChange} placeholder="Juan, Maria, Pedro..." />
                </div>

                <div className="form-group">
                  <label>Descripción del Proyecto</label>
                  <textarea name="description" className="form-input" rows="4" required value={formData.description} onChange={handleInputChange} placeholder="Detalles de la forja..."></textarea>
                </div>

                <div className="form-group">
                  <label>Objetivos (Uno por línea)</label>
                  <textarea name="objectives" className="form-input" rows="3" value={formData.objectives} onChange={handleInputChange} placeholder="Mejorar la eficiencia..."></textarea>
                </div>

                <div className="form-group">
                  <label>Stack Tecnológico (Separado por comas)</label>
                  <input type="text" name="techStack" className="form-input" value={formData.techStack} onChange={handleInputChange} placeholder="React, Node.js, Python..." />
                </div>

                <div className="form-row" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                      <span><ImageIcon size={14} /> Logo del Proyecto</span>
                      {formData.iconUrl && <button type="button" onClick={() => removeFile('iconUrl')} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label className={`btn btn-outline ${uploadingField === 'iconUrl' ? 'disabled' : ''}`} style={{ flex: 1, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {uploadingField === 'iconUrl' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                        {formData.iconUrl ? 'Reemplazar' : 'Subir'}
                        <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'iconUrl')} disabled={uploadingField === 'iconUrl'} />
                      </label>
                    </div>
                    {formData.iconUrl && (
                      <div className="preview-mini-clickable" onClick={() => setPreviewUrl(getMediaUrl(formData.iconUrl))}>
                        <img src={getMediaUrl(formData.iconUrl)} style={{ width: '100%', height: 120, objectFit: 'contain', borderRadius: 8, marginTop: 8, backgroundColor: 'var(--container-tint)' }} loading="lazy" />
                        <div className="preview-overlay-mini"><ExternalLink size={16} /></div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                      <span><ImageIcon size={14} /> Imagen de Portada (Banner)</span>
                      {formData.coverImageUrl && <button type="button" onClick={() => removeFile('coverImageUrl')} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label className={`btn btn-outline ${uploadingField === 'coverImageUrl' ? 'disabled' : ''}`} style={{ flex: 1, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {uploadingField === 'coverImageUrl' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                        {formData.coverImageUrl ? 'Reemplazar' : 'Subir'}
                        <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'coverImageUrl')} disabled={uploadingField === 'coverImageUrl'} />
                      </label>
                    </div>
                    {formData.coverImageUrl && (
                      <div className="preview-mini-clickable" onClick={() => setPreviewUrl(getMediaUrl(formData.coverImageUrl))}>
                        <img src={getMediaUrl(formData.coverImageUrl)} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} loading="lazy" />
                        <div className="preview-overlay-mini"><ExternalLink size={16} /></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                      <span><Video size={14} /> Demo Video (Opcional)</span>
                      {formData.videoUrl && <button type="button" onClick={() => removeFile('videoUrl')} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label className={`btn btn-outline ${uploadingField === 'videoUrl' ? 'disabled' : ''}`} style={{ flex: 1, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {uploadingField === 'videoUrl' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                        {formData.videoUrl ? 'Reemplazar' : 'Subir'}
                        <input type="file" hidden accept="video/*" onChange={(e) => handleFileUpload(e, 'videoUrl')} disabled={uploadingField === 'videoUrl'} />
                      </label>
                    </div>
                    {formData.videoUrl && (
                      <div className="video-container" style={{ marginTop: 8, height: 120 }}>
                        <video src={getMediaUrl(formData.videoUrl)} controls />
                      </div>
                    )}
                  </div>
                </div>

                {/* Secciones finales dentro del body */}
                <div className="form-row">
                  {/* Galería de Imágenes */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                      <span><ImageIcon size={14} /> Galería de Imágenes</span>
                      <label className={`btn btn-outline ${uploadingField === 'galleryUrls' ? 'disabled' : ''}`} style={{ fontSize: '0.7rem', cursor: 'pointer', padding: '0.2rem 0.5rem' }}>
                        {uploadingField === 'galleryUrls' ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Añadir
                        <input type="file" hidden accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'galleryUrls')} disabled={uploadingField === 'galleryUrls'} />
                      </label>
                    </label>

                    {formData.galleryUrls?.length === 0 && !uploadingField && (
                      <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: 12 }}>
                        <ImageIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                        <p className="text-muted">No hay imágenes en la galería.</p>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      {formData.galleryUrls?.map((url, i) => (
                        <div key={i} className="gallery-preview-item">
                          <img src={getMediaUrl(url)} onClick={() => setPreviewUrl(getMediaUrl(url))} loading="lazy" />
                          <div className="preview-overlay-mini" onClick={() => setPreviewUrl(getMediaUrl(url))}>
                            <ExternalLink size={14} />
                          </div>
                          <button type="button" onClick={() => removeFile('galleryUrls', i)} className="remove-btn-mini">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      {uploadingField === 'galleryUrls' && (
                        <div style={{ gridColumn: '1 / -1', padding: '0.5rem', textAlign: 'center' }}>
                          <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documentos y Enlaces */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                      <span><HardDrive size={14} /> Enlaces y Docs</span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button type="button" className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={addExternalLink}>
                          <ExternalLink size={12} /> Link
                        </button>
                        <label className={`btn btn-outline ${uploadingField === 'documents' ? 'disabled' : ''}`} style={{ fontSize: '0.7rem', cursor: 'pointer', padding: '0.2rem 0.5rem' }}>
                          {uploadingField === 'documents' ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                          Doc
                          <input type="file" hidden accept=".pdf,.doc,.docx,.zip" multiple onChange={(e) => handleFileUpload(e, 'documents')} disabled={uploadingField === 'documents'} />
                        </label>
                      </div>
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {uploadingField === 'documents' && (
                        <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        </div>
                      )}
                      {formData.documents?.length === 0 && (
                        <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
                          <p className="text-muted">No se han añadido recursos.</p>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {formData.documents?.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                              <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                                {doc.type === 'link' ? <ExternalLink size={16} /> : <FileCode size={16} />}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div title={doc.url} style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeFile('documents', i)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ backgroundColor: 'var(--surface)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Descartar</button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Refinar Cambios' : 'Forjar Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Preview Modal */}
      {previewUrl && (
        <div className="modal-overlay" style={{ zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.95)' }} onClick={() => setPreviewUrl(null)}>
          <button className="btn btn-outline" style={{ position: 'absolute', top: '2rem', right: '2rem', borderRadius: '50%', padding: '1rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            <X size={32} />
          </button>
          <div className="preview-container-full" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}

      {/* Modal de Ficha QR */}
      {selectedProjectForQR && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <QrCode style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>Ficha de Stand</h3>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} onClick={() => setSelectedProjectForQR(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f9fa' }}>
              {/* Contenedor del Diseño del Badge (Lo que se captura) */}
              <div id={`badge-${selectedProjectForQR.id}`} style={{
                width: '150mm',
                height: '200mm',
                background: '#ffffff',
                color: '#000000',
                padding: '15mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                position: 'relative',
                border: '1px solid #eee'
              }}>
                <div style={{ width: '100%', borderBottom: '3px solid #1B5E20', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#1B5E20' }}>{settings.eventName || 'FERIA DE PROYECTOS'}</h4>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                  <p style={{ margin: 0, fontSize: '14pt', fontWeight: 600, color: '#666' }}>ESTÁS EN EL STAND DE:</p>
                  <h1 style={{ margin: '15px 0', fontSize: '28pt', fontWeight: 900, lineHeight: 1.1 }}>{selectedProjectForQR.title}</h1>
                  <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '5px 15px', borderRadius: '20px', fontSize: '12pt', fontWeight: 700, alignSelf: 'center' }}>
                    {selectedProjectForQR.category}
                  </span>

                  <div style={{ margin: '40px 0', padding: '20px', border: '2px dashed #ddd', borderRadius: '15px' }}>
                    <QRCodeCanvas
                      value={selectedProjectForQR.id}
                      size={250}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <p style={{ margin: 0, fontSize: '16pt', fontWeight: 800 }}>ESCANEAME PARA EVALUAR</p>
                  <p style={{ margin: '10px 0 0', fontSize: '11pt', color: '#666' }}>Abre la App Kiosko y usa la cámara para calificar este proyecto.</p>
                </div>

                <div style={{ marginTop: '20px', fontSize: '10pt', color: '#aaa' }}>
                  PX FORGE • NÚCLEO EVALUADOR • 2026
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1.5rem', background: '#fff' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedProjectForQR(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, gap: '0.75rem' }}
                onClick={() => downloadProjectBadge(selectedProjectForQR)}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? <RefreshCw className="spin" size={18} /> : <Download size={18} />}
                {isGeneratingPDF ? 'Generando...' : 'Descargar Ficha PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Dialog (Alert/Confirm/Prompt) */}
      {dialog.show && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: 500, border: '2px solid var(--primary)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {dialog.type === 'alert' && <AlertCircle size={24} style={{ color: 'var(--primary)' }} />}
                {dialog.type === 'confirm' && <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />}
                {dialog.type === 'prompt' && <Plus size={24} style={{ color: 'var(--primary)' }} />}
                {dialog.title}
              </h3>
            </div>
            <div className="modal-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: (dialog.fields?.length > 0) ? '1.5rem' : '0' }}>{dialog.message}</p>

              {dialog.fields?.map(field => (
                <div key={field.name} className="form-group" style={{ textAlign: 'left', marginTop: '1rem' }}>
                  <label>{field.label}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={field.placeholder}
                    value={dialogData[field.name] || ''}
                    onChange={(e) => setDialogData({ ...dialogData, [field.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer" style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', gap: '1rem' }}>
              {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setDialog(prev => ({ ...prev, show: false }));
                    setDialogData({});
                    if (dialog.onCancel) dialog.onCancel();
                  }}
                >
                  <X size={18} /> Cancelar Operación
                </button>
              )}
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}
                onClick={() => {
                  if (dialog.onConfirm) dialog.onConfirm(dialogData);
                  setDialog(prev => ({ ...prev, show: false }));
                  setDialogData({});
                }}
              >
                {dialog.type === 'alert' ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                <span style={{ fontWeight: 800 }}>{dialog.type === 'alert' ? 'ENTENDIDO' : 'CONFIRMAR ACCIÓN'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Feedback Report (Invisible hasta que se dispara) */}
      {selectedProjectForFeedback && feedbackData && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 5000 }}>
          <div className="modal-content" style={{ maxWidth: 800, padding: 0, overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileBarChart style={{ color: 'var(--primary)' }} /> Reporte de Retroalimentación
              </h3>
              <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} onClick={() => setSelectedProjectForFeedback(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '70vh', padding: '1rem', background: '#f0f2f0' }}>
              {/* Contenedor del PDF */}
              <div id={`feedback-report-${selectedProjectForFeedback.id}`} style={{
                width: '210mm',
                minHeight: '297mm',
                background: '#ffffff',
                color: '#1a1a1a',
                padding: '25mm',
                margin: '0 auto',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                boxSizing: 'border-box'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1B5E20', paddingBottom: '20px', marginBottom: '40px' }}>
                  <div>
                    <h4 style={{ color: '#1B5E20', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10pt', fontWeight: 800 }}>{settings.eventName || 'FERIA DE PROYECTOS'}</h4>
                    <h1 style={{ margin: '10px 0 0', fontSize: '28pt', fontWeight: 900, color: '#000' }}>REPORTE DE FEEDBACK</h1>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10pt', color: '#888', fontWeight: 600 }}>FECHA DE EMISIÓN</div>
                    <div style={{ fontWeight: 800, fontSize: '12pt', color: '#1a1a1a' }}>{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Proyecto Info Card */}
                <div style={{ marginBottom: '40px', background: '#f9f9f9', padding: '30px', borderRadius: '15px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '9pt', color: '#666', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>PROYECTO EVALUADO</div>
                  <h2 style={{ margin: 0, fontSize: '26pt', fontWeight: 900, color: '#1B5E20' }}>{feedbackData.title}</h2>
                  <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                    <div>
                      <div style={{ fontSize: '8pt', color: '#888', fontWeight: 600, marginBottom: '4px' }}>CATEGORÍA</div>
                      <div style={{ fontWeight: 800, fontSize: '12pt' }}>{feedbackData.category}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8pt', color: '#888', fontWeight: 600, marginBottom: '4px' }}>REGISTROS</div>
                      <div style={{ fontWeight: 800, fontSize: '12pt' }}>{feedbackData.stats.voteCount} Jueces</div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '50px' }}>
                  <div style={{ background: '#1B5E20', color: '#ffffff', padding: '35px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11pt', opacity: 0.9, marginBottom: '15px', fontWeight: 700 }}>GLOBAL SCORE</div>
                    <div style={{ fontSize: '56pt', fontWeight: 900, lineHeight: 1 }}>
                      {feedbackData.stats.averageScore.toFixed(1)}
                      <span style={{ fontSize: '20pt', opacity: 0.7 }}> / 5.0</span>
                    </div>
                    <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={28} fill={s <= Math.round(feedbackData.stats.averageScore) ? "#ffffff" : "none"} stroke="#ffffff" strokeWidth={2.5} />
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 15px', fontSize: '18pt', fontWeight: 900, color: '#1a1a1a' }}>Resumen de Forja</h3>
                    <p style={{ margin: 0, fontSize: '11pt', color: '#555', lineHeight: 1.8 }}>
                      Este valor representa el promedio ponderado de todos los criterios evaluados. Refleja la consistencia técnica y el impacto de la propuesta según el jurado.
                    </p>
                  </div>
                </div>

                {/* Comments Section */}
                <div style={{ marginBottom: '60px' }}>
                  <h3 style={{ fontSize: '18pt', fontWeight: 900, marginBottom: '25px', color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '15px' }}>
                    <MessageSquare size={24} /> Observaciones del Jurado
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {feedbackData.comments.map((c, idx) => (
                      <div key={idx} style={{ padding: '25px', background: '#fafafa', borderLeft: '6px solid #1B5E20', borderRadius: '8px', borderTop: '1px solid #eee', borderRight: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                        <p style={{ margin: 0, fontSize: '12pt', fontStyle: 'italic', color: '#333', lineHeight: 1.6 }}>"{c.comment}"</p>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                          <div style={{ fontSize: '9pt', color: '#999', fontWeight: 700 }}>EMITIDO EL {new Date(c.timestamp).toLocaleDateString()}</div>
                          <div style={{ fontSize: '10pt', fontWeight: 900, color: '#1B5E20', background: '#e8f5e9', padding: '4px 12px', borderRadius: '6px' }}>SCORE: {c.averageScore}</div>
                        </div>
                      </div>
                    ))}
                    {feedbackData.comments.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#999', padding: '50px', border: '3px dashed #f0f0f0', borderRadius: '15px', fontSize: '12pt' }}>
                        No se registraron observaciones cualitativas para este proyecto.
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Footer - Separated by explicit spacer to avoid overlap */}
                <div style={{ height: '50px' }}></div>
                <div style={{ marginTop: 'auto', borderTop: '2px solid #f0f0f0', paddingTop: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10pt', color: '#ccc', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}>
                    PX FORGE PROTOCOL • REPORTE AUTOGENERADO • 2026
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1.5rem', background: '#fff' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedProjectForFeedback(null)}>Cerrar</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 2 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Procesando {feedbackData.comments.length} comentarios...</div>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? <RefreshCw className="spin" size={18} /> : <Download size={18} />}
                  Descargando...
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
