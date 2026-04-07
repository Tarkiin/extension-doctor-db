import { useState } from 'react';
import { UserPreferences } from '@/lib/types';
import { savePreferences } from '@/lib/storage';

interface OnboardingProps {
  onComplete: () => Promise<void>;
  initialPrefs: UserPreferences;
}

export function Onboarding({ onComplete, initialPrefs }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [analyzing, setAnalyzing] = useState(false);

  const toggleRemoteLookup = () => {
    setPrefs((p) => ({ ...p, enableRemoteLookup: !p.enableRemoteLookup }));
  };

  const toggleReviewSubmission = () => {
    setPrefs((p) => ({ ...p, enableReviewSubmission: !p.enableReviewSubmission }));
  };

  const handleFinish = async () => {
    setAnalyzing(true);
    try {
      // Guardar preferencias, marcando el onboarding como completado
      await savePreferences({
        ...prefs,
        onboardingCompleted: true,
      });
      
      // Ejecutar la acción final (el análisis inicial, dictado por el prop)
      await onComplete();
    } catch (err) {
      console.error('Error completando onboarding', err);
      setAnalyzing(false);
    }
  };

  return (
    <div 
      id="app-container" 
      className="flex flex-col relative text-slate-200 overflow-hidden w-[420px] h-[580px]"
    >
      {/* Progress Bar */}
      <div className="h-1 bg-slate-800 w-full relative">
        <div 
          className="h-full bg-doctor-500 transition-all duration-300" 
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        
        {/* Step 1: Bienvenida */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4">
              🩺
            </div>
            <h1 className="text-xl font-bold mb-2">Bienvenido a Extension Doctor</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Vamos a revisar los permisos de tus extensiones instaladas para alertarte sobre comportamientos riesgosos invisibles.
            </p>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-left mb-8 max-w-sm">
              <p className="text-xs font-semibold text-slate-300 mb-1">⚠️ Aviso importante</p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Esta herramienta realiza un análisis heurístico orientativo basado en permisos declarados y no garantiza detectar todo el malware ni sustituye a un antivirus clásico.
              </p>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full max-w-xs py-2.5 bg-doctor-600 hover:bg-doctor-500 rounded-lg font-semibold transition-colors"
            >
              Entendido, continuar
            </button>
          </div>
        )}

        {/* Step 2: Privacidad */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col w-full max-w-sm text-left">
            <h2 className="text-lg font-bold mb-1 text-center">Tú tienes el control</h2>
            <p className="text-xs text-slate-400 mb-6 text-center">
              Todo el análisis principal ocurre localmente en tu equipo. Configura las funciones remotas opcionales:
            </p>

            <div className="space-y-4 mb-8">
              {/* Opción 1 */}
              <div 
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${prefs.enableRemoteLookup ? 'bg-doctor-900/20 border-doctor-500/50' : 'bg-slate-800/30 border-slate-700/50'}`}
                onClick={toggleRemoteLookup}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">Consultar Base de Datos Remota</span>
                  <div className={`w-10 h-5 rounded-full flex items-center p-0.5 ${prefs.enableRemoteLookup ? 'bg-doctor-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${prefs.enableRemoteLookup ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Consulta nuestra lista curada en Github para obtener puntuaciones más precisas sobre las extensiones populares. Tu IP puede ser visible por GitHub Pages.
                </p>
              </div>

              {/* Opción 2 */}
              <div 
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${prefs.enableReviewSubmission ? 'bg-doctor-900/20 border-doctor-500/50' : 'bg-slate-800/30 border-slate-700/50'}`}
                onClick={toggleReviewSubmission}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">Permitir Envío de Datos Anónimos</span>
                  <div className={`w-10 h-5 rounded-full flex items-center p-0.5 ${prefs.enableReviewSubmission ? 'bg-doctor-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${prefs.enableReviewSubmission ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Habilita el botón para enviar los metadatos de extensiones desconocidas a nuestra cola pública y ayudar a la comunidad. Nunca enviaremos urls ni historial.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setStep(3)}
              className="w-full py-2.5 bg-doctor-600 hover:bg-doctor-500 rounded-lg font-semibold transition-colors"
            >
              Guardar preferencias
            </button>
          </div>
        )}

        {/* Step 3: Todo listo */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-doctor-900 text-doctor-400 rounded-full flex items-center justify-center text-3xl mb-4">
              ✨
            </div>
            <h2 className="text-xl font-bold mb-2">¡Todo listo!</h2>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
              La configuración inicial se ha guardado correctamente. Ya puedes realizar tu primera revisión de extensiones.
            </p>

            <button 
              onClick={handleFinish}
              disabled={analyzing}
              className="w-full max-w-xs py-3 bg-doctor-600 hover:bg-doctor-500 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-doctor-500/20"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  Analizando...
                </>
              ) : (
                '🔎 Ejecutar Análisis Inicial'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
