import React from 'react';
import { AppState, User, UserRole, Language } from '../types';
import { TRANSLATIONS, ROLE_PERMS_MAP } from '../translations';
import { Users, UserPlus, Trash2, ShieldCheck, Key } from 'lucide-react';

interface UsersTabProps {
  state: AppState;
  currentLang: Language;
  canManageUsers: boolean;
  onAddUser: () => void;
  onDeleteUser: (index: number) => void;
  onUpdateUser: (index: number, field: keyof User, value: string | boolean) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  state,
  currentLang,
  canManageUsers,
  onAddUser,
  onDeleteUser,
  onUpdateUser
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const rolesList: { role: UserRole; label: string }[] = [
    { role: 'admin', label: t('role_admin') },
    { role: 'manager', label: t('role_manager') },
    { role: 'kitchen', label: t('role_kitchen') },
    { role: 'purchasing', label: t('role_purchasing') },
    { role: 'viewer', label: t('role_viewer') }
  ];

  if (!canManageUsers) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
        <p className="text-sm text-slate-500">{t("no_perm")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_users")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدارة الحسابات، كلمات المرور، والصلاحيات التشغيلية (RBAC)
              </p>
            </div>
          </div>

          <button
            onClick={onAddUser}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("btn_add_user")}</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 text-right min-w-[160px]">الاسم الظاهر</th>
                <th className="p-2.5 text-center w-32">{t("username")}</th>
                <th className="p-2.5 text-center w-32">{t("password")}</th>
                <th className="p-2.5 text-center w-36">الدور والصلاحية</th>
                <th className="p-2.5 text-center w-20">{t("active")}</th>
                <th className="p-2.5 text-right min-w-[220px]">تفاصيل الصلاحيات</th>
                <th className="p-2.5 text-center w-14"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {state.users.map((u, idx) => {
                const perms = ROLE_PERMS_MAP[u.role] || ROLE_PERMS_MAP.viewer;
                const permKeys = Object.entries(perms).filter(([, v]) => v).map(([k]) => k);

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={u.name}
                        onChange={e => onUpdateUser(idx, 'name', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-xs font-medium text-right"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="text"
                        value={u.username}
                        disabled={u.username === 'admin'}
                        onChange={e => onUpdateUser(idx, 'username', e.target.value)}
                        className="w-28 text-center px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-mono text-xs font-semibold"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="text"
                        value={u.password}
                        onChange={e => onUpdateUser(idx, 'password', e.target.value)}
                        className="w-28 text-center px-1.5 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={u.role}
                        disabled={u.username === 'admin'}
                        onChange={e => onUpdateUser(idx, 'role', e.target.value as UserRole)}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-xs font-medium"
                      >
                        {rolesList.map(r => (
                          <option key={r.role} value={r.role}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={u.active}
                        disabled={u.username === 'admin'}
                        onChange={e => onUpdateUser(idx, 'active', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {permKeys.map(k => (
                          <span key={k} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(t("confirm_delete"))) {
                              onDeleteUser(idx);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title={t("btn_delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
