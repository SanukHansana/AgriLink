import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { restoreLanguage, setLanguage, translate, useLanguage, type Language } from '@/i18n/language';
const languages: { code: Language; label: string }[] = [{ code: 'en', label: 'English' }, { code: 'si', label: 'සිංහල' }, { code: 'ta', label: 'தமிழ்' }];
export function LanguageRestore() { useEffect(() => { void restoreLanguage(); }, []); return null; }
export function LanguagePicker({ profile = false }: { profile?: boolean }) {
  const selected = useLanguage(); const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 16, y: 80 });
  const trigger = useRef<View>(null);
  const window = useWindowDimensions();
  const show = () => {
    trigger.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x: Math.max(12, Math.min(x + width - 160, window.width - 172)), y: Math.max(12, Math.min(y + height + 6, window.height - 180)) });
    });
    setOpen(true);
  };
  return <View style={profile ? { marginVertical: 12, padding: 16, borderWidth: 1, borderColor: BrandColors.border, backgroundColor: '#fff', borderRadius: 12, gap: 10 } : undefined}>
    {profile && <Text style={{ color: BrandColors.primaryDark, fontSize: 16, fontWeight: '700' }}>{translate('Language Preferences')}</Text>}
    <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={`${translate('Language Preferences')}: ${selected.toUpperCase()}`} accessibilityState={{ expanded: open }} onPress={show} style={{ minHeight: 44, minWidth: 48, alignSelf: 'flex-start', paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: BrandColors.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14, fontWeight: '800', color: BrandColors.primaryDark }}>{selected.toUpperCase()} ⌄</Text></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={translate('Close selection')} onPress={() => setOpen(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.12)' }} />
        <View accessibilityViewIsModal style={{ position: 'absolute', left: anchor.x, top: anchor.y, width: 160, padding: 6, borderRadius: 12, backgroundColor: '#fff', borderColor: BrandColors.border, borderWidth: 1, elevation: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {languages.filter(({ code }) => code !== selected).map(({ code, label }) => <Pressable key={code} accessibilityRole="button" accessibilityLabel={label} onPress={() => { setError(false); setOpen(false); void setLanguage(code).catch(() => setError(true)); }} style={{ minHeight: 48, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 8 }}><Text style={{ fontSize: 15, color: BrandColors.primaryDark }}>{code.toUpperCase()} · {label}</Text></Pressable>)}
        </View>
      </View>
    </Modal>
    {error && <Text accessibilityRole="alert">{selected === 'si' ? 'භාෂාව සුරැකීමට නොහැකි විය.' : selected === 'ta' ? 'மொழியை சேமிக்க முடியவில்லை.' : 'Could not save your language.'}</Text>}
  </View>;
}
