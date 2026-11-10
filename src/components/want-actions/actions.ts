import { router, type Href } from "expo-router";
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
 * From a sheet, navigation replaces the sheet so Back goes to the list, and
 * Delete closes it. From a menu shown on the list itself, navigation pushes.
 */
export function wantActions(
  want: Want,
  remove: (id: number, title: string) => void,
  { fromSheet = true } = {},
): {
  main: WantAction[];
  destructive: WantAction[];
} {
  const go = (href: Href) => (fromSheet ? router.replace(href) : router.push(href));
  return {
    main: [
      {
        key: "got",
        label: "I got it",
        icon: CheckCircleIcon,
        run: () => go(`/want/${want.id}?choose=1`),
      },
      { key: "open", label: "Open", icon: ArrowSquareOutIcon, run: () => go(`/want/${want.id}`) },
      { key: "edit", label: "Edit", icon: PencilSimpleIcon, run: () => go(`/want/edit/${want.id}`) },
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
          if (fromSheet) router.back();
        },
      },
    ],
  };
}
