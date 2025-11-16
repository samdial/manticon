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
        {table.master_name || "-"}
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
              <li>Место проведения: ДК «Пилигрим», Москва</li>
              <li>Даты: 20–22 сентября</li>
              <li>
                Формат: короткие сессии на 3–4 часа, приветствуются новички
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
            <p>• Возьмите документ — доступ в 16+ зоны по паспорту.</p>
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
              time: "12:00",
              title: "Как вести первую НРИ",
              speaker: "Анна Воронова",
              desc: "Инструменты для старта: сессия ноль, безопасность и темп.",
            },
            {
              time: "13:30",
              title: "Миростроение без боли",
              speaker: "Илья Степанов",
              desc: "Практика создания сеттинга: карты, фракции, конфликты.",
            },
            {
              time: "15:00",
              title: "Импровизация мастера",
              speaker: "Сергей Лис",
              desc: "Приёмы импровизации, работа с идеями игроков.",
            },
            {
              time: "16:30",
              title: "Боёвка, которая не тормозит",
              speaker: "Кира Волкова",
              desc: "Динамичные сцены, инициативы и ясные ходы.",
            },
            {
              time: "18:00",
              title: "Хоррор у стола",
              speaker: "Дмитрий Чернов",
              desc: "Атмосфера, безопасность, звуковой дизайн и свет.",
            },
            {
              time: "19:30",
              title: "Инди‑системы 2025",
              speaker: "Влад Мариус",
              desc: "Обзор свежих правил и где их найти.",
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
                      <div className="font-semibold">{t.master_name || "-"}</div>
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
            ) : afternoonTables.length === 0 ? (
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
                      <div className="font-semibold">{t.master_name || "-"}</div>
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
              name: "Таверна Мудреца",
              description: "Сеть кафе настольных игр",
              image:
                "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "DragonSkull Games",
              description: "Издатель настольных ролевых игр",
              image:
                "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Экспедиция",
              description: "Туристическое агентство",
              image:
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Райские Миры",
              description: "Специализированный магазин",
              image:
                "https://images.unsplash.com/photo-1570303540540-25e0e5b2eb9a?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Ночной Орден",
              description: "Баланс игровых правил",
              image:
                "https://images.unsplash.com/photo-1552765069-5c63e89b51c7?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
            },
            {
              name: "Легенда",
              description: "Сообщество неклассических RPG",
              image:
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400&auto=format&fit=crop",
              link: "https://example.com",
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
                    src={sponsor.image}
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
