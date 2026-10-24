'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  user_id: string | null;
  created_at: string;
}

export default function AdminsManager({ currentEmail }: { currentEmail: string }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (loadError) {
      setError(loadError.message);
    } else {
      setAdmins((data as AdminUser[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error: insertError } = await supabase.from('admin_users').insert({
      email: normalizedEmail,
      name: name.trim() || null,
      active: true,
    });

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'An admin with this email already exists.'
          : insertError.message
      );
      setSaving(false);
      return;
    }

    setEmail('');
    setName('');
    await load();
    setSaving(false);
  };

  const toggleActive = async (admin: AdminUser) => {
    if (admin.email === currentEmail) {
      setError('You cannot disable your own admin account.');
      return;
    }
    setError('');
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ active: !admin.active, updated_at: new Date().toISOString() })
      .eq('id', admin.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  };

  const removeAdmin = async (admin: AdminUser) => {
    if (admin.email === currentEmail) {
      setError('You cannot remove your own admin account.');
      return;
    }
    if (!window.confirm(`Remove ${admin.email} from the admin list?`)) return;

    setError('');
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', admin.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Admin email"
          autoComplete="email"
          className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory outline-none focus:border-gold"
          required
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name (optional)"
          className="bg-pharaoh-bg border border-gold/30 rounded px-3 py-2 text-pharaoh-ivory outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add admin'}
        </button>
      </form>

      <p className="text-sm text-pharaoh-ivory/60">
        New admins sign in with a one-time code sent to the email address below. They must be added
        here before they can request a code.
      </p>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-pharaoh-ivory/60">Loading...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-pharaoh-ivory">
          <thead>
            <tr className="text-gold border-b border-gold/30">
              <th className="py-2 text-left">Email</th>
              <th className="py-2 text-left">Name</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Login</th>
              <th className="py-2 text-left">Added</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-gold/10">
                <td className="py-3 pr-4">
                  {admin.email}
                  {admin.email === currentEmail && (
                    <span className="ml-2 text-xs text-gold">(you)</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-pharaoh-ivory/70">{admin.name || '—'}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center gap-2 text-xs ${
                      admin.active ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        admin.active ? 'bg-green-400' : 'bg-red-400'
                      }`}
                    />
                    {admin.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-pharaoh-ivory/70">
                  {admin.user_id ? 'Linked' : 'Invited'}
                </td>
                <td className="py-3 pr-4 text-pharaoh-ivory/50">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(admin)}
                      disabled={admin.email === currentEmail}
                      className="text-gold hover:text-gold-light transition-colors disabled:opacity-30"
                    >
                      {admin.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAdmin(admin)}
                      disabled={admin.email === currentEmail}
                      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && admins.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-pharaoh-ivory/50">
                  No admins found. Add the first admin above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
