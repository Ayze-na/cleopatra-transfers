export function normalizePhone(phone: string | null | undefined): string {
  return (phone || '').replace(/\D/g, '');
}

export function whatsappLink(
  phone: string | null | undefined,
  text?: string
): string {
  const digits = normalizePhone(phone);
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
