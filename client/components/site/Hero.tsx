export default function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F34a813691cc14349b2c9685aab1d2252%2F5a18384fb83b4f83ad9aca4415052eb4?format=webp&width=800"
          alt="В гостях у Мантикоры — шапка конвента"
          className="h-[56vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background/90" />
      </div>
      <div className="relative container h-[56vh] flex items-end pb-10">
        <div>
          <span className="inline-block mb-2 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            Фэнтези • Ролевые игры • Комьюнити
          </span>
          <h1
            className="font-gothic text-5xl md:text-7xl font-bold tracking-tight text-amber-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
            style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
          >
            Конвент НРИ «Мантикон»
          </h1>
          <p className="mt-3 text-card-foreground/90 max-w-2xl text-base md:text-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            Истории, приключения и новые знакомства.
            Присоединяйтесь к крупнейшему фестивалю настольных ролевых игр.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#tables"
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Посмотреть столы
            </a>
            <a
              href="#register"
              className="inline-flex items-center rounded-md border border-input bg-background/80 px-5 py-2.5 hover:bg-accent/60 hover:text-accent-foreground transition-colors"
            >
              Зарегистрироваться
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
