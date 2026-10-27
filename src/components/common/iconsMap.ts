import type { Icon } from '@phosphor-icons/react';
import {
  Note, FileText, Folder, FolderOpen, ClipboardText, Check, CheckCircle, Checks,
  Wallet, CurrencyDollar, MagnifyingGlass, Plus, PushPin, Star, Trash, CalendarBlank,
  GearSix, Sun, Moon, CaretDown, CaretUp, CaretLeft, CaretRight, CaretDoubleLeft,
  CaretDoubleRight, X, PencilSimple, Pencil, DownloadSimple, UploadSimple, Printer,
  Question, Database, ShieldCheck, ChartBar, ChartPieSlice, ArrowCounterClockwise,
  Table, Code, ListBullets, ListNumbers, Quotes, Funnel, DotsThreeVertical,
  DotsThree, Clock, ArrowsOut, Minus, Keyboard, TextB, TextItalic, TextUnderline,
  TextStrikethrough, LinkSimple,
} from '@phosphor-icons/react';

export const iconNames = [
  'note', 'noteSolid', 'file', 'folder', 'folderSolid', 'task', 'taskSolid', 'tick',
  'tickSolid', 'tickDouble', 'wallet', 'money', 'search', 'plus', 'pin', 'pinSolid',
  'star', 'starSolid', 'trash', 'calendar', 'settings', 'sun', 'moon', 'arrowDown',
  'arrowUp', 'arrowLeft', 'arrowRight', 'doubleChevronLeft', 'doubleChevronRight',
  'close', 'edit', 'pencil', 'download', 'upload', 'printer', 'help', 'database',
  'shield', 'chart', 'pieChart', 'restore', 'table', 'code', 'list', 'listOrdered',
  'quote', 'filter', 'moreVertical', 'moreHorizontal', 'clock', 'maximize', 'minimize',
  'keyboard', 'bold', 'italic', 'underline', 'strikethrough', 'link',
] as const;
export type IconName = typeof iconNames[number];
export const MODAWWAN_ICONS: Record<IconName, Icon> = {
  note: Note, noteSolid: Note, file: FileText, folder: Folder, folderSolid: FolderOpen,
  task: ClipboardText, taskSolid: ClipboardText, tick: Check, tickSolid: CheckCircle,
  tickDouble: Checks, wallet: Wallet, money: CurrencyDollar, search: MagnifyingGlass,
  plus: Plus, pin: PushPin, pinSolid: PushPin, star: Star, starSolid: Star, trash: Trash,
  calendar: CalendarBlank, settings: GearSix, sun: Sun, moon: Moon, arrowDown: CaretDown,
  arrowUp: CaretUp, arrowLeft: CaretLeft, arrowRight: CaretRight,
  doubleChevronLeft: CaretDoubleLeft, doubleChevronRight: CaretDoubleRight, close: X,
  edit: PencilSimple, pencil: Pencil, download: DownloadSimple, upload: UploadSimple,
  printer: Printer, help: Question, database: Database, shield: ShieldCheck,
  chart: ChartBar, pieChart: ChartPieSlice, restore: ArrowCounterClockwise, table: Table,
  code: Code, list: ListBullets, listOrdered: ListNumbers, quote: Quotes, filter: Funnel,
  moreVertical: DotsThreeVertical, moreHorizontal: DotsThree, clock: Clock, maximize: ArrowsOut,
  minimize: Minus, keyboard: Keyboard, bold: TextB, italic: TextItalic,
  underline: TextUnderline, strikethrough: TextStrikethrough, link: LinkSimple,
};