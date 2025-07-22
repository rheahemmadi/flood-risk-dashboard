'use client';

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage = 'home' }: HeaderProps) {
  return (
               <header className="bg-white shadow-sm border-b border-red-600">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center py-4">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <h1 className="text-2xl font-bold text-gray-900">
                       The Alert Engine
                     </h1>
                   </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a 
              href="/" 
              className={`${
                currentPage === 'home' 
                  ? 'text-red-600 font-medium border-b-2 border-red-600' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              Home
            </a>
            <a 
              href="/map" 
              className={`${
                currentPage === 'map' 
                  ? 'text-red-600 font-medium border-b-2 border-red-600' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              Map Viewer
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
} 