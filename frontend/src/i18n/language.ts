import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';
export type Language = 'en' | 'si' | 'ta';
let language: Language = 'en';
let revision = 0;
const listeners = new Set<() => void>();
const KEY = 'agrilink-ui-language';
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useLanguage() { return useSyncExternalStore(subscribe, () => language, () => 'en' as Language); }
export function getLanguage() { return language; }
export function translate(text: string, locale = language): string {
  if (locale === 'en') return text;
  const key = text.trim();
  const result = translations[key]?.[locale] ?? translations[key.replace(/\s+/g, ' ')]?.[locale];
  if (result) return text.replace(key, result);
  if (text.includes('\n')) return text.split('\n').map((line) => translate(line, locale)).join('\n');
  const choose = /^Choose (.+)$/.exec(key);
  if (choose) return `${locale === 'si' ? 'තෝරන්න:' : 'தேர்ந்தெடு:'} ${translate(choose[1], locale)}`;
  if (key.endsWith(' ▾')) return `${translate(key.slice(0, -2), locale)} ▾`;
  const order = /^Order (\S+) is (.+)\.$/.exec(key);
  if (order) {
    const state = order[2] === 'accepted. Please pay for your order before the farmer can prepare it'
      ? locale === 'si' ? 'පිළිගෙන ඇත. ගොවියා සූදානම් කිරීමට පෙර ගෙවන්න' : 'ஏற்கப்பட்டது. விவசாயி தயாரிக்கும்முன் செலுத்தவும்'
      : translate(order[2], locale);
    return `${locale === 'si' ? 'ඇණවුම' : 'ஆர்டர்'} ${order[1]}: ${state}.`;
  }
  const payment = /^Demo payment received for (\S+)\. You can prepare the order\.$/.exec(key);
  if (payment) return locale === 'si' ? `${payment[1]} සඳහා ආදර්ශ ගෙවීම ලැබුණා. ඇණවුම සූදානම් කළ හැක.` : `${payment[1]}-க்கு மாதிரி கட்டணம் பெறப்பட்டது. ஆர்டரை தயாரிக்கலாம்.`;
  const received = /^Buyer confirmed receipt of (\S+)\.$/.exec(key);
  if (received) return locale === 'si' ? `ගැනුම්කරු ${received[1]} ලැබීම තහවුරු කළා.` : `வாங்குபவர் ${received[1]} பெற்றதை உறுதிசெய்தார்.`;
  const outbid = /^You have been outbid on (.+)\. Another buyer offered LKR (.+) per (\w+)\. Open My Bids to revise your offer\.$/.exec(key);
  if (outbid) return locale === 'si'
    ? `${outbid[1]} සඳහා ඉහළ ලංසුවක් ලැබී ඇත. වෙනත් ගැනුම්කරුවෙකු ${translate(outbid[3], locale)} ඒකකයකට රු. ${outbid[2]} දී ඇත. ලංසුව වෙනස් කිරීමට මගේ ලංසු විවෘත කරන්න.`
    : `${outbid[1]} பொருளில் உங்கள் ஏலம் முந்தப்பட்டது. மற்றொருவர் ${translate(outbid[3], locale)} அலகுக்கு ரூ. ${outbid[2]} அளித்துள்ளார். மாற்ற என் ஏலங்களை திறக்கவும்.`;
  // Translate UI label prefixes without changing names, codes, or amounts after them.
  const label = /^([^:]+:)\s*(.+)$/.exec(key);
  if (label && translations[label[1]]) return `${translate(label[1], locale)} ${label[2]}`;
  return text;
}
export async function setLanguage(next: Language) {
  revision += 1;
  language = next; listeners.forEach((listener) => listener());
  await AsyncStorage.setItem(KEY, next);
}
export async function restoreLanguage() {
  const version = revision;
  try { const saved = await AsyncStorage.getItem(KEY); if (version === revision && (saved === 'en' || saved === 'si' || saved === 'ta')) { language = saved; listeners.forEach((listener) => listener()); } } catch { /* English remains available if device storage fails. */ }
}
