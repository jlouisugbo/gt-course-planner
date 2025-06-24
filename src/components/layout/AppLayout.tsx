import Link from "next/link";

//Header + Navigation + Footer
export function Navbar() {
    return (
        <nav className="flex items-center justify-around px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative transition-all">
            <div className="hidden sm:flex items-center gap-8">
                <Link className="hover:underline" href="/">Home</Link>
                <Link className="hover:underline" href="/test">Planner</Link>
                <Link className="hover:underline" href="/">About</Link>

                <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
                    <input className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" type="text" placeholder="Search Courses..." />
                </div>

                <Link href="/login">
                    <button className="cursor-pointer px-8 py-2 bg-amber-500 hover:bg-amber-600 transition text-white rounded-full">
                        Login
                    </button>
                </Link>
                
            </div>

            <div className="flex top-[-10px] left-0 w-full bg-white shadow-md py-4 flex-row items-center gap-2 px-5 text-sm md:hidden">
                <Link href="/">Home</Link>
                <Link href="/test">Planner</Link>
                <Link href="/">About</Link>

                <Link href="/login">
                    <button className="cursor-pointer px-6 py-2 mt-2 bg-amber-500 hover:bg-amber-600 transition text-white rounded-full text-sm">
                        Login
                    </button>
                </Link>
            </div>
        </nav>
    )
}

export function Footer() {
    return (
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 border-t border-gray-300">
            <p className="py-4 text-center text-sm md:text-base text-gray-500/80">
                Copyright © 2025 by Joel Louis-Ugbo and other important contributors.
            </p>
        </div>
    )
}