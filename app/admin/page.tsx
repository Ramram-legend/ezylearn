'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck } from 'lucide-react';
import type { Plan } from '@/types/database';

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  plan: Plan;
}

const planLabels: Record<Plan, string> = {
  gratuit: 'Gratuit',
  plus: 'EasyLearn Plus',
  famille: 'Famille',
  etablissement: 'Établissement',
};

const plans: Plan[] = ['gratuit', 'plus', 'famille', 'etablissement'];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, Plan>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/users')
      .then(async (response) => {
        if (response.status === 401) {
          router.replace('/');
          return null;
        }
        if (response.status === 403) {
          setDenied(true);
          return null;
        }
        if (!response.ok) throw new Error('Impossible de charger la liste des utilisateurs.');
        return response.json() as Promise<{ users: AdminUser[] }>;
      })
      .then((data) => {
        if (!active || !data?.users) return;
        setUsers(data.users);
        setSelectedPlans(
          Object.fromEntries(data.users.map((user: AdminUser) => [user.id, user.plan]))
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        (user.displayName ?? '').toLowerCase().includes(query)
    );
  }, [search, users]);

  const savePlan = async (user: AdminUser) => {
    const plan = selectedPlans[user.id];
    if (plan === user.plan) return;

    setSavingUserId(user.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan }),
      });
      const data: { plan: Plan; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Impossible de modifier le forfait.');

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, plan: data.plan } : item))
      );
      setSuccessMessage(`Forfait de ${user.email} mis à jour : ${planLabels[data.plan]}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">Chargement…</main>;
  }

  if (denied) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <h1 className="text-xl font-bold text-foreground">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cette page est réservée à l’administration.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-start gap-4">
        <div className="rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground">Gestion des forfaits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recherchez un utilisateur et choisissez le forfait à lui attribuer.
          </p>
        </div>
      </header>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600">
          {successMessage}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-foreground">{filteredUsers.length} utilisateur(s)</p>
          <label className="relative block sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom ou e-mail"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-brand-blue"
            />
          </label>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Utilisateur</th>
                  <th className="px-5 py-3 font-semibold">Forfait actuel</th>
                  <th className="px-5 py-3 font-semibold">Nouveau forfait</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{user.displayName ?? 'Apprenant'}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{planLabels[user.plan]}</td>
                    <td className="px-5 py-4">
                      <select
                        aria-label={`Forfait pour ${user.email}`}
                        value={selectedPlans[user.id] ?? user.plan}
                        onChange={(event) =>
                          setSelectedPlans((current) => ({
                            ...current,
                            [user.id]: event.target.value as Plan,
                          }))
                        }
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      >
                        {plans.map((plan) => (
                          <option key={plan} value={plan}>{planLabels[plan]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={selectedPlans[user.id] === user.plan || savingUserId === user.id}
                        onClick={() => savePlan(user)}
                        className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingUserId === user.id ? 'Enregistrement…' : 'Appliquer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
