import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Eye, 
  Check,
  Copy,
  Settings,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { ThemeSettings, ColorPalette, ThemePreset } from '../types';
import { 
  getThemes, 
  saveTheme, 
  deleteTheme, 
  getActiveTheme, 
  setActiveTheme,
  themePresets,
  createThemeFromPreset,
  exportTheme,
  importTheme,
  resetToDefaultTheme,
  validateColorPalette,
  generateColorVariations
} from '../utils/themeManager';
import { getCurrentUser } from '../utils/auth';

const ThemeManager: React.FC = () => {
  const [themes, setThemes] = useState<ThemeSettings[]>([]);
  const [activeTheme, setActiveThemeState] = useState<ThemeSettings | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state for custom theme
  const [customTheme, setCustomTheme] = useState<Partial<ThemeSettings>>({
    name: '',
    description: '',
    colors: {
      primary: '#0ea5e9',
      primaryLight: '#38bdf8',
      primaryDark: '#0284c7',
      secondary: '#06b6d4',
      secondaryLight: '#22d3ee',
      secondaryDark: '#0891b2',
      accent: '#8b5cf6',
      accentLight: '#a78bfa',
      accentDark: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  });

  const currentUser = getCurrentUser();

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadThemes = () => {
    const allThemes = getThemes();
    const active = getActiveTheme();
    setThemes(allThemes);
    setActiveThemeState(active);
    setSelectedTheme(active);
  };

  const handleApplyTheme = (themeId: string) => {
    setLoading(true);
    try {
      const success = setActiveTheme(themeId);
      if (success) {
        loadThemes();
        setMessage({ type: 'success', text: '¡Tema aplicado exitosamente!' });
      } else {
        setMessage({ type: 'error', text: 'Error al aplicar el tema' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del sistema al aplicar el tema' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomTheme = () => {
    if (!currentUser) return;

    const validation = validateColorPalette(customTheme.colors || {});
    if (!validation.isValid) {
      setMessage({ type: 'error', text: validation.errors.join(', ') });
      return;
    }

    if (!customTheme.name?.trim()) {
      setMessage({ type: 'error', text: 'El nombre del tema es requerido' });
      return;
    }

    setLoading(true);
    try {
      const theme: ThemeSettings = {
        id: customTheme.id || Date.now().toString(),
        name: customTheme.name.trim(),
        description: customTheme.description?.trim() || '',
        colors: customTheme.colors as ColorPalette,
        isDefault: false,
        isActive: false,
        createdAt: customTheme.id ? (selectedTheme?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.username
      };

      saveTheme(theme);
      loadThemes();
      setIsEditing(false);
      setMessage({ type: 'success', text: customTheme.id ? 'Tema actualizado exitosamente' : 'Tema creado exitosamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar el tema' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tema?')) return;

    const success = deleteTheme(themeId);
    if (success) {
      loadThemes();
      setMessage({ type: 'success', text: 'Tema eliminado exitosamente' });
    } else {
      setMessage({ type: 'error', text: 'No se puede eliminar el tema predeterminado' });
    }
  };

  const handleCreateFromPreset = (presetId: string) => {
    if (!currentUser) return;

    const theme = createThemeFromPreset(presetId, undefined, currentUser.username);
    if (theme) {
      loadThemes();
      setMessage({ type: 'success', text: 'Tema creado desde preset exitosamente' });
      setShowPresets(false);
    }
  };

  const handleExportTheme = (themeId: string) => {
    const exportData = exportTheme(themeId);
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tema-${themes.find(t => t.id === themeId)?.name || 'custom'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Tema exportado exitosamente' });
    }
  };

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const theme = importTheme(content, currentUser.username);
      if (theme) {
        loadThemes();
        setMessage({ type: 'success', text: 'Tema importado exitosamente' });
      } else {
        setMessage({ type: 'error', text: 'Error al importar el tema. Verifica el formato del archivo.' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleColorChange = (colorKey: keyof ColorPalette, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors!,
        [colorKey]: value
      }
    }));

    // Auto-generate variations for primary colors
    if (colorKey === 'primary') {
      const variations = generateColorVariations(value);
      setCustomTheme(prev => ({
        ...prev,
        colors: {
          ...prev.colors!,
          primaryLight: variations.light,
          primaryDark: variations.dark
        }
      }));
    } else if (colorKey === 'secondary') {
      const variations = generateColorVariations(value);
      setCustomTheme(prev => ({
        ...prev,
        colors: {
          ...prev.colors!,
          secondaryLight: variations.light,
          secondaryDark: variations.dark
        }
      }));
    } else if (colorKey === 'accent') {
      const variations = generateColorVariations(value);
      setCustomTheme(prev => ({
        ...prev,
        colors: {
          ...prev.colors!,
          accentLight: variations.light,
          accentDark: variations.dark
        }
      }));
    }
  };

  const startEditingTheme = (theme: ThemeSettings) => {
    setCustomTheme({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      colors: { ...theme.colors }
    });
    setIsEditing(true);
  };

  const startCreatingTheme = () => {
    setCustomTheme({
      name: '',
      description: '',
      colors: { ...themePresets[0].colors }
    });
    setIsEditing(true);
  };

  const getPreviewClasses = () => {
    switch (previewMode) {
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'mobile':
        return 'max-w-sm mx-auto';
      default:
        return 'w-full';
    }
  };

  const colorGroups = [
    {
      title: 'Colores Principales',
      colors: [
        { key: 'primary' as keyof ColorPalette, label: 'Primario', description: 'Color principal de la marca' },
        { key: 'primaryLight' as keyof ColorPalette, label: 'Primario Claro', description: 'Variación clara del primario' },
        { key: 'primaryDark' as keyof ColorPalette, label: 'Primario Oscuro', description: 'Variación oscura del primario' }
      ]
    },
    {
      title: 'Colores Secundarios',
      colors: [
        { key: 'secondary' as keyof ColorPalette, label: 'Secundario', description: 'Color secundario de la marca' },
        { key: 'secondaryLight' as keyof ColorPalette, label: 'Secundario Claro', description: 'Variación clara del secundario' },
        { key: 'secondaryDark' as keyof ColorPalette, label: 'Secundario Oscuro', description: 'Variación oscura del secundario' }
      ]
    },
    {
      title: 'Colores de Acento',
      colors: [
        { key: 'accent' as keyof ColorPalette, label: 'Acento', description: 'Color de acento para destacar elementos' },
        { key: 'accentLight' as keyof ColorPalette, label: 'Acento Claro', description: 'Variación clara del acento' },
        { key: 'accentDark' as keyof ColorPalette, label: 'Acento Oscuro', description: 'Variación oscura del acento' }
      ]
    },
    {
      title: 'Colores de Estado',
      colors: [
        { key: 'success' as keyof ColorPalette, label: 'Éxito', description: 'Color para mensajes de éxito' },
        { key: 'warning' as keyof ColorPalette, label: 'Advertencia', description: 'Color para advertencias' },
        { key: 'error' as keyof ColorPalette, label: 'Error', description: 'Color para errores' },
        { key: 'info' as keyof ColorPalette, label: 'Información', description: 'Color para información' }
      ]
    },
    {
      title: 'Colores de Interfaz',
      colors: [
        { key: 'background' as keyof ColorPalette, label: 'Fondo', description: 'Color de fondo principal' },
        { key: 'surface' as keyof ColorPalette, label: 'Superficie', description: 'Color de tarjetas y paneles' },
        { key: 'text' as keyof ColorPalette, label: 'Texto', description: 'Color de texto principal' },
        { key: 'textSecondary' as keyof ColorPalette, label: 'Texto Secundario', description: 'Color de texto secundario' },
        { key: 'border' as keyof ColorPalette, label: 'Borde', description: 'Color de bordes y divisores' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Palette className="w-8 h-8 mr-3 text-purple-600" />
            Configuración de Temas
          </h2>
          <p className="text-gray-600 mt-1">
            Personaliza la apariencia visual de toda la aplicación
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Presets
          </button>
          
          <button
            onClick={startCreatingTheme}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Tema
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Theme Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Temas Predefinidos</h3>
                <button
                  onClick={() => setShowPresets(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-80">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themePresets.map(preset => (
                  <div key={preset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div 
                      className="w-full h-16 rounded-lg mb-3"
                      style={{ background: preset.preview }}
                    />
                    <h4 className="font-semibold text-gray-900 mb-1">{preset.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                    <button
                      onClick={() => handleCreateFromPreset(preset.id)}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Usar Este Tema
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Temas Disponibles</h3>
              <div className="flex items-center space-x-2">
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTheme}
                    className="hidden"
                  />
                  <Upload className="w-4 h-4 text-gray-600 hover:text-gray-800" />
                </label>
                <button
                  onClick={resetToDefaultTheme}
                  className="text-gray-600 hover:text-gray-800"
                  title="Restablecer tema predeterminado"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {themes.map(theme => (
                <div
                  key={theme.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    theme.isActive 
                      ? 'border-purple-500 bg-purple-50' 
                      : selectedTheme?.id === theme.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      {theme.name}
                      {theme.isActive && (
                        <Check className="w-4 h-4 ml-2 text-purple-600" />
                      )}
                      {theme.isDefault && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          Predeterminado
                        </span>
                      )}
                    </h4>
                    
                    <div className="flex items-center space-x-1">
                      {!theme.isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTheme(theme.id);
                          }}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Aplicar tema"
                          disabled={loading}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTheme(theme);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="Editar tema"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportTheme(theme.id);
                        }}
                        className="p-1 text-gray-600 hover:text-gray-700"
                        title="Exportar tema"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {!theme.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTheme(theme.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Eliminar tema"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                  
                  {/* Color Preview */}
                  <div className="flex space-x-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.success }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Editor */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {customTheme.id ? 'Editar Tema' : 'Crear Nuevo Tema'}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Tema *
                    </label>
                    <input
                      type="text"
                      value={customTheme.name || ''}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Mi Tema Personalizado"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={customTheme.description || ''}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Descripción del tema"
                    />
                  </div>
                </div>

                {/* Color Groups */}
                <div className="space-y-6">
                  {colorGroups.map(group => (
                    <div key={group.title} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">{group.title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.colors.map(color => (
                          <div key={color.key} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {color.label}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={customTheme.colors?.[color.key] || '#000000'}
                                onChange={(e) => handleColorChange(color.key, e.target.value)}
                                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customTheme.colors?.[color.key] || '#000000'}
                                onChange={(e) => handleColorChange(color.key, e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                                placeholder="#000000"
                              />
                              <button
                                onClick={() => navigator.clipboard.writeText(customTheme.colors?.[color.key] || '')}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Copiar color"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">{color.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCustomTheme}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {customTheme.id ? 'Actualizar Tema' : 'Crear Tema'}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedTheme ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Tema</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('tablet')}
                    className={`p-2 rounded-lg ${previewMode === 'tablet' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Theme Preview */}
              <div className={`${getPreviewClasses()} border border-gray-200 rounded-lg overflow-hidden`}>
                {/* Header Preview */}
                <div 
                  className="p-4 text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${selectedTheme.colors.primary}, ${selectedTheme.colors.secondary})` 
                  }}
                >
                  <h4 className="text-lg font-semibold"></h4> 
                  <p className="text-sm opacity-90"></p>
                </div>

                {/* Content Preview */}
                <div style={{ backgroundColor: selectedTheme.colors.background }} className="p-4">
                  {/* Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div 
                      className="p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: selectedTheme.colors.surface,
                        borderColor: selectedTheme.colors.border,
                        color: selectedTheme.colors.text
                      }}
                    >
                      <h5 className="font-medium mb-2">Tarjeta de Ejemplo</h5>
                      <p style={{ color: selectedTheme.colors.textSecondary }} className="text-sm">
                        Contenido de ejemplo para mostrar los colores del tema.
                      </p>
                    </div>
                    
                    <div 
                      className="p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: selectedTheme.colors.surface,
                        borderColor: selectedTheme.colors.border,
                        color: selectedTheme.colors.text
                      }}
                    >
                      <h5 className="font-medium mb-2">Otra Tarjeta</h5>
                      <p style={{ color: selectedTheme.colors.textSecondary }} className="text-sm">
                        Más contenido de ejemplo.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: selectedTheme.colors.primary }}
                    >
                      Botón Primario
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: selectedTheme.colors.secondary }}
                    >
                      Botón Secundario
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: selectedTheme.colors.accent }}
                    >
                      Botón Acento
                    </button>
                  </div>

                  {/* Status Colors */}
                  <div className="flex flex-wrap gap-2">
                    <span 
                      className="px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: selectedTheme.colors.success }}
                    >
                      Éxito
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: selectedTheme.colors.warning }}
                    >
                      Advertencia
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: selectedTheme.colors.error }}
                    >
                      Error
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: selectedTheme.colors.info }}
                    >
                      Información
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Actions */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedTheme.name}</h4>
                  <p className="text-sm text-gray-600">{selectedTheme.description}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!selectedTheme.isActive && (
                    <button
                      onClick={() => handleApplyTheme(selectedTheme.id)}
                      disabled={loading}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Aplicar Tema
                    </button>
                  )}
                  
                  <button
                    onClick={() => startEditingTheme(selectedTheme)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center py-12">
                <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un Tema</h3>
                <p className="text-gray-600">
                  Elige un tema de la lista para ver su vista previa y opciones de personalización.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;