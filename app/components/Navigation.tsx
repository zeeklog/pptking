'use client';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    title: "首页",
    href: "/",
    description: "PPTKING智能PPT生成平台"
  },
  {
    title: "PPT生成",
    href: "/generate",
    description: "AI智能生成PPT演示文稿"
  },
  {
    title: "PPT编辑器",
    href: "/ppt-edit",
    description: "专业PPT在线编辑器"
  },
  {
    title: "模板库", 
    href: "/templates",
    description: "海量精美PPT模板资源"
  },
  {
    title: "文案生成",
    href: "/copywriting", 
    description: "AI智能文案创作助手"
  }
];

export function Navigation() {
  const pathname = usePathname();

  // 判断当前路径是否匹配菜单项
  const isActive = (href: string) => {
    if (href === "/") {
      // 首页特殊处理：只有完全匹配 "/" 才算激活
      return pathname === "/";
    }
    // 其他页面：路径以 href 开头就算激活
    return pathname.startsWith(href);
  };

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="flex space-x-1">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          return (
            <NavigationMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <NavigationMenuLink
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-purple-50 hover:text-purple-600 focus:bg-purple-50 focus:text-purple-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-purple-100 data-[state=open]:bg-purple-100 cursor-pointer",
                    active
                      ? "bg-purple-100 text-purple-600 shadow-purple-sm" 
                      : "text-tech-600 hover:shadow-purple-sm"
                  )}
                  data-active={active}
                >
                  {item.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}