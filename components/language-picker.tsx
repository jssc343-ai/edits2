"use client";

import { Languages } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { LANGUAGES } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguagePicker() {
  const { lang, setLang, t } = useApp();
  return (
    <Select value={lang} onValueChange={setLang}>
      <SelectTrigger aria-label={t("language")} className="h-10 w-auto min-w-28 gap-2 bg-secondary">
        <Languages className="size-4 text-primary" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
