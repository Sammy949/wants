import { router } from "expo-router";
import { WantForm } from "@/components/want-form";
import { useWantsRepo } from "@/data/provider";

export default function NewWantSheet() {
  const repo = useWantsRepo();
  return (
    <WantForm
      heading="New want"
      onSubmit={async ({ title, kind, price, note }) => {
        await repo.create({ title, kind, price, note });
        router.back();
      }}
    />
  );
}
