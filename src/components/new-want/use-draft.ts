import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useWantsRepo } from "@/data/provider";
import { PRICE_LABEL, WantValidationError, type WantKind } from "@/data/wants";
import { parseAmount, type CurrencyCode } from "@/lib/money";

/** State and save logic for the New want flow. */
export function useNewWantDraft({ selectionHaptic = false } = {}) {
  const repo = useWantsRepo();
  const [title, setTitle] = useState("");
  const [kind, setKindRaw] = useState<WantKind>("thing");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    repo.lastCurrency().then((c) => c && setCurrency(c), () => {});
  }, [repo]);

  function setKind(next: WantKind) {
    if (next !== kind && selectionHaptic) Haptics.selectionAsync().catch(() => {});
    setKindRaw(next);
  }

  const parsed = amount.trim() ? parseAmount(amount, currency) : null;
  const priceLabel = PRICE_LABEL[kind];

  async function save() {
    setError(null);
    if (amount.trim() && parsed === null) {
      setError(`That ${priceLabel.toLowerCase()} isn't a valid amount.`);
      return false;
    }
    setSaving(true);
    try {
      await repo.create({ title, kind, note, price: parsed === null ? null : { minor: parsed, currency } });
      router.back();
      return true;
    } catch (e) {
      setError(e instanceof WantValidationError ? e.message : "Couldn't save. Try again.");
      setSaving(false);
      return false;
    }
  }

  return {
    title, setTitle, kind, setKind, amount, setAmount, currency, setCurrency, note, setNote,
    parsed, priceLabel, error, saving, save, canSave: !!title.trim() && !saving,
  };
}

export type Draft = ReturnType<typeof useNewWantDraft>;
