"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";

type IconName = "twitterX" | "instagram" | "github" | "linkedin";

type IconLinkProps = {
	icon: IconName;
	href: string;
	label: string;
	className?: string;
};

export function IconLink({ icon, href, label, className }: IconLinkProps) {
	const Icon = Icons[icon];
	return (
		<a
			href={href}
			aria-label={label}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card text-card-foreground shadow-sm transition-colors",
				"hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className
			)}
		>
			<Icon className="h-5 w-5" />
		</a>
	);
}


