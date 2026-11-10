import { router } from "expo-router";
import { ArrowSquareOutIcon } from "phosphor-react-native/src/icons/ArrowSquareOut";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import type { PhosphorIcon } from "@/components/icon";
import type { Want } from "@/data/wants";

export interface WantAction {
  key: string;
  label: string;
  icon: PhosphorIcon;
  destructive?: boolean;
  run: () => void;
}

/**
 * The actions available on a want from the list. Adding an action (Share,
 * Pin, ...) means adding an entry here; every sheet layout renders this list.
 * Navigation replaces the sheet so Back goes to the list, not to the sheet.
 */
export function wantActions(want: Want, remove: (id: number, title: string) => void): {
  main: WantAction[];
  destructive: WantAction[];
} {
  return {
    main: [
      {
        key: "got",
        label: "I got it",
        icon: CheckCircleIcon,
        run: () => router.replace(`/want/${want.id}?choose=1`),
      },
      { key: "open", label: "Open", icon: ArrowSquareOutIcon, run: () => router.replace(`/want/${want.id}`) },
      { key: "edit", label: "Edit", icon: PencilSimpleIcon, run: () => router.replace(`/want/edit/${want.id}`) },
    ],
    destructive: [
      {
        key: "delete",
        label: "Delete",
        icon: TrashIcon,
        destructive: true,
        run: () => {
          // Undo is offered on the list; no "are you sure" alert.
          remove(want.id, want.title);
          router.back();
        },
      },
    ],
  };
}
