import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background/80 to-background/10 backdrop-blur border-b border-border/50">
        <div className="container flex items-center justify-between py-3">
          <Link to="#top" className="flex items-center gap-2">
            <span className="text-2xl tracking-widest font-bold font-display text-primary">
              МАНТИКОН
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#about" className="hover:text-primary transition-colors">
              О конвенте
            </a>
            <a
              href="#lectures"
              className="hover:text-primary transition-colors"
            >
              Лекции
            </a>
            <a href="#tables" className="hover:text-primary transition-colors">
              Игровые столы
            </a>
            <a
              href="#register"
              className="hover:text-primary transition-colors"
            >
              Регистрация
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-[64px]" id="top">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-border/60 bg-card/50">
        <div className="container py-8 grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <div className="text-lg font-display tracking-wider text-primary">
              МАНТИКОН
            </div>
            <p className="text-muted-foreground mt-2">
              Конвент настольных ролевых игр. Добрo пожаловать в мир
              приключений!
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">Навигация</div>
            <ul className="space-y-1">
              <li>
                <a href="#about" className="hover:text-primary">
                  О конвенте
                </a>
              </li>
              <li>
                <a href="#lectures" className="hover:text-primary">
                  Лекции
                </a>
              </li>
              <li>
                <a href="#tables" className="hover:text-primary">
                  Игровые столы
                </a>
              </li>
              <li>
                <a href="#register" className="hover:text-primary">
                  Регистрация
                </a>
              </li>
            </ul>
          </div>
          <div>
          <div className="font-semibold mb-2">Контакты</div>
          <a 
  href="https://vk.com/id4883678" 
  target="_blank"
  rel="noopener noreferrer"
  className="text-muted-foreground block hover:text-amber-600 transition-colors"
  title="Профиль ВКонтакте"
>
  Богдан Воронов (VK)
</a>

<a 
  href="https://vk.com/dicecraftclub" 
  target="_blank"
  rel="noopener noreferrer"
  className="text-muted-foreground block hover:text-amber-600 transition-colors"
  title="Сообщество ВКонтакте"
>
  В костях у мантикоры (VK)
</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
