import React from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Boxes,
  Receipt,
  Truck,
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  QrCode,
  History,
  LogOut,
  Store,
  DollarSign,
  X,
  AlertTriangle,
  CheckCircle2,
  Check,
  Camera,
  ScanBarcode,
  Menu,
  Filter,
  RefreshCw,
  Eye,
  Download,
  CreditCard,
  Smartphone,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  Calendar,
  CalendarDays,
  Ban,
  BarChart2,
  Printer,
  CalendarRange,
} from 'lucide-react'

// Layout & Navigation Icons
export const IconDashboard = ({ size = 20, className = '', ...props }) => (
  <LayoutDashboard size={size} className={className} strokeWidth={2} {...props} />
)

export const IconPOS = ({ size = 20, className = '', ...props }) => (
  <ShoppingCart size={size} className={className} strokeWidth={2} {...props} />
)

export const IconProducts = ({ size = 20, className = '', ...props }) => (
  <Package size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCategories = ({ size = 20, className = '', ...props }) => (
  <Layers size={size} className={className} strokeWidth={2} {...props} />
)

export const IconInventory = ({ size = 20, className = '', ...props }) => (
  <Boxes size={size} className={className} strokeWidth={2} {...props} />
)

export const IconSales = ({ size = 20, className = '', ...props }) => (
  <Receipt size={size} className={className} strokeWidth={2} {...props} />
)

export const IconSuppliers = ({ size = 20, className = '', ...props }) => (
  <Truck size={size} className={className} strokeWidth={2} {...props} />
)

export const IconUsers = ({ size = 20, className = '', ...props }) => (
  <Users size={size} className={className} strokeWidth={2} {...props} />
)

// Actions & UI Icons
export const IconSearch = ({ size = 18, className = '', ...props }) => (
  <Search size={size} className={className} strokeWidth={2} {...props} />
)

export const IconPlus = ({ size = 18, className = '', ...props }) => (
  <Plus size={size} className={className} strokeWidth={2.2} {...props} />
)

export const IconEdit = ({ size = 16, className = '', ...props }) => (
  <Pencil size={size} className={className} strokeWidth={2} {...props} />
)

export const IconTrash = ({ size = 16, className = '', ...props }) => (
  <Trash2 size={size} className={className} strokeWidth={2} {...props} />
)

export const IconQr = ({ size = 16, className = '', ...props }) => (
  <QrCode size={size} className={className} strokeWidth={2} {...props} />
)

export const IconHistory = ({ size = 16, className = '', ...props }) => (
  <History size={size} className={className} strokeWidth={2} {...props} />
)

export const IconLogout = ({ size = 18, className = '', ...props }) => (
  <LogOut size={size} className={className} strokeWidth={2} {...props} />
)

export const IconStore = ({ size = 22, className = '', ...props }) => (
  <Store size={size} className={className} strokeWidth={2} {...props} />
)

export const IconDollar = ({ size = 16, className = '', ...props }) => (
  <DollarSign size={size} className={className} strokeWidth={2} {...props} />
)

export const IconClose = ({ size = 18, className = '', ...props }) => (
  <X size={size} className={className} strokeWidth={2.2} {...props} />
)

export const IconX = IconClose

export const IconAlertTriangle = ({ size = 20, className = '', ...props }) => (
  <AlertTriangle size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCheckCircle = ({ size = 20, className = '', ...props }) => (
  <CheckCircle2 size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCheck = ({ size = 18, className = '', ...props }) => (
  <Check size={size} className={className} strokeWidth={2.2} {...props} />
)

export const IconCamera = ({ size = 20, className = '', ...props }) => (
  <Camera size={size} className={className} strokeWidth={2} {...props} />
)

export const IconBarcode = ({ size = 20, className = '', ...props }) => (
  <ScanBarcode size={size} className={className} strokeWidth={2} {...props} />
)

// Extra modern utility icons
export const IconMenu = ({ size = 22, className = '', ...props }) => (
  <Menu size={size} className={className} strokeWidth={2} {...props} />
)

export const IconFilter = ({ size = 18, className = '', ...props }) => (
  <Filter size={size} className={className} strokeWidth={2} {...props} />
)

export const IconRefresh = ({ size = 18, className = '', ...props }) => (
  <RefreshCw size={size} className={className} strokeWidth={2} {...props} />
)

export const IconEye = ({ size = 18, className = '', ...props }) => (
  <Eye size={size} className={className} strokeWidth={2} {...props} />
)

export const IconDownload = ({ size = 18, className = '', ...props }) => (
  <Download size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCreditCard = ({ size = 18, className = '', ...props }) => (
  <CreditCard size={size} className={className} strokeWidth={2} {...props} />
)

export const IconSmartphone = ({ size = 18, className = '', ...props }) => (
  <Smartphone size={size} className={className} strokeWidth={2} {...props} />
)

export const IconChevronRight = ({ size = 18, className = '', ...props }) => (
  <ChevronRight size={size} className={className} strokeWidth={2} {...props} />
)

export const IconChevronDown = ({ size = 18, className = '', ...props }) => (
  <ChevronDown size={size} className={className} strokeWidth={2} {...props} />
)

export const IconArrowUpDown = ({ size = 18, className = '', ...props }) => (
  <ArrowUpDown size={size} className={className} strokeWidth={2} {...props} />
)

export const IconSparkles = ({ size = 18, className = '', ...props }) => (
  <Sparkles size={size} className={className} strokeWidth={2} {...props} />
)

export const IconTrendingUp = ({ size = 18, className = '', ...props }) => (
  <TrendingUp size={size} className={className} strokeWidth={2} {...props} />
)

export const IconBanknote = ({ size = 18, className = '', ...props }) => (
  <Banknote size={size} className={className} strokeWidth={2} {...props} />
)

export const IconWallet = ({ size = 18, className = '', ...props }) => (
  <Wallet size={size} className={className} strokeWidth={2} {...props} />
)

export const IconTrendingDown = ({ size = 18, className = '', ...props }) => (
  <TrendingDown size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCalendar = ({ size = 18, className = '', ...props }) => (
  <Calendar size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCalendarDays = ({ size = 18, className = '', ...props }) => (
  <CalendarDays size={size} className={className} strokeWidth={2} {...props} />
)

export const IconCalendarRange = ({ size = 18, className = '', ...props }) => (
  <CalendarRange size={size} className={className} strokeWidth={2} {...props} />
)

export const IconBan = ({ size = 18, className = '', ...props }) => (
  <Ban size={size} className={className} strokeWidth={2} {...props} />
)

export const IconBarChart = ({ size = 18, className = '', ...props }) => (
  <BarChart2 size={size} className={className} strokeWidth={2} {...props} />
)

export const IconPrinter = ({ size = 18, className = '', ...props }) => (
  <Printer size={size} className={className} strokeWidth={2} {...props} />
)
