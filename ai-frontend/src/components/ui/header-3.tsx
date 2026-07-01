'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import { useModal, ModalType } from "@/context/ModalContext";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon } from 'lucide-react';
import {
	Cpu,
	Search,
	Image,
	Bell,
	Calendar,
	Sheet,
	CloudRain,
	Database,
	Layers,
	Key,
	MessageSquare,
	Eye,
	ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LinkItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	description?: string;
	modelUsed?: string;
	whyExplain?: string;
	type?: string;
};

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
	const { openModal } = useModal();
	const [mobileFeaturesOpen, setMobileFeaturesOpen] = React.useState(false);
	const [mobileProtoOpen, setMobileProtoOpen] = React.useState(false);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn('fixed top-0 left-0 right-0 z-50 w-full border-b border-transparent transition-all duration-300', {
				'bg-[#050505]/80 border-red-500/10 backdrop-blur-lg shadow-lg shadow-red-500/5 py-1': scrolled,
				'bg-transparent py-3': !scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 md:px-12">
				<div className="flex items-center gap-6">
					{/* Nexa Brand Logo */}
					<a href="#" className="flex items-center gap-2.5 group cursor-pointer mr-2 shrink-0">
						<div className="p-1.5 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-red-500/20 group-hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all duration-300">
							<NexaLogoIcon className="w-5 h-5" />
						</div>
						<div className="flex flex-col items-start justify-center">
							<div className="flex items-baseline font-sans font-black text-sm tracking-[0.12em] text-white leading-none">
								<span>NEXA</span>
								<span className="text-red-500 font-bold tracking-tighter mx-0.5">//</span>
								<span className="text-zinc-100 font-bold text-xs tracking-normal">AI</span>
							</div>
							<span className="text-[8px] text-zinc-500 font-mono tracking-widest mt-1 leading-none uppercase">Personal Engine</span>
						</div>
					</a>
					
					{/* Navigation Menu */}
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList>
							{/* Dropdown 1: Autonomous Features */}
							<NavigationMenuItem>
								<NavigationMenuTrigger className="text-zinc-400 hover:text-white font-medium">Features</NavigationMenuTrigger>
								<NavigationMenuContent className="p-1">
									<div className="bg-[#0c0b0d] border border-zinc-800/80 rounded-lg p-2.5 shadow-2xl w-[600px] grid grid-cols-2 gap-3">
										<div className="col-span-2 border-b border-zinc-900 pb-2 mb-1">
											<span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Nexa Autonomous Toolkit</span>
										</div>
										{productLinks.map((item, i) => (
											<div key={i} className="hover:bg-zinc-900/60 p-2 rounded-lg transition-colors border border-transparent hover:border-zinc-850">
												<ListItem {...item} />
												{item.modelUsed && (
													<div className="mt-2.5 pl-9 flex flex-col gap-1 text-[10px]">
														<div className="text-red-400 font-semibold flex items-center gap-1">
															<span className="font-bold">Model:</span> {item.modelUsed}
														</div>
														<div className="text-zinc-500 leading-normal">
															<span className="font-bold">Mechanism:</span> {item.whyExplain}
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{/* Dropdown 2: Core Protocols & Diagrams */}
							<NavigationMenuItem>
								<NavigationMenuTrigger className="text-zinc-400 hover:text-white font-medium">Architecture</NavigationMenuTrigger>
								<NavigationMenuContent className="p-1">
									<div className="bg-[#0c0b0d] border border-zinc-800/80 rounded-lg p-2.5 shadow-2xl w-[580px] grid grid-cols-2 gap-3">
										<div className="col-span-2 border-b border-zinc-900 pb-2 mb-1">
											<span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">System Protocols & Schemas</span>
										</div>
										{architectureLinks.map((item, i) => (
											<div key={i} className="hover:bg-zinc-900/60 p-2 rounded-lg transition-colors border border-transparent hover:border-zinc-850">
												<ListItem 
													{...item} 
													onClick={(e) => {
														e.preventDefault();
														if (item.type) {
															openModal(item.type as ModalType);
														}
													}}
												/>
												<div className="mt-2 pl-9 flex items-center justify-between text-[10px] text-zinc-500">
													<span>Diagram: Available</span>
													<button 
														onClick={() => {
															if (item.type) {
																openModal(item.type as ModalType);
															}
														}}
														className="text-red-400 font-bold hover:underline flex items-center gap-1 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/10 cursor-pointer"
													>
														<Eye className="w-3 h-3" /> Explain Core
													</button>
												</div>
											</div>
										))}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{/* Direct links */}
							<NavigationMenuLink className="px-4 text-sm text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer" asChild>
								<a href="#about">
									Dual Persona
								</a>
							</NavigationMenuLink>
							<NavigationMenuLink className="px-4 text-sm text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer" asChild>
								<a href="#try-now">
									Sandbox
								</a>
							</NavigationMenuLink>
						</NavigationMenuList>
					</NavigationMenu>
				</div>

				<div className="hidden items-center gap-3 md:flex">
					<Button variant="outline" className="opacity-75 cursor-default hover:bg-transparent hover:text-zinc-400">
						<div className="flex items-center gap-2">
							<MessageSquare className="w-4 h-4 text-zinc-500 fill-current" />
							WhatsApp <span className="text-red-500 font-bold uppercase tracking-wider text-[9px] bg-red-950/40 border border-red-500/10 px-1.5 py-0.5 rounded">Coming Soon</span>
						</div>
					</Button>
					<Button asChild>
						<a href="#try-now">Launch Emulator</a>
					</Button>
				</div>

				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="md:hidden border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5 text-red-500" duration={300} />
				</Button>
			</nav>

			{/* Mobile Drawer Navigation */}
			<MobileMenu open={open} className="flex flex-col justify-between gap-6 overflow-y-auto">
				<NavigationMenu className="max-w-full">
					<div className="flex w-full flex-col gap-y-4">
						{/* Collapsible Features */}
						<div className="flex flex-col">
							<button 
								onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
								className="w-full flex items-center justify-between text-[11px] font-bold text-red-500 tracking-wider uppercase border-b border-zinc-900 pb-1.5 cursor-pointer text-left"
							>
								<span>Features</span>
								<ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-300", {
									"rotate-180 text-red-500": mobileFeaturesOpen
								})} />
							</button>
							<AnimatePresence initial={false}>
								{mobileFeaturesOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="overflow-hidden"
									>
										<div className="grid gap-2 pt-2 pb-1">
											{productLinks.map((link) => (
												<ListItem key={link.title} {...link} />
											))}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
						
						{/* Collapsible Protocols */}
						<div className="flex flex-col">
							<button 
								onClick={() => setMobileProtoOpen(!mobileProtoOpen)}
								className="w-full flex items-center justify-between text-[11px] font-bold text-red-500 tracking-wider uppercase border-b border-zinc-900 pb-1.5 cursor-pointer text-left"
							>
								<span>Protocols & Diagrams</span>
								<ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-300", {
									"rotate-180 text-red-500": mobileProtoOpen
								})} />
							</button>
							<AnimatePresence initial={false}>
								{mobileProtoOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="overflow-hidden"
									>
										<div className="grid gap-2 pt-2 pb-1">
											{architectureLinks.map((link) => (
												<ListItem 
													key={link.title} 
													{...link} 
													onClick={(e) => {
														e.preventDefault();
														setOpen(false);
														if (link.type) {
															openModal(link.type as ModalType);
														}
													}}
												/>
											))}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</NavigationMenu>
				<div className="flex flex-col gap-2 pt-4 border-t border-zinc-900">
					<Button variant="outline" className="w-full bg-transparent border-zinc-800 opacity-60 cursor-not-allowed">
						<div className="flex items-center justify-center gap-2">
							<MessageSquare className="w-4 h-4 text-zinc-500 fill-current" />
							WhatsApp (Coming Soon)
						</div>
					</Button>
					<Button className="w-full" asChild onClick={() => setOpen(false)}>
						<a href="#try-now">Launch Emulator</a>
					</Button>
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-[#080708]/95 border-b border-zinc-900 backdrop-blur-xl',
				'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
					'size-full p-6',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
	href,
	modelUsed,
	whyExplain,
	type,
	onClick,
	...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem & { onClick?: (e: React.MouseEvent) => void }) {
	return (
		<NavigationMenuLink className={cn('w-full flex flex-row gap-x-3 p-1.5 rounded-md hover:bg-zinc-900/80 transition-colors', className)} {...props} asChild>
			<a href={href} onClick={onClick}>
				<div className="bg-zinc-950 border border-zinc-900/60 flex aspect-square size-10 items-center justify-center rounded-md shadow-inner text-red-500">
					<Icon className="size-4.5" />
				</div>
				<div className="flex flex-col items-start justify-center flex-1 min-w-0">
					<span className="font-semibold text-xs text-white">{title}</span>
					<span className="text-zinc-500 text-[10px] truncate w-full">{description}</span>
				</div>
			</a>
		</NavigationMenuLink>
	);
}

const productLinks: LinkItem[] = [
	{
		title: 'Autonomous Web Search',
		href: '#features',
		description: 'Parses DDG static HTML structures.',
		icon: Search,
		modelUsed: 'Gemini 2.5 Flash',
		whyExplain: 'Flash processes summaries rapidly in under 80ms, bypassing browser automation overhead.',
	},
	{
		title: 'Flux Image Engine',
		href: '#features',
		description: 'Generates anime, realism, and 3D renders.',
		icon: Image,
		modelUsed: 'Flux Swarm via Pollinations',
		whyExplain: 'Uses Flux-Realism or Anime models depending on the semantic content of user requests.',
	},
	{
		title: 'Supabase Reminders',
		href: '#features',
		description: 'Schedules pending cron notification timers.',
		icon: Bell,
		modelUsed: 'NodeJS Timers / Supabase client',
		whyExplain: 'Bypasses AI engines completely to schedule precise alerts via server database keys.',
	},
	{
		title: 'Smart Calendar Manager',
		href: '#features',
		description: 'Autonomously books slots in Google Calendar.',
		icon: Calendar,
		modelUsed: 'Gemini 2.5 Flash',
		whyExplain: 'Converts conversational dates to ISO format, checking availability and booking dynamically.',
	},
	{
		title: 'Lead Generation CRM',
		href: '#features',
		description: 'Pipes inquiry details to Google Sheets.',
		icon: Sheet,
		modelUsed: 'Gemini 2.5 Flash',
		whyExplain: 'Extracts structured names, phones, and requirements from messy user messages.',
	},
	{
		title: 'Weather & News Dispatch',
		href: '#features',
		description: 'Open-Meteo and news headlines dispatches.',
		icon: CloudRain,
		modelUsed: 'Gemini 2.5 Flash',
		whyExplain: 'Synthesizes geocoded weather outputs and search lists into friendly reports.',
	},
];

const architectureLinks: LinkItem[] = [
	{
		title: 'UCF Context Fabric',
		href: '/diagrams/ucf.png',
		description: 'Vector similarity RAG and mood fusion.',
		icon: Database,
		type: 'ucf',
	},
	{
		title: 'HMP Router Engine',
		href: '/diagrams/hmp.png',
		description: 'Complexity checks and query routing.',
		icon: Cpu,
		type: 'hmp',
	},
	{
		title: 'ORA Routing Matrix',
		href: '/diagrams/ora.png',
		description: 'Zero-downtime key rotation mechanism.',
		icon: Key,
		type: 'ora',
	},
	{
		title: 'VASP Synaptic Sync',
		href: '/diagrams/full.png',
		description: 'Syncing context deltas and branch prediction.',
		icon: Layers,
		type: 'vasp',
	},
];

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}

const NexaLogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="stroke-red-500" />
    <line x1="12" y1="2" x2="12" y2="22" className="stroke-red-900 opacity-40" strokeWidth="1" />
    <line x1="2" y1="8.5" x2="22" y2="15.5" className="stroke-red-900 opacity-40" strokeWidth="1" />
    <line x1="2" y1="15.5" x2="22" y2="8.5" className="stroke-red-900 opacity-40" strokeWidth="1" />
    <circle cx="12" cy="12" r="3.5" className="fill-red-600 stroke-none" />
  </svg>
);
