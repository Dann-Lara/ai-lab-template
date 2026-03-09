'use client';

/**
 * PermissionGate — renders children only if the user has the given permission.
 * Must be rendered inside a DashboardLayout (which mounts PermissionsProvider).
 *
 * While permissions are loading: shows a spinner.
 * If access denied: shows a lock screen.
 */
import { useRouter } from 'next/navigation';
import { usePermissions } from '../../lib/permissions-context';
import { useI18n } from '../../lib/i18n-context';

function Spinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );
}

function LockScreen() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="card p-10 text-center max-w-sm w-full space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800
                        border border-slate-200 dark:border-slate-700
                        flex items-center justify-center mx-auto text-slate-400 text-2xl">
          🔒
        </div>
        <p className="font-mono text-[13px] font-semibold text-slate-700 dark:text-slate-300">
          {t.applications?.accessDenied ?? 'Acceso restringido'}
        </p>
        <p className="font-mono text-[11px] text-slate-400">
          {t.applications?.accessDeniedDesc ?? 'No tienes permiso para acceder a este módulo.'}
        </p>
        <button onClick={() => router.back()} className="btn-ghost text-[10px] py-2 px-4 mx-auto">
          ← {t.common?.back ?? 'Volver'}
        </button>
      </div>
    </div>
  );
}

interface PermissionGateProps {
  module: string;
  children: React.ReactNode;
}

export function PermissionGate({ module, children }: PermissionGateProps) {
  const { can, ready } = usePermissions();

  console.log(`[PermissionGate] module=${module} ready=${ready} can=${can(module)}`);

  if (!ready) return <Spinner />;
  if (!can(module)) return <LockScreen />;
  return <>{children}</>;
}
