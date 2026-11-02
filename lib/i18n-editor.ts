export const LANGS = [
  { code: "zh-TW", name: "繁體中文" },
  { code: "en", name: "English" },
  { code: "zh-CN", name: "简体中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ไทย" },
  { code: "tr", name: "Türkçe" },
  { code: "it", name: "Italiano" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "uk", name: "Українська" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "fil", name: "Filipino" },
  { code: "bn", name: "বাংলা" },
  { code: "fa", name: "فارسی" },
  { code: "sv", name: "Svenska" },
  { code: "el", name: "Ελληνικά" },
  { code: "he", name: "עברית" },
  { code: "cs", name: "Čeština" },
  { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

export const RTL_LANGS: string[] = ["ar", "fa", "he"];

export function isLangCode(value: unknown): value is LangCode {
  return LANGS.some((l) => l.code === value);
}

type Dict = Record<string, string>;

const en: Dict = {
  appName: "JSC343 AI EDITS",
  tagline: "Give your photos and clips a lively 3D motion worth remembering.",
  howTitle: "How it works",
  s1: "Choose your language",
  s2: "Sign in with Pi",
  s3: "Pick photo or short video",
  s4: "Pick hand-drawn or AI 3D motion",
  s5: "Upload your media",
  s6: "Preview the result",
  s7: "Download your creation",
  hello: "Hi, {name}",
  signedIn: "Signed in with Pi",
  chooseMode: "Choose edit mode",
  photoDesc: "Decorate or animate a single photo",
  videoDesc: "Decorate or animate a short clip",
  handDesc: "Draw and decorate by hand",
  aiDesc: "Pick from AI-generated motion templates",
  uploadPhoto: "Tap to upload a photo",
  uploadVideo: "Tap to upload a short video",
  replace: "Replace",
  play: "Play",
  pause: "Pause",
  color: "Color",
  size: "Brush size",
  undo: "Undo",
  clear: "Clear",
  exporting: "Exporting…",
  ephemeral: "Results are not stored on our servers. Download to keep them.",
  exportFail: "Export failed. Please try again.",
  loadFail: "This file could not be opened.",
  prefs: "Preferences",
  feedbackTitle: "Send feedback",
  feedbackHint: "Tell us what you think",
  send: "Send",
  sent: "Thanks, your feedback was saved.",
  sendFail: "Could not save right now. Please retry.",
  adminEntry: "Admin console (temporary)",
};

const zhTW: Dict = {
  appName: "JSC343 AI EDITS",
  tagline: "讓照片與短片動起來，留下值得回味的回憶。",
  howTitle: "建立說明",
  s1: "選擇語言",
  s2: "使用 Pi 登入",
  s3: "選擇相片或短視頻",
  s4: "選擇手工繪圖或 AI 3D 動態",
  s5: "上傳素材",
  s6: "預覽效果",
  s7: "下載成果",
  hello: "嗨，{name}",
  signedIn: "已透過 Pi 登入",
  chooseMode: "選擇編輯模式",
  photoDesc: "為單張相片加上手繪或動態",
  videoDesc: "為短片加上手繪或動態",
  handDesc: "用手繪方式繪製與裝飾",
  aiDesc: "從 AI 生成的動態模板中挑選",
  uploadPhoto: "點按上傳相片",
  uploadVideo: "點按上傳短視頻",
  replace: "更換素材",
  play: "播放",
  pause: "暫停",
  color: "顏色",
  size: "筆刷大小",
  undo: "復原",
  clear: "清除",
  exporting: "輸出中…",
  ephemeral: "成果不會保存在伺服器，請下載保存。",
  exportFail: "輸出失敗，請再試一次。",
  loadFail: "無法開啟此檔案。",
  prefs: "玩家偏好",
  feedbackTitle: "意見反饋",
  feedbackHint: "告訴我們你的想法",
  send: "送出",
  sent: "感謝你，反饋已保存。",
  sendFail: "目前無法保存，請稍後再試。",
  adminEntry: "管理後台（暫時入口）",
};

const CORE_KEYS = [
  "start", "language", "settings", "back", "signOut", "photo", "video",
  "hand", "ai3d", "upload", "preview", "download", "template", "chooseType",
] as const;

const CORE: Record<string, string[]> = {
  "zh-TW": ["開始", "語言", "設定", "返回", "登出", "相片編輯", "短視頻編輯", "手工繪圖編輯", "AI 3D 動態編輯", "上傳素材", "預覽", "下載", "動態模板", "選擇編輯區塊"],
  en: ["Get started", "Language", "Settings", "Back", "Sign out", "Photo editing", "Short video editing", "Hand-drawn editing", "AI 3D motion", "Upload", "Preview", "Download", "Motion templates", "Choose what to edit"],
  "zh-CN": ["开始", "语言", "设置", "返回", "退出登录", "相片编辑", "短视频编辑", "手工绘图", "AI 3D 动态", "上传素材", "预览", "下载", "动态模板", "选择编辑类型"],
  ja: ["始める", "言語", "設定", "戻る", "ログアウト", "写真編集", "ショート動画編集", "手描き編集", "AI 3Dモーション", "アップロード", "プレビュー", "ダウンロード", "モーションテンプレート", "編集タイプを選択"],
  ko: ["시작하기", "언어", "설정", "뒤로", "로그아웃", "사진 편집", "숏폼 편집", "손그림 편집", "AI 3D 모션", "업로드", "미리보기", "다운로드", "모션 템플릿", "편집 유형 선택"],
  es: ["Empezar", "Idioma", "Ajustes", "Atrás", "Cerrar sesión", "Editar foto", "Editar vídeo corto", "Dibujo a mano", "Movimiento 3D con IA", "Subir", "Vista previa", "Descargar", "Plantillas", "Elige el tipo de edición"],
  fr: ["Commencer", "Langue", "Réglages", "Retour", "Se déconnecter", "Édition photo", "Édition vidéo courte", "Dessin à la main", "Animation 3D IA", "Importer", "Aperçu", "Télécharger", "Modèles", "Choisir le type"],
  de: ["Starten", "Sprache", "Einstellungen", "Zurück", "Abmelden", "Foto bearbeiten", "Kurzvideo bearbeiten", "Handzeichnung", "KI-3D-Bewegung", "Hochladen", "Vorschau", "Herunterladen", "Vorlagen", "Bearbeitungsart wählen"],
  pt: ["Começar", "Idioma", "Configurações", "Voltar", "Sair", "Editar foto", "Editar vídeo curto", "Desenho à mão", "Movimento 3D com IA", "Enviar", "Pré-visualizar", "Baixar", "Modelos", "Escolha o tipo de edição"],
  ru: ["Начать", "Язык", "Настройки", "Назад", "Выйти", "Редактор фото", "Редактор видео", "Рисование вручную", "ИИ 3D-анимация", "Загрузить", "Просмотр", "Скачать", "Шаблоны", "Выберите тип"],
  ar: ["ابدأ", "اللغة", "الإعدادات", "رجوع", "تسجيل الخروج", "تحرير الصور", "تحرير الفيديو القصير", "الرسم اليدوي", "حركة ثلاثية الأبعاد بالذكاء الاصطناعي", "رفع", "معاينة", "تنزيل", "القوالب", "اختر نوع التحرير"],
  hi: ["शुरू करें", "भाषा", "सेटिंग्स", "वापस", "लॉग आउट", "फ़ोटो संपादन", "शॉर्ट वीडियो संपादन", "हाथ से चित्रकारी", "AI 3D मोशन", "अपलोड", "पूर्वावलोकन", "डाउनलोड", "टेम्पलेट", "संपादन प्रकार चुनें"],
  id: ["Mulai", "Bahasa", "Pengaturan", "Kembali", "Keluar", "Edit foto", "Edit video pendek", "Gambar tangan", "Gerak 3D AI", "Unggah", "Pratinjau", "Unduh", "Templat", "Pilih jenis edit"],
  vi: ["Bắt đầu", "Ngôn ngữ", "Cài đặt", "Quay lại", "Đăng xuất", "Chỉnh sửa ảnh", "Chỉnh sửa video ngắn", "Vẽ tay", "Chuyển động 3D AI", "Tải lên", "Xem trước", "Tải xuống", "Mẫu", "Chọn loại chỉnh sửa"],
  th: ["เริ่มเลย", "ภาษา", "ตั้งค่า", "กลับ", "ออกจากระบบ", "แก้ไขรูปภาพ", "แก้ไขวิดีโอสั้น", "วาดด้วยมือ", "ภาพเคลื่อนไหว 3D ด้วย AI", "อัปโหลด", "ตัวอย่าง", "ดาวน์โหลด", "เทมเพลต", "เลือกประเภทการแก้ไข"],
  tr: ["Başla", "Dil", "Ayarlar", "Geri", "Çıkış yap", "Fotoğraf düzenle", "Kısa video düzenle", "Elle çizim", "Yapay zekâ 3D hareket", "Yükle", "Önizleme", "İndir", "Şablonlar", "Düzenleme türünü seç"],
  it: ["Inizia", "Lingua", "Impostazioni", "Indietro", "Esci", "Modifica foto", "Modifica video breve", "Disegno a mano", "Movimento 3D con IA", "Carica", "Anteprima", "Scarica", "Modelli", "Scegli il tipo"],
  nl: ["Starten", "Taal", "Instellingen", "Terug", "Uitloggen", "Foto bewerken", "Korte video bewerken", "Handtekenen", "AI 3D-beweging", "Uploaden", "Voorbeeld", "Downloaden", "Sjablonen", "Kies bewerkingstype"],
  pl: ["Zacznij", "Język", "Ustawienia", "Wstecz", "Wyloguj", "Edycja zdjęć", "Edycja krótkich wideo", "Rysowanie ręczne", "Ruch 3D z AI", "Prześlij", "Podgląd", "Pobierz", "Szablony", "Wybierz typ edycji"],
  uk: ["Почати", "Мова", "Налаштування", "Назад", "Вийти", "Редагування фото", "Редагування відео", "Малювання вручну", "ШІ 3D-анімація", "Додати файл", "Перегляд", "Завантажити", "Шаблони", "Оберіть тип"],
  ms: ["Mulakan", "Bahasa", "Tetapan", "Kembali", "Log keluar", "Edit foto", "Edit video pendek", "Lukisan tangan", "Gerakan 3D AI", "Muat naik", "Pratonton", "Muat turun", "Templat", "Pilih jenis suntingan"],
  fil: ["Magsimula", "Wika", "Mga setting", "Bumalik", "Mag-sign out", "I-edit ang larawan", "I-edit ang maikling video", "Guhit-kamay", "AI 3D na galaw", "Mag-upload", "Preview", "I-download", "Mga template", "Pumili ng uri"],
  bn: ["শুরু করুন", "ভাষা", "সেটিংস", "ফিরে যান", "লগ আউট", "ছবি সম্পাদনা", "শর্ট ভিডিও সম্পাদনা", "হাতে আঁকা", "AI 3D মোশন", "আপলোড", "প্রিভিউ", "ডাউনলোড", "টেমপ্লেট", "সম্পাদনার ধরন বাছুন"],
  fa: ["شروع", "زبان", "تنظیمات", "بازگشت", "خروج", "ویرایش عکس", "ویرایش ویدیوی کوتاه", "نقاشی دستی", "حرکت سه‌بعدی هوش مصنوعی", "بارگذاری", "پیش‌نمایش", "دانلود", "قالب‌ها", "نوع ویرایش را انتخاب کنید"],
  sv: ["Börja", "Språk", "Inställningar", "Tillbaka", "Logga ut", "Redigera foto", "Redigera kortvideo", "Handritat", "AI 3D-rörelse", "Ladda upp", "Förhandsvisning", "Ladda ner", "Mallar", "Välj redigeringstyp"],
  el: ["Ξεκινήστε", "Γλώσσα", "Ρυθμίσεις", "Πίσω", "Αποσύνδεση", "Επεξεργασία φωτογραφίας", "Επεξεργασία βίντεο", "Σχέδιο στο χέρι", "Κίνηση 3D με AI", "Μεταφόρτωση", "Προεπισκόπηση", "Λήψη", "Πρότυπα", "Επιλέξτε τύπο"],
  he: ["התחל", "שפה", "הגדרות", "חזרה", "התנתקות", "עריכת תמונה", "עריכת סרטון קצר", "ציור ידני", "תנועת תלת־ממד בבינה מלאכותית", "העלאה", "תצוגה מקדימה", "הורדה", "תבניות", "בחר סוג עריכה"],
  cs: ["Začít", "Jazyk", "Nastavení", "Zpět", "Odhlásit", "Úprava fotek", "Úprava krátkého videa", "Ruční kresba", "AI 3D pohyb", "Nahrát", "Náhled", "Stáhnout", "Šablony", "Vyberte typ úprav"],
  ro: ["Începe", "Limbă", "Setări", "Înapoi", "Deconectare", "Editare foto", "Editare video scurt", "Desen manual", "Mișcare 3D cu IA", "Încarcă", "Previzualizare", "Descarcă", "Șabloane", "Alege tipul de editare"],
  hu: ["Kezdés", "Nyelv", "Beállítások", "Vissza", "Kijelentkezés", "Fotószerkesztés", "Rövid videó szerkesztése", "Kézi rajz", "AI 3D mozgás", "Feltöltés", "Előnézet", "Letöltés", "Sablonok", "Válassz szerkesztéstípust"],
};

function coreLookup(lang: string, key: string): string | undefined {
  const idx = (CORE_KEYS as readonly string[]).indexOf(key);
  if (idx < 0) return undefined;
  return CORE[lang]?.[idx];
}

export function translate(lang: LangCode, key: string): string {
  const fromCore = coreLookup(lang, key);
  if (fromCore) return fromCore;
  if (lang === "zh-TW" || lang === "zh-CN") {
    return zhTW[key] ?? en[key] ?? key;
  }
  return en[key] ?? key;
}
