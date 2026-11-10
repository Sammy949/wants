import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { PackageIcon } from "phosphor-react-native/src/icons/Package";
import { TargetIcon } from "phosphor-react-native/src/icons/Target";
import type { WantKind } from "@/data/wants";

/** Type choices with icons and one-line hints. */
export const TYPE_OPTIONS: { value: WantKind; label: string; hint: string; icon: typeof PackageIcon }[] = [
  { value: "thing", label: "Thing", hint: "Something to buy or own", icon: PackageIcon },
  { value: "goal", label: "Goal", hint: "Something to do or reach", icon: TargetIcon },
  { value: "place", label: "Place", hint: "Somewhere to go", icon: MapPinIcon },
];
