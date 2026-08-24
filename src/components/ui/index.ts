// Dizayn tizimi — yagona kirish nuqtasi.
//
// Sahifa faqat shu yerdan oladi:
//   import { Button, Card, TableFrame, Modal } from "@/components/ui";
//
// Ranglar `src/app/globals.css` dagi tokenlarda, sinflar `styles.ts` da.
// Sahifada `slate-*`, `emerald-*`, `indigo-*` yozilmaydi.

export { default as Button } from "./Button";
export { Card, CardHeader, StatCard, SumStrip, SumCell } from "./Card";
export {
  TableFrame,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
  NumTd,
  Tfoot,
  Num,
  Code,
} from "./Table";
export { default as Modal } from "./Modal";
export { default as ConfirmDialog } from "./ConfirmDialog";
export { default as FileDrop } from "./FileDrop";
export { Checkbox, RowCheckbox } from "./Checkbox";
export { Field, Input, Select, SearchInput } from "./Form";
export {
  Alert,
  Badge,
  EmptyState,
  FaqItem,
  Spinner,
  PageLoader,
  Skeleton,
  StatRowSkeleton,
  TableSkeleton,
} from "./Feedback";
export { Toaster, notify } from "./Toast";
export { Reveal, CountUp, usePrefersReducedMotion } from "./Motion";
export { default as PageHeader } from "./PageHeader";
export { default as Tabs, type TabItem } from "./Tabs";
export { ModuleScope, useModule, type ModuleKind } from "./Module";
export {
  cx,
  buttonClasses,
  fieldClasses,
  fieldWidth,
  labelClasses,
  tableCls,
  toneText,
  toneSoft,
  layout,
  align,
  type Tone,
  type ButtonVariant,
  type ButtonSize,
} from "./styles";
