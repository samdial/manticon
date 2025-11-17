import { useEffect, useMemo, useState } from "react";
import Hero from "@/components/site/Hero";
import GalleryRibbon from "@/components/site/GalleryRibbon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export type GameTable = {
  id: string;
  master_name: string | null;
  master_url: string | null;
  system: string | null;
  remaining_seats: number | null;
  adventure_name: string | null;
  description: string | null;
  novices: string | null;
  age_range: string | null;
  pregens: string | null;
  player_count: number | null;
  
};

// Legacy type for backward compatibility
type LegacyGameTable = {
  id: string;
  master: string;
  system: string;
  description: string;
  freeSeats: number;
};

// Component for collapsible description
function TableRowDescription({ description }: { description: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const needsCollapse = description.length > 100;
  const shortDesc = needsCollapse
    ? description.slice(0, 100) + "..."
    : description;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-1">
        <div className={needsCollapse && !isOpen ? "line-clamp-2" : ""}>
          {isOpen ? description : shortDesc}
        </div>
        {needsCollapse && (
          <CollapsibleTrigger asChild>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              {isOpen ? (
                <>
                  Свернуть <ChevronDown className="h-3 w-3 rotate-180" />
                </>
              ) : (
                <>
                  Развернуть <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </CollapsibleTrigger>
        )}
      </div>
    </Collapsible>
  );
}

// Component for table row with collapsible description
function TableRow({ table }: { table: GameTable }) {
  const description = table.description || "";

  return (
    <tr className="border-t">
      <td className="px-4 py-3 text-muted-foreground">
        {table.system || "-"}
      </td>

      <td className="px-4 py-3 font-medium">
        {table.master_url ? (
          <a
            href={table.master_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {table.master_name || "-"}
          </a>
        ) : (
          table.master_name || "-"
        )}
      </td>

      <td className="px-4 py-3">{table.adventure_name || "-"}</td>

      <td className="px-4 py-3">
        {description ? (
          <TableRowDescription description={description} />
        ) : (
          "-"
        )}
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
            (table.remaining_seats ?? 0) > 0
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {table.player_count ?? table.remaining_seats ?? "-"}
        </span>
      </td>
    </tr>
  );
}


export default function Index() {
  const [tables, setTables] = useState<GameTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch("/api/tables");
        if (!res.ok) throw new Error("Failed to fetch tables");
        const data = await res.json();
        console.log("[Tables] Loaded:", data.tables?.length || 0, "tables");
        setTables(data.tables || []);
      } catch (err) {
        console.error("Failed to load tables:", err);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить список столов. Попробуйте обновить страницу.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const selectable = useMemo(
    () => tables.filter((t) => (t.remaining_seats ?? 0) > 0),
    [tables],
  );

  const morningTables = useMemo(() => tables.slice(0, 15), [tables]);
  const afternoonTables = useMemo(() => tables.slice(15, 30), [tables]);

  // Registration form state
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = tables.find((t) => t.id === selectedId);

    if (!chosen) {
      toast({
        title: "Выберите стол",
        description: "Пожалуйста, выберите мастера со свободными местами.",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Введите имя",
        description: "Укажите ваше имя для регистрации.",
      });
      return;
    }
    if (!age.trim()) {
      toast({
        title: "Введите контакт",
        description: "Укажите страничку в соцсетях для связи.",
      });
      return;
    }
    if ((chosen.remaining_seats ?? 0) <= 0) {
      toast({
        title: "Мест нет",
        description: "К сожалению, в этом столе уже нет мест.",
      });
      return;
    }

    const remainingSeats = (chosen.remaining_seats ?? 0) - 1;
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: age.trim(),
          tableId: chosen.id,
          masterName: chosen.master_name,
          remainingSeats,
          system: chosen.system,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("Register request failed", err);
      toast({
        title: "Ошибка регистрации",
        description: "Не удалось отправить запрос. Попробуйте ещё раз.",
      });
      return;
    }

    // Refresh tables after registration
    const refreshRes = await fetch("/api/tables");
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      setTables(refreshData.tables || []);
    }

    toast({
      title: "Успех!",
      description: `${name} записан(а) к мастеру «${chosen.master_name}». Осталось мест: ${remainingSeats}.`,
    });

    setName("");
    setAge("");
  };

  return (
    <div>
      <Hero />

      <GalleryRibbon />

      <section id="about" className="container mt-12 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Анонсы и описание
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              «Мантикон» — ежегодный конвент настольных ролевых игр: десятки
              столов, новые системы и лучшие мастера. У нас — доброжелательное
              сообщество, насыщенная программа и комфортные зоны отдыха.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Место проведения: ДК «Студеновский», г.Липецк, ул Шкатова, 25</li>
              <li>Даты: 6-7 декабря 2025 года</li>
              <li>
                Формат игр: короткие сессии на 4 часа, приветствуются новички
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Важное
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Регистрация обязательна: места ограничены.</p>
            <p>
              • Приходите чуть раньше начала, чтобы не опаздывать к старту
              партии.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="lectures" className="container mt-12">
        <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-amber-900 dark:text-amber-100 mb-6">
          Лекции — суббота
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              time: "11:00",
              title: "Эволюция ужаса",
              speaker: "Владимир Сулимов",
              desc: "Социальные предпосылки развития жанра «хоррор» за последние сто лет",
            },
            {
              time: "12:30",
              title: "Сказка как ширма ужасного",
              speaker: "Артем Красин",
              desc: "Как страшные фантазии в литературе и ролевых играх помогают нам справляться с реальностью",
            },
            {
              time: "14:00",
              title: "Монстр говорит",
              speaker: "Кристиан Стокер",
              desc: "речевые особенности нежити, демонов и древних сущностей",
            },
            {
              time: "15:00",
              title: "Old School modules",
              speaker: "Рансвинд",
              desc: "",
            },
            {
              time: "16:00",
              title: "Мистический пласт в НРИ",
              speaker: "Ксения Приходько",
              desc: "Как создается мистический пласт в кабинетных ролевых играх?",
            },
            {
              time: "17:00",
              title: "Тихий ужас",
              speaker: "Кристиан Стокер",
              desc: "как молчание и отсутствие речи создают атмосферу страха",
            },
          ].map((l, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="shrink-0 rounded-md bg-primary/10 text-primary px-3 py-2 font-semibold">
                  {l.time}
                </div>
                <div>
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Спикер: {l.speaker}
                  </div>
                  <p className="mt-2 text-sm">{l.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="tables" className="container mt-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Игровые столы — воскресенье
          </h2>
          <div className="text-sm text-muted-foreground">
            Свободные места: {tables.reduce((a, t) => a + (t.remaining_seats ?? 0), 0)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Сессии 10:30–15:00 и с 15:00.
        </p>

        <Tabs defaultValue="morning">
          <TabsList>
            <TabsTrigger value="morning">10:30–15:00</TabsTrigger>
            <TabsTrigger value="afternoon">с 15:00</TabsTrigger>
          </TabsList>

          <TabsContent value="morning">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка...
              </div>
            ) : morningTables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Столы пока не добавлены. Данные появятся после заполнения базы данных.
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3">Система</th>
                      <th className="px-4 py-3">Мастер</th>
                      <th className="px-4 py-3">Название приключения</th>
                      <th className="px-4 py-3">Описание</th>
                      <th className="px-4 py-3">Число игроков</th>
                    </tr>
                  </thead>
                  <tbody>
                    {morningTables.map((t) => (
                      <TableRow key={t.id} table={t} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="md:hidden grid gap-3 mt-3">
              {morningTables.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                    <div className="font-semibold">
  {t.master_url ? (
    <a
      href={t.master_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {t.master_name || "-"}
    </a>
  ) : (
    t.master_name || "-"
  )}
</div>

                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          (t.remaining_seats ?? 0) > 0
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.player_count ?? t.remaining_seats ?? "-"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.system || "-"}
                    </div>
                    {t.adventure_name && (
                      <div className="text-sm font-medium">{t.adventure_name}</div>
                    )}
                    {t.description && (
                      <TableRowDescription description={t.description} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="afternoon">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка...
              </div>
            )   : afternoonTables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Столы пока не добавлены. Данные появятся после заполнения базы данных.
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3">Система</th>
                      <th className="px-4 py-3">Мастер</th>
                      <th className="px-4 py-3">Название приключения</th>
                      <th className="px-4 py-3">Описание</th>
                      <th className="px-4 py-3">Число игроков</th>
                    </tr>
                  </thead>
                  <tbody>
                    {afternoonTables.map((t) => (
                      <TableRow key={t.id} table={t} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="md:hidden grid gap-3 mt-3">
              {afternoonTables.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                    <div className="font-semibold">
  {t.master_url ? (
    <a
      href={t.master_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {t.master_name || "-"}
    </a>
  ) : (
    t.master_name || "-"
  )}
</div>

                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          (t.remaining_seats ?? 0) > 0
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.player_count ?? t.remaining_seats ?? "-"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.system || "-"}
                    </div>
                    {t.adventure_name && (
                      <div className="text-sm font-medium">{t.adventure_name}</div>
                    )}
                    {t.description && (
                      //<TableRowDescription description={t.description} />
                      <div className="text-sm font-medium">{t.description}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section id="register" className="container mt-12 mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Регистрация на игру
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleRegister}
              className="grid gap-4 md:grid-cols-4"
            >
              <div className="md:col-span-2">
                <Label htmlFor="master">Выбор мастера</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger
                    id="master"
                    className="mt-1"
                    aria-label="Выберите стол"
                  >
                    <SelectValue placeholder="Выберите стол с местами" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectable.length === 0 ? (
                      <SelectItem disabled value="none">
                        Мест нет
                      </SelectItem>
                    ) : (
                      selectable.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.master_name || "-"} • {t.system || "-"} • мест: {t.remaining_seats ?? 0}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <Label htmlFor="age">Как с тобой связаться (VK, TG)</Label>
                <Input
                  id="age"
                  className="mt-1"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Например, @username или vk.com/username"
                />
              </div>
              <div className="md:col-span-4">
  <Button type="submit" className="w-full md:w-auto">
    Записаться
  </Button>

  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
    Нажимая «Записаться», вы соглашаетесь с{" "}
    <a
      href="/policy"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      Политикой обработки персональных данных
    </a>.
  </p>
</div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section id="sponsors" className="container mt-12 mb-20">
  <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-amber-900 dark:text-amber-100 mb-6 text-center">
    Спонсоры
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[
      {
        name: "☾ Imiris ☾",
        description: " ✦ необыкновенные украшения ✦",
        image: "/img/1.webp",
        link: "https://vk.com/imiris_workshop",
      },
      {
        name: "DeadFishCrew",
        description: "Немного рукоделия, немного рукоблудия, много упоротости и увлечённости.",
        image: "/img/2.webp",
        link: "https://vk.com/deadfishcrew",
      },
      {
        name: "Dice Lab",
        description: "Ищешь уникальные дайсы? Ты их уже нашел. ",
        image: "img/3.webp",
        link: "https://vk.com/dicelab",
      },
      {
        name: "Ковен 36",
        description: "",
        image: "/img/4.webp",
        link: "https://example.com",
      },
      {
        name: "Narash workshop",
        description: "",
        image: "/img/5.webp",
        link: "https://vk.com/narash_cosplay",
      },
      {
        name: "Pandora Box",
        description: "",
        image: "/img/6.webp",
        link: "https://vk.com/studiapandorabox",
      },
      {
        name: "Rollевая кухня",
        description: " ",
        image: "/img/7.webp",
        link: "https://vk.com/rollplaykitchen",
      },  
      {
        name: "НSkull Factory",
        description: "Лучший подарок - это подарок сделанный моими руками!",
        image: "/img/8.webp",
        link: "https://vk.com/sckull",
      },
      {
        name: "Wishport",
        description: "Издательство настольных ролевых игр",
        image: "/img/9.webp",
        link: "https://vk.com/wishport",
      },
      {
        name: "замогилье",
        description: "",
        image: "/img/10.webp",
        link: "https://vk.com/mog1lka",
      },
      {
        name: "Нити судьбы",
        description: "Описание издательства 11",
        image: "/img/11.webp",
        link: "https://vk.com/nitisudbu",
      },
      {
        name: "НРИ Офиздат",
        description: "издательство и магазин настольных ролевых игр ",
        image: "/img/12.webp",
        link: "https://ofizdat.ru/",
      },
      {
        name: "Рыжий библиотекарь",
        description: "издательство и магазин настольных ролевых игр ",
        image: "/img/13.webp",
        link: "https://vk.com/red_librarian",
      },
      {
        name: "Студия 101",
        description: "Издатель ролевых игр на русском языке.",
        image: "/img/14.webp",
        link: "https://vk.com/studio101",
      },
      {
        name: "Сундук Мастера",
        description: "сокровищница уникальных аксессуаров для настольных ролевых игр!",
        image: "/img/15.webp",
        link: "https://vk.com/diceboxes",
      },
      {
        name: "У Хорька",
        description: "3D-студия печати",
        image: "/img/16.webp",
        link: "https://vk.com/u_horka",
      },
      {
        name: "Четвёртый чердак",
        description: "авторская керамика",
        image: "/img/17.png",
        link: "https://vk.com/cherdak4m",
      },
      {
        name: "Чудеса Леса",
        description: "Творческая мастерская",
        image: "/img/18.webp",
        link: "https://vk.com/chudesalesa",
      },
    ].map((sponsor, i) => (
      <a
        key={i}
        href={sponsor.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800">
          <div className="overflow-hidden h-40">
            <img
              src={`${sponsor.image}?q=80&w=400&auto=format&fit=crop`}
              alt={sponsor.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-1">
              {sponsor.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {sponsor.description}
            </p>
          </CardContent>
        </Card>
      </a>
    ))}
  </div>
</section>
    </div>
  );
}
